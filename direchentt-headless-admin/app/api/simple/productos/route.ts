import { NextRequest, NextResponse } from 'next/server';
import { crearTienda } from '@/lib/tienda-intuitiva';

/**
 * API Intuitiva para productos
 * GET /api/simple/productos?shop=123&categoria=456&buscar=camiseta&limite=10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop') || '5112334';
    const categoria = searchParams.get('categoria') || undefined;
    const buscar = searchParams.get('buscar') || undefined;
    const limite = parseInt(searchParams.get('limite') || '20');
    const orden = searchParams.get('orden') as 'precio' | 'nombre' | 'fecha' || undefined;

    const tienda = crearTienda(shopId);
    
    let productos;
    if (buscar) {
      productos = await tienda.productos.buscar(buscar, limite);
    } else {
      productos = await tienda.productos.todos({ categoria, limite, orden });
    }

    const info = await tienda.info.obtener();

    return NextResponse.json({
      exito: true,
      tienda: info,
      productos,
      total: productos.length,
      filtros: {
        categoria,
        buscar,
        limite,
        orden
      }
    });

  } catch (error: any) {
    console.error('Error en API simple productos:', error);
    return NextResponse.json({
      exito: false,
      error: error.message,
      ayuda: 'Usa: /api/simple/productos?shop=ID&categoria=CAT&buscar=TERMINO&limite=N'
    }, { status: 500 });
  }
}