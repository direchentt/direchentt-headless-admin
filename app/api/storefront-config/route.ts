import { NextRequest, NextResponse } from 'next/server';
import {
  mergeStorefrontPatch,
  parseStorefrontConfigPatch,
  resolveStorefrontConfig,
} from '@/lib/storefront-config';
import {
  getStorefrontConfigStored,
  upsertStorefrontConfigStored,
} from '@/lib/storefront-db';

/**
 * GET  /api/storefront-config?shop=ID  → configuración resuelta (público, cacheable)
 * PUT  /api/storefront-config?shop=ID  → merge parcial (requiere header Authorization: Bearer <CMS_ADMIN_SECRET>)
 *
 * Variable de entorno: CMS_ADMIN_SECRET
 */

function parseShopId(request: NextRequest): number | null {
  const id = request.nextUrl.searchParams.get('shop');
  if (!id) return null;
  const n = parseInt(id, 10);
  return Number.isFinite(n) ? n : null;
}

function authorizeAdmin(request: NextRequest): boolean {
  const secret = process.env.CMS_ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7).trim();
  return token === secret;
}

export async function GET(request: NextRequest) {
  const storeId = parseShopId(request);
  if (storeId == null) {
    return NextResponse.json({ error: 'Query shop (id numérico) requerido' }, { status: 400 });
  }

  try {
    const stored = await getStorefrontConfigStored(storeId);
    const resolved = resolveStorefrontConfig(stored);
    return NextResponse.json(
      {
        exito: true,
        storeId,
        config: resolved,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json(
      { exito: false, error: 'No se pudo leer la configuración', detalle: msg },
      { status: 503 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!authorizeAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const storeId = parseShopId(request);
  if (storeId == null) {
    return NextResponse.json({ error: 'Query shop (id numérico) requerido' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = parseStorefrontConfigPatch(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const existing = await getStorefrontConfigStored(storeId);
    const merged = mergeStorefrontPatch(existing, parsed.patch);
    await upsertStorefrontConfigStored(storeId, merged);
    const resolved = resolveStorefrontConfig(merged);
    return NextResponse.json({ exito: true, storeId, config: resolved });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json(
      { exito: false, error: 'No se pudo guardar', detalle: msg },
      { status: 503 }
    );
  }
}
