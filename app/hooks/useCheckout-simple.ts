'use client';

import { useState } from 'react';

interface CheckoutItem {
  variantId: string;
  quantity: number;
  productId?: string;
}

interface UseCheckoutOptions {
  storeId: string;
  domain?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

interface CheckoutState {
  loading: boolean;
  error: string | null;
}

export function useCheckout({ storeId, domain, onSuccess, onError }: UseCheckoutOptions) {
  const [state, setState] = useState<CheckoutState>({
    loading: false,
    error: null
  });

  /**
   * Agregar producto al carrito
   */
  const addToCart = async (item: CheckoutItem) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/checkout-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setState(prev => ({ ...prev, loading: false }));
        
        // Para addToCart, abrimos la URL en nueva pestaña
        const addToCartUrl = result.alternatives?.directAdd || result.checkoutUrl;
        if (addToCartUrl) {
          const newWindow = window.open(addToCartUrl, '_blank');
          if (!newWindow) {
            // Si el popup fue bloqueado, redirigir en la misma ventana
            window.location.href = addToCartUrl;
          }
        }
        
        onSuccess?.(result);
        return result;
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al agregar al carrito';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      onError?.(errorMessage);
      throw error;
    }
  };

  /**
   * Proceder directamente al checkout
   */
  const buyNow = async (item: CheckoutItem) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/checkout-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      
      const result = await response.json();
      
      if (result.success && result.checkoutUrl) {
        setState(prev => ({ ...prev, loading: false }));
        
        // Abrir checkout en nueva ventana
        const newWindow = window.open(result.checkoutUrl, '_blank', 'width=1000,height=800');
        
        if (newWindow) {
          onSuccess?.(result);
          return result;
        } else {
          // Si el popup fue bloqueado, redirigir en la misma ventana
          window.location.href = result.checkoutUrl;
          onSuccess?.(result);
          return result;
        }
      } else {
        throw new Error(result.error || 'Error en el checkout');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar checkout';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      onError?.(errorMessage);
      throw error;
    }
  };

  /**
   * Resetear el estado
   */
  const reset = () => {
    setState({ loading: false, error: null });
  };

  return {
    // Estado
    loading: state.loading,
    error: state.error,
    
    // Acciones
    addToCart,
    buyNow,
    reset
  };
}