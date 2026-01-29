import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, fetchTN } from '../../../lib/backend';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop') || '5112334';

    // Obtener datos de la tienda desde MongoDB
    const storeLocal = await getStoreData(shopId);
    if (!storeLocal) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Obtener información adicional de la tienda desde TiendaNube
    const [storeInfo, banners] = await Promise.all([
      fetchTN('store', storeLocal.storeId, storeLocal.accessToken),
      fetchTN('banners', storeLocal.storeId, storeLocal.accessToken)
    ]);

    return NextResponse.json({
      success: true,
      store: {
        // Datos locales (MongoDB)
        id: storeLocal.storeId,
        accessToken: storeLocal.accessToken ? 'present' : 'missing',
        logo: storeLocal.logo,
        domain: storeLocal.domain,
        localName: storeLocal.shop_name,
        updatedAt: storeLocal.updated_at,
        
        // Datos de TiendaNube
        ...storeInfo,
        banners: banners || []
      }
    });

  } catch (error: any) {
    console.error('Error in store API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store info', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop') || '5112334';
    const body = await request.json();

    // Obtener datos de la tienda
    const storeLocal = await getStoreData(shopId);
    if (!storeLocal) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Actualizar tienda en TiendaNube
    const updateResult = await fetch(`https://api.tiendanube.com/v1/${storeLocal.storeId}/store`, {
      method: 'PUT',
      headers: {
        'Authentication': `bearer ${storeLocal.accessToken}`,
        'User-Agent': 'Direchentt',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!updateResult.ok) {
      throw new Error('Failed to update store');
    }

    const updatedStore = await updateResult.json();

    return NextResponse.json({
      success: true,
      store: updatedStore
    });

  } catch (error: any) {
    console.error('Error updating store:', error);
    return NextResponse.json(
      { error: 'Failed to update store', details: error.message },
      { status: 500 }
    );
  }
}