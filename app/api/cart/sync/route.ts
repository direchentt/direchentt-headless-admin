import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { items, storeId } = await request.json();
    
    // Crear URL de checkout con los items
    const checkoutUrl = new URL(`https://${storeId}.mitiendanube.com/checkout/v3/start`);
    
    // Agregar cada item como parámetro
    items.forEach((item: any, index: number) => {
      checkoutUrl.searchParams.append(`add_to_cart[${index}][variant_id]`, item.variantId);
      checkoutUrl.searchParams.append(`add_to_cart[${index}][quantity]`, item.quantity.toString());
    });
    
    return NextResponse.json({ 
      success: true, 
      checkoutUrl: checkoutUrl.toString() 
    });
    
  } catch (error) {
    console.error('Error syncing cart:', error);
    return NextResponse.json(
      { success: false, error: 'Error al sincronizar carrito' },
      { status: 500 }
    );
  }
}
