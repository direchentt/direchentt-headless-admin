import { NextRequest, NextResponse } from 'next/server';
import { getStoreData } from '@/lib/backend';

/**
 * Dominio del storefront NATIVO de Tiendanube.
 * NUNCA usar el campo `domain` de MongoDB: apunta al headless (Next.js)
 * que no tiene rutas /cart/add ni /checkout.
 */
function getTiendanubeDomain(storeId: string): string {
  return `${storeId}.mitiendanube.com`;
}

/**
 * Estrategia 1 (preferida): Cart API de Tiendanube
 * POST /v1/{store_id}/carts → devuelve checkout_url listo para redirect.
 *
 * La API puede devolver el campo como `checkout_url` o `permalink`
 * dependiendo de la versión. Se intenta ambos.
 */
async function createCheckoutViaCartApi(
  storeId: string,
  accessToken: string,
  items: { variant_id: number; quantity: number }[]
): Promise<string | null> {
  try {
    const res = await fetch(`https://api.tiendanube.com/v1/${storeId}/carts`, {
      method: 'POST',
      headers: {
        Authentication: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DirechenttHeadless/1.0',
      },
      body: JSON.stringify({
        cart: { line_items: items },
      }),
    });

    const text = await res.text();

    if (!res.ok) {
      console.warn(`⚠️ Cart API HTTP ${res.status}:`, text.slice(0, 300));
      return null;
    }

    const data = JSON.parse(text) as {
      checkout_url?: string;
      permalink?: string;
      id?: string | number;
    };

    console.log('📦 Cart API response fields:', Object.keys(data));

    // Tiendanube puede devolver el campo como checkout_url o permalink
    const url = data.checkout_url || data.permalink || null;

    if (url) {
      console.log('✅ Cart API OK → checkout_url:', url);
    } else {
      console.warn('⚠️ Cart API OK pero sin checkout_url ni permalink. Respuesta:', text.slice(0, 300));
    }

    return url;
  } catch (e) {
    console.warn('❌ Cart API error:', e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Estrategia 2 (fallback): URL /cart/add/ del storefront nativo.
 * Tiendanube redirige internamente a /checkout/v3/start/{session}/{token}
 * cuando recibe ?storefront=permalink.
 *
 * Formato: https://{storeId}.mitiendanube.com/cart/add/{variantId}:{qty},{variantId2}:{qty2}?storefront=permalink
 */
function buildCartAddUrl(
  storeId: string,
  items: { variant_id: number; quantity: number }[]
): string {
  const domain = getTiendanubeDomain(storeId);
  const cartQuery = items
    .filter((i) => i.variant_id)
    .map((i) => `${i.variant_id}:${i.quantity}`)
    .join(',');

  const url = new URL(`https://${domain}/cart/add/${cartQuery}`);
  url.searchParams.set('storefront', 'permalink');
  url.searchParams.set('from_store', '1');
  url.searchParams.set('country', 'AR');

  return url.toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variantId, quantity = 1, shop, productId, items } = body;
    const storeId = String(shop || '5112334');

    // Normalizar items al formato interno
    let lineItems: { variant_id: number; quantity: number }[] = [];

    if (items && Array.isArray(items) && items.length > 0) {
      lineItems = items
        .map((item: { variantId: unknown; quantity?: unknown }) => ({
          variant_id: parseInt(String(item.variantId), 10),
          quantity: Math.max(1, parseInt(String(item.quantity ?? 1), 10)),
        }))
        .filter((i) => i.variant_id > 0);
    } else if (variantId != null) {
      const vid = parseInt(String(variantId), 10);
      const qty = Math.max(1, parseInt(String(quantity), 10));
      if (vid > 0) lineItems = [{ variant_id: vid, quantity: qty }];
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sin variantes válidas para checkout' },
        { status: 400 }
      );
    }

    // Obtener datos de la tienda desde MongoDB
    const storeLocal = await getStoreData(storeId);
    if (!storeLocal) {
      return NextResponse.json(
        { success: false, error: 'Tienda no encontrada en la base de datos' },
        { status: 404 }
      );
    }

    const tiendanubeDomain = getTiendanubeDomain(String(storeLocal.storeId));
    let checkoutUrl: string | null = null;
    let method: string;

    // Estrategia 1: Cart API (devuelve checkout_url directo, más limpio)
    const token = storeLocal.accessToken as string | undefined;
    if (token) {
      checkoutUrl = await createCheckoutViaCartApi(
        String(storeLocal.storeId),
        token,
        lineItems
      );
      if (checkoutUrl) method = 'cart_api';
    }

    // Estrategia 2 (fallback): /cart/add/ URL en el storefront nativo
    if (!checkoutUrl) {
      checkoutUrl = buildCartAddUrl(String(storeLocal.storeId), lineItems);
      method = 'cart_add_url';
      console.log('🔄 Fallback a /cart/add URL:', checkoutUrl);
    }

    console.log(`🛒 Checkout generado [${method!}]:`, checkoutUrl);

    return NextResponse.json({
      success: true,
      checkoutUrl,
      domain: tiendanubeDomain,
      method: method!,
    });
  } catch (error) {
    console.error('❌ Error en /api/checkout:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
