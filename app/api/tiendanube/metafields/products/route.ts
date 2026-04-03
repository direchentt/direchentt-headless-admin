import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, fetchTiendanubeProductMetafields } from '@/lib/backend';

/** Metafields de un producto: GET /metafields/products?owner_id= */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop') || '5112334';
    const productId = searchParams.get('productId');
    if (!productId) {
      return NextResponse.json(
        { exito: false, error: 'Falta query productId' },
        { status: 400 }
      );
    }

    const storeLocal = await getStoreData(shopId);
    if (!storeLocal?.accessToken) {
      return NextResponse.json({ exito: false, error: 'Tienda no encontrada' }, { status: 404 });
    }

    const metafields = await fetchTiendanubeProductMetafields(
      storeLocal.storeId,
      storeLocal.accessToken,
      productId
    );

    return NextResponse.json({
      exito: true,
      tienda: storeLocal.storeId,
      producto_id: productId,
      metafields,
      total: metafields.length,
    });
  } catch (e) {
    console.error('GET /api/tiendanube/metafields/products:', e);
    return NextResponse.json(
      { exito: false, error: e instanceof Error ? e.message : 'Error' },
      { status: 500 }
    );
  }
}
