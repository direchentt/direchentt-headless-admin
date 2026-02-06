import { NextRequest, NextResponse } from 'next/server';

/**
 * Página HTML que agrega productos al carrito usando un formulario POST y redirige
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

  // Generar inputs ocultos para el formulario
  const inputs = products.map((p, i) => `
    <input type="hidden" name="add[${i}][variant_id]" value="${p.variant_id}">
    <input type="hidden" name="add[${i}][quantity]" value="${p.quantity}">
  `).join('');

  // HTML con formulario POST automático
  // Agregamos 'checkout' como action endpoint en lugar de 'comprar' para ir directo
  // O mantenemos 'comprar' pero aseguramos los flags correctos.
  // Tiendanube usa /comprar para procesar el carrito.

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Iniciando compra...</title>
  <meta name="referrer" content="origin">
  <style>
    body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background: #fff; }
    .loader { border: 3px solid #f3f3f3; border-top: 3px solid #000; border-radius: 50%; width: 40px; height: 40px; animation: spin 0.8s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    p { margin-top: 20px; font-size: 14px; color: #333; letter-spacing: 1px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div style="text-align: center;">
    <div class="loader" style="margin: 0 auto;"></div>
    <p>Conectando con Tiendanube...</p>
  </div>

  <form id="checkoutForm" action="https://${DOMAIN}/comprar" method="POST">
    ${inputs}
    <input type="hidden" name="go_to_checkout" value="true">
    <input type="hidden" name="cp_triggered" value="true"> 
  </form>

  <script>
    // Enviar el formulario automáticamente
    window.onload = function() {
      // Pequeño delay para asegurar que el DOM esté listo y no sea flaggeado como bot instantáneo
      setTimeout(function() {
        document.getElementById('checkoutForm').submit();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
