import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, fetchTN, processProducts } from '../../../lib/backend';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop') || '5112334';
    const category = searchParams.get('category');
    const limit = searchParams.get('limit') || '20';
    const sort = searchParams.get('sort');

    // Obtener datos de la tienda
    const storeLocal = await getStoreData(shopId);
    if (!storeLocal) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Construir query para TiendaNube
    let apiQuery = `limit=${limit}`;
    if (category) apiQuery += `&category=${category}`;
    if (sort) apiQuery += `&sort_by=${sort}`;

    // Obtener productos desde TiendaNube
    const productsRaw = await fetchTN('products', storeLocal.storeId, storeLocal.accessToken, apiQuery);
    
    // Procesar productos
    const products = processProducts(productsRaw);

    return NextResponse.json({
      success: true,
      products,
      total: products.length,
      store: {
        id: storeLocal.storeId,
        name: storeLocal.shop_name,
        domain: storeLocal.domain
      }
    });

  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, productData } = body;

    // Obtener datos de la tienda
    const storeLocal = await getStoreData(shopId);
    if (!storeLocal) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Crear producto en TiendaNube (requiere token con permisos de escritura)
    const newProduct = await fetch(`https://api.tiendanube.com/v1/${storeLocal.storeId}/products`, {
      method: 'POST',
      headers: {
        'Authentication': `bearer ${storeLocal.accessToken}`,
        'User-Agent': 'Direchentt',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (!newProduct.ok) {
      throw new Error('Failed to create product');
    }

    const productResult = await newProduct.json();

    return NextResponse.json({
      success: true,
      product: productResult
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}