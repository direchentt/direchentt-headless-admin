
import { NextRequest, NextResponse } from 'next/server';
import { getStoreData } from '../../../lib/backend';



export async function POST(req: NextRequest) {
  try {
    let TIENDANUBE_TOKEN = process.env.TIENDANUBE_TOKEN;
    let TIENDANUBE_STORE_ID = process.env.TIENDANUBE_STORE_ID;

    const { variantId, quantity, email, storeId } = await req.json();
    if (!variantId || !quantity) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // Si no hay token o storeId en env, buscar en MongoDB
    if (!TIENDANUBE_TOKEN || !TIENDANUBE_STORE_ID) {
      const storeData = await getStoreData(storeId || '5112334');
      if (!storeData || !storeData.accessToken || !storeData.storeId) {
        return NextResponse.json({ error: 'No se encontró accessToken/storeId en MongoDB ni en .env.local' }, { status: 500 });
      }
      TIENDANUBE_TOKEN = storeData.accessToken;
      TIENDANUBE_STORE_ID = storeData.storeId;
    }

    const API_BASE = `https://api.tiendanube.com/v1/${TIENDANUBE_STORE_ID}`;

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
