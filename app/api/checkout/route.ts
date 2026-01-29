import { NextResponse } from 'next/server';
import { getStoreData } from '../../../lib/backend';

export async function POST(request: Request) {
  try {
    const { variantId, quantity, shop } = await request.json();
    
    const storeData = await getStoreData(shop);
    if (!storeData) {
      return NextResponse.json(
        { success: false, error: 'Tienda no encontrada' },
        { status: 404 }
      );
    }

    // Construir URL de checkout con el producto
    const domain = storeData.domain || `${storeData.storeId}.mitiendanube.com`;
    
    // URL del producto con variante para que el usuario lo agregue al carrito en TiendaNube
    const checkoutUrl = `https://${domain}/products/${variantId}`;
    
    return NextResponse.json({ 
      success: true, 
      checkoutUrl,
      domain
    });
    
  } catch (error) {
    console.error('Error al preparar checkout:', error);
    return NextResponse.json(
      { success: false, error: 'Error al preparar checkout' },
      { status: 500 }
    );
  }
}
