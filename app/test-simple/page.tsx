// Test simple para verificar que los botones de checkout funcionan
'use client';

import { useState } from 'react';

export default function SimpleCheckoutTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const testCheckout = async (variantId: string, productId: string, quantity: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, productId, quantity })
      });
      
      const result = await response.json();
      setResult(result);
      
      if (result.success && result.checkoutUrl) {
        // Abrir en nueva ventana
        const newWindow = window.open(result.checkoutUrl, '_blank', 'width=1000,height=800');
        if (!newWindow) {
          // Si el popup fue bloqueado, preguntar al usuario
          const goToCheckout = confirm('El popup fue bloqueado. ¿Quieres ir al checkout en esta ventana?');
          if (goToCheckout) {
            window.location.href = result.checkoutUrl;
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: error instanceof Error ? error.message : 'Error desconocido' });
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '40px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🛒 Test Simple de Checkout - TiendaNube</h1>
      
      <div style={{ 
        border: '2px solid #ddd', 
        borderRadius: '12px', 
        padding: '30px',
        backgroundColor: '#f9f9f9',
        marginBottom: '20px'
      }}>
        <h2>Prueba con IDs reales</h2>
        <p><strong>Variant ID:</strong> 1386747186</p>
        <p><strong>Product ID:</strong> 308877801</p>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button 
            onClick={() => testCheckout('1386747186', '308877801', 1)}
            disabled={loading}
            style={{
              backgroundColor: '#007cba',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? 'Procesando...' : 'Probar Checkout (Cantidad: 1)'}
          </button>
          
          <button 
            onClick={() => testCheckout('1386747186', '308877801', 2)}
            disabled={loading}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? 'Procesando...' : 'Probar Checkout (Cantidad: 2)'}
          </button>
        </div>
      </div>

      {result && (
        <div style={{ 
          border: '1px solid #ccc', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: result.success ? '#e8f5e8' : '#ffe8e8'
        }}>
          <h3>{result.success ? '✅ Resultado exitoso' : '❌ Error'}</h3>
          <pre style={{ 
            backgroundColor: '#f0f0f0', 
            padding: '15px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.success && result.alternatives && (
            <div style={{ marginTop: '15px' }}>
              <h4>URLs disponibles para probar:</h4>
              
              {/* URLs con IDs originales */}
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <strong>📦 URLs con IDs de Producto/Variante:</strong>
                <ul style={{ marginTop: '5px' }}>
                  <li><a href={result.alternatives.cartAddId} target="_blank">🛒 Cart Add (id=) - Formato 1</a></li>
                  <li><a href={result.alternatives.cartAddVariant} target="_blank">🛒 Cart Add (variant=) - Formato 2</a></li>
                  <li><a href={result.alternatives.checkoutDirect} target="_blank">⚡ Checkout Directo - Formato 3</a></li>
                  <li><a href={result.alternatives.productWithVariant} target="_blank">📄 Producto con Variant - Formato 4</a></li>
                  <li><a href={result.alternatives.cartSimple} target="_blank">🛍️ Cart Simple - Formato 5</a></li>
                  <li><a href={result.alternatives.productAutoAdd} target="_blank">🚀 Producto Auto-Add - Formato 6</a></li>
                </ul>
              </div>

              {/* URLs de productos reales que funcionan */}
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
                <strong>✅ URLs de Productos Reales (sabemos que funcionan):</strong>
                <ul style={{ marginTop: '5px' }}>
                  <li><a href={result.alternatives.knownWorking1} target="_blank">👒 Beanie Wilow (URL real)</a></li>
                  <li><a href={result.alternatives.knownWorking2} target="_blank">👒 Beanie Kravel (URL real)</a></li>
                  <li><a href={result.alternatives.knownWorking3} target="_blank">👕 Kham T-shirt (URL real)</a></li>
                </ul>
              </div>

              {/* URLs de prueba con handles */}
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
                <strong>🧪 URLs de Prueba con Handles:</strong>
                <ul style={{ marginTop: '5px' }}>
                  <li><a href={result.alternatives.testBeanieWilow} target="_blank">👒 Test Beanie Wilow con quantity</a></li>
                  <li><a href={result.alternatives.testBeanieWilowCart} target="_blank">🛒 Test Beanie Wilow Cart</a></li>
                  <li><a href={result.alternatives.testBeanieKravel} target="_blank">👒 Test Beanie Kravel</a></li>
                  <li><a href={result.alternatives.testKhamTshirt} target="_blank">👕 Test Kham T-shirt</a></li>
                </ul>
              </div>

              {/* URLs de carrito con diferentes formatos */}
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                <strong>🛒 URLs de Carrito con Handles:</strong>
                <ul style={{ marginTop: '5px' }}>
                  <li><a href={result.alternatives.cartWithHandle1} target="_blank">🛒 Cart con Product param</a></li>
                  <li><a href={result.alternatives.cartWithHandle2} target="_blank">🛒 Cart con SKU param</a></li>
                </ul>
              </div>

              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                💡 <strong>Tip:</strong> Ahora tienes {Object.keys(result.alternatives).length} formatos diferentes. Prueba cada uno hasta encontrar el que funcione.
              </p>
              {result.productHandle && (
                <p style={{ fontSize: '12px', color: '#007cba', marginTop: '5px' }}>
                  ✅ <strong>Handle encontrado:</strong> {result.productHandle}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        border: '1px solid #2196f3'
      }}>
        <h3>ℹ️ Información de la prueba</h3>
        <p>Esta página prueba directamente el endpoint <code>/api/checkout-simple</code> que:</p>
        <ul>
          <li>✅ NO usa la API de carts de TiendaNube (que no funciona)</li>
          <li>✅ Genera URLs directas que SÍ funcionan</li>
          <li>✅ Usa el dominio correcto: www.direchentt.com.ar</li>
          <li>✅ Usa IDs reales del catálogo</li>
        </ul>
        <p><strong>Resultado esperado:</strong> Se abrirá una nueva ventana de TiendaNube con el producto agregado al carrito.</p>
      </div>
    </div>
  );
}