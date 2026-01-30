import { NextResponse } from 'next/server';

// Este endpoint actúa como un "proxy" para agregar productos al carrito de TiendaNube
export async function POST(request: Request) {
  try {
    // 1. Obtener la cookie de la petición original (la que viene de Postman/cliente)
    const cookie = request.headers.get('cookie');
    if (!cookie) {
      console.error('[PROXY] Error: No se recibió ninguna cookie del cliente.');
      return NextResponse.json({ success: false, message: 'Error: La cookie de sesión es obligatoria.' }, { status: 400 });
    }
    console.log('[PROXY] Cookie recibida del cliente.');

    // 2. Obtener los datos del producto del cuerpo de la petición
    const { variantId, quantity } = await request.json();
    if (!variantId || !quantity) {
      return NextResponse.json({ success: false, message: 'Faltan variantId o quantity' }, { status: 400 });
    }

    // 3. Preparar la petición para TiendaNube
    const tiendanubeUrl = 'https://www.direchentt.com.ar/comprar/';
    
    // El cuerpo debe estar en formato 'form-urlencoded'
    const body = new URLSearchParams();
    body.append('add_to_cart', variantId); // Usamos 'add_to_cart' que es común
    body.append('quantity', quantity.toString());

    console.log(`[PROXY] Enviando a TiendaNube URL: ${tiendanubeUrl}`);
    console.log(`[PROXY] Enviando Body: ${body.toString()}`);

    // 4. Realizar la llamada a TiendaNube reenviando la cookie
    const response = await fetch(tiendanubeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie, // Reenviamos la cookie del cliente
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.direchentt.com.ar/',
        'Origin': 'https://www.direchentt.com.ar',
      },
      body: body.toString(),
    });

    // 5. Analizar y devolver la respuesta de TiendaNube
    console.log(`[PROXY] Respuesta de TiendaNube Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PROXY] TiendaNube respondió con un error:', errorText);
      throw new Error(`TiendaNube respondió con status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[PROXY] Respuesta JSON de TiendaNube:', data);

    return NextResponse.json({ 
      success: true, 
      message: 'Petición al proxy exitosa.',
      tiendanube_response: data 
    });

  } catch (error) {
    console.error('[PROXY] Error catastrófico en el proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió';
    return NextResponse.json({ success: false, message: 'Error en el servidor proxy', error: errorMessage }, { status: 500 });
  }
}