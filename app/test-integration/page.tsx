'use client';

import { useState } from 'react';

export default function TestIntegrationPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutTest, setCheckoutTest] = useState<any>(null);
  const [simpleTest, setSimpleTest] = useState<any>(null);

  const runIntegrationTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-integration?shop=5112334');
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Error:', error);
      setTestResults({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
    setLoading(false);
  };

  const testCheckout = async () => {
    setLoading(true);
    try {
      // Primero obtener un producto real
      const productsResponse = await fetch('/api/products?shop=5112334&limit=1');
      const productsData = await productsResponse.json();
      
      if (!productsData.success || !productsData.products || productsData.products.length === 0) {
        throw new Error('No se encontraron productos reales');
      }
      
      const realProduct = productsData.products[0];
      const realVariant = realProduct.variants && realProduct.variants[0];
      
      if (!realVariant) {
        throw new Error('Producto sin variantes disponibles');
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: realVariant.id,
          quantity: 1,
          shop: '5112334',
          productId: realProduct.id,
          selectedVariant: realVariant
        })
      });
      const data = await response.json();
      
      // Agregar información del producto real usado
      data.productInfo = {
        productId: realProduct.id,
        productName: typeof realProduct.name === 'string' ? realProduct.name : 
                    (realProduct.name?.es || realProduct.name?.en || 'Producto sin nombre'),
        variantId: realVariant.id,
        price: realVariant.price
      };
      
      setCheckoutTest(data);
    } catch (error) {
      console.error('Error:', error);
      setCheckoutTest({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
    setLoading(false);
  };

  const testSimpleCheckout = async () => {
    setLoading(true);
    try {
      // Primero obtener un producto real
      const productsResponse = await fetch('/api/products?shop=5112334&limit=1');
      const productsData = await productsResponse.json();
      
      if (!productsData.success || !productsData.products || productsData.products.length === 0) {
        throw new Error('No se encontraron productos reales');
      }
      
      const realProduct = productsData.products[0];
      const realVariant = realProduct.variants && realProduct.variants[0];
      
      if (!realVariant) {
        throw new Error('Producto sin variantes disponibles');
      }

      const response = await fetch('/api/simple-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: realVariant.id,
          quantity: 1,
          shop: '5112334',
          productId: realProduct.id
        })
      });
      const data = await response.json();
      
      // Agregar información del producto real usado
      data.productInfo = {
        productId: realProduct.id,
        productName: typeof realProduct.name === 'string' ? realProduct.name : 
                    (realProduct.name?.es || realProduct.name?.en || 'Producto sin nombre'),
        variantId: realVariant.id,
        price: realVariant.price
      };
      
      setSimpleTest(data);
    } catch (error) {
      console.error('Error:', error);
      setSimpleTest({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🧪 Test de Integración TiendaNube</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>📊 Información de la Tienda</h2>
        <button 
          onClick={runIntegrationTest}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007cba',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Probando...' : 'Probar Integración'}
        </button>
      </div>

      {testResults && (
        <div style={{ 
          background: testResults.success ? '#f0fff0' : '#fff0f0', 
          padding: '15px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>{testResults.success ? '✅' : '❌'} Resultado del Test</h3>
          
          {testResults.results && (
            <div>
              <h4>🏪 Datos de la Tienda:</h4>
              <ul>
                <li><strong>Store ID:</strong> {testResults.results.storeData.storeId}</li>
                <li><strong>Nombre:</strong> {testResults.results.storeData.shopName}</li>
                <li><strong>Dominio:</strong> {testResults.results.storeData.domain}</li>
                <li><strong>Access Token:</strong> {testResults.results.storeData.hasAccessToken ? '✅ Disponible' : '❌ No disponible'}</li>
                <li><strong>Actualizado:</strong> {new Date(testResults.results.storeData.updatedAt).toLocaleString()}</li>
              </ul>

              <h4>🌐 Tests de Conectividad:</h4>
              <ul>
                <li>
                  <strong>Dominio:</strong> {testResults.results.tests.connectivity.success ? '✅' : '❌'} 
                  {testResults.results.tests.connectivity.status} {testResults.results.tests.connectivity.statusText}
                </li>
                <li>
                  <strong>API:</strong> {testResults.results.tests.api.success ? '✅' : '❌'} 
                  {testResults.results.tests.api.success ? 'Funcionando' : testResults.results.tests.api.error}
                </li>
              </ul>

              <h4>🔗 URLs Generadas:</h4>
              <ul>
                {Object.entries(testResults.results.tests.urls).map(([key, url]) => (
                  <li key={key}>
                    <strong>{key}:</strong> 
                    <a href={url as string} target="_blank" rel="noopener noreferrer" style={{ color: '#007cba', marginLeft: '10px' }}>
                      {url as string}
                    </a>
                  </li>
                ))}
              </ul>

              <h4>💡 Recomendaciones:</h4>
              <ul>
                {testResults.recommendations.map((rec: string, index: number) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2>🛒 Test de Checkout</h2>
        <button 
          onClick={testCheckout}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Obteniendo producto real...' : 'Probar Checkout (Producto Real)'}
        </button>
        
        <button 
          onClick={testSimpleCheckout}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Generando...' : '🔄 Checkout Alternativo'}
        </button>
      </div>

      {checkoutTest && (
        <div style={{ 
          background: checkoutTest.success ? '#f0fff0' : '#fff0f0', 
          padding: '15px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>{checkoutTest.success ? '✅' : '❌'} Resultado del Checkout</h3>
          
          {checkoutTest.productInfo && (
            <div style={{ marginBottom: '15px', padding: '10px', background: '#e3f2fd', borderRadius: '4px' }}>
              <h4>🛍️ Producto Real Usado:</h4>
              <p><strong>ID:</strong> {checkoutTest.productInfo.productId}</p>
              <p><strong>Nombre:</strong> {checkoutTest.productInfo.productName}</p>
              <p><strong>Variante ID:</strong> {checkoutTest.productInfo.variantId}</p>
              <p><strong>Precio:</strong> ${checkoutTest.productInfo.price}</p>
            </div>
          )}
          
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(checkoutTest, null, 2)}
          </pre>
          
          {checkoutTest.checkoutUrl && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ marginBottom: '10px' }}>
                <a 
                  href={checkoutTest.checkoutUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: '#007cba',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    marginRight: '10px'
                  }}
                >
                  🚀 Estrategia Principal
                </a>
                
                {checkoutTest.fallbackUrls && checkoutTest.fallbackUrls.map((url: string, index: number) => (
                  <a 
                    key={index}
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      marginRight: '5px',
                      marginTop: '5px',
                      fontSize: '12px'
                    }}
                  >
                    📋 Fallback {index + 1}
                  </a>
                ))}
              </div>
              
              {checkoutTest.fallback && (
                <div style={{ 
                  background: '#fff3cd', 
                  border: '1px solid #ffeaa7', 
                  padding: '10px', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  💡 <strong>Instrucciones:</strong> Se abrirá la página del producto. 
                  Haz clic en "Agregar al carrito" y luego en "Finalizar compra".
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '4px',
        marginTop: '20px'
      }}>
        <h3>ℹ️ Información</h3>
        <p>Esta página te permite probar la integración con TiendaNube usando tu configuración actual.</p>
        <p><strong>Dominio configurado:</strong> www.direchentt.com.ar</p>
        <p><strong>Store ID:</strong> 5112334</p>
      </div>

      {simpleTest && (
        <div style={{ 
          background: simpleTest.success ? '#f0fff0' : '#fff0f0', 
          padding: '15px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>{simpleTest.success ? '✅' : '❌'} Checkout Alternativo</h3>
          
          {simpleTest.productInfo && (
            <div style={{ marginBottom: '15px', padding: '10px', background: '#e8f5e8', borderRadius: '4px' }}>
              <h4>🛍️ Producto:</h4>
              <p><strong>Nombre:</strong> {simpleTest.productInfo.productName}</p>
              <p><strong>Precio:</strong> ${simpleTest.productInfo.price}</p>
            </div>
          )}
          
          {simpleTest.strategies && (
            <div style={{ marginTop: '15px' }}>
              <h4>🎯 Estrategias con Datos Reales:</h4>
              <div style={{ display: 'grid', gap: '8px', marginBottom: '15px' }}>
                <a 
                  href={simpleTest.strategies.traditional} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    padding: '12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontSize: '14px'
                  }}
                >
                  🥇 MEJOR: /cart/add/[ID] (Tradicional)
                </a>
                
                <a 
                  href={simpleTest.strategies.addQuery} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    padding: '10px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontSize: '13px'
                  }}
                >
                  🥈 ALTERNATIVA: /cart/add?id=[ID]
                </a>
                
                <a 
                  href={simpleTest.strategies.product} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    padding: '10px',
                    backgroundColor: '#007cba',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontSize: '13px'
                  }}
                >
                  📦 Ver Producto + Variante
                </a>
                
                <a 
                  href={simpleTest.strategies.productSimple} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    padding: '10px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontSize: '13px'
                  }}
                >
                  🛍️ Solo Producto (Manual)
                </a>
              </div>
              
              {simpleTest.productData && (
                <div style={{ 
                  background: '#e8f5e8', 
                  border: '1px solid #c3e6cb', 
                  padding: '10px', 
                  borderRadius: '4px',
                  marginBottom: '10px',
                  fontSize: '12px'
                }}>
                  <strong>📊 Producto Real Usado:</strong><br/>
                  ID: {simpleTest.productData.id}<br/>
                  Handle: {simpleTest.productData.handle}<br/>
                  Variante: {simpleTest.productData.variantId}
                </div>
              )}
              
              <div style={{ 
                background: '#d4edda', 
                border: '1px solid #c3e6cb', 
                padding: '10px', 
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                💡 <strong>Instrucciones:</strong><br/>
                1. Prueba "MEJOR" primero - debería agregar automáticamente<br/>
                2. Si falla, prueba "ALTERNATIVA"<br/>
                3. Como último recurso, usa "Ver Producto" y agrega manualmente
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}