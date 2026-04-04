import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

/**
 * Checkout Pro: crea preferencia con el Access Token (servidor).
 * La Public Key no hace falta para este flujo (redirección a init_point).
 * Public Key = Bricks / tokenización en el front; ver docs MP.
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'Definí NEXT_PUBLIC_APP_URL para back_urls y webhooks' },
      { status: 500 }
    );
  }

  const currencyId = (process.env.MP_PREFERENCE_CURRENCY || 'ARS').toUpperCase();

  try {
    const { items, storeId } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const mapped = items.map((item: any) => {
      const title = String(item.name || 'Producto').slice(0, 250);
      const unit = Number(item.price);
      const qty = Math.min(99, Math.max(1, parseInt(String(item.quantity), 10) || 1));
      if (!Number.isFinite(unit) || unit <= 0) {
        throw new Error(`Precio inválido para ítem: ${title}`);
      }
      return {
        id: String(item.variantId ?? item.id ?? ''),
        title,
        unit_price: unit,
        quantity: qty,
        currency_id: currencyId,
      };
    });

    const result = await preference.create({
      body: {
        items: mapped,
        back_urls: {
          success: `${baseUrl}/checkout/success`,
          failure: `${baseUrl}/checkout/failure`,
          pending: `${baseUrl}/checkout/pending`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/checkout/mercadopago/webhook`,
        metadata: {
          store_id: String(storeId || '5112334'),
          cart_items: JSON.stringify(
            items.map((i: any) => ({ id: i.variantId, q: i.quantity }))
          ),
        },
      },
    });

    const payUrl = result.init_point || result.sandbox_init_point;
    if (!payUrl) {
      return NextResponse.json({ error: 'MP no devolvió URL de pago' }, { status: 500 });
    }

    return NextResponse.json({
      id: result.id,
      init_point: payUrl,
    });
  } catch (error) {
    console.error('❌ Error creando preferencia de Mercado Pago:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
