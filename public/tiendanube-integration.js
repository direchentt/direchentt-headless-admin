/**
 * Script para integrar tu headless con TiendaNube
 * Incluye este script en tu plantilla de TiendaNube para mejorar la integración
 */

(function() {
  'use strict';
  
  // Configuración
  const config = {
    headlessOrigin: '{{ headless_domain }}', // Reemplaza con tu dominio
    debug: false
  };
  
  // Utility functions
  function log(...args) {
    if (config.debug) console.log('[Headless Integration]', ...args);
  }
  
  function error(...args) {
    console.error('[Headless Integration]', ...args);
  }
  
  /**
   * Función principal para agregar productos al carrito
   */
  function addToCartFromHeadless(variantId, quantity = 1, callback) {
    log('Adding to cart:', { variantId, quantity });
    
    if (typeof LS !== 'undefined' && LS.cart) {
      // Método 1: Usar la API de TiendaNube
      LS.cart.addToCart(variantId, quantity, function(success, data) {
        log('LS.cart.addToCart result:', { success, data });
        
        if (success) {
          // Actualizar el contador del carrito si existe
          updateCartCounter();
          
          // Mostrar notificación de éxito
          showNotification('✅ Producto agregado al carrito', 'success');
          
          if (callback) callback(true, data);
        } else {
          error('Failed to add to cart using LS.cart');
          fallbackAddToCart(variantId, quantity, callback);
        }
      });
    } else {
      // Método 2: Fallback usando formulario POST
      log('LS.cart not available, using fallback');
      fallbackAddToCart(variantId, quantity, callback);
    }
  }
  
  /**
   * Método de respaldo para agregar al carrito
   */
  function fallbackAddToCart(variantId, quantity, callback) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/cart/add';
    form.style.display = 'none';
    
    const variantInput = document.createElement('input');
    variantInput.type = 'hidden';
    variantInput.name = 'id';
    variantInput.value = variantId;
    
    const quantityInput = document.createElement('input');
    quantityInput.type = 'hidden';
    quantityInput.name = 'quantity';
    quantityInput.value = quantity;
    
    form.appendChild(variantInput);
    form.appendChild(quantityInput);
    document.body.appendChild(form);
    
    // Interceptar el submit para manejar la respuesta
    form.addEventListener('submit', function(e) {
      log('Fallback form submitted');
      if (callback) callback(true, null);
    });
    
    form.submit();
    
    setTimeout(() => {
      document.body.removeChild(form);
    }, 1000);
  }
  
  /**
   * Actualizar contador del carrito en la interfaz
   */\n  function updateCartCounter() {\n    // Buscar elementos comunes del contador del carrito\n    const selectors = [\n      '.cart-count',\n      '.cart-counter', \n      '.js-cart-count',\n      '[data-cart-count]',\n      '.header-cart-count'\n    ];\n    \n    selectors.forEach(selector => {\n      const elements = document.querySelectorAll(selector);\n      elements.forEach(element => {\n        // Intentar obtener el count actual del carrito\n        if (typeof LS !== 'undefined' && LS.cart && LS.cart.getCartData) {\n          const cartData = LS.cart.getCartData();\n          if (cartData && cartData.item_count !== undefined) {\n            element.textContent = cartData.item_count;\n          }\n        }\n      });\n    });\n  }\n  \n  /**\n   * Mostrar notificación al usuario\n   */\n  function showNotification(message, type = 'info') {\n    // Crear elemento de notificación\n    const notification = document.createElement('div');\n    notification.textContent = message;\n    notification.style.cssText = `\n      position: fixed;\n      top: 20px;\n      right: 20px;\n      padding: 12px 20px;\n      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};\n      color: white;\n      border-radius: 4px;\n      z-index: 10000;\n      box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n      font-size: 14px;\n      max-width: 300px;\n      animation: slideInRight 0.3s ease-out;\n    `;\n    \n    // Agregar animación CSS\n    if (!document.getElementById('headless-notification-styles')) {\n      const style = document.createElement('style');\n      style.id = 'headless-notification-styles';\n      style.textContent = `\n        @keyframes slideInRight {\n          from { transform: translateX(100%); opacity: 0; }\n          to { transform: translateX(0); opacity: 1; }\n        }\n        @keyframes slideOutRight {\n          from { transform: translateX(0); opacity: 1; }\n          to { transform: translateX(100%); opacity: 0; }\n        }\n      `;\n      document.head.appendChild(style);\n    }\n    \n    document.body.appendChild(notification);\n    \n    // Remover después de 3 segundos\n    setTimeout(() => {\n      notification.style.animation = 'slideOutRight 0.3s ease-out';\n      setTimeout(() => {\n        if (notification.parentNode) {\n          notification.parentNode.removeChild(notification);\n        }\n      }, 300);\n    }, 3000);\n  }\n  \n  /**\n   * Manejar mensajes desde el headless\n   */\n  function handleHeadlessMessage(event) {\n    // Verificar origen por seguridad\n    if (event.origin !== config.headlessOrigin) return;\n    \n    const { type, data } = event.data;\n    \n    switch (type) {\n      case 'ADD_TO_CART':\n        addToCartFromHeadless(data.variantId, data.quantity, (success, result) => {\n          // Enviar respuesta de vuelta al headless\n          event.source.postMessage({\n            type: 'ADD_TO_CART_RESPONSE',\n            success,\n            data: result\n          }, event.origin);\n        });\n        break;\n        \n      case 'GET_CART_DATA':\n        let cartData = null;\n        if (typeof LS !== 'undefined' && LS.cart && LS.cart.getCartData) {\n          cartData = LS.cart.getCartData();\n        }\n        \n        event.source.postMessage({\n          type: 'CART_DATA_RESPONSE',\n          data: cartData\n        }, event.origin);\n        break;\n        \n      default:\n        log('Unknown message type:', type);\n    }\n  }\n  \n  /**\n   * Procesar parámetros de URL para auto-agregar productos\n   */\n  function processUrlParams() {\n    const urlParams = new URLSearchParams(window.location.search);\n    const variantId = urlParams.get('add_variant');\n    const quantity = parseInt(urlParams.get('quantity') || '1');\n    \n    if (variantId) {\n      log('Auto-adding variant from URL:', variantId);\n      \n      // Esperar un poco para que TiendaNube se inicialice\n      setTimeout(() => {\n        addToCartFromHeadless(variantId, quantity, (success) => {\n          if (success) {\n            // Opcional: redireccionar al carrito o checkout\n            const redirect = urlParams.get('redirect');\n            if (redirect === 'cart') {\n              window.location.href = '/cart';\n            } else if (redirect === 'checkout') {\n              window.location.href = '/checkout';\n            }\n          }\n        });\n      }, 1000);\n    }\n  }\n  \n  // Inicialización\n  function init() {\n    log('Initializing headless integration');\n    \n    // Escuchar mensajes del headless\n    window.addEventListener('message', handleHeadlessMessage);\n    \n    // Procesar parámetros de URL\n    processUrlParams();\n    \n    // Exponer funciones globalmente para uso manual\n    window.HeadlessIntegration = {\n      addToCart: addToCartFromHeadless,\n      updateCartCounter,\n      showNotification\n    };\n    \n    log('Integration ready');\n  }\n  \n  // Inicializar cuando el DOM esté listo\n  if (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', init);\n  } else {\n    init();\n  }\n  \n})();