import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/backend';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ success: false, error: 'storeId requerido' });
    }

    const client = await getMongoClient();
    
    // Mostrar información antes de eliminar
    const storeToDelete = await client.db('AppRegaloDB').collection('stores')
      .findOne({ storeId });
    
    if (!storeToDelete) {
      return NextResponse.json({ success: false, error: 'Store no encontrado' });
    }

    // Eliminar el store
    const result = await client.db('AppRegaloDB').collection('stores')
      .deleteOne({ storeId });

    return NextResponse.json({
      success: true,
      message: `Store ${storeId} eliminado`,
      deletedStore: {
        storeId: storeToDelete.storeId,
        shopName: storeToDelete.shop_name
      },
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error eliminando store:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}