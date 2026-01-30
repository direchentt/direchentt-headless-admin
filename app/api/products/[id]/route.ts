import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, fetchTN, fetchProductWithVariants } from '../../../../lib/backend';
import { processProduct, getRelatedProducts } from '../../../../lib/product-utils';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params; // Next.js 15/16 fix
    
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop') || '5112334';
    const expand = searchParams.get('expand') === 'true';

    const storeLocal = await getStoreData(shopId);
    if (!storeLocal) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Si se solicita expandido (para QuickShop), usar la función especializada
    if (expand) {
      const expandedProduct = await fetchProductWithVariants(id, storeLocal.storeId, storeLocal.accessToken);
      
      if (!expandedProduct) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        product: expandedProduct
      });
    }

    // Llamada normal para la página de producto
    const [product, allProducts] = await Promise.all([
      fetchTN(`products/${id}`, storeLocal.storeId, storeLocal.accessToken),
      fetchTN('products', storeLocal.storeId, storeLocal.accessToken, 'limit=50&published=true')
    ]);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const processedProduct = processProduct(product);

    const relatedProducts = getRelatedProducts(
      allProducts?.result || allProducts || [],
      product.id,
      product.category_id,
      4
    );

    return NextResponse.json({
      success: true,
      product: processedProduct,
      related: relatedProducts,
      store: {
        id: storeLocal.storeId,
        name: storeLocal.shop_name,
        domain: storeLocal.domain
      }
    });

  } catch (error) {
    console.error('Error in product API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}