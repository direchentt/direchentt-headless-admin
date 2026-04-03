import { NextRequest, NextResponse } from 'next/server';
import {
  getStoreData,
  fetchTiendanubePageById,
  fetchTiendanubeStore,
  pickTiendanubeLocalizedText,
} from '@/lib/backend';

/** Una página por id (GET /pages/:pageID). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = new URL(request.url).searchParams.get('shop') || '5112334';
    const storeLocal = await getStoreData(shopId);
    if (!storeLocal?.accessToken) {
      return NextResponse.json({ exito: false, error: 'Tienda no encontrada' }, { status: 404 });
    }

    const [pageRaw, tnStore] = await Promise.all([
      fetchTiendanubePageById(storeLocal.storeId, storeLocal.accessToken, id),
      fetchTiendanubeStore(storeLocal.storeId, storeLocal.accessToken),
    ]);

    if (!pageRaw) {
      return NextResponse.json({ exito: false, error: 'Página no encontrada' }, { status: 404 });
    }

    const mainLang = tnStore?.main_language || 'es';
    const pagina = {
      id: pageRaw.id,
      published: pageRaw.published,
      nombre: pickTiendanubeLocalizedText(pageRaw.name, mainLang),
      handle: pickTiendanubeLocalizedText(pageRaw.handle, mainLang),
      contenido_html: pickTiendanubeLocalizedText(pageRaw.content, mainLang),
      seo_titulo: pickTiendanubeLocalizedText(pageRaw.seo_title, mainLang),
      seo_descripcion: pickTiendanubeLocalizedText(pageRaw.seo_description, mainLang),
      actualizado: pageRaw.updated_at,
    };

    return NextResponse.json({ exito: true, tienda: storeLocal.storeId, pagina });
  } catch (e) {
    console.error('GET /api/tiendanube/pages/[id]:', e);
    return NextResponse.json(
      { exito: false, error: e instanceof Error ? e.message : 'Error' },
      { status: 500 }
    );
  }
}
