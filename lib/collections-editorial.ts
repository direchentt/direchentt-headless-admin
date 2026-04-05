/**
 * Resuelve bloques editorial + grilla 2×2 para /collections (servidor).
 */

import type {
  CollectionsEditorialBlockStored,
  CollectionsGridCellStored,
  CollectionsPageStored,
} from '@/lib/storefront-config';

export type ResolvedCollectionsCell =
  | { type: 'product'; product: any }
  | { type: 'image'; url: string }
  | { type: 'video'; url: string };

export interface ResolvedCollectionsEditorialBlock {
  layout: 'editorial-left' | 'editorial-right';
  editorial: { kind: 'image' | 'video'; url: string };
  cells: ResolvedCollectionsCell[];
}

function takeRandomProduct(pool: any[], used: Set<number>): any | null {
  for (const p of pool) {
    const id = p?.id;
    if (id == null) continue;
    const n = Number(id);
    if (!used.has(n)) {
      used.add(n);
      return p;
    }
  }
  return null;
}

/** Si no quedan sin usar, repite algún producto del pool para no dejar celdas vacías. */
function takeProductLoose(pool: any[], used: Set<number>): any | null {
  const u = takeRandomProduct(pool, used);
  if (u) return u;
  for (const p of pool) {
    if (p?.id != null) return p;
  }
  return null;
}

function normalizeGridCells(cells: CollectionsGridCellStored[] | undefined): CollectionsGridCellStored[] {
  const g = (cells || []).slice(0, 4);
  while (g.length < 4) {
    g.push({ mode: 'random' });
  }
  return g.slice(0, 4);
}

function resolveOneBlock(
  block: CollectionsEditorialBlockStored,
  pool: any[],
  productById: Map<number, any>,
  used: Set<number>
): ResolvedCollectionsEditorialBlock | null {
  const url = block.editorialUrl?.trim();
  if (!url) return null;

  const grid = normalizeGridCells(block.gridCells);
  const cells: ResolvedCollectionsCell[] = [];

  for (const c of grid) {
    if (c.mode === 'media') {
      const u = c.url?.trim();
      if (u) {
        cells.push({
          type: c.mediaKind === 'video' ? 'video' : 'image',
          url: u,
        });
      } else {
        const r = takeProductLoose(pool, used);
        if (!r) return null;
        cells.push({ type: 'product', product: r });
      }
      continue;
    }
    if (c.mode === 'product' && c.productId != null) {
      const pid = Number(c.productId);
      const p = productById.get(pid);
      if (p) {
        used.add(Number(p.id));
        cells.push({ type: 'product', product: p });
      } else {
        const r = takeProductLoose(pool, used);
        if (!r) return null;
        cells.push({ type: 'product', product: r });
      }
      continue;
    }
    const r = takeProductLoose(pool, used);
    if (!r) return null;
    cells.push({ type: 'product', product: r });
  }

  if (cells.length !== 4) return null;

  return {
    layout: block.layout === 'editorial-right' ? 'editorial-right' : 'editorial-left',
    editorial: {
      kind: block.editorialKind === 'video' ? 'video' : 'image',
      url,
    },
    cells: cells.slice(0, 4),
  };
}

function editorialKindFromUrl(url: string): 'image' | 'video' {
  const u = url.toLowerCase();
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(u)) return 'video';
  return 'image';
}

function fourProductCells(pool: any[], used: Set<number>): ResolvedCollectionsCell[] | null {
  const cells: ResolvedCollectionsCell[] = [];
  for (let i = 0; i < 4; i++) {
    const p = takeProductLoose(pool, used);
    if (!p) return null;
    cells.push({ type: 'product', product: p });
  }
  return cells;
}

/**
 * URLs legacy (sin editorialBlocks): cada URL = un banner + grilla 2×2 de productos.
 * Orden: primero editorialLeftUrl, luego editorialGridUrl (si es distinta).
 */
function resolveLegacyUrlBlocks(
  col: CollectionsPageStored,
  pool: any[],
  used: Set<number>
): ResolvedCollectionsEditorialBlock[] {
  const left = col.editorialLeftUrl?.trim() || '';
  const grid = col.editorialGridUrl?.trim() || '';
  const urls: string[] = [];
  if (left) urls.push(left);
  if (grid && grid !== left) urls.push(grid);

  const out: ResolvedCollectionsEditorialBlock[] = [];
  for (const url of urls) {
    const cells = fourProductCells(pool, used);
    if (!cells) break;
    out.push({
      layout: 'editorial-left',
      editorial: { kind: editorialKindFromUrl(url), url },
      cells,
    });
  }
  return out;
}

/** Fila visual: banner | 4 productos (2×2); la siguiente invierte el lado del banner. */
function applyAlternatingBannerLayout(blocks: ResolvedCollectionsEditorialBlock[]): void {
  blocks.forEach((b, i) => {
    b.layout = i % 2 === 0 ? 'editorial-left' : 'editorial-right';
  });
}

/**
 * Bloques para /collections:
 * - Con `editorialBlocks` en storefront: cada bloque = banner + 2×2 (según celdas configuradas).
 * - Sin bloques pero con URLs legacy: 1–2 filas banner+2×2 desde editorialLeftUrl / editorialGridUrl.
 * - Si no hay banners ni URLs: null → la página muestra solo grilla aleatoria.
 *
 * Siempre alterna izquierda/derecha por índice de fila (0: banner izq., 1: banner der., …).
 */
export function resolveCollectionsEditorialBlocks(
  col: CollectionsPageStored | undefined,
  productsShuffled: any[]
): ResolvedCollectionsEditorialBlock[] | null {
  if (!col) return null;

  const pool = [...productsShuffled];
  const productById = new Map<number, any>();
  for (const p of pool) {
    if (p?.id != null) productById.set(Number(p.id), p);
  }

  const used = new Set<number>();
  let out: ResolvedCollectionsEditorialBlock[] = [];

  const configured = col.editorialBlocks;
  if (Array.isArray(configured) && configured.length > 0) {
    for (const b of configured) {
      const resolved = resolveOneBlock(b, pool, productById, used);
      if (resolved) out.push(resolved);
    }
  } else {
    out = resolveLegacyUrlBlocks(col, pool, used);
  }

  if (out.length === 0) return null;

  applyAlternatingBannerLayout(out);
  return out;
}

export function collectUsedProductIds(blocks: ResolvedCollectionsEditorialBlock[]): Set<number> {
  const s = new Set<number>();
  for (const b of blocks) {
    for (const c of b.cells) {
      if (c.type === 'product' && c.product?.id != null) {
        s.add(Number(c.product.id));
      }
    }
  }
  return s;
}
