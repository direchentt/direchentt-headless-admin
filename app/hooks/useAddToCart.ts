'use client';

import { useState } from 'react';

type CheckoutRedirectExtras = {
  productId?: string | number;
  name?: string;
  price?: number;
};

export const useAddToCart = (storeId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToCart = async (
    variantId: string,
    quantity: number,
    email?: string,
    extras?: CheckoutRedirectExtras
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${window.location.origin}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          quantity,
          email,
          shop: storeId || '5112334',
          ...(extras?.productId != null ? { productId: extras.productId } : {}),
          ...(extras?.name != null ? { name: extras.name } : {}),
          ...(extras?.price != null ? { price: extras.price } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'No se pudo obtener el checkout');
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return { addToCart, isLoading, error };
};

