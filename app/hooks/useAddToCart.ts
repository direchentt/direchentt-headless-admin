'use client';

import { useState } from 'react';

export const useAddToCart = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToCart = (variantId: string, quantity: number) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🛒 Agregando al carrito de TiendaNube:', { variantId, quantity });
      
      // Usar el endpoint de TiendaNube para agregar al carrito y redirigir directamente al checkout
      // Este formato es compatible con TiendaNube y funciona cross-domain
      const checkoutUrl = `https://www.direchentt.com.ar/cart/add/${variantId}:${quantity}?from_store=1&country=AR`;
      
      console.log('✅ Redirigiendo a checkout de TiendaNube:', checkoutUrl);
      
      // Redirección directa - más confiable que form.submit()
      window.location.href = checkoutUrl;
      
      // No seteamos isLoading a false porque la página se va a redirigir
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado';
      console.error('❌ Error en useAddToCart:', errorMessage);
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  return { addToCart, isLoading, error };
};

