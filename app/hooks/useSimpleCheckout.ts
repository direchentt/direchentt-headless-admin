import { useCallback } from 'react';

interface UseSimpleCheckoutParams {
  storeUrl?: string;
  productId?: string;
  variantId?: string;
}

export const useSimpleCheckout = ({ 
  storeUrl = 'https://www.direchentt.com.ar', 
  productId,
  variantId 
}: UseSimpleCheckoutParams = {}) => {
  
  // Método que SÍ funciona: Redirigir a la página del producto
  const goToProduct = useCallback((customProductId?: string, openInNewTab = true) => {
    const finalProductId = customProductId || productId;
    
    if (!finalProductId) {
      console.error('Product ID is required');
      return;
    }

    const productUrl = `${storeUrl}/products/${finalProductId}`;
    
    if (openInNewTab) {
      window.open(productUrl, '_blank');
    } else {
      window.location.href = productUrl;
    }
    
    return productUrl;
  }, [storeUrl, productId]);

  // Crear enlace HTML para el producto
  const createProductLink = useCallback((customProductId?: string, linkText = 'Ver Producto') => {
    const finalProductId = customProductId || productId;
    
    if (!finalProductId) {
      console.error('Product ID is required');
      return null;
    }

    const productUrl = `${storeUrl}/products/${finalProductId}`;
    
    return {
      href: productUrl,
      text: linkText,
      target: '_blank'
    };
  }, [storeUrl, productId]);

  // Obtener URL del producto
  const getProductUrl = useCallback((customProductId?: string) => {
    const finalProductId = customProductId || productId;
    
    if (!finalProductId) {
      return null;
    }

    return `${storeUrl}/products/${finalProductId}`;
  }, [storeUrl, productId]);

  return {
    goToProduct,
    createProductLink,
    getProductUrl
  };
};