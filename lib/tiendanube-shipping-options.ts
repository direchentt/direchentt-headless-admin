/**
 * Lista transportistas y opciones vía API oficial Tiendanube.
 * @see https://tiendanube.github.io/api-documentation/resources/shipping-carrier
 *
 * GET /v1/{store_id}/shipping_carriers
 * GET /v1/{store_id}/shipping_carriers/{id}/options
 */

import type { ExpressCheckoutShippingOption } from '@/lib/express-checkout-shipping';

type TnCarrier = {
  id?: number;
  name?: string;
  active?: boolean;
};

type TnCarrierOption = {
  id?: number;
  code?: string;
  name?: string;
  active?: boolean;
  additional_cost?: number | { amount?: number; currency?: string };
};

function parseAdditionalCost(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.round(Math.max(0, raw) * 100) / 100;
  }
  if (raw && typeof raw === 'object' && 'amount' in raw) {
    const a = (raw as { amount: unknown }).amount;
    if (typeof a === 'number' && Number.isFinite(a)) {
      return Math.round(Math.max(0, a) * 100) / 100;
    }
  }
  return 0;
}

async function tnFetchJson(storeId: string, token: string, path: string): Promise<unknown> {
  const url = `https://api.tiendanube.com/v1/${storeId}${path}`;
  const res = await fetch(url, {
    headers: {
      Authentication: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'DirechenttHeadless/1.0',
    },
    cache: 'no-store',
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`TN ${path} HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * Opciones activas de todos los carriers activos de la tienda.
 * Cada ítem: id estable `tn_c{CARRIER}_o{OPTION}`, label "Carrier — Opción", price desde additional_cost.
 */
export async function fetchTiendanubeShippingOptions(
  storeId: string,
  accessToken: string
): Promise<ExpressCheckoutShippingOption[]> {
  const token = accessToken.trim();
  if (!token) return [];

  const carriersRaw = await tnFetchJson(storeId, token, '/shipping_carriers');
  if (!Array.isArray(carriersRaw)) {
    return [];
  }

  const out: ExpressCheckoutShippingOption[] = [];
  const seenIds = new Set<string>();

  for (const c of carriersRaw as TnCarrier[]) {
    const cid = typeof c.id === 'number' && Number.isFinite(c.id) ? c.id : null;
    const cname = typeof c.name === 'string' ? c.name.trim() : '';
    if (cid == null || !cname) continue;
    if (c.active === false) continue;

    let optionsRaw: unknown;
    try {
      optionsRaw = await tnFetchJson(storeId, token, `/shipping_carriers/${cid}/options`);
    } catch (e) {
      console.warn(`[TN shipping] options carrier ${cid}:`, e instanceof Error ? e.message : e);
      continue;
    }
    if (!Array.isArray(optionsRaw)) continue;

    for (const opt of optionsRaw as TnCarrierOption[]) {
      const oid = typeof opt.id === 'number' && Number.isFinite(opt.id) ? opt.id : null;
      const oname = typeof opt.name === 'string' ? opt.name.trim() : '';
      if (oid == null || !oname) continue;
      if (opt.active === false) continue;

      const price = parseAdditionalCost(opt.additional_cost);
      const id = `tn_c${cid}_o${oid}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      const label = `${cname} — ${oname}`.slice(0, 200);
      out.push({
        id,
        label,
        price,
      });
    }
  }

  return out;
}
