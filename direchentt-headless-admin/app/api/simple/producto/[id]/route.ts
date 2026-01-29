import { NextRequest, NextResponse } from 'next/server';
import { crearTienda } from '@/lib/tienda-intuitiva';

/**
 * API Intuitiva para producto individual
 * GET /api/simple/producto/123?shop=456
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop') || '5112334';
    const { id } = params;

    const tienda = crearTienda(shopId);
    
    const [producto, relacionados, info] = await Promise.all([
      tienda.productos.obtener(id),
      tienda.productos.relacionados(id),
      tienda.info.obtener()
    ]);

    if (!producto) {
      return NextResponse.json({
        exito: false,
        error: `Producto ${id} no encontrado`
      }, { status: 404 });
    }

    return NextResponse.json({
      exito: true,
      tienda: info,
      producto,
      relacionados,
      totalRelacionados: relacionados.length
    });

  } catch (error: any) {
    console.error('Error en API simple producto:', error);
    return NextResponse.json({
      exito: false,
      error: error.message,
      ayuda: 'Usa: /api/simple/producto/ID?shop=SHOP_ID'
    }, { status: 500 });
  }
}