'use client';

import { useState, useEffect } from 'react';

export default function ComparisonTest() {
  const [results, setResults] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    // Obtener productos del localhost
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.products && data.products.length > 0) {
          setProducts(data.products.slice(0, 5)); // Solo los primeros 5
          setSelectedProduct(data.products[0]);
        }
      })
      .catch(error => {
        addResult(`❌ Error obteniendo productos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      });
  }, []);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // TEST 1: Ir a TiendaNube original
  const testTiendaNubeOriginal = () => {
    addResult(`🔍 ABRIENDO TIENDA ORIGINAL: https://direchentt.mitiendanube.com`);
    window.open('https://direchentt.mitiendanube.com', '_blank');
    
    addResult(`🛒 INTENTA: Agregar un producto al carrito en TiendaNube`);
    addResult(`📝 OBSERVA: Las URLs que se generan en la consola`);
  };

  // TEST 2: Simular compra en localhost
  const testLocalhost = () => {
    if (!selectedProduct) {
      addResult(`❌ No hay productos disponibles`);
      return;
    }

    addResult(`🏠 ABRIENDO LOCALHOST: http://localhost:3000/product/${selectedProduct.id}`);
    window.open(`http://localhost:3000/product/${selectedProduct.id}`, '_blank');
    
    addResult(`📦 PRODUCTO SELECCIONADO: ${selectedProduct.name}`);
    addResult(`🔢 ID: ${selectedProduct.id}`);
    addResult(`📝 OBSERVA: Cómo funciona el checkout en headless`);
  };

  // TEST 3: Intentar checkout directo
  const testDirectCheckout = () => {
    if (!selectedProduct) {
      addResult(`❌ No hay productos disponibles`);
      return;
    }

    // Probar diferentes URLs de checkout
    const checkoutUrls = [
      'https://direchentt.mitiendanube.com/comprar',
      'https://direchentt.mitiendanube.com/checkout',
      'https://direchentt.mitiendanube.com/checkout/v3/start',
      `https://direchentt.mitiendanube.com/productos/${selectedProduct.handle || selectedProduct.id}`
    ];

    checkoutUrls.forEach((url, index) => {
      setTimeout(() => {
        addResult(`🔗 PROBANDO URL ${index + 1}: ${url}`);
        // Hacer una prueba HTTP para ver si funciona
        fetch(`http://localhost:3000/api/test-urls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
        .then(res => res.json())
        .then(data => {
          addResult(`${data.success ? '✅' : '❌'} ${url}: ${data.status || 'Error'}`);
        });
      }, index * 1000);
    });
  };

  // TEST 4: Analizar diferencias
  const analyzeFlow = () => {
    addResult(`📊 ANÁLISIS DE DIFERENCIAS:`);
    addResult(`🔸 TIENDANUBE ORIGINAL: Tiene carrito nativo, checkout completo`);
    addResult(`🔸 LOCALHOST HEADLESS: Muestra productos, pero necesita redirección`);
    addResult(`🔸 PROBLEMA: /comprar está caído (Error 500)`);
    addResult(`🔸 SOLUCIÓN: Redireccionar a TiendaNube para checkout`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔬 Test de Comparación: TiendaNube vs Headless</h1>
      
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>📦 Producto de Prueba</h2>
        {selectedProduct ? (
          <div>
            <p><strong>Nombre:</strong> {selectedProduct.name}</p>
            <p><strong>ID:</strong> {selectedProduct.id}</p>
            <p><strong>Handle:</strong> {selectedProduct.handle || 'No disponible'}</p>
            <p><strong>Precio:</strong> ${selectedProduct.variants?.[0]?.price || 'N/A'}</p>
          </div>
        ) : (
          <p>Cargando productos...</p>
        )}
      </div>

      <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
        <button 
          onClick={testTiendaNubeOriginal}
          style={{
            padding: '15px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          🏪 TEST 1: Abrir TiendaNube Original
        </button>

        <button 
          onClick={testLocalhost}
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
          🏠 TEST 2: Abrir Producto en Localhost
        </button>

        <button 
          onClick={testDirectCheckout}
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
          🔗 TEST 3: Probar URLs de Checkout
        </button>

        <button 
          onClick={analyzeFlow}
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
          📊 TEST 4: Analizar Diferencias
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
          🗑️ Limpiar Resultados
        </button>
      </div>

      <div style={{ background: '#e9ecef', padding: '15px', borderRadius: '5px', maxHeight: '400px', overflowY: 'scroll' }}>
        <h3>📝 Log de Resultados:</h3>
        {results.length === 0 ? (
          <p style={{ color: '#6c757d' }}>Ejecuta los tests para ver los resultados...</p>
        ) : (
          <div>
            {results.map((result, index) => (
              <div key={index} style={{ 
                marginBottom: '5px', 
                fontSize: '14px',
                fontFamily: 'monospace',
                padding: '2px 0'
              }}>
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', background: '#d1ecf1', padding: '15px', borderRadius: '8px' }}>
        <h3>🎯 Instrucciones de Prueba:</h3>
        <ol>
          <li><strong>TEST 1:</strong> Abre TiendaNube original, intenta agregar algo al carrito</li>
          <li><strong>TEST 2:</strong> Abre el mismo producto en localhost</li>
          <li><strong>TEST 3:</strong> Ve qué URLs de checkout funcionan</li>
          <li><strong>TEST 4:</strong> Compara las diferencias</li>
        </ol>
      </div>
    </div>
  );
}