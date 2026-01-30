import { NextResponse } from 'next/server';
import { getStoreData } from '../../../lib/backend';

export async function POST(request: Request) {
  try {
    const { variantId, quantity = 1, shop, productId, selectedVariant } = await request.json();
    
    console.log('🛒 Iniciando checkout:', { variantId, quantity, shop, productId });
    
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
    console.log('🏪 Tienda encontrada:', { 
      storeId: storeData.storeId, 
      domain, 
      hasAccessToken: !!storeData.accessToken,
      shopName: storeData.shop_name 
    });
    
    // Intentar agregar el producto al carrito usando la API de TiendaNube
    try {
      const cartResponse = await addToCart({
        storeId: storeData.storeId,
        domain,
        variantId: variantId || selectedVariant?.id,
        quantity,
        accessToken: storeData.accessToken
      });

      if (cartResponse.success) {
        // Redireccionar al checkout con el producto ya en el carrito
        const checkoutUrl = cartResponse.checkoutUrl || `https://${domain}/checkout`;
        
        return NextResponse.json({ 
          success: true, 
          checkoutUrl,
          cartId: cartResponse.cartId,
          message: 'Producto agregado al carrito',
          method: cartResponse.method,
          domain
        });
      } else {
        // Fallback: usar diferentes estrategias
        const strategies = [
          // Estrategia 1: Página del producto con auto-add
          `https://${domain}/products/${productId}?variant=${variantId}&quantity=${quantity}&auto_add=1`,
          // Estrategia 2: Página del producto simple
          `https://${domain}/products/${productId}?variant=${variantId}`,
          // Estrategia 3: Solo el producto
          `https://${domain}/products/${productId}`
        ];
        
        return NextResponse.json({ 
          success: true, 
          checkoutUrl: strategies[0],
          fallbackUrls: strategies.slice(1),
          fallback: true,
          message: 'Abriendo producto para agregar al carrito manualmente',
          domain
        });
      }
    } catch (cartError) {
      console.warn('⚠️ Error agregando al carrito, usando fallback:', cartError);
      
      // Fallback: redireccionar al producto
      const fallbackUrl = `https://${domain}/products/${productId}${variantId ? `?variant=${variantId}` : ''}`;
      
      return NextResponse.json({ 
        success: true, 
        checkoutUrl: fallbackUrl,
        fallback: true,
        message: 'Redirigiendo al producto en TiendaNube',
        domain
      });
    }
    
  } catch (error) {
    console.error('❌ Error al preparar checkout:', error);
    return NextResponse.json(
      { success: false, error: 'Error al preparar checkout' },
      { status: 500 }
    );
  }
}

/**
 * Agregar producto al carrito de TiendaNube
 */
async function addToCart({ storeId, domain, variantId, quantity, accessToken }: {
  storeId: string;
  domain: string;
  variantId: string;
  quantity: number;
  accessToken?: string;
}) {
  console.log('🛒 Intentando agregar al carrito:', { storeId, variantId, quantity, hasToken: !!accessToken });
  
  // Método 1: Usar la API REST de TiendaNube (requiere access token)
  if (accessToken && variantId) {
    try {
      // Primero intentar con la API admin de TiendaNube
      const apiUrl = `https://api.tiendanube.com/v1/${storeId}/carts`;
      
      console.log('📡 Llamando API TiendaNube:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Headless-Integration/1.0'
        },
        body: JSON.stringify({
          line_items: [{
            variant_id: parseInt(variantId),
            quantity: quantity
          }]
        })
      });

      console.log('📡 Respuesta API:', response.status, response.statusText);
      
      if (response.ok) {
        const cartData = await response.json();
        console.log('✅ Carrito creado:', cartData);
        return { 
          success: true, 
          cartId: cartData.id,
          checkoutUrl: cartData.checkout_url || `https://${domain}/checkout`,
          method: 'api'
        };
      } else {
        const errorData = await response.text();
        console.warn('⚠️ Error API TiendaNube:', response.status, errorData);
      }
    } catch (error) {
      console.warn('❌ Error con API REST de carrito:', error);
    }
  }

  // Fallback: usar diferentes estrategias de checkout
  console.log('🔄 Usando estrategias alternativas de checkout');
  
  // Estrategia 1: Checkout tradicional sin v3
  try {
    const traditionalCheckout = `https://${domain}/cart/add?id=${variantId}&quantity=${quantity}&return_to=/checkout`;
    return { 
      success: true, 
      method: 'traditional_checkout',
      checkoutUrl: traditionalCheckout,
      reason: 'Checkout tradicional con redirección' 
    };
  } catch (error) {
    console.warn('Error con checkout tradicional:', error);
  }
  
  // Estrategia 2: Solo página del producto
  return { 
    success: true, 
    method: 'product_page',
    reason: 'Redirección a página del producto'
  };
}
