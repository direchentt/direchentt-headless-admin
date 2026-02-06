import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { variantId, quantity = 1, shop, productId, items } = body;
    const storeId = shop || '5112334';

    // Manejar array de items si viene del hook
    let productsToCreate: { variant_id: number; quantity: number; product_id?: number }[] = [];

    if (items && Array.isArray(items) && items.length > 0) {
      productsToCreate = items.map((item: any) => ({
        variant_id: parseInt(item.variantId.toString()),
        quantity: parseInt(item.quantity.toString()),
        product_id: item.productId ? parseInt(item.productId.toString()) : undefined
      }));
    } else if (variantId) {
      productsToCreate = [{
        variant_id: parseInt(variantId.toString()),
        quantity: parseInt(quantity.toString()),
        product_id: productId ? parseInt(productId.toString()) : undefined
      }];
    }

    if (productsToCreate.length === 0) {
      return NextResponse.json({ success: false, error: 'No hay productos' }, { status: 400 });
    }

    console.log('🛒 Hybrid Checkout:', {
      storeId,
      itemsCount: productsToCreate.length,
      items: productsToCreate
    });

    // Detectar la URL base desde el request para redirigir al endpoint local
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Generar URL a la página de redirección interna
    const itemsParam = encodeURIComponent(JSON.stringify(productsToCreate));
    const checkoutUrl = `${baseUrl}/api/checkout-redirect?items=${itemsParam}`;

    console.log('✅ Checkout URL:', checkoutUrl);

    return NextResponse.json({
      success: true,
      checkoutUrl,
      method: 'hybrid_checkout_redirect'
    });

  } catch (error) {
    console.error('❌ Error en checkout:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
