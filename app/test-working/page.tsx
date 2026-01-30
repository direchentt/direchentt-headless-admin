'use client';

import { useState } from 'react';

export default function TestWorkingPage() {
  const [results, setResults] = useState<string[]>([]);
  
  // Método 1: Redirigir a la página principal de la tienda (SÍ FUNCIONA)
  const redirectToStore = () => {
    const storeUrl = `https://www.direchentt.com.ar`;
    
    addResult(`✅ REDIRECCIÓN A TIENDA: ${storeUrl}`);
    
    // Abrir en nueva pestaña
    window.open(storeUrl, '_blank');
  };

  // Método 2: Redirigir a comprar (en español TiendaNube)
  const redirectToCart = () => {
    const cartUrl = `https://www.direchentt.com.ar/comprar`;
    
    addResult(`✅ REDIRECCIÓN A COMPRAR: ${cartUrl}`);
    
    // Crear enlace clicable
    const linkElement = document.createElement('a');
    linkElement.href = cartUrl;
    linkElement.textContent = 'IR A COMPRAR EN TIENDANUBE';
    linkElement.target = '_blank';
    linkElement.style.cssText = 'display: block; margin: 10px 0; padding: 10px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;';
    
    document.getElementById('links-container')?.appendChild(linkElement);
  };

  // Método 3: Redirigir a checkout directo
  const redirectToCheckout = () => {
    const checkoutUrl = `https://www.direchentt.com.ar/checkout`;
    
    addResult(`✅ REDIRECCIÓN A CHECKOUT: ${checkoutUrl}`);
    
    // Redirigir en la misma pestaña
    window.location.href = checkoutUrl;
  };

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
    const container = document.getElementById('links-container');
    if (container) {
      container.innerHTML = '';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 MÉTODOS QUE SÍ FUNCIONAN</h1>
      
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>🎯 Datos del producto de prueba:</h2>
        <ul>
          <li><strong>Store ID:</strong> 5112334</li>
          <li><strong>Domain:</strong> www.direchentt.com.ar</li>
          <li><strong>Product ID:</strong> 308877801</li>
          <li><strong>Variant ID:</strong> 1386747186</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={redirectToStore}
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
          🏪 MÉTODO 1: Abrir tienda principal
        </button>

        <button 
          onClick={redirectToCart}
          style={{
            padding: '15px',
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          🛒 MÉTODO 2: Crear enlace a /comprar
        </button>

        <button 
          onClick={redirectToCheckout}
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
          💳 MÉTODO 3: Ir directo al checkout
        </button>

        <button 
          onClick={clearResults}
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
          🗑️ Limpiar resultados
        </button>
      </div>

      <div id="links-container" style={{ marginBottom: '20px' }}></div>

      <div style={{ background: '#e9ecef', padding: '15px', borderRadius: '5px' }}>
        <h3>📝 Resultados:</h3>
        {results.length === 0 ? (
          <p style={{ color: '#6c757d' }}>Haz clic en los botones para probar...</p>
        ) : (
          <ul>
            {results.map((result, index) => (
              <li key={index} style={{ marginBottom: '5px', fontSize: '14px' }}>
                {result}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: '30px', background: '#d4edda', padding: '15px', borderRadius: '5px' }}>
        <h3>⚠️ PROBLEMA IDENTIFICADO:</h3>
        <p style={{ background: '#f8d7da', padding: '10px', borderRadius: '5px' }}>
          <strong>La tienda https://www.direchentt.com.ar/comprar está experimentando problemas de servidor.</strong><br/>
          Error: "Estamos experimentando inconvenientes con el servidor..."
        </p>

        <h3>✅ Lo que SÍ funciona:</h3>
        <ol>
          <li><strong>Redirigir a la tienda principal de TiendaNube</strong> ✅</li>
          <li><strong>Esperar a que se resuelvan los problemas del servidor</strong></li>
          <li><strong>Usar /comprar en lugar de /cart</strong> (español correcto)</li>
        </ol>
      </div>

      <div style={{ marginTop: '20px', background: '#f8d7da', padding: '15px', borderRadius: '5px' }}>
        <h3>❌ Lo que NO funciona:</h3>
        <ol>
          <li>URLs directas de agregar al carrito (/cart/add)</li>
          <li>URLs de checkout directo (/checkout/v3/start)</li>
          <li>JavaScript AJAX desde dominio externo</li>
        </ol>
      </div>
    </div>
  );
}