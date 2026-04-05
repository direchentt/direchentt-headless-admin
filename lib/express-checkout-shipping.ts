/**
 * Opciones de envío para checkout exprés (config storefront + validación servidor).
 */

export type ExpressCheckoutShippingOption = {
  id: string;
  label: string;
  /** >= 0; misma moneda que la preferencia MP (ej. ARS) */
  price: number;
};

export type ExpressCheckoutShippingSelection = {
  id: string;
  label: string;
  price: number;
};

const MAX_OPTIONS = 12;

export function normalizeExpressCheckoutShippingOptions(
  raw: ExpressCheckoutShippingOption[] | undefined | null
): ExpressCheckoutShippingOption[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { id: 'standard', label: 'Envío a domicilio', price: 0 },
      { id: 'pickup', label: 'Retiro en local', price: 0 },
    ];
  }
  const out: ExpressCheckoutShippingOption[] = [];
  const seen = new Set<string>();
  for (const x of raw.slice(0, MAX_OPTIONS)) {
    if (!x || typeof x !== 'object') continue;
    const id = typeof x.id === 'string' ? x.id.trim().slice(0, 64) : '';
    const label = typeof x.label === 'string' ? x.label.trim().slice(0, 200) : '';
    let price = typeof x.price === 'number' && Number.isFinite(x.price) ? x.price : 0;
    price = Math.round(Math.max(0, price) * 100) / 100;
    if (!id || !label) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label, price });
  }
  return out.length > 0
    ? out
    : [{ id: 'standard', label: 'Envío a domicilio', price: 0 }];
}

export function parseExpressShippingSelection(
  body: unknown
): ExpressCheckoutShippingSelection | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const o = body as Record<string, unknown>;
  const id = typeof o.id === 'string' ? o.id.trim().slice(0, 64) : '';
  const label = typeof o.label === 'string' ? o.label.trim().slice(0, 200) : '';
  const priceRaw = o.price;
  const price =
    typeof priceRaw === 'number' && Number.isFinite(priceRaw)
      ? Math.round(Math.max(0, priceRaw) * 100) / 100
      : null;
  if (!id || !label || price === null) return null;
  return { id, label, price };
}

/** Comprueba que id/precio coincidan con la tabla de la tienda (anti manipulación). */
export function matchShippingSelectionToOptions(
  selection: ExpressCheckoutShippingSelection,
  options: ExpressCheckoutShippingOption[]
): ExpressCheckoutShippingOption | null {
  const opt = options.find((x) => x.id === selection.id);
  if (!opt) return null;
  if (Math.abs(opt.price - selection.price) > 0.02) return null;
  if (opt.label !== selection.label) return null;
  return opt;
}

export function parseShippingSnapshotFromMetadata(
  meta: Record<string, unknown> | null
): ExpressCheckoutShippingSelection | null {
  if (!meta) return null;
  const raw = meta.shipping_snapshot;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return parseExpressShippingSelection(o);
  } catch {
    return null;
  }
}
