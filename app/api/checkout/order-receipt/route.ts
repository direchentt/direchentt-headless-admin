import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { getStoreData } from '@/lib/backend';
import { buildPublicCheckoutReceipt, asMetaRecord } from '@/lib/checkout-receipt';
import { findMpPaymentByPaymentId } from '@/lib/mp-payments-db';

export const dynamic = 'force-dynamic';

async function loadPaymentWithMeta(accessToken: string, paymentId: string) {
  const mpClient = new MercadoPagoConfig({ accessToken });
  const paymentApi = new Payment(mpClient);
  const p = await paymentApi.get({ id: String(paymentId) });
  let meta = asMetaRecord(p.metadata);
  const prefRaw = (p as unknown as Record<string, unknown>).preference_id;
  if (prefRaw != null) {
    try {
      const prefApi = new Preference(mpClient);
      const pref = await prefApi.get({ preferenceId: String(prefRaw) });
      const pm = asMetaRecord(pref.metadata);
      if (pm && Object.keys(pm).length > 0) {
        meta = { ...(meta || {}), ...pm };
      }
    } catch {
      /* preferencia opcional */
    }
  }
  return { p, meta };
}

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get('payment_id')?.trim();
  if (!paymentId) {
    return NextResponse.json({ ok: false, error: 'Falta payment_id' }, { status: 400 });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: 'Checkout no configurado' }, { status: 503 });
  }

  try {
    const { p, meta } = await loadPaymentWithMeta(accessToken, paymentId);
    const pRec = p as unknown as Record<string, unknown>;
    const mergedPayment = { ...pRec, metadata: meta ?? pRec.metadata };

    const storeRaw = meta?.store_id ?? meta?.storeId;
    const storeIdNum = parseInt(String(storeRaw ?? ''), 10);
    if (!Number.isFinite(storeIdNum) || storeIdNum <= 0) {
      return NextResponse.json({ ok: false, error: 'Pago sin tienda asociada' }, { status: 404 });
    }

    const store = await getStoreData(String(storeIdNum));
    const domain =
      store?.domain?.replace(/^https?:\/\//, '').replace(/\/$/, '') || `${storeIdNum}.mitiendanube.com`;
    const shopHomeUrl = `https://${domain}`;
    const storeLabel =
      (typeof store?.shop_name === 'string' && store.shop_name.trim()) ||
      (typeof store?.name === 'string' && store.name.trim()) ||
      `Tienda ${storeIdNum}`;

    const doc = await findMpPaymentByPaymentId(paymentId);
    const receipt = buildPublicCheckoutReceipt(mergedPayment, doc, { shopHomeUrl, storeLabel });

    return NextResponse.json({ ok: true, receipt });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[order-receipt]', msg);
    return NextResponse.json({ ok: false, error: 'No se pudo cargar el comprobante' }, { status: 404 });
  }
}
