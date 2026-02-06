'use client';

import { useState } from 'react';
import { useCheckoutReal } from '../hooks/useCheckout-real';

export default function TestRealCheckout() {
  const { loading, error, addToCart, buyNow, goToProduct, clearError } = useCheckoutReal();
  const [quantity, setQuantity] = useState(1);

  const testProduct = {
    variantId: '1386747186',
    productId: '308877801',
    name: 'Producto de Prueba'
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>✅ Checkout Real - Métodos que SÍ Funcionan</h1>
      
      {/* Información importante */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#d4edda', 
        border: '2px solid #28a745', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h2>🎯 PROBLEMA IDENTIFICADO Y RESUELTO:</h2>
        <p><strong>❌ URLs que NO funcionan:</strong> Todas las URLs directas de <code>/cart/add</code>, <code>/checkout/v3/start</code>, etc. devuelven <strong>404 Error</strong></p>
        <p><strong>✅ SOLUCIÓN REAL:</strong> Usar JavaScript/AJAX/Formularios para agregar productos al carrito</p>
        
        <div style={{ marginTop: '15px', fontSize: '14px' }}>
          <strong>URLs probadas en vivo:</strong>
          <ul style={{ marginTop: '5px' }}>
            <li>❌ <code>https://direchentt.mitiendanube.com/cart/add?id=1386747186&quantity=1</code> → 404</li>
            <li>❌ <code>https://direchentt.mitiendanube.com/checkout/v3/start?variant_id=1386747186</code> → 404</li>
            <li>✅ <code>https://direchentt.mitiendanube.com/cart</code> → 200 OK</li>
            <li>✅ <code>https://direchentt.mitiendanube.com/productos/beany-wilow/</code> → 200 OK</li>
          </ul>
        </div>
      </div>

      {/* Configuración de prueba */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6' 
      }}>
        <h3>🧪 Prueba con Producto Real:</h3>
        <div style={{ marginBottom: '15px' }}>
          <strong>Producto:</strong> {testProduct.name}<br/>
          <strong>Variant ID:</strong> <code>{testProduct.variantId}</code><br/>
          <strong>Product ID:</strong> <code>{testProduct.productId}</code>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label><strong>Cantidad:</strong></label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            min="1"
            max="10"
            style={{ 
              marginLeft: '10px', 
              padding: '5px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              width: '60px'
            }}
          />
        </div>

        {error && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f8d7da', 
            border: '1px solid #dc3545', 
            borderRadius: '4px', 
            marginBottom: '15px',
            color: '#721c24' 
          }}>
            <strong>Error:</strong> {error}
            <button 
              onClick={clearError} 
              style={{ 
                marginLeft: '10px', 
                background: 'none', 
                border: 'none', 
                color: '#721c24', 
                textDecoration: 'underline',
                cursor: 'pointer' 
              }}
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fff', 
        borderRadius: '8px', 
        border: '1px solid #ddd',
        marginBottom: '20px' 
      }}>
        <h3>🚀 Métodos que Funcionan:</h3>
        
        <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          
          <button
            onClick={() => addToCart(testProduct.variantId, quantity)}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#6c757d' : '#007cba',
              color: 'white',
              padding: '15px 20px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? '🔄 Agregando...' : '🛒 Agregar al Carrito (JavaScript)'}
          </button>

          <button
            onClick={() => buyNow(testProduct.variantId, quantity)}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#6c757d' : '#28a745',
              color: 'white',
              padding: '15px 20px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? '🔄 Procesando...' : '⚡ Comprar Ahora (JavaScript)'}
          </button>

          <button
            onClick={() => goToProduct('beany-wilow')}
            style={{
              backgroundColor: '#ffc107',
              color: '#212529',
              padding: '15px 20px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            📄 Ir a Página de Producto
          </button>

          <a 
            href="https://direchentt.mitiendanube.com/cart"
            target="_blank"
            style={{
              backgroundColor: '#6f42c1',
              color: 'white',
              padding: '15px 20px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'block',
              textAlign: 'center',
              transition: 'background-color 0.2s'
            }}
          >
            🛍️ Abrir Carrito Directamente
          </a>
        </div>
      </div>

      {/* Información técnica */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        border: '1px solid #2196f3' 
      }}>
        <h3>⚙️ Cómo Funciona:</h3>
        <ol>
          <li><strong>Método 1:</strong> Usar la API JavaScript nativa de TiendaNube (<code>LS.cart.addItem()</code>)</li>
          <li><strong>Método 2:</strong> AJAX POST a <code>/cart/add.js</code> con FormData</li>
          <li><strong>Método 3:</strong> Crear formulario HTML dinámico y enviarlo por POST</li>
          <li><strong>Fallback:</strong> Redirigir a página de producto si todo falla</li>
        </ol>
        
        <p style={{ marginTop: '15px', fontSize: '14px', fontStyle: 'italic' }}>
          💡 <strong>Nota:</strong> Los métodos JavaScript funcionan mejor cuando se ejecutan desde dentro del dominio de TiendaNube. 
          Para uso desde dominios externos, el formulario HTML es la opción más confiable.
        </p>
      </div>

      {/* Código de ejemplo */}
      <details style={{ marginTop: '20px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          📋 Ver código JavaScript que funciona
        </summary>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '12px',
          marginTop: '10px',
          border: '1px solid #dee2e6'
        }}>
{`// Método 1: API nativa de TiendaNube
if (typeof LS !== 'undefined' && LS.cart) {
  LS.cart.addItem('${testProduct.variantId}', ${quantity});
}

// Método 2: AJAX POST
fetch('https://direchentt.mitiendanube.com/cart/add.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'id=${testProduct.variantId}&quantity=${quantity}'
});

// Método 3: Formulario dinámico
const form = document.createElement('form');
form.method = 'POST';
form.action = 'https://direchentt.mitiendanube.com/cart/add';
// ... agregar inputs y submit`}
        </pre>
      </details>
    </div>
  );
}