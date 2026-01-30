import { NextRequest, NextResponse } from 'next/server';
import { crearTienda } from '@/lib/tienda-intuitiva';

/**
 * API Intuitiva para categorías
 * GET /api/simple/categorias?shop=123
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop') || '5112334';

    const tienda = crearTienda(shopId);
    
    const [categorias, info] = await Promise.all([
      tienda.categorias.todas(),
      tienda.info.obtener()
    ]);

    return NextResponse.json({
      exito: true,
      tienda: info,
      categorias,
      total: categorias.length,
      totalSubcategorias: categorias.reduce((acc: number, cat: any) => acc + cat.hijos.length, 0)
    });

  } catch (error) {
    console.error('Error en API simple categorías:', error);
    return NextResponse.json({
      exito: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      ayuda: 'Usa: /api/simple/categorias?shop=SHOP_ID'
    }, { status: 500 });
  }
}