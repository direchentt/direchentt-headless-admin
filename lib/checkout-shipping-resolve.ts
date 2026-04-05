import { getStoreData } from '@/lib/backend';
import { getStorefrontConfigStored } from '@/lib/storefront-db';
import type { ExpressCheckoutShippingOption } from '@/lib/express-checkout-shipping';
import { normalizeExpressCheckoutShippingOptions, MAX_EXPRESS_SHIPPING_OPTIONS } from '@/lib/express-checkout-shipping';
import { fetchTiendanubeShippingOptions } from '@/lib/tiendanube-shipping-options';

/**
 * Opciones de envío para checkout exprés: API Tiendanube (carriers + options) + extras desde Mongo.
 * Si TN devuelve ítems, se priorizan y se agregan entradas de `expressCheckoutShipping` con id distinto.
 * Si TN falla o está vacío, se usa solo la config (o defaults).
 */
export async function getMergedExpressShippingOptions(
  storeIdStr: string
): Promise<ExpressCheckoutShippingOption[]> {
  const storeIdNum = parseInt(storeIdStr, 10);
  const stored =
    Number.isFinite(storeIdNum) && storeIdNum > 0
      ? await getStorefrontConfigStored(storeIdNum)
      : null;
  const configRaw = stored?.expressCheckoutShipping;

  const storeLocal = await getStoreData(storeIdStr);
  const token =
    typeof storeLocal?.accessToken === 'string' ? storeLocal.accessToken.trim() : '';
  const sid = storeLocal?.storeId != null ? String(storeLocal.storeId) : storeIdStr;

  let fromTn: ExpressCheckoutShippingOption[] = [];
  if (token) {
    try {
      fromTn = await fetchTiendanubeShippingOptions(sid, token);
    } catch (e) {
      console.warn('[checkout-shipping-resolve] TN:', e instanceof Error ? e.message : e);
    }
  }

  if (fromTn.length > 0) {
    const map = new Map<string, ExpressCheckoutShippingOption>();
    for (const o of fromTn) {
      map.set(o.id, o);
    }
    const fromConfig = normalizeExpressCheckoutShippingOptions(configRaw);
    for (const c of fromConfig) {
      if (!map.has(c.id)) {
        map.set(c.id, c);
      }
    }
    return [...map.values()].slice(0, MAX_EXPRESS_SHIPPING_OPTIONS);
  }

  return normalizeExpressCheckoutShippingOptions(configRaw).slice(0, MAX_EXPRESS_SHIPPING_OPTIONS);
}
