import { NextRequest, NextResponse } from 'next/server';
import { getStoreData } from '../../../lib/backend';

export async function POST(req: NextRequest) {
  try {
    const { variantId, quantity = 1, shop, productId, items } = await req.json();
    const storeId = shop || '5112334';

    console.log('🛒 Checkout:', { variantId, quantity, storeId, productId, itemsCount: items?.length });

    // Preparar productos
    let productsToCreate: { variant_id: number; quantity: number }[] = [];
    if (items && Array.isArray(items)) {
      productsToCreate = items.map((item: any) => ({
        variant_id: parseInt(item.variantId.toString()),
        quantity: parseInt(item.quantity.toString())
      }));
    } else if (variantId) {
      productsToCreate = [{
        variant_id: parseInt(variantId.toString()),
        quantity: parseInt(quantity.toString()),
      }];
    }

    if (productsToCreate.length === 0) {
      return NextResponse.json({ success: false, error: 'No hay productos' }, { status: 400 });
    }

    console.log('📦 Productos:', productsToCreate);

    // Usar página de redirección que envía formulario POST a /cart
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const itemsParam = encodeURIComponent(JSON.stringify(productsToCreate));
    const checkoutUrl = `${baseUrl}/api/checkout-redirect?items=${itemsParam}`;

    console.log('✅ Checkout URL:', checkoutUrl);
    return NextResponse.json({
      success: true,
      checkoutUrl,
      method: 'form_post'
    });

  } catch (error) {
    console.error('❌ Error en checkout:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
