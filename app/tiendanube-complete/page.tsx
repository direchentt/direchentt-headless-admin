'use client';

export default function TiendaNubeComplete() {
  const storeId = '5112334';
  const storeDomain = 'www.direchentt.com.ar';
  
  const checkoutInfo = {
    storeUrl: `https://${storeDomain}`,
    callbackUrls: {
      success: `https://${storeDomain}/checkout/v3/success`,
      failure: `https://${storeDomain}/checkout/v3/next`,
      cancel: `https://${storeDomain}/checkout/v3/next`
    },
    checkoutUrl: `https://${storeDomain}/checkout/v3/start`
  };

  const sections = [
    {
      title: "📚 INFORMACIÓN OFICIAL DE LA DOCUMENTACIÓN",
      color: "#d1ecf1",
      items: [
        "TiendaNube usa JavaScript para el checkout, no URLs directas",
        "El checkout está en: /checkout/v3/start/",
        "URLs de callback: /checkout/v3/success/, /checkout/v3/next/",
        "Productos están en: /productos/nombre-producto/?variant=ID",
        "El sistema usa LoadCheckoutPaymentContext() para pagos"
      ]
    },
    {
      title: "⚠️ PROBLEMA ACTUAL IDENTIFICADO",
      color: "#f8d7da", 
      items: [
        `Tu tienda ${storeDomain} tiene problemas de servidor`,
        'Error: "Estamos experimentando inconvenientes con el servidor"',
        "La página /comprar devuelve error 500",
        "Solo la página principal funciona correctamente"
      ]
    },
    {
      title: "🔧 SOLUCIÓN TÉCNICA RECOMENDADA",
      color: "#d4edda",
      items: [
        "Esperar a que TiendaNube resuelva los problemas del servidor",
        "Una vez funcionando, redirigir desde tu headless a:",
        `• ${storeDomain}/comprar (página de checkout)`,
        `• ${storeDomain}/checkout/v3/start/ (checkout v3)`,
        "Implementar manejo de JavaScript usando LoadCheckoutPaymentContext"
      ]
    },
    {
      title: "💻 INTEGRACIÓN JAVASCRIPT (Para cuando funcione)",
      color: "#fff3cd",
      items: [
        "TiendaNube usa LoadCheckoutPaymentContext() para checkout",
        "Datos disponibles via Checkout.getData()",
        "URLs de productos: /productos/producto-name/?variant=ID", 
        "Checkout v3 maneja todo el proceso de pago",
        "Callbacks automáticos a success/failure URLs"
      ]
    }
  ];

  const testUrl = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1>🏪 TiendaNube: Análisis Completo</h1>
      
      <div style={{ background: '#e7f3ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #b3d9ff' }}>
        <h2>📋 Resumen Ejecutivo</h2>
        <p><strong>Estado:</strong> Tu tienda tiene problemas de servidor temporales</p>
        <p><strong>Solución:</strong> Una vez resueltos, redirigir a <code>/comprar</code> o <code>/checkout/v3/start</code></p>
        <p><strong>Integración:</strong> TiendaNube maneja el checkout completo con JavaScript</p>
      </div>

      {sections.map((section, index) => (
        <div key={index} style={{
          background: section.color,
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ddd'
        }}>
          <h2>{section.title}</h2>
          <ul>
            {section.items.map((item, i) => (
              <li key={i} style={{ marginBottom: '8px' }}>{item}</li>
            ))}
          </ul>
        </div>
      ))}

      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>🧪 URLs de Prueba</h2>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => testUrl(checkoutInfo.storeUrl)}
              style={{
                padding: '8px 15px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✅ Tienda Principal
            </button>
            <code>{checkoutInfo.storeUrl}</code>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => testUrl(`${checkoutInfo.storeUrl}/comprar`)}
              style={{
                padding: '8px 15px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ❌ Comprar (Error)
            </button>
            <code>{checkoutInfo.storeUrl}/comprar</code>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => testUrl(`${checkoutInfo.storeUrl}/checkout/v3/start`)}
              style={{
                padding: '8px 15px',
                background: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Checkout V3
            </button>
            <code>{checkoutInfo.storeUrl}/checkout/v3/start</code>
          </div>
        </div>
      </div>

      <div style={{ background: '#e7f3ff', padding: '20px', borderRadius: '8px' }}>
        <h2>🚀 Próximos Pasos</h2>
        <ol>
          <li><strong>Esperar:</strong> Que TiendaNube resuelva los problemas del servidor</li>
          <li><strong>Probar:</strong> Las URLs de checkout una vez funcionen</li>
          <li><strong>Implementar:</strong> Redirección desde tu headless a TiendaNube</li>
          <li><strong>Integrar:</strong> JavaScript de checkout si necesitas más control</li>
        </ol>
        
        <div style={{ marginTop: '15px', padding: '15px', background: '#fff', borderRadius: '5px' }}>
          <h3>💡 Código de Ejemplo para tu Headless:</h3>
          <pre style={{ background: '#f1f1f1', padding: '10px', borderRadius: '3px', fontSize: '12px' }}>
{`// Una vez que funcione el servidor
const redirectToCheckout = () => {
  window.location.href = 'https://${storeDomain}/comprar';
  // O alternativamente:
  // window.location.href = 'https://${storeDomain}/checkout/v3/start';
};`}
          </pre>
        </div>
      </div>
    </div>
  );
}