import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, fetchProductWithVariants } from '@/lib/backend';
import { processProduct, getVariantDisplayPrices, parseMoney } from '@/lib/product-utils';
import {
  createMercadoPagoCheckoutProPreference,
  type MpPreferenceInputItem,
} from '@/lib/mercadopago-checkout-pro';
import crypto from 'crypto';

type CheckoutBodyItem = {
  variantId?: unknown;
  quantity?: unknown;
  productId?: unknown;
  name?: unknown;
  price?: unknown;
};

/** Arma ítems con nombre y precio para MP (body del cliente o API Tienda Nube). */
async function buildMercadoPagoItemsFromCheckout(
  lineItems: { variant_id: number; quantity: number }[],
  bodyItems: CheckoutBodyItem[] | undefined,
  storeId: string,
  tnToken: string | undefined
): Promise<MpPreferenceInputItem[] | null> {
  const resolved: MpPreferenceInputItem[] = [];
  const productCache = new Map<number, NonNullable<ReturnType<typeof processProduct>>>();

  for (let i = 0; i < lineItems.length; i++) {
    const li = lineItems[i];
    const raw =
      bodyItems?.find((x) => parseInt(String(x.variantId), 10) === li.variant_id) ??
      bodyItems?.[i];

    let name =
      raw?.name != null && String(raw.name).trim() !== ''
        ? String(raw.name).trim()
        : undefined;
    let price: string | number | undefined =
      raw?.price != null && String(raw.price).trim() !== '' ? (raw.price as string | number) : undefined;

    const productIdNum =
      raw?.productId != null ? parseInt(String(raw.productId), 10) : undefined;

    const needsTnFetch = (name == null || price == null) && productIdNum != null && Number.isFinite(productIdNum);
    if (needsTnFetch && !tnToken?.trim()) {
      console.warn('MP checkout: falta nombre/precio y no hay token TN para enriquecer');
      return null;
    }

    if (needsTnFetch && productIdNum != null) {
      let proc = productCache.get(productIdNum);
      if (!proc) {
        const product = await fetchProductWithVariants(String(productIdNum), storeId, tnToken!);
        if (!product) {
          console.warn(`MP checkout: producto ${productIdNum} no encontrado`);
          return null;
        }
        const processed = processProduct(product);
        if (!processed) {
          return null;
        }
        proc = processed;
        productCache.set(productIdNum, proc);
      }
      const variant = proc.variants?.find((v: { id: number }) => v.id === li.variant_id);
      if (!variant) {
        console.warn(`MP checkout: variante ${li.variant_id} no existe en producto ${productIdNum}`);
        return null;
      }
      const { current } = getVariantDisplayPrices(variant);
      name = name ?? String(proc.name || 'Producto');
      price = price ?? current;
    }

    if (!name || price == null || parseMoney(price) <= 0) {
      console.warn('MP checkout: falta nombre o precio válido', { variant_id: li.variant_id });
      return null;
    }

    resolved.push({
      variantId: li.variant_id,
      name,
      price,
      quantity: li.quantity,
    });
  }

  return resolved;
}

/**
 * Obtiene el dominio correcto de checkout para una tienda.
 * 
 * Si la tienda tiene un dominio personalizado (en MongoDB.domain):
 *   - Usa ese dominio directamente para checkout
 * Si no:
 *   - Fallback a {storeId}.mitiendanube.com
 */
