import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { parseMoney } from '@/lib/product-utils';

function mercadoPagoErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null) {
    const o = err as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    const cause = o.cause;
    if (Array.isArray(cause) && cause[0] && typeof cause[0] === 'object' && cause[0] !== null) {
      const c0 = cause[0] as Record<string, unknown>;
      if (typeof c0.description === 'string') return c0.description;
    }
  }
  try {
    return JSON.stringify(err);
  } catch {
    return 'Error al crear la preferencia en Mercado Pago';
  }
}

/**
 * Checkout Pro: crea preferencia con el Access Token (servidor).
 * La Public Key no hace falta para este flujo (redirección a init_point).
 * Public Key = Bricks / tokenización en el front; ver docs MP.
 */
/**
 * URL pública para back_urls y notification_url.
 * Prioridad: host de esta petición (coincide con donde el usuario compra) → env → Vercel.
 * Así evitamos rechazos de MP cuando NEXT_PUBLIC_APP_URL no coincide con el dominio real (www, custom domain, etc.).
 */
function resolvePublicBaseUrl(req: NextRequest): string | null {
  const fromRequest = req.nextUrl?.origin?.replace(/\/$/, '').trim();
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '').trim();
  const vercel = process.env.VERCEL_URL?.replace(/\/$/, '').trim();
  const fromVercel = vercel ? `https://${vercel}` : '';
  if (fromRequest) return fromRequest;
  if (fromEnv) return fromEnv;
  if (fromVercel) return fromVercel;
  return null;
}

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

  const baseUrl = resolvePublicBaseUrl(req);
  if (!baseUrl) {
    return NextResponse.json(
      {
        error:
          'No se pudo determinar la URL pública (back_urls). Definí NEXT_PUBLIC_APP_URL o desplegá en Vercel.',
      },
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
      const unit = Math.round(parseMoney(item.price) * 100) / 100;
      const qty = Math.min(99, Math.max(1, parseInt(String(item.quantity), 10) || 1));
      if (!Number.isFinite(unit) || unit <= 0) {
        throw new Error(`Precio inválido para ítem: ${title} (recibido: ${JSON.stringify(item.price)})`);
      }
      return {
        id: String(item.variantId ?? item.id ?? ''),
        title,
        unit_price: unit,
        quantity: qty,
        currency_id: currencyId,
      };
    });

    const backUrls = {
      success: `${baseUrl}/checkout/success`,
      failure: `${baseUrl}/checkout/failure`,
      pending: `${baseUrl}/checkout/pending`,
    };

    // MP exige HTTPS en back_urls y notification_url (no http://localhost salvo túnel).
    const body: Parameters<Preference['create']>[0]['body'] = {
      items: mapped,
      back_urls: backUrls,
      notification_url: `${baseUrl}/api/checkout/mercadopago/webhook`,
      metadata: {
        store_id: String(storeId || '5112334'),
        cart_items: JSON.stringify(
          items.map((i: any) => ({ id: i.variantId, q: i.quantity }))
        ),
      },
    };
    if (baseUrl.startsWith('https://')) {
      body.auto_return = 'approved';
    }

    const result = await preference.create({ body });

    const payUrl = result.init_point || result.sandbox_init_point;
    if (!payUrl) {
      return NextResponse.json({ error: 'MP no devolvió URL de pago' }, { status: 500 });
    }

    return NextResponse.json({
      id: result.id,
      init_point: payUrl,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error) {
    console.error('❌ Error creando preferencia de Mercado Pago:', error);
    return NextResponse.json(
      { error: mercadoPagoErrorMessage(error) },
      { status: 500 }
    );
  }
}
