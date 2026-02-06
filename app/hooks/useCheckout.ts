'use client';

import { useState } from 'react';

interface CheckoutItem {
  variantId: number;
  quantity: number;
  productId?: number;
}

export function useCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckout = async (items: CheckoutItem[]) => {
    setIsLoading(true);
    setError(null);

    try {
      if (items.length === 0) {
        throw new Error('El carrito está vacío');
      }

      // Llamar a nuestra API para crear el carrito en TiendaNube y obtener la URL oficial
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          shop: '5112334' // ID de la tienda del usuario
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'No se pudo generar el checkout');
      }

      console.log('🛒 Redirigiendo al checkout oficial:', data.checkoutUrl);
      window.location.href = data.checkoutUrl;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error en checkout:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckout,
    createCartAndCheckout: createCheckout, // Alias para compatibilidad
    loading: isLoading,
    isLoading,
    error
  };
}