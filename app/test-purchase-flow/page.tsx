'use client';
import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    price: string;
    product_id: string;
  }>;
}

export default function TestPurchaseFlow() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [simulationStep, setSimulationStep] = useState<string>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [apiVariables, setApiVariables] = useState<Record<string, any>>({});

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[PURCHASE FLOW] ${message}`);
  };

  useEffect(() => {
    // Cargar productos desde la API local
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.slice(0, 5)); // Solo primeros 5 para la prueba
        log(`✅ Productos cargados desde localhost: ${data.length} productos`);
      })
      .catch(err => {
        log(`❌ Error cargando productos: ${err.message}`);
      });
  }, []);

  const simulateLocalPurchase = async (product: Product) => {
    log(`🏠 INICIANDO SIMULACIÓN EN LOCALHOST`);
    setSimulationStep('localhost-cart');
    
    try {
      // 1. Agregar al carrito usando la API local
      const cartResponse = await fetch('/api/checkout-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId: product.variants[0]?.id,
          quantity: 1
        })
      });
      
      const cartData = await cartResponse.json();
      log(`📦 Respuesta del carrito local: ${JSON.stringify(cartData)}`);
      
      // 2. Obtener datos necesarios para TiendaNube
      setApiVariables(prev => ({
        ...prev,
        localhost: {
          productId: product.id,
          variantId: product.variants[0]?.id,
          cartResponse: cartData,
          storeId: '5112334',
          domain: 'www.direchentt.com.ar'
        }
      }));
      
      setSimulationStep('localhost-checkout');
      log(`🛒 Variables capturadas para localhost: productId=${product.id}, variantId=${product.variants[0]?.id}`);
      
    } catch (error) {
      log(`❌ Error en simulación localhost: ${error}`);
    }
  };

  const simulateTiendaNubePurchase = async (product: Product) => {
    log(`🏪 INICIANDO SIMULACIÓN EN TIENDANUBE`);
    setSimulationStep('tiendanube-cart');
    
    try {
      // 1. Probar diferentes métodos de agregar al carrito
      const tiendaURL = `https://www.direchentt.com.ar`;
      
      // Método 1: URL directa del producto
      const productURL = `${tiendaURL}/products/${product.id}`;
      log(`🔗 Probando URL del producto: ${productURL}`);
      
      const productResponse = await fetch(productURL, { method: 'HEAD' });
      log(`📊 Status del producto en TiendaNube: ${productResponse.status}`);
      
      // Método 2: Intentar agregar al carrito via API
      const addToCartURL = `${tiendaURL}/cart/add`;
      log(`🛍️ Probando agregar al carrito: ${addToCartURL}`);
      
      // 2. Capturar variables necesarias para TiendaNube
      setApiVariables(prev => ({
        ...prev,
        tiendanube: {
          storeUrl: tiendaURL,
          productUrl: productURL,
          addToCartUrl: addToCartURL,
          productId: product.id,
          variantId: product.variants[0]?.id,
          storeId: '5112334',
          status: productResponse.status
        }
      }));
      
      setSimulationStep('tiendanube-checkout');
      log(`🏪 Variables capturadas para TiendaNube: storeUrl=${tiendaURL}, productId=${product.id}`);
      
    } catch (error) {
      log(`❌ Error en simulación TiendaNube: ${error}`);
    }
  };

  const compareVariables = () => {
    log(`📊 COMPARANDO VARIABLES NECESARIAS:`);
    
    const requiredForCommunication = {
      store_id: '5112334',
      headless_domain: 'store.direchentt.com.ar',
      tiendanube_domain: 'www.direchentt.com.ar',
      product_mapping: {
        localhost_id: apiVariables.localhost?.productId,
        tiendanube_id: apiVariables.tiendanube?.productId,
        variant_mapping: {
          localhost_variant: apiVariables.localhost?.variantId,
          tiendanube_variant: apiVariables.tiendanube?.variantId
        }
      },
      api_endpoints: {
        localhost_cart: '/api/checkout-simple',
        tiendanube_cart: apiVariables.tiendanube?.addToCartUrl,
        tiendanube_product: apiVariables.tiendanube?.productUrl
      },
      authentication: {
        tiendanube_store_id: '5112334',
        required_headers: ['Content-Type', 'User-Agent'],
        cors_handling: 'required_for_cross_origin'
      }
    };
    
    log(`🔧 Variables necesarias para comunicación:`);
    log(JSON.stringify(requiredForCommunication, null, 2));
    
    setApiVariables(prev => ({
      ...prev,
      communication_requirements: requiredForCommunication
    }));
  };

  return (
    <div className="container mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-8">
          🔍 Simulación de Proceso de Compra Comparativo
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Control */}
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">🎯 Seleccionar Producto</h2>
              <div className="space-y-2">
                {products.map(product => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full p-3 text-left rounded border ${
                      selectedProduct?.id === product.id 
                        ? 'bg-blue-100 border-blue-500' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">
                      ID: {product.id} | Variantes: {product.variants?.length || 0}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedProduct && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">🛍️ Simular Compras</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => simulateLocalPurchase(selectedProduct)}
                    className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600"
                    disabled={simulationStep !== 'idle'}
                  >
                    🏠 Simular en Localhost
                  </button>
                  
                  <button
                    onClick={() => simulateTiendaNubePurchase(selectedProduct)}
                    className="w-full bg-purple-500 text-white p-3 rounded hover:bg-purple-600"
                    disabled={simulationStep !== 'idle'}
                  >
                    🏪 Simular en TiendaNube
                  </button>
                  
                  <button
                    onClick={compareVariables}
                    className="w-full bg-orange-500 text-white p-3 rounded hover:bg-orange-600"
                    disabled={Object.keys(apiVariables).length < 2}
                  >
                    📊 Comparar Variables API
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel de Logs */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">📋 Logs de Simulación</h2>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500">Esperando simulación...</div>
              )}
            </div>
          </div>
        </div>

        {/* Panel de Variables Capturadas */}
        {Object.keys(apiVariables).length > 0 && (
          <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🔧 Variables API Capturadas</h2>
            <pre className="bg-white p-4 rounded border overflow-x-auto text-sm">
              {JSON.stringify(apiVariables, null, 2)}
            </pre>
          </div>
        )}

        {/* Estado Actual */}
        <div className="mt-6 text-center">
          <div className={`inline-block px-4 py-2 rounded-full text-white ${
            simulationStep === 'idle' ? 'bg-gray-500' :
            simulationStep.includes('localhost') ? 'bg-blue-500' :
            simulationStep.includes('tiendanube') ? 'bg-purple-500' : 'bg-green-500'
          }`}>
            Estado: {simulationStep === 'idle' ? 'Esperando' : simulationStep.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}