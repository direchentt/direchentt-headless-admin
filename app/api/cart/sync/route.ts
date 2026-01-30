import { NextResponse } from 'next/server';
import { getStoreData } from '../../../../lib/backend';

export async function POST(request: Request) {
  try {
    const { variantId, quantity = 1, shop, productId, selectedVariant } = await request.json();
    
    console.log('🛒 Sincronizando carrito:', { variantId, quantity, shop, productId });
    
    const storeData = await getStoreData(shop);
    if (!storeData) {
      return NextResponse.json(
        { success: false, error: 'Tienda no encontrada' },
        { status: 404 }
      );
    }

    // Usar dominio personalizado conocido para esta tienda específica
    let domain = storeData.domain;
    if (!domain) {
      if (storeData.storeId === '5112334') {
        domain = 'www.direchentt.com.ar';
      } else {
        domain = `${storeData.storeId}.mitiendanube.com`;
      }
    }
    console.log('🏪 Sincronizando con tienda:', { 
      storeId: storeData.storeId, 
      domain, 
      shopName: storeData.shop_name,
      hasAccessToken: !!storeData.accessToken 
    });
    
    // Método 1: Intentar usar la API de JavaScript de TiendaNube (más confiable)
    const jsUrl = await buildJavaScriptAddToCartUrl({
      domain,
      variantId: variantId || selectedVariant?.id,
      quantity,
      productId
    });

    if (jsUrl) {
      return NextResponse.json({
        success: true,
        method: 'javascript',
        addToCartUrl: jsUrl,
        message: 'Usar JavaScript para agregar al carrito',
        domain
      });
    }

    // Método 2: Usar URL directa de checkout v3
    const checkoutUrl = buildCheckoutV3Url({
      domain,
      variantId: variantId || selectedVariant?.id,
      quantity
    });

    return NextResponse.json({
      success: true,
      method: 'direct',
      checkoutUrl,
      message: 'Checkout directo con producto',
      domain
    });
    
  } catch (error) {
    console.error('❌ Error sincronizando carrito:', error);
    return NextResponse.json(
      { success: false, error: 'Error al sincronizar carrito' },
      { status: 500 }
    );
  }
}

/**
 * Construir URL para usar JavaScript de TiendaNube (más confiable)
 */
function buildJavaScriptAddToCartUrl({ domain, variantId, quantity, productId }: {
  domain: string;
  variantId: string;
  quantity: number;
  productId?: string;
}) {
  if (!variantId) return null;
  
  // Esta URL permitirá usar JavaScript para agregar al carrito
  const url = new URL(`https://${domain}/products/${productId || variantId}`);
  url.searchParams.set('variant', variantId);
  url.searchParams.set('quantity', quantity.toString());
  
  return url.toString();
}

/**
 * Construir URL de checkout v3 directo con productos
 */
function buildCheckoutV3Url({ domain, variantId, quantity }: {
  domain: string;
  variantId: string;
  quantity: number;
}) {
  const checkoutUrl = new URL(`https://${domain}/checkout/v3/start`);
  
  if (variantId) {
    checkoutUrl.searchParams.append('add_to_cart[0][variant_id]', variantId);
    checkoutUrl.searchParams.append('add_to_cart[0][quantity]', quantity.toString());
  }
  
  return checkoutUrl.toString();
}
