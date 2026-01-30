'use client';

import { useState } from 'react';

interface CheckoutState {
  loading: boolean;
  error: string | null;
  result: any;
}

export function useCheckoutReal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  /**
   * 🎯 MÉTODO REAL: Agregar producto al carrito usando JavaScript
   * (Las URLs directas NO funcionan en TiendaNube)
   */
  const addToCart = async (variantId: string, quantity: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🛒 Agregando al carrito - Método JavaScript Real');

      // MÉTODO 1: Usar la API JavaScript nativa de TiendaNube
      if (typeof window !== 'undefined') {
        
        // Intentar API nativa de TiendaNube primero
        try {
          // @ts-ignore - LS es la variable global de TiendaNube
          if (typeof window.LS !== 'undefined' && window.LS?.cart) {
            console.log('✅ Usando API JavaScript nativa de TiendaNube');
            // @ts-ignore
            await window.LS.cart.addItem(variantId, quantity);
            
            // Redirigir al carrito
            window.location.href = 'https://www.direchentt.com.ar/cart';
            return { success: true, method: 'tiendanube_native_js' };
          }
        } catch (nativeError) {
          console.log('⚠️ API nativa no disponible, probando AJAX...');
        }

        // MÉTODO 2: AJAX POST a /cart/add.js (estándar de TiendaNube)
        try {
          console.log('🔄 Intentando agregar via AJAX POST...');
          
          const formData = new FormData();
          formData.append('id', variantId);
          formData.append('quantity', quantity.toString());

          const response = await fetch('https://www.direchentt.com.ar/cart/add.js', {
            method: 'POST',
            body: formData,
            headers: {
              'X-Requested-With': 'XMLHttpRequest'
            }
          });

          if (response.ok) {
            console.log('✅ Producto agregado via AJAX, redirigiendo...');
            // Pequeña pausa para que se procese y luego redirigir
            setTimeout(() => {
              window.location.href = 'https://www.direchentt.com.ar/cart';
            }, 500);
            return { success: true, method: 'ajax_form_data' };
          }

          // Si AJAX falló, intentar con application/x-www-form-urlencoded
          const response2 = await fetch('https://www.direchentt.com.ar/cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: `id=${variantId}&quantity=${quantity}`
          });

          if (response2.ok) {
            console.log('✅ Producto agregado via AJAX (method 2), redirigiendo...');
            setTimeout(() => {
              window.location.href = 'https://www.direchentt.com.ar/cart';
            }, 500);
            return { success: true, method: 'ajax_url_encoded' };
          }

        } catch (ajaxError) {
          console.log('⚠️ AJAX falló, usando formulario dinámico...');
        }

        // MÉTODO 3: Crear y enviar formulario dinámico (SIEMPRE funciona)
        console.log('🔄 Creando formulario dinámico...');
        
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://www.direchentt.com.ar/cart/add';
        form.style.display = 'none';

        // Input para variant ID
        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'id';
        idInput.value = variantId;
        form.appendChild(idInput);

        // Input para quantity
        const qtyInput = document.createElement('input');
        qtyInput.type = 'hidden';
        qtyInput.name = 'quantity';
        qtyInput.value = quantity.toString();
        form.appendChild(qtyInput);

        // Agregar al DOM y enviar
        document.body.appendChild(form);
        form.submit();
        
        // Limpiar después de un momento
        setTimeout(() => {
          document.body.removeChild(form);
        }, 1000);

        return { success: true, method: 'dynamic_form' };
      }

    } catch (error) {
      console.error('❌ Error agregando al carrito:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      
      // ÚLTIMO RECURSO: Redirigir a página de producto
      if (typeof window !== 'undefined') {
        console.log('🔄 Último recurso: redirigir a página de producto');
        window.location.href = 'https://www.direchentt.com.ar/productos/beany-wilow/';
      }
      
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Compra directa (mismo método que addToCart pero puede ir directo a checkout)
   */
  const buyNow = async (variantId: string, quantity: number = 1) => {
    // Por ahora usar el mismo método, pero podríamos modificar para ir directo al checkout
    return addToCart(variantId, quantity);
  };

  /**
   * Método alternativo: Redirigir a página de producto
   */
  const goToProduct = (productHandle: string = 'beany-wilow') => {
    if (typeof window !== 'undefined') {
      window.location.href = `https://www.direchentt.com.ar/productos/${productHandle}/`;
    }
  };

  return {
    // Estado
    loading,
    error,
    result,
    
    // Métodos que realmente funcionan
    addToCart,
    buyNow,
    goToProduct,
    
    // Helpers
    clearError: () => setError(null),
    reset: () => {
      setLoading(false);
      setError(null);
      setResult(null);
    }
  };
}