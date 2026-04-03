import { NextRequest, NextResponse } from 'next/server';
import {
  getStoreData,
  fetchTiendanubeStore,
  normalizeTiendanubeLogo,
  pickTiendanubeLocalizedText,
} from '@/lib/backend';

// En esta ruta NO van params porque la carpeta no tiene [id]
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop') || '5112334';
    const incluirApi = searchParams.get('live') === '1' || searchParams.get('fromApi') === '1';

    const storeLocal = await getStoreData(shopId);
    if (!storeLocal) {
      return NextResponse.json({ exito: false, error: 'Tienda no encontrada' }, { status: 404 });
    }

    let tiendanube: Record<string, unknown> | null = null;
    if (incluirApi && storeLocal.accessToken) {
      const raw = await fetchTiendanubeStore(shopId, storeLocal.accessToken);
      if (raw) {
        const mainLang = raw.main_language || 'es';
        tiendanube = {
          id: raw.id,
          nombre: pickTiendanubeLocalizedText(raw.name, mainLang),
          descripcion: pickTiendanubeLocalizedText(raw.description, mainLang),
          logo: normalizeTiendanubeLogo(raw.logo),
          moneda_principal: raw.main_currency,
          idioma_principal: raw.main_language,
          pais: raw.country,
          dominios: raw.domains,
          dominio_original: raw.original_domain,
          contacto_email: raw.contact_email,
          telefono: raw.phone,
          instagram: raw.instagram,
          facebook: raw.facebook,
          cuentas_cliente: raw.customer_accounts,
        };
      }
    }

    return NextResponse.json({
      exito: true,
      tienda: {
        id: storeLocal.storeId,
        nombre: storeLocal.shop_name,
        logo: storeLocal.logo,
        dominio: storeLocal.domain
      },
      ...(tiendanube ? { tiendanube } : {}),
    });

  } catch (error: unknown) {
    console.error('Error en API store:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { exito: false, error: 'Error al obtener tienda', detalle: errorMessage },
      { status: 500 }
    );
  }
}