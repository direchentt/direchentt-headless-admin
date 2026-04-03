/**
 * Utilidades para integración headless con el checkout de Tiendanube.
 *
 * FLUJO CORRECTO para headless:
 *
 * 1. (Preferido) Cart API — POST /v1/{storeId}/carts
 *    → devuelve { checkout_url } con la URL real del checkout v3.
 *    Implementado en app/api/checkout/route.ts
 *
 * 2. (Fallback) /cart/add/ URL en el storefront nativo
 *    → Tiendanube redirige a /checkout/v3/start/{session}/{token}
 *    → SIEMPRE usar {storeId}.mitiendanube.com, NUNCA el dominio custom headless.
 *    El dominio custom (www.direchentt.com.ar) apunta a Next.js y no tiene estas rutas.
 */

export interface CheckoutItem {
  variantId: string;
  quantity: number;
  productId?: string;
}

/**
 * Construye la URL de /cart/add/ para el storefront nativo de Tiendanube.
 * Usar solo como fallback cuando la Cart API no responde.
 *
 * @param storeId - ID numérico de la tienda (ej: "5112334")
 * @param items   - Variantes con cantidad
 * @param country - Código de país para el checkout (default: "AR")
 */
export function buildCartAddCheckoutUrl(
  storeId: string,
  items: CheckoutItem[],
  country: string = 'AR'
): string {
  const domain = `${storeId}.mitiendanube.com`;
  const cartQuery = items
    .filter((i) => i.variantId)
    .map((i) => `${i.variantId}:${i.quantity}`)
    .join(',');

  const url = new URL(`https://${domain}/cart/add/${cartQuery}`);
  url.searchParams.set('storefront', 'permalink');
  url.searchParams.set('from_store', '1');
  url.searchParams.set('country', country);
  return url.toString();
}

/**
 * @deprecated Usar buildCartAddCheckoutUrl en su lugar.
 * Mantenido por compatibilidad con código legacy.
 */
export function createCartPermalinkCheckoutUrl(
  _domain: string,
  items: CheckoutItem[],
  country: string = 'AR'
): string {
  // Extraer el storeId del domain legacy (ej: "5112334.mitiendanube.com" → "5112334")
  // Si viene un dominio custom, no se puede extraer el storeId → usar fallback genérico
  const match = _domain.match(/^(\d+)\.mitiendanube\.com/);
  const storeId = match ? match[1] : _domain.split('.')[0];
  return buildCartAddCheckoutUrl(storeId, items, country);
}
