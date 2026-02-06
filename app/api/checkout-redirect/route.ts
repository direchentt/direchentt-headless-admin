import { NextRequest, NextResponse } from 'next/server';

/**
 * Página HTML que agrega productos al carrito de Tiendanube usando JavaScript
 * y luego redirige al checkout
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const items = searchParams.get('items');

  if (!items) {
    return new NextResponse('Missing items parameter', { status: 400 });
  }

  let products: { variant_id: number; quantity: number }[] = [];
  try {
    products = JSON.parse(decodeURIComponent(items));
  } catch (e) {
    return new NextResponse('Invalid items format', { status: 400 });
  }

  const DOMAIN = 'www.direchentt.com.ar';

  // Crear HTML que usa AJAX para agregar productos al carrito
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirigiendo al checkout...</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 400px;
    }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #000;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 24px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h1 {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    p {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
    }
    .error {
      color: #d32f2f;
      margin-top: 20px;
    }
    .retry-btn {
      margin-top: 20px;
      padding: 12px 24px;
      background: #000;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .retry-btn:hover {
      background: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Preparando tu compra</h1>
    <p id="status">Agregando productos al carrito...</p>
    <div id="error" class="error" style="display:none;"></div>
    <button id="retry" class="retry-btn" style="display:none;" onclick="location.reload()">Reintentar</button>
  </div>

  <script>
    const products = ${JSON.stringify(products)};
    const DOMAIN = '${DOMAIN}';
    
    async function addProductsToCart() {
      try {
        document.getElementById('status').textContent = 'Agregando productos al carrito...';
        
        // Construir URL con parámetros GET
        let url = \`https://\${DOMAIN}/comprar?\`;
        
        // Agregar cada producto como parámetro
        products.forEach((product, index) => {
          url += \`add[\${index}][id]=\${product.variant_id}&\`;
          url += \`add[\${index}][quantity]=\${product.quantity}&\`;
        });
        
        // Agregar parámetro para ir al checkout
        url += 'go_to_checkout=true';
        
        console.log('Redirecting to:', url);
        
        // Esperar un momento para que el usuario vea el mensaje
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Redirigir directamente
        document.getElementById('status').textContent = 'Redirigiendo al checkout...';
        window.location.href = url;
        
      } catch (error) {
        console.error('Error:', error);
        document.getElementById('status').style.display = 'none';
        document.querySelector('.spinner').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = 'Hubo un error al procesar tu compra. Por favor, intenta nuevamente.';
        document.getElementById('retry').style.display = 'inline-block';
      }
    }
    
    // Ejecutar cuando la página cargue
    window.addEventListener('DOMContentLoaded', addProductsToCart);
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
