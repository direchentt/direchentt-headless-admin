'use client';

import { useState } from 'react';
import { CheckoutItem, CheckoutStrategy, CheckoutStrategies, StrategyMessages } from '../lib/tiendanube-checkout';

interface UseCheckoutOptions {
  storeId: string;
  domain?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

interface CheckoutState {
  loading: boolean;
  error: string | null;
  strategy: CheckoutStrategy | null;
}

export function useCheckout({ storeId, domain, onSuccess, onError }: UseCheckoutOptions) {
  const [state, setState] = useState<CheckoutState>({
    loading: false,
    error: null,
    strategy: null
  });

  /**
   * Agregar producto al carrito
   */
  const addToCart = async (item: CheckoutItem) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Usar el nuevo endpoint simplificado que SÍ funciona
      const response = await fetch('/api/checkout-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: item.variantId,
          quantity: item.quantity,
          productId: item.productId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          strategy: result.method as CheckoutStrategy 
        }));
        
        // Para addToCart, abrimos la URL alternativa "directAdd" en nueva pestaña
        const addToCartUrl = result.alternatives?.directAdd || result.checkoutUrl;
        if (addToCartUrl) {
          window.open(addToCartUrl, '_blank');
          // Mostrar mensaje informativo
          showUserMessage(CheckoutStrategies.PRODUCT_PAGE);
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
      // Usar el nuevo endpoint simplificado que SÍ funciona
      const response = await fetch('/api/checkout-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: item.variantId,
          quantity: item.quantity,
          productId: item.productId
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.checkoutUrl) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          strategy: result.fallback ? CheckoutStrategies.PRODUCT_PAGE : CheckoutStrategies.DIRECT_CHECKOUT 
        }));
        
        // Abrir checkout en nueva ventana
        const newWindow = window.open(result.checkoutUrl, '_blank', 'width=1000,height=800');
        
        if (newWindow) {
          // Mostrar mensaje apropiado
          if (result.fallback) {
            showUserMessage(CheckoutStrategies.PRODUCT_PAGE);
          } else {
            showUserMessage(CheckoutStrategies.DIRECT_CHECKOUT);
          }
          
          onSuccess?.(result);
          return result;
        } else {
          throw new Error('No se pudo abrir la ventana de checkout. Verifica que no esté bloqueada por el navegador.');
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
   * Mostrar mensaje al usuario según la estrategia
   */
  const showUserMessage = (strategy: CheckoutStrategy) => {
    const message = StrategyMessages[strategy];
    if (message) {
      // Usar notificación nativa o alert como fallback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('TiendaNube Checkout', { body: message });
      } else {
        alert(message);
      }
    }
  };

  /**
   * Resetear el estado
   */
  const reset = () => {
    setState({ loading: false, error: null, strategy: null });
  };

  return {
    // Estado
    loading: state.loading,
    error: state.error,
    strategy: state.strategy,
    
    // Acciones
    addToCart,
    buyNow,
    reset,
    
    // Utilidades
    showUserMessage
  };
}