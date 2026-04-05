import { NextResponse } from 'next/server';
import { fetchTN, getStoreData } from '@/lib/backend';
import { verifyStorefrontSession } from '@/lib/storefront-session';
import {
  wishlistAdd,
  wishlistHas,
  wishlistListProductIds,
  wishlistRemove,
} from '@/lib/wishlist-db';
import { getVariantDisplayPrices } from '@/lib/product-utils';

function bearerToken(req: Request): string | null {
  const h = req.headers.get('authorization');
  if (!h?.toLowerCase().startsWith('bearer ')) return null;
  return h.slice(7).trim() || null;
}

function parseShopId(shop: string | null): number | null {
  if (!shop) return null;
  const n = parseInt(shop, 10);
  return Number.isFinite(n) ? n : null;
}

function productAnyVariantInStock(p: Record<string, unknown> | null): boolean {
  if (!p) return false;
  const variants = p.variants;
  if (!Array.isArray(variants) || variants.length === 0) return true;
  return variants.some(
    (v: { stock?: number | null }) =>
      v.stock === null || v.stock === undefined || v.stock > 0
  );
}

function safeProductName(name: unknown): string {
  if (!name) return 'Producto';
  if (typeof name === 'string') return name;
  if (typeof name === 'object' && name !== null) {
    const o = name as Record<string, string>;
    return o.es || o.en || Object.values(o)[0] || 'Producto';
  }
  return 'Producto';
}

export async function GET(req: Request) {
  const token = bearerToken(req);
  const session = token ? verifyStorefrontSession(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const url = new URL(req.url);
  const storeId = parseShopId(url.searchParams.get('shop'));
  const idsOnly = url.searchParams.get('idsOnly') === '1';

  if (storeId === null) {
    return NextResponse.json({ error: 'shop inválido' }, { status: 400 });
  }

  const rows = await wishlistListProductIds(storeId, session.sub);
  const ids = rows.map((r) => r.productId);

  if (idsOnly) {
    return NextResponse.json({ ids });
  }

  const store = await getStoreData(String(storeId));
  if (!store?.accessToken) {
    return NextResponse.json(
      { error: 'Tienda no disponible' },
      { status: 503 }
    );
  }

  const tokenTn = String(store.accessToken);
  const addedMap = new Map(rows.map((r) => [r.productId, r.addedAt]));

  const items = await Promise.all(
    ids.map(async (productId) => {
      const addedAt = addedMap.get(productId) ?? new Date();
      const raw = await fetchTN(
        `products/${productId}`,
        String(storeId),
        tokenTn,
        '',
        { bypassCache: true }
      );
      const product =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? (raw as Record<string, unknown>)
          : null;

      const firstVariant = (product?.variants as unknown[] | undefined)?.[0] as
        | Record<string, unknown>
        | undefined;
      const { current } = getVariantDisplayPrices(firstVariant || {});
      const inStock = productAnyVariantInStock(product);

      return {
        productId,
        addedAt: addedAt.toISOString(),
        product,
        name: safeProductName(product?.name),
        inStock,
        price: current,
        unavailable: !product,
      };
    })
  );

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const token = bearerToken(req);
  const session = token ? verifyStorefrontSession(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: { shop?: string; productId?: number; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const storeId = parseShopId(typeof body.shop === 'string' ? body.shop : null);
  const productId =
    typeof body.productId === 'number' && Number.isFinite(body.productId)
      ? Math.floor(body.productId)
      : null;
  const action =
    typeof body.action === 'string' ? body.action.toLowerCase() : 'toggle';

  if (storeId === null || productId === null || productId <= 0) {
    return NextResponse.json(
      { error: 'shop y productId requeridos' },
      { status: 400 }
    );
  }

  let inWishlist: boolean;

  if (action === 'add') {
    await wishlistAdd(storeId, session.sub, productId);
    inWishlist = true;
  } else if (action === 'remove') {
    await wishlistRemove(storeId, session.sub, productId);
    inWishlist = false;
  } else {
    const had = await wishlistHas(storeId, session.sub, productId);
    if (had) {
      await wishlistRemove(storeId, session.sub, productId);
      inWishlist = false;
    } else {
      await wishlistAdd(storeId, session.sub, productId);
      inWishlist = true;
    }
  }

  return NextResponse.json({ ok: true, inWishlist });
}
