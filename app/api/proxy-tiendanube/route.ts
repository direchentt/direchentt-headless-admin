import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic'; // Asegura que la ruta no sea cacheada

export async function POST(request: NextRequest) {
  console.log('[PROXY] Petición recibida en /api/proxy-tiendanube');

  try {
    const body = await request.json();
    const { variantId, quantity } = body;

    if (!variantId || !quantity) {
      console.log('[PROXY] Error: Faltan variantId o quantity en el body');
      return NextResponse.json({ success: false, error: 'Faltan variantId o quantity' }, { status: 400 });
    }

    const cookie = request.headers.get('cookie');
    if (!cookie) {
      console.log('[PROXY] Error: No se recibió ninguna cookie del cliente.');
      return NextResponse.json({ success: false, error: 'Cookie de sesión no proporcionada' }, { status: 400 });
    }
    console.log('[PROXY] Cookie recibida del cliente.');

    const formData = new URLSearchParams();
    formData.append('add_to_cart', variantId.toString());
    formData.append('quantity', quantity.toString());
    
    const tiendanubeUrl = 'https://direchentt.mitiendanube.com/comprar/';
    console.log(`[PROXY] Enviando petición a TiendaNube: POST ${tiendanubeUrl}`);

    const response = await fetch(tiendanubeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie,
      },
      body: formData.toString(),
      redirect: 'manual', // Evita que fetch siga las redirecciones automáticamente
    });

    console.log(`[PROXY] Respuesta recibida de TiendaNube con status: ${response.status}`);

    // TiendaNube responde con un 302 Redirect al carrito si el producto se agrega correctamente.
    if (response.status === 302 || response.status === 200) {
      let location = response.headers.get('Location');
      console.log(`[PROXY] Redirección original detectada a: ${location}`);

      // Corregimos el dominio si es necesario
      if (location) {
        const originalDomain = '5112334.mitiendanube.com';
        const correctDomain = 'direchentt.mitiendanube.com';
        location = location.replace(originalDomain, correctDomain);
        console.log(`[PROXY] Redirección corregida a: ${location}`);
      }
      
      // Devolvemos una respuesta exitosa junto con la URL de redirección para que el cliente decida qué hacer.
      return NextResponse.json({ success: true, redirectTo: location || '/cart' });
    } else {
      // Si la respuesta no es la esperada, logueamos y devolvemos el error.
      const text = await response.text();
      console.log('[PROXY] Respuesta inesperada de TiendaNube:', text);
      return NextResponse.json({ success: false, error: 'Respuesta inesperada de TiendaNube', details: text }, { status: response.status });
    }

  } catch (error) {
    console.error('[PROXY] Error interno en el servidor:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
