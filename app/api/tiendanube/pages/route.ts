import { NextRequest, NextResponse } from 'next/server';
import {
  getStoreData,
  fetchTiendanubePages,
  fetchTiendanubeStore,
  pickTiendanubeLocalizedText,
} from '@/lib/backend';

/** Listado de páginas personalizadas (GET /pages). Requiere permiso read_content en el token. */
export async function GET(request: NextRequest) {
  try {
    const shopId = new URL(request.url).searchParams.get('shop') || '5112334';
    const storeLocal = await getStoreData(shopId);
    if (!storeLocal?.accessToken) {
      return NextResponse.json({ exito: false, error: 'Tienda no encontrada' }, { status: 404 });
    }

    const [rawPages, tnStore] = await Promise.all([
      fetchTiendanubePages(storeLocal.storeId, storeLocal.accessToken),
      fetchTiendanubeStore(storeLocal.storeId, storeLocal.accessToken),
    ]);

    const mainLang = tnStore?.main_language || 'es';
    const paginas = (rawPages as Record<string, unknown>[]).map((p) => ({
      id: p.id,
      published: p.published,
      nombre: pickTiendanubeLocalizedText(
        p.name as Record<string, string> | string | undefined,
        mainLang
      ),
      handle: pickTiendanubeLocalizedText(
        p.handle as Record<string, string> | string | undefined,
        mainLang
      ),
      actualizado: p.updated_at,
    }));

    return NextResponse.json({
      exito: true,
      tienda: storeLocal.storeId,
      paginas,
      total: paginas.length,
    });
  } catch (e) {
    console.error('GET /api/tiendanube/pages:', e);
    return NextResponse.json(
      { exito: false, error: e instanceof Error ? e.message : 'Error' },
      { status: 500 }
    );
  }
}
