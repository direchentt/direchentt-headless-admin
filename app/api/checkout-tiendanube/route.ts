import { NextRequest, NextResponse } from 'next/server';

// Lee el token de la API desde variables de entorno
const TIENDANUBE_TOKEN = process.env.TIENDANUBE_TOKEN;
const TIENDANUBE_STORE_ID = process.env.TIENDANUBE_STORE_ID; // Debes tener esto en tu .env.local

if (!TIENDANUBE_TOKEN || !TIENDANUBE_STORE_ID) {
  throw new Error('Faltan TIENDANUBE_TOKEN o TIENDANUBE_STORE_ID en .env.local');
}

const API_BASE = `https://api.tiendanube.com/v1/${TIENDANUBE_STORE_ID}`;

export async function POST(req: NextRequest) {
  try {
    const { variantId, quantity, email } = await req.json();
    if (!variantId || !quantity) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // 1. Crear carrito
    const cartRes = await fetch(`${API_BASE}/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authentication': `bearer ${TIENDANUBE_TOKEN}`,
        'User-Agent': 'direchentt-headless',
      },
      body: JSON.stringify({
        email: email || undefined,
        products: [
          {
            variant_id: variantId,
            quantity: quantity,
          },
        ],
      }),
    });
    if (!cartRes.ok) {
      const error = await cartRes.text();
      return NextResponse.json({ error: 'Error creando carrito', details: error }, { status: 500 });
    }
    const cart = await cartRes.json();

    // 2. Obtener checkout URL
    const checkoutUrl = cart.checkout_url || cart.checkout?.url;
    if (!checkoutUrl) {
      return NextResponse.json({ error: 'No se pudo obtener checkout_url', cart }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