async function getCheckoutDomain(storeId: string): Promise<string> {
  try {
    const storeLocal = await getStoreData(storeId);
    // Si existe dominio en MongoDB, usarlo (e.g., "www.direchentt.com.ar")
    if (storeLocal?.domain && storeLocal.domain.trim()) {
      return storeLocal.domain.replace(/^https?:\/\//, ''); // remover protocolo si existe
    }
  } catch {
    // Ignorar error y usar fallback
  }
  // Fallback: storefront nativo de Tiendanube
  return `${storeId}.mitiendanube.com`;
}

/**
 * Estrategia 1 (preferida): Cart API de Tiendanube
 * POST /v1/{store_id}/carts → devuelve id (cartId) y hash (cartHash)
 * Entonces construimos: /checkout/v3/start/{id}/{hash}
 */
async function createCheckoutViaCartApi(
  storeId: string,
  accessToken: string,
  items: { variant_id: number; quantity: number }[],
  checkoutDomain: string
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

    // 🔍 LOGUEAR COMPLETO (DEBUG)
    console.log('🔍 Cart API Response:');
    console.log('  STATUS:', res.status);
    console.log('  HEADERS:', Object.fromEntries(res.headers.entries()));
    console.log('  BODY:', text);

    if (!res.ok) {
      console.warn(`⚠️ Cart API HTTP ${res.status}:`, text.slice(0, 300));
      return null;
    }

    const data = JSON.parse(text) as Record<string, unknown>;

    console.log('📦 Cart API response fields:', Object.keys(data));
    console.log('📦 Full response object:', JSON.stringify(data, null, 2));

    // Prioridad 1: Si la API devuelve checkout_url completo
    if (data.checkout_url) {
      console.log('✅ Cart API → checkout_url directo:', data.checkout_url);
      return String(data.checkout_url);
    }

    // Prioridad 2: Si devuelve permalink completo
    if (data.permalink) {
      console.log('✅ Cart API → permalink directo:', data.permalink);
      return String(data.permalink);
    }

    // Prioridad 3: Si devuelve id y hash
    if (data.id && data.hash) {
      const url = `https://${checkoutDomain}/checkout/start?cart_id=${data.id}&cart_hash=${data.hash}`;
      console.log('✅ Cart API → URL construida desde id/hash:', url);
      return url;
    }

    console.warn('⚠️ Cart API OK pero sin checkout_url, permalink, id o hash.');
    console.warn('⚠️ Todos los campos disponibles:', Object.keys(data));
    return null;
  } catch (e) {
    console.warn('❌ Cart API error:', e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Estrategia: Construir URL de checkout con cartId y hash generados
 * basados en los items. Esto funciona como un "carrito temporal"
 */
function buildCheckoutWithCartUrl(
  checkoutDomain: string,
  items: { variant_id: number; quantity: number }[]
): string {
  // Generar un cartId simple (timestamp + random)
  const cartId = Date.now().toString();
  
  // Generar un hash SHA256 de los items + cartId
  const itemsStr = items.map(i => `${i.variant_id}:${i.quantity}`).join(',');
  const hash = crypto
    .createHash('sha256')
    .update(`${itemsStr}${cartId}`)
    .digest('hex');

  const url = new URL(`https://${checkoutDomain}/checkout/v3/start/${cartId}/${hash}`);
  url.searchParams.set('from_store', '1');
  url.searchParams.set('country', 'AR');
  
  // Agregar items como parámetros
  items.forEach((item, idx) => {
    url.searchParams.set(`items[${idx}][variant_id]`, String(item.variant_id));
    url.searchParams.set(`items[${idx}][quantity]`, String(item.quantity));
  });

  console.log(`✨ Checkout generado con hash temporal:`, url.toString());
  return url.toString();
}

/**
 * Estrategia: Construir URL de checkout con cartId y hash
 * Formato: /checkout/v3/start/{cartId}/{cartHash}
 */
function buildCheckoutUrl(
  checkoutDomain: string,
  cartId: string | number,
  cartHash: string
): string {
  const url = `https://${checkoutDomain}/checkout/v3/start/${cartId}/${cartHash}?from_store=1&country=AR`;
  console.log(`✅ Checkout URL construida:`, url);
  return url;
}

/**
 * Estrategia 2 (fallback): URL /cart/add/ del storefront.
 * Tiendanube redirige internamente a /checkout/v3/start/{session}/{token}
 * cuando recibe ?storefront=permalink.
 *
 * Formato: https://{checkoutDomain}/cart/add/{variantId}:{qty},{variantId2}:{qty2}?storefront=permalink
 */
function buildCartAddUrl(
  checkoutDomain: string,
  items: { variant_id: number; quantity: number }[]
): string {
  const cartQuery = items
    .filter((i) => i.variant_id)
    .map((i) => `${i.variant_id}:${i.quantity}`)
    .join(',');

  const url = new URL(`https://${checkoutDomain}/cart/add/${cartQuery}`);
  url.searchParams.set('storefront', 'permalink');
  url.searchParams.set('from_store', '1');
  url.searchParams.set('country', 'AR');

  return url.toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variantId, quantity = 1, shop, productId, items, name, price } = body;
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

    let bodyItemsForMp: CheckoutBodyItem[] | undefined;
    if (items && Array.isArray(items) && items.length > 0) {
      bodyItemsForMp = items as CheckoutBodyItem[];
    } else if (variantId != null) {
      bodyItemsForMp = [
        { variantId, quantity, productId, name, price },
      ];
    }

    // Obtener datos de la tienda desde MongoDB
    const storeLocal = await getStoreData(storeId);
    if (!storeLocal) {
      return NextResponse.json(
        { success: false, error: 'Tienda no encontrada en la base de datos' },
        { status: 404 }
      );
    }

    // Determinar el dominio de checkout (personalizado o nativo)
    const checkoutDomain = await getCheckoutDomain(storeId);

    let checkoutUrl: string | null = null;
    let method: string | undefined;

    const token = storeLocal.accessToken as string | undefined;
    const mpToken = process.env.MP_ACCESS_TOKEN?.trim();

    if (mpToken) {
      const mpItems = await buildMercadoPagoItemsFromCheckout(
        lineItems,
        bodyItemsForMp,
        String(storeLocal.storeId),
        token
      );
      if (mpItems && mpItems.length === lineItems.length) {
        const mpResult = await createMercadoPagoCheckoutProPreference(
          req,
          mpToken,
          String(storeLocal.storeId),
          mpItems
        );
        if (mpResult.ok) {
          return NextResponse.json({
            success: true,
            checkoutUrl: mpResult.init_point,
            domain: checkoutDomain,
            method: 'mercadopago_checkout_pro',
          });
        }
        console.warn('⚠️ Mercado Pago falló, se usa checkout TiendaNube:', mpResult.error);
      }
    }

    // Estrategia 1: Usar Cart API para crear el carrito
    const nativeDomain = `${storeLocal.storeId}.mitiendanube.com`;
    
    if (token) {
      const cartApiUrl = await createCheckoutViaCartApi(
        String(storeLocal.storeId),
        token,
        lineItems,
        nativeDomain
      );
      
      if (cartApiUrl) {
        checkoutUrl = cartApiUrl;
        method = 'cart_api';
      }
    }

    // Estrategia 2: Si Cart API falla, generar IDs y construir URL de checkout
    if (!checkoutUrl) {
      try {
        // Intentar extraer cartId y cartHash de la respuesta de Cart API
        const res = await fetch(`https://api.tiendanube.com/v1/${storeLocal.storeId}/carts`, {
          method: 'POST',
          headers: {
            Authentication: `bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'DirechenttHeadless/1.0',
          },
          body: JSON.stringify({
            cart: { line_items: lineItems },
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            id?: string | number;
            hash?: string;
          };
          
          if (data.id && data.hash) {
            checkoutUrl = buildCheckoutUrl(checkoutDomain, data.id, data.hash);
            method = 'checkout_v3_with_cart_api';
          }
        }
      } catch (e) {
        console.warn('Error intente Cart API:', e);
      }
    }

    // Estrategia 3: Fallback - generar IDs localmente
    if (!checkoutUrl) {
      const cartId = Date.now().toString(); // timestamp como cartId
      const itemsStr = lineItems.map(i => `${i.variant_id}:${i.quantity}`).join(',');
      const cartHash = crypto
        .createHash('sha256')
        .update(`${itemsStr}${cartId}${storeLocal.storeId}`)
        .digest('hex');
      
      checkoutUrl = buildCheckoutUrl(checkoutDomain, cartId, cartHash);
      method = 'checkout_v3_generated_ids';
      console.log(`⚠️ Usando IDs generados localmente (fallback)`);
    }

    return NextResponse.json({
      success: true,
      checkoutUrl,
      domain: checkoutDomain,
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
