import { NextRequest, NextResponse } from 'next/server';
import {
  getStoreData,
  fetchTiendanubeLocations,
  fetchTiendanubeStore,
  pickTiendanubeLocalizedText,
} from '@/lib/backend';

/**
 * Depósitos / ubicaciones de envío (GET /locations).
 * Requiere scope read_locations. Si el token no lo incluye, la API devuelve error y respondemos lista vacía con aviso.
 */
export async function GET(request: NextRequest) {
  try {
    const shopId = new URL(request.url).searchParams.get('shop') || '5112334';
    const storeLocal = await getStoreData(shopId);
    if (!storeLocal?.accessToken) {
      return NextResponse.json({ exito: false, error: 'Tienda no encontrada' }, { status: 404 });
    }

    const [raw, tnStore] = await Promise.all([
      fetchTiendanubeLocations(storeLocal.storeId, storeLocal.accessToken),
      fetchTiendanubeStore(storeLocal.storeId, storeLocal.accessToken),
    ]);

    const mainLang = tnStore?.main_language || 'es';
    const ubicaciones = (raw as Record<string, unknown>[]).map((loc) => {
      const addr = loc.address as Record<string, unknown> | undefined;
      const province = addr?.province as { name?: string; code?: string } | undefined;
      const country = addr?.country as { name?: string; code?: string } | undefined;
      return {
        id: loc.id,
        nombre: pickTiendanubeLocalizedText(
          loc.name as Record<string, string> | string | undefined,
          mainLang
        ),
        predeterminada: loc.is_default,
        prioridad: loc.priority,
        direccion: addr
          ? {
              calle: addr.street,
              numero: addr.number,
              piso: addr.floor,
              localidad: addr.locality,
              ciudad: addr.city,
              cp: addr.zipcode,
              provincia: province?.name,
              codigo_provincia: province?.code,
              pais: country?.name,
              codigo_pais: country?.code,
              referencia: addr.reference,
              entre_calles: addr.between_streets,
            }
          : null,
      };
    });

    return NextResponse.json({
      exito: true,
      tienda: storeLocal.storeId,
      ubicaciones,
      total: ubicaciones.length,
      nota:
        ubicaciones.length === 0
          ? 'Sin datos o el access token no tiene scope read_locations.'
          : undefined,
    });
  } catch (e) {
    console.error('GET /api/tiendanube/locations:', e);
    return NextResponse.json(
      { exito: false, error: e instanceof Error ? e.message : 'Error' },
      { status: 500 }
    );
  }
}
