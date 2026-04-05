import { NextResponse } from 'next/server';
import {
  getShopperProfile,
  topCategoryIdsFromProfile,
} from '@/lib/shopper-intelligence-db';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseShopId(shop: string | null): number | null {
  if (!shop) return null;
  const n = parseInt(shop, 10);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');
  const visitorId = url.searchParams.get('visitorId');

  const storeId = parseShopId(shop);
  if (storeId === null || !visitorId || !UUID_RE.test(visitorId)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  try {
    const profile = await getShopperProfile(storeId, visitorId);
    const topCategoryIds = topCategoryIdsFromProfile(profile, 12);
    return NextResponse.json({
      recentProductIds: profile?.recentProductIds ?? [],
      cartAffinityIds: profile?.cartAffinityIds ?? [],
      topCategoryIds,
      recentQueries: profile?.recentQueries ?? [],
      totals: profile?.totals ?? { views: 0, cartAdds: 0, searches: 0 },
    });
  } catch (e) {
    console.error('[storefront/profile]', e);
    return NextResponse.json({ error: 'No disponible' }, { status: 503 });
  }
}
