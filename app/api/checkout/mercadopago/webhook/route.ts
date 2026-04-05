import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { getStoreData } from '@/lib/backend';
import {
  upsertMpPaymentFromWebhook,
  cartLinesForTiendanubeOrder,
  findMpPaymentByPaymentId,
  tryMarkConfirmationEmailSent,
  type MpPaymentTiendanubeSync,
} from '@/lib/mp-payments-db';
import { buildPublicCheckoutReceipt } from '@/lib/checkout-receipt';
import { sendOrderConfirmationEmail } from '@/lib/order-confirmation-email';
import type { ExpressCheckoutBuyerInput } from '@/lib/express-checkout-buyer';
import {
  buildTiendanubeOrderBodyFromBuyer,
  validateExpressCheckoutBuyer,
} from '@/lib/express-checkout-buyer';
import { parseShippingSnapshotFromMetadata } from '@/lib/express-checkout-shipping';

export const dynamic = 'force-dynamic';

function isPaymentNotification(topic: string | null, body: unknown): boolean {
  const tl = (topic || '').toLowerCase();
  if (tl === 'payment' || tl.includes('payment')) return true;
  if (body && typeof body === 'object' && body !== null) {
    const b = body as Record<string, unknown>;
    const t = String(b.type ?? b.topic ?? '').toLowerCase();
    if (t.includes('payment')) return true;
    const a = String(b.action ?? '').toLowerCase();
    if (a.includes('payment')) return true;
  }
  return false;
}

/** MP IPN: query topic=id o body JSON (notificaciones v2). */
function extractPaymentNotification(
  req: NextRequest,
  body: unknown
): { topic: string | null; paymentId: string | null } {
  const url = new URL(req.url);
  let topic =
    url.searchParams.get('topic') ||
    url.searchParams.get('type') ||
    req.headers.get('x-topic');
  let paymentId = url.searchParams.get('id') || url.searchParams.get('data.id');

  if (body && typeof body === 'object' && body !== null) {
    const b = body as Record<string, unknown>;
    if (!topic && typeof b.type === 'string') topic = b.type;
    if (!topic && typeof b.topic === 'string') topic = b.topic;
    if (!topic && typeof b.action === 'string' && String(b.action).toLowerCase().includes('payment')) {
      topic = 'payment';
    }
    const data = b.data;
    if (!paymentId && data && typeof data === 'object' && data !== null && 'id' in data) {
      paymentId = String((data as { id: unknown }).id);
    }
    if (!paymentId && b.id != null) paymentId = String(b.id);
  }

  return { topic, paymentId };
}

function asMetaRecord(meta: unknown): Record<string, unknown> | null {
  if (!meta || typeof meta !== 'object') return null;
  return meta as Record<string, unknown>;
}

function parseBuyerSnapshotFromMetadata(meta: Record<string, unknown> | null): ExpressCheckoutBuyerInput | null {
  if (!meta) return null;
  const raw = meta.buyer_snapshot;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const o = JSON.parse(raw) as ExpressCheckoutBuyerInput;
    if (!o || typeof o !== 'object') return null;
    if (validateExpressCheckoutBuyer(o) !== null) return null;
    return o;
  } catch {
    return null;
  }
}

async function tryCreateTiendanubeOrder(
  storeIdStr: string,
  lines: { variant_id: number; quantity: number }[],
  accessToken: string,
  meta: Record<string, unknown> | null
): Promise<MpPaymentTiendanubeSync> {
  if (lines.length === 0) {
    return { attempted: false };
  }
  const API_BASE = `https://api.tiendanube.com/v1/${storeIdStr}`;
  const buyer = parseBuyerSnapshotFromMetadata(meta);
  const shippingSel = parseShippingSnapshotFromMetadata(meta);
  const orderBody = buyer
    ? buildTiendanubeOrderBodyFromBuyer(lines, buyer, {
        shippingSelection: shippingSel ?? undefined,
      })
    : {
        products: lines,
        payment_status: 'paid',
        shipping_status: 'unpacked',
      };
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authentication: `bearer ${accessToken}`,
        'User-Agent': 'direchentt-headless',
      },
      body: JSON.stringify(orderBody),
    });
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text.slice(0, 400) };
    }
    if (!res.ok) {
      const msg =
        parsed && typeof parsed === 'object' && parsed !== null && 'message' in parsed
          ? String((parsed as { message: unknown }).message)
          : text.slice(0, 280);
      return { attempted: true, ok: false, httpStatus: res.status, error: msg };
    }
    const oid =
      parsed && typeof parsed === 'object' && parsed !== null && 'id' in parsed
        ? Number((parsed as { id: unknown }).id)
        : NaN;
    return {
      attempted: true,
      ok: true,
      httpStatus: res.status,
      orderId: Number.isFinite(oid) ? oid : undefined,
    };
  } catch (e) {
    return {
      attempted: true,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    path: '/api/checkout/mercadopago/webhook',
    hint: 'Mercado Pago envía notificaciones por POST (IPN).',
  });
}

