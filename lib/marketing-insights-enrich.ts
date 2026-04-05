import type { MarketingInsightsSnapshot } from '@/lib/shopper-intelligence-db';
import type { PresenceRow } from '@/lib/storefront-presence-db';
import {
  batchTiendanubeCategoryTitles,
  batchTiendanubeProductTitles,
} from '@/lib/tiendanube-marketing-lookup';

function mergeProductTitles<T extends { productId: number; title?: string }>(
  rows: T[],
  titles: Map<number, string>
): T[] {
  return rows.map((r) => ({
    ...r,
    title: r.title || titles.get(r.productId),
  }));
}

function mergeCategoryTitles<T extends { categoryId: number; title?: string }>(
  rows: T[],
  titles: Map<number, string>
): T[] {
  return rows.map((r) => ({
    ...r,
    title: r.title || titles.get(r.categoryId),
  }));
}

export async function enrichMarketingInsightsSnapshot(
  shopParam: string,
  snapshot: MarketingInsightsSnapshot | null
): Promise<MarketingInsightsSnapshot | null> {
  if (!snapshot) return null;
  const pids = new Set<number>();
  const cids = new Set<number>();
  for (const r of snapshot.topCartProductIds) pids.add(r.productId);
  for (const r of snapshot.topProductViews) pids.add(r.productId);
  for (const r of snapshot.topCategoryViews) cids.add(r.categoryId);

  const [ptitles, ctitles] = await Promise.all([
    batchTiendanubeProductTitles(shopParam, [...pids]),
    batchTiendanubeCategoryTitles(shopParam, [...cids]),
  ]);

  return {
    ...snapshot,
    topCartProductIds: mergeProductTitles(snapshot.topCartProductIds, ptitles),
    topProductViews: mergeProductTitles(snapshot.topProductViews, ptitles),
    topCategoryViews: mergeCategoryTitles(snapshot.topCategoryViews, ctitles),
  };
}

export async function enrichPresenceRows(
  shopParam: string,
  rows: PresenceRow[]
): Promise<PresenceRow[]> {
  if (rows.length === 0) return rows;
  const pids = rows.map((r) => r.productId).filter((x): x is number => x != null && x > 0);
  const cids = rows.map((r) => r.categoryId).filter((x): x is number => x != null && x > 0);
  const [ptitles, ctitles] = await Promise.all([
    batchTiendanubeProductTitles(shopParam, pids),
    batchTiendanubeCategoryTitles(shopParam, cids),
  ]);
  return rows.map((r) => ({
    ...r,
    productTitle: r.productId != null ? ptitles.get(r.productId) : undefined,
    categoryTitle: r.categoryId != null ? ctitles.get(r.categoryId) : undefined,
  }));
}
