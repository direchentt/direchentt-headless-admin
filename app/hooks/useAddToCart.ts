'use client';

import { useState } from 'react';

export const useAddToCart = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToCart = (variantId: string, quantity: number) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🛒 Enviando POST a /comprar/ con:', { variantId, quantity });
      
      // Crear un formulario que haga POST a /comprar/ de TiendaNube
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://www.direchentt.com.ar/comprar/';
      form.style.display = 'none';
      
      // TiendaNube espera estos parámetros exactos
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
      
      // Agregar al DOM, enviar y limpiar
      document.body.appendChild(form);
      console.log('✅ Enviando formulario a TiendaNube /comprar/');
      form.submit();
      
      // No removemos el form porque el navegador se va a redirigir
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

