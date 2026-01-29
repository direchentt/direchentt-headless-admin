import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, fetchTN } from '../../../lib/backend';
import { processProduct } from '../../../lib/product-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop') || '5112334';
    const query = searchParams.get('q') || '';
    const limit = searchParams.get('limit') || '10';

    if (!query.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required'
      }, { status: 400 });
    }

    // Obtener datos de la tienda
    const storeLocal = await getStoreData(shopId);
    if (!storeLocal) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Buscar productos usando la API de TiendaNube
    const searchQuery = `q=${encodeURIComponent(query)}&limit=${limit}&published=true`;
    const searchResults = await fetchTN('products', storeLocal.storeId, storeLocal.accessToken, searchQuery);

    // Procesar resultados
    const processedResults = (searchResults || [])
      .filter((product: any) => product?.published && product?.variants?.length > 0)
      .map((product: any) => processProduct(product))
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      query,
      results: processedResults,
      total: processedResults.length,
      hasMore: processedResults.length >= parseInt(limit)
    });

  } catch (error: any) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Failed to search products', details: error.message },
      { status: 500 }
    );
  }
}