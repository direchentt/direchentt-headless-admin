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
      
      // Crear formulario HTML para POST a /comprar/ de TiendaNube
      // Este es el método estándar que usa TiendaNube
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://www.direchentt.com.ar/comprar/';
      
      const addToCartField = document.createElement('input');
      addToCartField.type = 'hidden';
      addToCartField.name = 'add_to_cart';
      addToCartField.value = variantId;
      form.appendChild(addToCartField);
      
      const quantityField = document.createElement('input');
      quantityField.type = 'hidden';
      quantityField.name = 'quantity';
      quantityField.value = quantity.toString();
      form.appendChild(quantityField);
      
      document.body.appendChild(form);
      console.log('✅ Enviando formulario a TiendaNube /comprar/');
      form.submit();
      
      // No seteamos isLoading a false porque el navegador se va a redirigir
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

