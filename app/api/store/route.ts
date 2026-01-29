import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, fetchTN } from '@/lib/backend';
import { processProduct, getRelatedProducts } from '@/lib/product-utils';

// En esta ruta NO van params porque la carpeta no tiene [id]
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop') || '5112334';

    // Obtener datos de la tienda
    const storeLocal = await getStoreData(shopId);
    if (!storeLocal) {
      return NextResponse.json({ exito: false, error: 'Tienda no encontrada' }, { status: 404 });
    }

    // Aquí tu lógica para obtener datos generales de la tienda si los necesitas
    // ...

    return NextResponse.json({
      exito: true,
      tienda: {
        id: storeLocal.storeId,
        nombre: storeLocal.shop_name,
        logo: storeLocal.logo,
        dominio: storeLocal.domain
      }
    });

  } catch (error: any) {
    console.error('Error en API store:', error);
    return NextResponse.json(
      { exito: false, error: 'Error al obtener tienda', detalle: error.message },
      { status: 500 }
    );
  }
}