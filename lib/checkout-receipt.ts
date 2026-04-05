import type { ExpressCheckoutBuyerInput } from '@/lib/express-checkout-buyer';
import type { MpPaymentDoc } from '@/lib/mp-payments-db';
import { parseMoney, formatPrice } from '@/lib/product-utils';
import { parseShippingSnapshotFromMetadata } from '@/lib/express-checkout-shipping';

export type PublicReceiptLine = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type PublicCheckoutReceipt = {
  paymentId: string;
  status: string;
  statusDetail?: string;
  preferenceId?: string;
  externalReference?: string;
  amount: number;
  currencyId: string;
  paymentMethodId?: string;
  paymentTypeId?: string;
  dateApproved?: string;
  storeId: number;
  storeLabel: string;
  shopHomeUrl: string;
  tiendanubeOrderId?: number;
  payerEmail?: string;
  buyer: ExpressCheckoutBuyerInput | null;
  shipping: { label: string; price: number } | null;
  lines: PublicReceiptLine[];
  subtotalProducts: number;
  shippingCost: number;
  total: number;
};

export function asMetaRecord(meta: unknown): Record<string, unknown> | null {
  if (!meta || typeof meta !== 'object') return null;
  return meta as Record<string, unknown>;
}

function parseCartLinesDetail(meta: Record<string, unknown> | null): PublicReceiptLine[] {
  if (!meta) return [];
  const raw = meta.cart_lines_detail;
  let parsed: unknown;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  } else {
    parsed = raw;
  }
  if (!Array.isArray(parsed)) return [];
  const out: PublicReceiptLine[] = [];
  for (const row of parsed) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const name = String(o.name || 'Producto').slice(0, 300);
    const qty = Math.min(99, Math.max(1, parseInt(String(o.quantity ?? 1), 10) || 1));
    const unit = Math.round(parseMoney(o.price ?? 0) * 100) / 100;
    if (!Number.isFinite(unit) || unit < 0) continue;
    out.push({
      name,
      quantity: qty,
      unitPrice: unit,
      lineTotal: Math.round(unit * qty * 100) / 100,
    });
  }
  return out;
}

function parseBuyerSnapshot(meta: Record<string, unknown> | null): ExpressCheckoutBuyerInput | null {
  if (!meta) return null;
  const raw = meta.buyer_snapshot;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const o = JSON.parse(raw) as ExpressCheckoutBuyerInput;
    if (!o || typeof o !== 'object') return null;
    return o;
  } catch {
    return null;
  }
}

/** Arma líneas mínimas desde cart_items si no hay cart_lines_detail */
function linesFromCartItemsOnly(meta: Record<string, unknown> | null): PublicReceiptLine[] {
  if (!meta) return [];
  const raw = meta.cart_items;
  let parsed: unknown;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  } else {
    parsed = raw;
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((row: unknown) => {
    const o = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    const id = o.id ?? o.variantId;
    const q = o.q ?? o.quantity;
    const quantity = Math.min(99, Math.max(1, parseInt(String(q ?? 1), 10) || 1));
    return {
      name: `Producto (variante ${String(id)})`,
      quantity,
      unitPrice: 0,
      lineTotal: 0,
    };
  });
}

type MpPaymentLike = {
  id?: string | number;
  status?: string;
  status_detail?: string;
  metadata?: unknown;
  transaction_amount?: number;
  currency_id?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  date_approved?: string;
  external_reference?: string;
  preference_id?: string | number;
  payer?: { email?: string };
};

export function buildPublicCheckoutReceipt(
  mp: MpPaymentLike,
  doc: MpPaymentDoc | null,
  opts: { shopHomeUrl: string; storeLabel: string }
): PublicCheckoutReceipt {
  const meta =
    asMetaRecord(mp.metadata) ??
    (doc?.metadataSnapshot ? (doc.metadataSnapshot as Record<string, unknown>) : null);

  let lines = parseCartLinesDetail(meta);
  if (lines.length === 0) {
    lines = linesFromCartItemsOnly(meta);
  }

  const buyer = parseBuyerSnapshot(meta);
  const shipSnap = parseShippingSnapshotFromMetadata(meta);
  const shipping = shipSnap ? { label: shipSnap.label, price: shipSnap.price } : null;

  const subtotalProducts = lines.reduce((s, l) => s + l.lineTotal, 0);
  const shippingCost = shipping?.price ?? 0;
  const amount =
    typeof mp.transaction_amount === 'number' && Number.isFinite(mp.transaction_amount)
      ? mp.transaction_amount
      : Math.round((subtotalProducts + shippingCost) * 100) / 100;

  const storeRaw = meta?.store_id ?? meta?.storeId;
  const storeId = parseInt(String(storeRaw ?? doc?.storeId ?? '0'), 10);
  const storeIdNum = Number.isFinite(storeId) ? storeId : 0;

  const tnOrder = doc?.tiendanubeSync?.ok ? doc.tiendanubeSync.orderId : undefined;

  return {
    paymentId: String(mp.id ?? ''),
    status: String(mp.status ?? 'unknown'),
    statusDetail: typeof mp.status_detail === 'string' ? mp.status_detail : undefined,
    preferenceId: mp.preference_id != null ? String(mp.preference_id) : doc?.preferenceId,
    externalReference:
      typeof mp.external_reference === 'string'
        ? mp.external_reference
        : doc?.externalReference,
    amount,
    currencyId: typeof mp.currency_id === 'string' ? mp.currency_id : doc?.currencyId || 'ARS',
    paymentMethodId:
      typeof mp.payment_method_id === 'string' ? mp.payment_method_id : doc?.paymentMethodId,
    paymentTypeId: typeof mp.payment_type_id === 'string' ? mp.payment_type_id : undefined,
    dateApproved: typeof mp.date_approved === 'string' ? mp.date_approved : undefined,
    storeId: storeIdNum,
    storeLabel: opts.storeLabel,
    shopHomeUrl: opts.shopHomeUrl,
    tiendanubeOrderId: tnOrder,
    payerEmail:
      typeof mp.payer?.email === 'string'
        ? mp.payer.email
        : doc?.payerEmail,
    buyer,
    shipping,
    lines,
    subtotalProducts: Math.round(subtotalProducts * 100) / 100,
    shippingCost: Math.round(shippingCost * 100) / 100,
    total: Math.round(amount * 100) / 100,
  };
}

export function receiptSummaryText(r: PublicCheckoutReceipt): string {
  const parts = r.lines.map((l) => `${l.name} x${l.quantity} — ${formatPrice(l.lineTotal)}`);
  return parts.join('\n');
}