export async function POST(req: NextRequest) {
  const accessToken = process.env.MP_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    console.error('MP webhook: falta MP_ACCESS_TOKEN');
    return NextResponse.json({ received: true, error: 'no_token' }, { status: 200 });
  }

  let body: unknown = null;
  try {
    const text = await req.text();
    if (text?.trim()) body = JSON.parse(text);
  } catch {
    body = null;
  }

  const { topic, paymentId } = extractPaymentNotification(req, body);
  console.log(`🔔 Mercado Pago webhook topic=${topic} paymentId=${paymentId}`);

  if (!paymentId) {
    return NextResponse.json({ received: true, note: 'sin payment id' }, { status: 200 });
  }

  if (!isPaymentNotification(topic, body)) {
    return NextResponse.json({ received: true, note: 'topic_no_payment' }, { status: 200 });
  }

  try {
    const mpClient = new MercadoPagoConfig({ accessToken });
    const paymentApi = new Payment(mpClient);
    const p = await paymentApi.get({ id: String(paymentId) });

    let meta = asMetaRecord(p.metadata);
    const prefRaw = (p as unknown as Record<string, unknown>).preference_id;
    if (!meta?.buyer_snapshot && prefRaw != null) {
      try {
        const prefApi = new Preference(mpClient);
        const pref = await prefApi.get({ preferenceId: String(prefRaw) });
        const pm = asMetaRecord(pref.metadata);
        if (pm && Object.keys(pm).length > 0) {
          meta = { ...(meta || {}), ...pm };
        }
      } catch (e) {
        console.warn('[MP webhook] No se pudo obtener metadata de la preferencia:', e);
      }
    }
    const storeRaw = meta?.store_id ?? meta?.storeId;
    const storeIdNum = parseInt(String(storeRaw ?? ''), 10);
    const storeIdForDb = Number.isFinite(storeIdNum) ? storeIdNum : 0;

    const payer = p.payer as { email?: string } | undefined;
    const payerEmail = typeof payer?.email === 'string' ? payer.email : undefined;

    const paymentSummary: Record<string, unknown> = {
      id: p.id,
      status: p.status,
      status_detail: p.status_detail,
      transaction_amount: p.transaction_amount,
      currency_id: p.currency_id,
      date_created: p.date_created,
      date_approved: p.date_approved,
      payment_type_id: p.payment_type_id,
      payment_method_id: p.payment_method_id,
    };

    let tiendanubeSync: MpPaymentTiendanubeSync | undefined;

    if (p.status === 'approved' && storeIdForDb > 0) {
      const lines = cartLinesForTiendanubeOrder(meta);
      const storeData = await getStoreData(String(storeIdForDb));
      if (storeData?.accessToken && lines.length > 0) {
        tiendanubeSync = await tryCreateTiendanubeOrder(
          String(storeIdForDb),
          lines,
          storeData.accessToken,
          meta
        );
        if (tiendanubeSync.ok) {
          console.log(`🎉 Orden TN tras MP payment ${paymentId}:`, tiendanubeSync.orderId);
        } else if (tiendanubeSync.attempted) {
          console.warn(`⚠️ MP aprobado pero orden TN falló (${paymentId}):`, tiendanubeSync.error);
        }
      } else if (lines.length === 0) {
        tiendanubeSync = { attempted: false };
        console.warn(`⚠️ MP aprobado sin líneas en metadata (payment ${paymentId})`);
      } else {
        tiendanubeSync = { attempted: false };
        console.warn(`⚠️ MP aprobado sin token TN para tienda ${storeIdForDb}`);
      }
    }

    await upsertMpPaymentFromWebhook({
      paymentId: String(p.id ?? paymentId),
      storeId: storeIdForDb,
      preferenceId: prefRaw != null ? String(prefRaw) : undefined,
      status: String(p.status ?? 'unknown'),
      statusDetail: typeof p.status_detail === 'string' ? p.status_detail : undefined,
      transactionAmount:
        typeof p.transaction_amount === 'number' ? p.transaction_amount : parseFloat(String(p.transaction_amount)),
      currencyId: typeof p.currency_id === 'string' ? p.currency_id : undefined,
      payerEmail,
      externalReference:
        typeof p.external_reference === 'string' ? p.external_reference : undefined,
      paymentMethodId: typeof p.payment_method_id === 'string' ? p.payment_method_id : undefined,
      metadata: meta ?? undefined,
      paymentSummary,
      tiendanubeSync,
    });

    if (p.status === 'approved' && storeIdForDb > 0) {
      const pid = String(p.id ?? paymentId);
      const storeData = await getStoreData(String(storeIdForDb));
      const domain =
        storeData?.domain?.replace(/^https?:\/\//, '').replace(/\/$/, '') ||
        `${storeIdForDb}.mitiendanube.com`;
      const shopHomeUrl = `https://${domain}`;
      const storeLabel =
        (typeof storeData?.shop_name === 'string' && storeData.shop_name.trim()) ||
        (typeof storeData?.name === 'string' && storeData.name.trim()) ||
        `Tienda ${storeIdForDb}`;
      const doc = await findMpPaymentByPaymentId(pid);
      const mergedPayment = { ...(p as unknown as Record<string, unknown>), metadata: meta ?? p.metadata };
      const receipt = buildPublicCheckoutReceipt(mergedPayment, doc, { shopHomeUrl, storeLabel });
      const to = receipt.payerEmail || receipt.buyer?.email?.trim();
      if (to) {
        const claimed = await tryMarkConfirmationEmailSent(pid);
        if (claimed) {
          void sendOrderConfirmationEmail(to, receipt).then((sendRes) => {
            if (!sendRes.ok) {
              console.warn('[MP webhook] Email de confirmación no enviado:', sendRes.error);
            }
          });
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('❌ MP webhook error:', err);
    return NextResponse.json({ received: true, error: 'processing_failed' }, { status: 200 });
  }
}
