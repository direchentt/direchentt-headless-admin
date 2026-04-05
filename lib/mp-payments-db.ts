import { getMongoClient } from '@/lib/backend';

const DB_NAME = 'direchentt-headless-admin';
const COLLECTION = 'mercadopago_payments';

/** Líneas guardadas desde metadata.cart_items (variante + cantidad). */
export type MpCartLineSnapshot = {
  variantId?: number;
  quantity?: number;
};

export type MpPaymentTiendanubeSync = {
  attempted: boolean;
  ok?: boolean;
  error?: string;
  orderId?: number;
  httpStatus?: number;
};

/**
 * Pago / notificación persistida cuando Mercado Pago avisa al webhook.
 * Sirve para ver en el admin lo cobrado por Checkout Pro aunque TiendaNube falle.
 */
export type MpPaymentDoc = {
  paymentId: string;
  storeId: number;
  preferenceId?: string;
  status: string;
  statusDetail?: string;
  transactionAmount?: number;
  currencyId?: string;
  payerEmail?: string;
  externalReference?: string;
  paymentMethodId?: string;
  cartItems: MpCartLineSnapshot[];
  metadataSnapshot?: Record<string, unknown>;
  tiendanubeSync?: MpPaymentTiendanubeSync;
  /** Campos útiles del GET /payments/{id} (sin volcar todo el objeto) */
  paymentSummary?: Record<string, unknown>;
  confirmationEmailSent?: boolean;
  confirmationEmailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

function parseCartItemsFromMetadata(meta: Record<string, unknown> | null | undefined): MpCartLineSnapshot[] {
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
    if (!row || typeof row !== 'object') return {};
    const o = row as Record<string, unknown>;
    const id = o.id ?? o.variantId;
    const q = o.q ?? o.quantity;
    const variantId = typeof id === 'number' ? id : parseInt(String(id), 10);
    const quantity = typeof q === 'number' ? q : parseInt(String(q), 10) || 1;
    return {
      variantId: Number.isFinite(variantId) ? variantId : undefined,
      quantity: Number.isFinite(quantity) ? quantity : 1,
    };
  });
}

/** Variantes + cantidades para POST /orders de Tienda Nube (si aplica). */
export function cartLinesForTiendanubeOrder(
  meta: Record<string, unknown> | null | undefined
): { variant_id: number; quantity: number }[] {
  return parseCartItemsFromMetadata(meta ?? undefined)
    .filter((i): i is MpCartLineSnapshot & { variantId: number } => typeof i.variantId === 'number' && i.variantId > 0)
    .map((i) => ({ variant_id: i.variantId, quantity: Math.max(1, i.quantity ?? 1) }));
}

export async function upsertMpPaymentFromWebhook(input: {
  paymentId: string;
  storeId: number;
  preferenceId?: string;
  status: string;
  statusDetail?: string;
  transactionAmount?: number;
  currencyId?: string;
  payerEmail?: string;
  externalReference?: string;
  paymentMethodId?: string;
  metadata: Record<string, unknown> | null | undefined;
  paymentSummary?: Record<string, unknown>;
  tiendanubeSync?: MpPaymentTiendanubeSync;
}): Promise<void> {
  const client = await getMongoClient();
  const coll = client.db(DB_NAME).collection<MpPaymentDoc>(COLLECTION);
  const cartItems = parseCartItemsFromMetadata(input.metadata ?? undefined);
  const now = new Date();

  const doc: Partial<MpPaymentDoc> = {
    paymentId: input.paymentId,
    storeId: input.storeId,
    preferenceId: input.preferenceId,
    status: input.status,
    statusDetail: input.statusDetail,
    transactionAmount: input.transactionAmount,
    currencyId: input.currencyId,
    payerEmail: input.payerEmail,
    externalReference: input.externalReference,
    paymentMethodId: input.paymentMethodId,
    cartItems,
    metadataSnapshot: input.metadata ?? undefined,
    paymentSummary: input.paymentSummary,
    updatedAt: now,
  };
  if (input.tiendanubeSync) {
    doc.tiendanubeSync = input.tiendanubeSync;
  }

  await coll.updateOne(
    { paymentId: input.paymentId },
    {
      $set: doc,
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );
}

export async function findMpPaymentByPaymentId(paymentId: string): Promise<MpPaymentDoc | null> {
  const client = await getMongoClient();
  const coll = client.db(DB_NAME).collection<MpPaymentDoc>(COLLECTION);
  const doc = await coll.findOne({ paymentId: String(paymentId) });
  return doc;
}

/** Devuelve true solo la primera vez (para no duplicar emails ante reintentos de IPN). */
export async function tryMarkConfirmationEmailSent(paymentId: string): Promise<boolean> {
  const client = await getMongoClient();
  const coll = client.db(DB_NAME).collection<MpPaymentDoc>(COLLECTION);
  const r = await coll.updateOne(
    { paymentId: String(paymentId), confirmationEmailSent: { $ne: true } },
    { $set: { confirmationEmailSent: true, confirmationEmailSentAt: new Date() } }
  );
  return r.modifiedCount === 1;
}

export async function listMpPaymentsByStore(
  storeId: number,
  page: number,
  perPage: number = 25
): Promise<{ items: MpPaymentDoc[]; total: number }> {
  const client = await getMongoClient();
  const coll = client.db(DB_NAME).collection<MpPaymentDoc>(COLLECTION);
  const filter = { storeId };
  const skip = Math.max(0, (Math.max(1, page) - 1) * perPage);
  const [items, total] = await Promise.all([
    coll.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(perPage).toArray(),
    coll.countDocuments(filter),
  ]);
  return { items, total };
}
