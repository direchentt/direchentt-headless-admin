import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStoreData } from '@/lib/backend';

/**
 * Checkout Session de Stripe (tarjetas, Apple Pay / Google Pay donde aplique).
 * El monto se toma siempre de la API de TiendaNube (no confiar en el cliente).
 * @see https://stripe.com/docs/api/checkout/sessions/create
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: 'STRIPE_SECRET_KEY no configurada. Agregala en Vercel / .env.local' },
      { status: 503 }
    );
  }

  let body: { shop?: string; productId?: number; variantId?: number; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const shop = String(body.shop || '').trim();
  const productId = Number(body.productId);
  const variantId = Number(body.variantId);
  const quantity = Math.min(10, Math.max(1, Math.floor(Number(body.quantity) || 1)));

  if (!shop || !Number.isFinite(productId) || !Number.isFinite(variantId)) {
    return NextResponse.json({ error: 'shop, productId y variantId son obligatorios' }, { status: 400 });
  }

  const store = await getStoreData(shop);
  if (!store?.accessToken) {
    return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
  }

  const pRes = await fetch(
    `https://api.tiendanube.com/v1/${store.storeId}/products/${productId}`,
    {
      headers: {
        Authentication: `bearer ${store.accessToken}`,
        'User-Agent': 'Direchentt',
      },
      cache: 'no-store',
    }
  );

  if (!pRes.ok) {
    return NextResponse.json({ error: 'No se pudo leer el producto en TiendaNube' }, { status: 502 });
  }

  const product = (await pRes.json()) as {
    name?: string | { es?: string; en?: string };
    variants?: Array<{ id: number; price?: string | number }>;
  };

  const variant = product.variants?.find((v) => Number(v.id) === variantId);
  if (!variant) {
    return NextResponse.json({ error: 'Variante no encontrada' }, { status: 400 });
  }

  const priceNum = parseFloat(String(variant.price ?? '0'));
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return NextResponse.json({ error: 'Precio de variante inválido' }, { status: 400 });
  }

  const currency = (process.env.STRIPE_CHECKOUT_CURRENCY || 'ars').toLowerCase().trim();
  const unitAmount = Math.round(priceNum * 100);
  if (unitAmount < 50) {
    return NextResponse.json({ error: 'Monto demasiado bajo para Stripe' }, { status: 400 });
  }

  const nameEs =
    typeof product.name === 'object' && product.name !== null
      ? String(product.name.es || product.name.en || 'Producto')
      : String(product.name || 'Producto');

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    request.headers.get('origin') ||
    '';

  if (!origin) {
    return NextResponse.json(
      { error: 'Definí NEXT_PUBLIC_APP_URL para las URLs de retorno de Stripe' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secret);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity,
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: nameEs,
              metadata: {
                tiendanube_store_id: String(store.storeId),
                tiendanube_product_id: String(productId),
                tiendanube_variant_id: String(variantId),
              },
            },
          },
        },
      ],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/product/${productId}?shop=${encodeURIComponent(shop)}`,
      metadata: {
        tiendanube_store_id: String(store.storeId),
        tiendanube_product_id: String(productId),
        tiendanube_variant_id: String(variantId),
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe no devolvió URL de checkout' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de Stripe';
    console.error('Stripe checkout session:', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
