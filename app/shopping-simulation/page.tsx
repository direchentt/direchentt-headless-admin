'use client';

import { useState } from 'react';

export default function ShoppingSimulation() {
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()} ${icon} ${message}`]);
  };

  // SIMULACIÓN COMPLETA DE COMPRA
  const simulateFullPurchase = async () => {
    addResult('🛒 INICIANDO SIMULACIÓN COMPLETA DE COMPRA');
    
    // PASO 1: Tienda Original
    addResult('PASO 1: Probando TiendaNube Original');
    
    try {
      // Probar página principal
      const mainResponse = await fetch('https://direchentt.mitiendanube.com');
      addResult(`Página principal: ${mainResponse.status}`, mainResponse.ok ? 'success' : 'error');
      
      // Probar productos
      const productsResponse = await fetch('https://direchentt.mitiendanube.com/productos');
      addResult(`Página productos: ${productsResponse.status}`, productsResponse.ok ? 'success' : 'error');
      
      // Probar checkout
      const checkoutResponse = await fetch('https://direchentt.mitiendanube.com/comprar');
      addResult(`Página checkout (/comprar): ${checkoutResponse.status}`, checkoutResponse.ok ? 'success' : 'error');
      
      // Probar checkout alternativo
      const checkoutAltResponse = await fetch('https://direchentt.mitiendanube.com/checkout');
      addResult(`Checkout alternativo: ${checkoutAltResponse.status}`, checkoutAltResponse.ok ? 'success' : 'error');
      
    } catch (error) {
      addResult(`Error probando TiendaNube: ${error}`, 'error');
    }

    // PASO 2: Localhost
    addResult('PASO 2: Probando Localhost Headless');
    
    try {
      // Probar API de productos
      const localProductsResponse = await fetch('/api/products');
      addResult(`API productos localhost: ${localProductsResponse.status}`, localProductsResponse.ok ? 'success' : 'error');
      
      if (localProductsResponse.ok) {
        const productsData = await localProductsResponse.json();
        addResult(`Productos encontrados: ${productsData.products?.length || 0}`);
        
        if (productsData.products && productsData.products.length > 0) {
          const firstProduct = productsData.products[0];
          addResult(`Primer producto: ${firstProduct.name} (ID: ${firstProduct.id})`);
          
          // Abrir producto en localhost
          const productUrl = `http://localhost:3000/product/${firstProduct.id}`;
          addResult(`Abriendo producto: ${productUrl}`);
          window.open(productUrl, '_blank');
        }
      }
      
    } catch (error) {
      addResult(`Error probando localhost: ${error}`, 'error');
    }

    // PASO 3: Análisis
    addResult('PASO 3: Análisis de Diferencias');
    addResult('TiendaNube: Tiene todo integrado pero /comprar está caído');
    addResult('Localhost: Muestra productos pero necesita redirección para checkout');
    addResult('Solución: Redirigir de localhost a TiendaNube cuando funcione');
  };

  // TEST INDIVIDUAL: Solo TiendaNube
  const testTiendaNube = () => {
    addResult('🏪 Abriendo TiendaNube Original');
    window.open('https://direchentt.mitiendanube.com', '_blank');
    addResult('Instrucciones: Navega, busca productos, intenta agregar al carrito');
    addResult('Observa: URLs que se generan, funcionalidad disponible');
  };

  // TEST INDIVIDUAL: Solo localhost
  const testLocalhost = () => {
    addResult('🏠 Abriendo Localhost');
    window.open('http://localhost:3000', '_blank');
    addResult('Instrucciones: Navega, busca productos, prueba checkout');
    addResult('Observa: Qué falta para completar la compra');
  };

  // PROBAR URLs ESPECÍFICAS
  const testSpecificUrls = async () => {
    addResult('🔗 PROBANDO URLs ESPECÍFICAS');
    
    const urlsToTest = [
      'https://direchentt.mitiendanube.com',
      'https://direchentt.mitiendanube.com/productos', 
      'https://direchentt.mitiendanube.com/comprar',
      'https://direchentt.mitiendanube.com/checkout',
      'https://direchentt.mitiendanube.com/checkout/v3/start',
      'http://localhost:3000',
      'http://localhost:3000/api/products'
    ];

    for (const url of urlsToTest) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        addResult(`${url}: ${response.status}`, response.ok ? 'success' : 'error');
      } catch (error) {
        addResult(`${url}: Error de conexión`, 'error');
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre requests
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🛒 Simulación Completa de Compra</h1>
      <p><strong>Objetivo:</strong> Comparar el flujo de compra entre TiendaNube original y tu headless</p>
      
      <div style={{ display: 'grid', gap: '15px', marginBottom: '30px' }}>
        <button 
          onClick={simulateFullPurchase}
          style={{
            padding: '20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🎯 SIMULACIÓN COMPLETA - Probar Todo
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button 
            onClick={testTiendaNube}
            style={{
              padding: '15px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            🏪 Solo TiendaNube Original
          </button>

          <button 
            onClick={testLocalhost}
            style={{
              padding: '15px',
              background: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            🏠 Solo Localhost Headless
          </button>
        </div>

        <button 
          onClick={testSpecificUrls}
          style={{
            padding: '15px',
            background: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          🔗 Probar URLs Específicas
        </button>

        <button 
          onClick={() => setResults([])}
          style={{
            padding: '10px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          🗑️ Limpiar Log
        </button>
      </div>

      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>📋 Estado Actual Detectado:</h2>
        <ul>
          <li>✅ <strong>TiendaNube principal:</strong> Funciona (200 OK)</li>
          <li>✅ <strong>TiendaNube /productos:</strong> Funciona (200 OK)</li>
          <li>❌ <strong>TiendaNube /comprar:</strong> Error servidor (500)</li>
          <li>❌ <strong>TiendaNube /checkout:</strong> No existe (404)</li>
          <li>✅ <strong>Localhost:</strong> Funcionando con 114 productos</li>
          <li>⚠️ <strong>Problema:</strong> Checkout de TiendaNube caído</li>
        </ul>
      </div>

      <div style={{ background: '#e9ecef', padding: '20px', borderRadius: '8px', maxHeight: '500px', overflowY: 'auto' }}>
        <h3>📝 Log de Simulación:</h3>
        {results.length === 0 ? (
          <p style={{ color: '#6c757d', fontStyle: 'italic' }}>Ejecuta una simulación para ver los resultados...</p>
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>
            {results.map((result, index) => (
              <div key={index} style={{ 
                marginBottom: '4px', 
                padding: '4px 0',
                borderLeft: result.includes('✅') ? '3px solid #28a745' : 
                           result.includes('❌') ? '3px solid #dc3545' : '3px solid #007bff',
                paddingLeft: '8px'
              }}>
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', background: '#d1ecf1', padding: '20px', borderRadius: '8px' }}>
        <h3>📊 Conclusiones Esperadas:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
          <div>
            <h4>🏪 TiendaNube Original:</h4>
            <ul>
              <li>✅ Muestra productos</li>
              <li>❌ Checkout caído (/comprar error 500)</li>
              <li>✅ Carrito nativo (cuando funciona)</li>
              <li>✅ Proceso completo integrado</li>
            </ul>
          </div>
          <div>
            <h4>🏠 Localhost Headless:</h4>
            <ul>
              <li>✅ Muestra productos correctamente</li>
              <li>❌ Sin checkout integrado</li>
              <li>✅ Interfaz personalizada</li>
              <li>⚠️ Necesita redirección a TiendaNube</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}