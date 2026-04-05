import { getStoreData } from '@/lib/backend';
import { tiendanubeAdminGet } from '@/lib/tiendanube-admin-fetch';

function pickLocalizedName(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim().slice(0, 240);
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const s = o.es ?? o.en ?? Object.values(o).find((v) => typeof v === 'string');
    if (typeof s === 'string') return s.trim().slice(0, 240);
  }
  return '';
}

function productTitleFromBody(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  return pickLocalizedName((body as Record<string, unknown>).name);
}

function categoryTitleFromBody(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const b = body as Record<string, unknown>;
  return pickLocalizedName(b.name ?? b.title);
}

/**
 * Resuelve títulos vía API oficial Tiendanube (GET /products/{id}).
 * @see https://tiendanube.github.io/api-documentation/resources/product
 */
export async function batchTiendanubeProductTitles(
  shopParam: string,
  productIds: number[]
): Promise<Map<number, string>> {
  const store = await getStoreData(shopParam.trim());
  if (!store?.accessToken) return new Map();
  const sid = String(store.storeId);
  const uniq = [...new Set(productIds.filter((x) => Number.isFinite(x) && x > 0))].slice(0, 48);
  const map = new Map<number, string>();
  const concurrency = 4;
  for (let i = 0; i < uniq.length; i += concurrency) {
    const chunk = uniq.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (id) => {
        const r = await tiendanubeAdminGet(sid, store.accessToken, `products/${id}`, {});
        if (r.ok) {
          const t = productTitleFromBody(r.body);
          if (t) map.set(id, t);
        }
      })
    );
  }
  return map;
}

/**
 * @see https://tiendanube.github.io/api-documentation/resources/category
 */
export async function batchTiendanubeCategoryTitles(
  shopParam: string,
  categoryIds: number[]
): Promise<Map<number, string>> {
  const store = await getStoreData(shopParam.trim());
  if (!store?.accessToken) return new Map();
  const sid = String(store.storeId);
  const uniq = [...new Set(categoryIds.filter((x) => Number.isFinite(x) && x > 0))].slice(0, 36);
  const map = new Map<number, string>();
  const concurrency = 4;
  for (let i = 0; i < uniq.length; i += concurrency) {
    const chunk = uniq.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (id) => {
        const r = await tiendanubeAdminGet(sid, store.accessToken, `categories/${id}`, {});
        if (r.ok) {
          const t = categoryTitleFromBody(r.body);
          if (t) map.set(id, t);
        }
      })
    );
  }
  return map;
}
