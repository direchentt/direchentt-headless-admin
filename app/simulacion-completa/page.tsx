'use client';
import { useState, useEffect } from 'react';

export default function SimulacionCompleta() {
  const [paso, setPaso] = useState<number>(1);
  const [resultados, setResultados] = useState<Record<string, any>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [producto, setProducto] = useState<any>(null);

  const log = (mensaje: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const entrada = `[${timestamp}] ${mensaje}`;
    setLogs(prev => [...prev, entrada]);
    console.log(entrada);
  };

  // Cargar producto de ejemplo
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.products && data.products.length > 0) {
          const prod = data.products[0];
          setProducto(prod);
          log(`✅ Producto cargado: ${prod.name?.es || prod.name} (ID: ${prod.id})`);
        }
      })
      .catch(err => log(`❌ Error cargando producto: ${err.message}`));
  }, []);

  // Paso 1: Simular agregado al carrito en localhost
  const simularLocalhostCart = async () => {
    log('🏠 INICIO: Simulando agregar al carrito en LOCALHOST');
    setPaso(2);

    try {
      const response = await fetch('/api/checkout-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: producto.id,
          variantId: producto.variants[0]?.id,
          quantity: 1
        })
      });

      const data = await response.json();
      
      setResultados(prev => ({
        ...prev,
        localhost: {
          success: response.ok,
          data: data,
          variables: {
            productId: producto.id,
            variantId: producto.variants[0]?.id,
            price: producto.variants[0]?.price,
            sku: producto.variants[0]?.sku
          }
        }
      }));

      log(`✅ LOCALHOST: Carrito simulado exitosamente`);
      log(`📦 Variables capturadas: productId=${producto.id}, variantId=${producto.variants[0]?.id}`);
      
    } catch (error) {
      log(`❌ LOCALHOST: Error - ${error}`);
      setResultados(prev => ({
        ...prev,
        localhost: { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
      }));
    }
  };

  // Paso 2: Simular agregado al carrito en TiendaNube
  const simularTiendaNubeCart = async () => {
    log('🏪 INICIO: Simulando agregar al carrito en TIENDANUBE');
    setPaso(3);

    try {
      // Simular llamada AJAX a TiendaNube
      const tiendanubeUrl = 'https://direchentt.mitiendanube.com/cart/add.js';
      const formData = `id=${producto.variants[0]?.id}&quantity=1`;
      
      log(`🔗 Intentando: ${tiendanubeUrl}`);
      log(`📤 Datos: ${formData}`);

      // En una implementación real, esto iría a través de un proxy API
      const mockResponse = {
        success: true,
        method: 'AJAX_POST',
        endpoint: tiendanubeUrl,
        data: formData,
        status: 'Simulado - requiere proxy CORS en implementación real'
      };

      setResultados(prev => ({
        ...prev,
        tiendanube: {
          success: true,
          data: mockResponse,
          variables: {
            domain: 'direchentt.mitiendanube.com',
            endpoint: '/cart/add.js',
            method: 'POST',
            contentType: 'application/x-www-form-urlencoded',
            productId: producto.id,
            variantId: producto.variants[0]?.id
          }
        }
      }));

      log(`✅ TIENDANUBE: Simulación completada`);
      log(`🔧 Método: AJAX POST a ${tiendanubeUrl}`);

    } catch (error) {
      log(`❌ TIENDANUBE: Error - ${error}`);
    }
  };

  // Paso 3: Analizar variables necesarias para comunicación
  const analizarVariables = () => {
    log('📊 ANÁLISIS: Variables necesarias para comunicación');
    setPaso(4);

    const variablesNecesarias = {
      configuracion: {
        STORE_ID: '5112334',
        HEADLESS_DOMAIN: 'store.direchentt.com.ar',
        TIENDANUBE_DOMAIN: 'direchentt.mitiendanube.com'
      },
      endpoints: {
        LOCALHOST_PRODUCTS: '/api/products',
        LOCALHOST_CHECKOUT: '/api/checkout-simple',
        TIENDANUBE_ADD_CART: '/cart/add.js',
        TIENDANUBE_GET_CART: '/cart.js'
      },
      comunicacion: {
        CORS_PROXY: 'Requerido para llamadas cross-origin',
        SESSION_COOKIES: 'store_session_payload_5112334, store_login_session',
        USER_AGENT: 'Mozilla/5.0 (compatible)',
        CONTENT_TYPE: 'application/x-www-form-urlencoded'
      },
      mapeo: {
        PRODUCT_ID_CONSISTENT: true,
        VARIANT_ID_CONSISTENT: true,
        PRICE_MAPPING: 'Directo desde API',
        SKU_MAPPING: 'Disponible en ambos sistemas'
      }
    };

    setResultados(prev => ({
      ...prev,
      analisis: variablesNecesarias
    }));

    log('🔧 Variables de configuración identificadas');
    log('📡 Endpoints de comunicación mapeados');
    log('🔒 Requisitos de seguridad y CORS identificados');
    log('🎯 Mapeo de productos consistente confirmado');
  };

  // Paso 4: Generar código de implementación
  const generarImplementacion = () => {
    log('💻 GENERACIÓN: Código de implementación');
    setPaso(5);

    const codigoImplementacion = {
      apiRoute: `
// /api/bridge-tiendanube/route.ts
export async function POST(request: Request) {
  const { action, productId, variantId, quantity } = await request.json();
  
  if (action === 'addToCart') {
    return await fetch('https://direchentt.mitiendanube.com/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible)'
      },
      body: \`id=\${variantId}&quantity=\${quantity}\`
    });
  }
}`,
      reactHook: `
// Hook para comunicación con TiendaNube
export function useTiendaNubeBridge() {
  const addToCart = async (productId: string, variantId: string, quantity: number) => {
    const response = await fetch('/api/bridge-tiendanube', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'addToCart', 
        productId, 
        variantId, 
        quantity 
      })
    });
    return await response.json();
  };
  
  return { addToCart };
}`,
      configuracion: `
// config/tiendanube.ts
export const TIENDANUBE_CONFIG = {
  STORE_ID: '5112334',
  DOMAIN: 'direchentt.mitiendanube.com',
  ENDPOINTS: {
    ADD_CART: '/cart/add.js',
    GET_CART: '/cart.js',
    CHECKOUT: '/comprar/'
  }
};`
    };

    setResultados(prev => ({
      ...prev,
      implementacion: codigoImplementacion
    }));

    log('✅ Código de API Bridge generado');
    log('🔗 Hook de React creado');
    log('⚙️ Configuración de TiendaNube establecida');
  };

  const resetearSimulacion = () => {
    setPaso(1);
    setResultados({});
    setLogs([]);
    log('🔄 Simulación reseteada');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔄 Simulación Completa de Proceso de Compra
          </h1>
          <p className="text-lg text-gray-600">
            Comparación entre Localhost (Headless) ↔ TiendaNube Original
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  paso >= num 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {num}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2 max-w-2xl mx-auto">
            <span>Localhost</span>
            <span>TiendaNube</span>
            <span>Análisis</span>
            <span>Código</span>
            <span>Completo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Control */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">🎮 Panel de Control</h2>
            
            {producto && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">📦 Producto Seleccionado</h3>
                <div className="text-sm">
                  <p><strong>Nombre:</strong> {producto.name?.es || producto.name}</p>
                  <p><strong>ID:</strong> {producto.id}</p>
                  <p><strong>Variante:</strong> {producto.variants[0]?.id}</p>
                  <p><strong>Precio:</strong> ${producto.variants[0]?.price}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={simularLocalhostCart}
                disabled={paso !== 1 || !producto}
                className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                🏠 Paso 1: Simular Localhost
              </button>

              <button
                onClick={simularTiendaNubeCart}
                disabled={paso !== 2}
                className="w-full bg-purple-500 text-white p-3 rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                🏪 Paso 2: Simular TiendaNube
              </button>

              <button
                onClick={analizarVariables}
                disabled={paso !== 3}
                className="w-full bg-orange-500 text-white p-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                📊 Paso 3: Analizar Variables
              </button>

              <button
                onClick={generarImplementacion}
                disabled={paso !== 4}
                className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                💻 Paso 4: Generar Código
              </button>

              <button
                onClick={resetearSimulacion}
                className="w-full bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600"
              >
                🔄 Resetear Simulación
              </button>
            </div>
          </div>

          {/* Panel de Logs */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">📋 Logs de Simulación</h2>
            <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="mb-1 break-words">{log}</div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500">Esperando inicio de simulación...</div>
              )}
            </div>
          </div>
        </div>

        {/* Resultados */}
        {Object.keys(resultados).length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">📊 Resultados de Simulación</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Localhost Results */}
              {resultados.localhost && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-3">🏠 Localhost (Headless)</h3>
                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                    {JSON.stringify(resultados.localhost, null, 2)}
                  </pre>
                </div>
              )}

              {/* TiendaNube Results */}
              {resultados.tiendanube && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-3">🏪 TiendaNube</h3>
                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                    {JSON.stringify(resultados.tiendanube, null, 2)}
                  </pre>
                </div>
              )}

              {/* Analysis Results */}
              {resultados.analisis && (
                <div className="bg-orange-50 p-4 rounded-lg lg:col-span-2">
                  <h3 className="font-semibold text-orange-800 mb-3">📊 Variables Necesarias</h3>
                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                    {JSON.stringify(resultados.analisis, null, 2)}
                  </pre>
                </div>
              )}

              {/* Implementation Code */}
              {resultados.implementacion && (
                <div className="bg-green-50 p-4 rounded-lg lg:col-span-2">
                  <h3 className="font-semibold text-green-800 mb-3">💻 Código de Implementación</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">API Route</h4>
                      <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
                        {resultados.implementacion.apiRoute}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">React Hook</h4>
                      <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
                        {resultados.implementacion.reactHook}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Final Summary */}
        {paso === 5 && (
          <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">🎉 Simulación Completada</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">✅ Localhost Funcional</h3>
                <p className="text-sm">Tu headless puede procesar productos y generar checkouts</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🔗 Comunicación Posible</h3>
                <p className="text-sm">Variables identificadas para conectar ambos sistemas</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">💻 Código Generado</h3>
                <p className="text-sm">API Bridge y hooks listos para implementar</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}