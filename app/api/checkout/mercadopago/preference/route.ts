import { NextRequest, NextResponse } from 'next/server';
import { createMercadoPagoCheckoutProPreference } from '@/lib/mercadopago-checkout-pro';

/**
 * Checkout Pro: crea preferencia con el Access Token (servidor).
 * La Public Key no hace falta para este flujo (redirección a init_point).
 */
export async function POST(req: NextRequest) {
  const accessToken = process.env.MP_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          'Falta MP_ACCESS_TOKEN en el servidor. La Public Key va aparte (frontend); para preferencias solo el token de acceso.',
      },
      { status: 503 }
    );
  }

  try {
    const { items, storeId } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    const mpItems = items.map((item: any) => ({
      variantId: item.variantId ?? item.id,
      id: item.id,
      name: String(item.name || 'Producto'),
      price: item.price,
      quantity: item.quantity ?? 1,
    }));

    const result = await createMercadoPagoCheckoutProPreference(
      req,
      accessToken,
      String(storeId || '5112334'),
      mpItems
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode });
    }

    return NextResponse.json({
      id: result.preference_id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error) {
    console.error('❌ preference route:', error);
    return NextResponse.json({ error: 'JSON inválido o error interno' }, { status: 400 });
  }
}
