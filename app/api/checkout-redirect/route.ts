import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const items = searchParams.get('items');

  if (!items) {
    return new NextResponse('Missing items parameter', { status: 400 });
  }

  const DOMAIN = 'www.direchentt.com.ar';

  // Redirigir a una página de la tienda (search es ideal porque carga rápido)
  // con un parámetro especial que nuestro script detectará
  const redirectUrl = `https://${DOMAIN}/search/?headless_checkout=true&items=${encodeURIComponent(items)}`;

  // Página intermedia simple para feedback visual
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Conectando...</title>
  <style>
    body { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background: #fff; }
    .loader { border: 3px solid #f3f3f3; border-top: 3px solid #000; border-radius: 50%; width: 40px; height: 40px; animation: spin 0.8s linear infinite; margin-bottom: 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader"></div>
  <p>Conectando con la tienda...</p>
  <script>
    // Redirigir inmediatamente
    window.location.href = "${redirectUrl}";
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
