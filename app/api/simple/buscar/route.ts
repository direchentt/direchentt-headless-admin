import { NextRequest, NextResponse } from 'next/server';
import { crearTienda } from '@/lib/tienda-intuitiva';

/**
 * API Intuitiva para búsqueda
 * GET /api/simple/buscar?shop=123&q=camiseta&categoria=456&precioMin=100&precioMax=1000&limite=10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop') || '5112334';
    const termino = searchParams.get('q') || '';
    const categoria = searchParams.get('categoria') || undefined;
    const precioMin = searchParams.get('precioMin') ? parseFloat(searchParams.get('precioMin')!) : undefined;
    const precioMax = searchParams.get('precioMax') ? parseFloat(searchParams.get('precioMax')!) : undefined;
    const limite = parseInt(searchParams.get('limite') || '10');

    if (!termino.trim()) {
      return NextResponse.json({
        exito: false,
        error: 'Falta el parámetro "q" para buscar',
        ayuda: 'Usa: /api/simple/buscar?shop=ID&q=TERMINO&categoria=CAT&precioMin=MIN&precioMax=MAX&limite=N'
      }, { status: 400 });
    }

    const tienda = crearTienda(shopId);
    
    const [resultados, info] = await Promise.all([
      tienda.buscar.avanzada({
        termino,
        categoria,
        precioMin,
        precioMax,
        limite
      }),
      tienda.info.obtener()
    ]);

    return NextResponse.json({
      exito: true,
      tienda: info,
      busqueda: {
        termino,
        categoria,
        precioMin,
        precioMax,
        limite
      },
      resultados,
      total: resultados.length,
      hayMas: resultados.length >= limite
    });

  } catch (error) {
    console.error('Error en API simple búsqueda:', error);
    return NextResponse.json({
      exito: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      ayuda: 'Usa: /api/simple/buscar?shop=ID&q=TERMINO&categoria=CAT&precioMin=MIN&precioMax=MAX&limite=N'
    }, { status: 500 });
  }
}