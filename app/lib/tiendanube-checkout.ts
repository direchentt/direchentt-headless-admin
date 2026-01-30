// Tipos básicos para checkout de TiendaNube
export interface CheckoutItem {
  variantId: string;
  quantity: number;
  productId?: string;
}

export type CheckoutStrategy = 'direct_url' | 'product_page' | 'direct_checkout';

export const CheckoutStrategies = {
  DIRECT_URL: 'direct_url' as CheckoutStrategy,
  PRODUCT_PAGE: 'product_page' as CheckoutStrategy,
  DIRECT_CHECKOUT: 'direct_checkout' as CheckoutStrategy
};

export const StrategyMessages = {
  [CheckoutStrategies.DIRECT_URL]: 'Producto agregado al carrito. Serás redirigido a TiendaNube.',
  [CheckoutStrategies.PRODUCT_PAGE]: 'Abriendo página del producto en TiendaNube.',
  [CheckoutStrategies.DIRECT_CHECKOUT]: 'Iniciando proceso de checkout en TiendaNube.'
};