import { NextResponse } from 'next/server';
import { upsertPresence } from '@/lib/storefront-presence-db';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseShopId(shop: string | null): number | null {
  if (!shop) return null;
  const n = parseInt(shop, 10);
  return Number.isFinite(n) ? n : null;
}

const ALLOWED_TYPES = new Set([
  'home',
  'product',
  'category',
  'collections',
  'search',
  'cart',
  'other',
]);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const shop = typeof body.shop === 'string' ? body.shop : null;
  const visitorId = typeof body.visitorId === 'string' ? body.visitorId : null;
  const path = typeof body.path === 'string' ? body.path : '/';
  const pageType = typeof body.pageType === 'string' ? body.pageType : 'other';

  const storeId = parseShopId(shop);
  if (storeId === null || !visitorId || !UUID_RE.test(visitorId)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  const pt = ALLOWED_TYPES.has(pageType) ? pageType : 'other';
  const productId =
    typeof body.productId === 'number'
      ? body.productId
      : typeof body.productId === 'string'
        ? parseInt(body.productId, 10)
        : undefined;
  const categoryId =
    typeof body.categoryId === 'number'
      ? body.categoryId
      : typeof body.categoryId === 'string'
        ? parseInt(body.categoryId, 10)
        : undefined;

  const deviceHint =
    typeof body.deviceHint === 'string' ? body.deviceHint.slice(0, 200) : undefined;

  try {
    await upsertPresence({
      storeId,
      visitorId,
      path: path.slice(0, 512),
      pageType: pt,
      productId:
        productId != null && Number.isFinite(productId) && productId > 0
          ? Math.floor(productId)
          : undefined,
      categoryId:
        categoryId != null && Number.isFinite(categoryId) && categoryId > 0
          ? Math.floor(categoryId)
          : undefined,
      deviceHint,
    });
  } catch (e) {
    console.error('[presence]', e);
    return NextResponse.json({ error: 'No disponible' }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
