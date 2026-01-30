import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, fetchTN, processCategories } from '../../../lib/backend';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop') || '5112334';

    // Obtener datos de la tienda
    const storeLocal = await getStoreData(shopId);
    if (!storeLocal) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Obtener categorías desde TiendaNube
    const categoriesRaw = await fetchTN('categories', storeLocal.storeId, storeLocal.accessToken);
    
    // Procesar categorías
    const categories = processCategories(categoriesRaw);

    // Organizar categorías por jerarquía
    const parentCategories = categories.filter(cat => !cat.parent);
    const childCategories = categories.filter(cat => cat.parent);

    const organizedCategories = parentCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(child => child.parent === parent.id)
    }));

    return NextResponse.json({
      success: true,
      categories: organizedCategories,
      all: categories,
      total: categories.length
    });

  } catch (error) {
    console.error('Error in categories API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}