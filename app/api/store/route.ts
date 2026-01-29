import { NextRequest, NextResponse } from 'next/server';
import { getStoreData } from '@/lib/backend';

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

  } catch (error: unknown) {
    console.error('Error en API store:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { exito: false, error: 'Error al obtener tienda', detalle: errorMessage },
      { status: 500 }
    );
  }
}