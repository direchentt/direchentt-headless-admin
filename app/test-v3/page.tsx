'use client';

import { useState } from 'react';

export default function TestCheckoutV3() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  const testCheckoutV3 = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/checkout-v3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variantId: '1386747186',
          quantity: quantity,
          productId: '308877801'
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Error de conexión',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🚀 Test Checkout V3 - Patrón TiendaNube Real</h1>
      
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f0f8ff', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '2px solid #007cba'
      }}>
        <h2>💡 Información Importante</h2>
        <p>Este endpoint intenta replicar el patrón V3 real de TiendaNube que compartiste:</p>
        <code style={{ 
          backgroundColor: '#e8f4f8', 
          padding: '10px', 
          display: 'block', 
          borderRadius: '4px',
          fontSize: '12px',
          wordBreak: 'break-all'
        }}>
          https://direchentt.mitiendanube.com/checkout/v3/start/1883736273/cf70b8a50dc9640327892d31728cad7b9aa4babd?from_store=1&country=AR
        </code>
        <p><strong>Estructura:</strong> <code>/checkout/v3/start/[SESSION_ID]/[SECURITY_TOKEN]?from_store=1&country=AR</code></p>
      </div>

      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fff', 
        borderRadius: '8px', 
        border: '1px solid #ddd',
        marginBottom: '20px'
      }}>
        <h3>🧪 Configuración de Prueba</h3>
        
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
              borderRadius: '4px' 
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong>Producto de Prueba:</strong>
          <ul style={{ margin: '5px 0', fontSize: '14px' }}>
            <li><code>variantId: 1386747186</code></li>
            <li><code>productId: 308877801</code></li>
            <li><code>store: 5112334 (direchentt.mitiendanube.com)</code></li>
          </ul>
        </div>

        <button
          onClick={testCheckoutV3}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#ccc' : '#007cba',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? '🔄 Probando V3...' : '🚀 Probar Checkout V3'}
        </button>

        <button
          onClick={() => {
            setQuantity(quantity + 1);
            testCheckoutV3();
          }}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Cargando...' : `➕ Probar con ${quantity + 1} unidades`}
        </button>
      </div>

      {result && (
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          borderRadius: '8px',
          border: result.success ? '2px solid #28a745' : '2px solid #dc3545',
          backgroundColor: result.success ? '#d4edda' : '#f8d7da'
        }}>
          <h3>{result.success ? '✅ Resultado Exitoso' : '❌ Error'}</h3>
          
          {result.success && result.alternatives && (
            <div style={{ marginTop: '15px' }}>
              <h4>🎯 URLs Generadas con Patrón V3:</h4>
              
              {/* URLs que siguen el patrón v3 real */}
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
                <strong>✅ Patrón /checkout/v3/start/ EXACTO:</strong>
                <ul style={{ marginTop: '5px' }}>
                  <li><a href={result.alternatives.v3StartWithIds} target="_blank" style={{ color: '#007cba' }}>🚀 V3 Start con IDs simulados</a></li>
                  <li><a href={result.alternatives.v3StartDirect} target="_blank" style={{ color: '#007cba' }}>🎯 V3 Start Directo (MÁS PROBABLE)</a></li>
                  <li><a href={result.alternatives.v3StartAdd} target="_blank" style={{ color: '#007cba' }}>🛒 V3 Start con Add</a></li>
                  <li><a href={result.alternatives.v3StartVariant} target="_blank" style={{ color: '#007cba' }}>📦 V3 Start con Variant ID</a></li>
                </ul>
              </div>

              {/* URLs con parámetros adicionales */}
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
                <strong>🧪 V3 Start con Parámetros:</strong>
                <ul style={{ marginTop: '5px' }}>
                  <li><a href={result.alternatives.v3StartParams1} target="_blank" style={{ color: '#ff8c00' }}>📋 V3 Start con Arrays</a></li>
                  <li><a href={result.alternatives.v3StartParams2} target="_blank" style={{ color: '#ff8c00' }}>⚙️ V3 Start con Params Alt</a></li>
                </ul>
              </div>

              {/* URLs de fallback */}
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                <strong>🔄 URLs de Fallback:</strong>
                <ul style={{ marginTop: '5px' }}>
                  <li><a href={result.alternatives.cartRedirect} target="_blank" style={{ color: '#2196f3' }}>🛒 Cart con redirect a checkout</a></li>
                  <li><a href={result.alternatives.instantBuy} target="_blank" style={{ color: '#2196f3' }}>⚡ Instant Buy</a></li>
                </ul>
              </div>

              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                💡 <strong>Tip:</strong> Las URLs con patrón V3 real requieren IDs y tokens válidos de sesión. 
                Las URLs directas tienen más probabilidad de funcionar.
              </p>
            </div>
          )}

          <details style={{ marginTop: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📋 Ver respuesta completa JSON</summary>
            <pre style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '11px',
              marginTop: '10px'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h3>ℹ️ Información Técnica</h3>
        <p>Este endpoint (<code>/api/checkout-v3</code>) intenta:</p>
        <ol>
          <li>✅ <strong>Crear sesión oficial</strong> usando la API de TiendaNube</li>
          <li>✅ <strong>Generar URLs V3</strong> siguiendo el patrón que funciona</li>
          <li>✅ <strong>Proporcionar alternativas</strong> de fallback</li>
        </ol>
        
        <p><strong>Diferencias con /api/checkout-simple:</strong></p>
        <ul>
          <li>🎯 Enfoque en patrón V3 real de TiendaNube</li>
          <li>🚀 Intento de usar API oficial para generar sesiones válidas</li>
          <li>🔗 URLs que siguen la estructura /checkout/v3/start/ID/TOKEN</li>
        </ul>
      </div>
    </div>
  );
}