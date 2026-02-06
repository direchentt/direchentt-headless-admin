'use client';

export default function TiendaNubeUrls() {
  const storeId = '5112334';
  const storeDomain = 'direchentt.mitiendanube.com';
  
  const urls = [
    { 
      name: '🏪 Tienda Principal', 
      url: `https://${storeDomain}`,
      description: 'Página principal de la tienda'
    },
    { 
      name: '🛒 Comprar (Carrito)', 
      url: `https://${storeDomain}/comprar`,
      description: 'Página de carrito/checkout en español'
    },
    { 
      name: '📦 Productos', 
      url: `https://${storeDomain}/productos`,
      description: 'Lista de productos'
    },
    { 
      name: '💳 Checkout', 
      url: `https://${storeDomain}/checkout`,
      description: 'Proceso de checkout'
    },
    { 
      name: '🔍 Buscar', 
      url: `https://${storeDomain}/search?q=producto`,
      description: 'Búsqueda de productos'
    },
    { 
      name: '📱 Contacto', 
      url: `https://${storeDomain}/pages/contacto`,
      description: 'Página de contacto'
    }
  ];

  const testUrl = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔗 URLs Correctas de TiendaNube</h1>
      
      <div style={{ background: '#d1ecf1', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bee5eb' }}>
        <h2>ℹ️ Información de la Tienda</h2>
        <ul>
          <li><strong>Store ID:</strong> {storeId}</li>
          <li><strong>Dominio:</strong> {storeDomain}</li>
          <li><strong>Plataforma:</strong> TiendaNube (Español)</li>
        </ul>
      </div>

      <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #f5c6cb' }}>
        <h2>⚠️ Estado Actual</h2>
        <p><strong>Problema detectado:</strong> La página /comprar está experimentando problemas de servidor</p>
        <p><em>Mensaje de error:</em> "Estamos experimentando inconvenientes con el servidor..."</p>
      </div>

      <h2>🧪 Prueba las URLs</h2>
      
      <div style={{ display: 'grid', gap: '15px', marginBottom: '30px' }}>
        {urls.map((item, index) => (
          <div key={index} style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '15px',
            background: '#f8f9fa'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, marginRight: '10px' }}>{item.name}</h3>
              <button 
                onClick={() => testUrl(item.url)}
                style={{
                  padding: '5px 10px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Probar
              </button>
            </div>
            <p style={{ margin: '5px 0', color: '#6c757d', fontSize: '14px' }}>{item.description}</p>
            <code style={{ 
              background: '#e9ecef', 
              padding: '5px 8px', 
              borderRadius: '3px', 
              fontSize: '12px',
              display: 'block',
              wordBreak: 'break-all'
            }}>
              {item.url}
            </code>
          </div>
        ))}
      </div>

      <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
        <h2>✅ URLs Correctas para TiendaNube Español</h2>
        <ul>
          <li><strong>/comprar</strong> - En lugar de /cart (inglés)</li>
          <li><strong>/productos</strong> - En lugar de /products (inglés)</li>
          <li><strong>/buscar o /search</strong> - Para búsquedas</li>
          <li><strong>/checkout</strong> - Proceso de pago</li>
        </ul>
      </div>

      <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
        <h2>🛠️ Para Desarrolladores</h2>
        <p><strong>Una vez que los problemas del servidor se resuelvan,</strong> puedes usar estas URLs en tu headless:</p>
        <ol>
          <li>Redirigir desde tu headless a <code>https://{storeDomain}/comprar</code></li>
          <li>Permitir que TiendaNube maneje todo el proceso de checkout</li>
          <li>El usuario regresa a tu tienda después de la compra</li>
        </ol>
      </div>
      
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <p style={{ color: '#6c757d' }}>
          💡 <strong>Tip:</strong> La página principal <a href={`https://${storeDomain}`} target="_blank">https://{storeDomain}</a> sí funciona correctamente
        </p>
      </div>
    </div>
  );
}