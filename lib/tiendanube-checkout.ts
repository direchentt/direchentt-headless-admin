/**
 * Utilidades para integración con TiendaNube Checkout
 */

export interface CheckoutItem {
  variantId: string;
  quantity: number;
  productId?: string;
}

export interface CheckoutOptions {
  domain: string;
  items: CheckoutItem[];
  redirectToCheckout?: boolean;
  useJavaScript?: boolean;
}

/**
 * Crear URL de checkout v3 con productos pre-agregados
 */
export function createCheckoutUrl({ domain, items, redirectToCheckout = true }: CheckoutOptions): string {
  const baseUrl = redirectToCheckout 
    ? `https://${domain}/checkout/v3/start`
    : `https://${domain}/cart`;
  
  const url = new URL(baseUrl);
  
  items.forEach((item, index) => {
    if (item.variantId) {
      url.searchParams.append(`add_to_cart[${index}][variant_id]`, item.variantId);
      url.searchParams.append(`add_to_cart[${index}][quantity]`, item.quantity.toString());
    }
  });
  
  return url.toString();
}

/**
 * Crear URL de producto con variante seleccionada
 */
export function createProductUrl({ domain, productId, variantId, quantity = 1 }: {
  domain: string;
  productId: string;
  variantId?: string;
  quantity?: number;
}): string {
  const url = new URL(`https://${domain}/products/${productId}`);
  
  if (variantId) {
    url.searchParams.set('variant', variantId);
  }
  if (quantity > 1) {
    url.searchParams.set('quantity', quantity.toString());
  }
  
  return url.toString();
}

/**
 * Generar código JavaScript para agregar al carrito
 * Esto se puede usar cuando el usuario está en la página de TiendaNube
 */
export function generateAddToCartScript({ variantId, quantity = 1 }: {
  variantId: string;
  quantity?: number;
}): string {
  return `
// Script para agregar producto al carrito en TiendaNube
(function() {
  if (typeof LS !== 'undefined' && LS.cart) {
    // Usar la API de TiendaNube si está disponible
    LS.cart.addToCart('${variantId}', ${quantity}, function(success) {
      if (success) {
        console.log('Producto agregado al carrito');
        // Opcional: redireccionar al carrito o checkout
        // window.location.href = '/cart';
      } else {
        console.error('Error agregando producto al carrito');
      }
    });
  } else {
    // Fallback: usar formulario tradicional
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/cart/add';
    
    const variantInput = document.createElement('input');
    variantInput.type = 'hidden';
    variantInput.name = 'id';
    variantInput.value = '${variantId}';
    
    const quantityInput = document.createElement('input');
    quantityInput.type = 'hidden';
    quantityInput.name = 'quantity';
    quantityInput.value = '${quantity}';
    
    form.appendChild(variantInput);
    form.appendChild(quantityInput);
    document.body.appendChild(form);
    form.submit();
  }
})();
`.trim();
}

/**
 * Estrategias de checkout para diferentes casos
 */
export const CheckoutStrategies = {
  /**
   * Estrategia 1: Checkout directo con URL v3
   * Más rápido pero puede no funcionar en todas las tiendas
   */
  DIRECT_CHECKOUT: 'direct_checkout',
  
  /**
   * Estrategia 2: Redireccionar al producto con variante
   * Más confiable, el usuario debe hacer clic en agregar al carrito
   */
  PRODUCT_PAGE: 'product_page',
  
  /**
   * Estrategia 3: Usar JavaScript API
   * Requiere que el usuario esté en el dominio de la tienda
   */
  JAVASCRIPT_API: 'javascript_api',
  
  /**
   * Estrategia 4: Formulario POST tradicional
   * Más compatible pero requiere integración del lado del servidor
   */
  FORM_POST: 'form_post'
} as const;

export type CheckoutStrategy = typeof CheckoutStrategies[keyof typeof CheckoutStrategies];

/**
 * Seleccionar la mejor estrategia basada en el contexto
 */
export function selectBestStrategy({
  hasAccessToken,
  isOnTiendaNubeDomain,
  preferredStrategy
}: {
  hasAccessToken?: boolean;
  isOnTiendaNubeDomain?: boolean;
  preferredStrategy?: CheckoutStrategy;
}): CheckoutStrategy {
  if (preferredStrategy) return preferredStrategy;
  
  if (isOnTiendaNubeDomain) return CheckoutStrategies.JAVASCRIPT_API;
  if (hasAccessToken) return CheckoutStrategies.DIRECT_CHECKOUT;
  
  return CheckoutStrategies.PRODUCT_PAGE;
}

/**
 * Mensajes de usuario para cada estrategia
 */
export const StrategyMessages = {
  [CheckoutStrategies.DIRECT_CHECKOUT]: '🚀 Redirigiendo al checkout con tu producto...',
  [CheckoutStrategies.PRODUCT_PAGE]: '📱 Abriendo producto en TiendaNube. Haz clic en "Agregar al carrito".',
  [CheckoutStrategies.JAVASCRIPT_API]: '⚡ Agregando producto al carrito...',
  [CheckoutStrategies.FORM_POST]: '📝 Procesando tu pedido...'
};