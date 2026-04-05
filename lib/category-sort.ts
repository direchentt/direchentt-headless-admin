/**
 * Orden en página de categoría.
 * Valores alineados con GET /products sort_by (Nuvemshop API).
 * @see https://tiendanube.github.io/api-documentation/resources/product
 */

import { getVariantDisplayPrices } from '@/lib/product-utils';

/** Valores que aceptamos en ?sort= (evita inyectar basura a la API) */
const ALLOWED = new Set([
  '',
  'price-ascending',
  'price-descending',
  'alpha-ascending',
  'alpha-descending',
  'best-selling',
  'created-at-ascending',
  'created-at-descending',
]);

export function normalizeCategorySortParam(raw: string | undefined | null): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  return ALLOWED.has(s) ? s : '';
}

function createdTs(p: any): number {
  const d = p?.createdAt || p?.created_at;
  if (!d) return 0;
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : 0;
}

function sortPrice(p: any): number {
  const v = p?.variants?.[0];
  const { current } = getVariantDisplayPrices(v || {});
  return Number.isFinite(current) ? current : 0;
}

function sortName(p: any): string {
  const n = p?.name;
  if (typeof n === 'string') return n;
  if (n && typeof n === 'object') return String(n.es || n.en || n.pt || '');
  return '';
}

/**
 * Orden determinístico en servidor (respaldo si la API devuelve mal el sort_by con category_id).
 */
export function sortCategoryProducts(products: any[], sort: string): any[] {
  const list = Array.isArray(products) ? [...products] : [];
  const s = normalizeCategorySortParam(sort);

  switch (s) {
    case 'price-ascending':
      return list.sort(
        (a, b) => sortPrice(a) - sortPrice(b) || Number(a.id) - Number(b.id)
      );
    case 'price-descending':
      return list.sort(
        (a, b) => sortPrice(b) - sortPrice(a) || Number(b.id) - Number(a.id)
      );
    case 'alpha-ascending':
      return list.sort((a, b) =>
        sortName(a).localeCompare(sortName(b), 'es', { sensitivity: 'base' })
      );
    case 'alpha-descending':
      return list.sort((a, b) =>
        sortName(b).localeCompare(sortName(a), 'es', { sensitivity: 'base' })
      );
    case 'best-selling': {
      const hasMetric = list.some(
        (p) => p?.sold_quantity != null || p?.sales_count != null
      );
      if (!hasMetric) return list;
      return list.sort((a, b) => {
        const qa = Number(a.sold_quantity ?? a.sales_count ?? 0);
        const qb = Number(b.sold_quantity ?? b.sales_count ?? 0);
        return qb - qa || Number(b.id) - Number(a.id);
      });
    }
    case 'created-at-ascending':
      return list.sort(
        (a, b) => createdTs(a) - createdTs(b) || Number(a.id) - Number(b.id)
      );
    case 'created-at-descending':
      return list.sort(
        (a, b) => createdTs(b) - createdTs(a) || Number(b.id) - Number(a.id)
      );
    default:
      /* "" = más recientes primero (misma idea que created-at-descending) */
      return list.sort(
        (a, b) => createdTs(b) - createdTs(a) || Number(b.id) - Number(a.id)
      );
  }
}
