import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, fetchTN } from '../../../../../lib/backend';
import { processProduct, getRelatedProducts } from '../../../../../lib/product-utils';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params; // Next.js 15/16 fix

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop') || '5112334';

    const storeLocal = await getStoreData(shopId);
    if (!storeLocal) {
      return NextResponse.json({ exito: false, error: 'Tienda no encontrada' }, { status: 404 });
    }

    const [product, allProducts] = await Promise.all([
      fetchTN(`products/${id}`, storeLocal.storeId, storeLocal.accessToken),
      fetchTN('products', storeLocal.storeId, storeLocal.accessToken, 'limit=50&published=true')
    ]);

    if (!product) {
      return NextResponse.json({ exito: false, error: 'Producto no encontrado' }, { status: 404 });
    }

    const processedProduct = processProduct(product);

    const relatedProducts = getRelatedProducts(
      allProducts?.result || allProducts || [],
      product.id,
      product.category_id,
      4
    );

    return NextResponse.json({
      exito: true,
      tienda: {
        id: storeLocal.storeId,
        nombre: storeLocal.shop_name,
        logo: storeLocal.logo,
        dominio: storeLocal.domain,
        actualizado: storeLocal.updatedAt
      },
      producto: processedProduct,
      relacionados: relatedProducts,
      totalRelacionados: relatedProducts.length
    });

  } catch (error: any) {
    console.error('Error en API simple producto:', error);
    return NextResponse.json(
      { exito: false, error: 'Error al obtener producto', detalle: error.message },
      { status: 500 }
    );
  }
}