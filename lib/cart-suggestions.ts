import { getVariantDisplayPrices } from '@/lib/product-utils';

/**
 * Sugerencias para el carrito: prioriza misma categoría que lo ya agregado,
 * complementa con otras categorías y evita duplicar productos en el carrito.
 */
export function pickStrategicCartUpsells(
  products: any[],
  cartProductIds: Set<string>,
  limit: number = 3
): any[] {
  if (!Array.isArray(products) || products.length === 0) return [];

  const cartCategories = new Set<number>();
  for (const p of products) {
    if (!p?.id) continue;
    if (!cartProductIds.has(String(p.id))) continue;
    const cid = Number(p.category_id);
    if (Number.isFinite(cid)) cartCategories.add(cid);
  }

  type Scored = { product: any; score: number };
  const scored: Scored[] = [];

  for (const p of products) {
    if (!p?.published) continue;
    const id = String(p.id);
    if (cartProductIds.has(id)) continue;
    if (!p.variants?.length) continue;
    const inStock = p.variants.some((v: any) => (v.stock ?? 0) > 0);
    if (!inStock) continue;

    let score = 0;
    const cid = Number(p.category_id);
    if (cartCategories.size > 0 && Number.isFinite(cid) && cartCategories.has(cid)) {
      score += 100;
    }
    const v0 = p.variants[0];
    const { hasPromo } = getVariantDisplayPrices(v0 || {});
    if (hasPromo) score += 15;
    score += Math.min(20, (p.images?.length || 0) * 2);
    scored.push({ product: p, score });
  }

  scored.sort((a, b) => b.score - a.score || Number(a.product.id) - Number(b.product.id));
  return scored.slice(0, limit).map((s) => s.product);
}
