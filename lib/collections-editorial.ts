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

/** Si hay `editorialBlocks` en config, devuelve bloques resueltos; si no, null. */
export function resolveCollectionsEditorialBlocks(
  col: CollectionsPageStored | undefined,
  productsShuffled: any[]
): ResolvedCollectionsEditorialBlock[] | null {
  const blocks = col?.editorialBlocks;
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  const pool = [...productsShuffled];
  const productById = new Map<number, any>();
  for (const p of pool) {
    if (p?.id != null) productById.set(Number(p.id), p);
  }

  const used = new Set<number>();
  const out: ResolvedCollectionsEditorialBlock[] = [];

  for (const b of blocks) {
    const resolved = resolveOneBlock(b, pool, productById, used);
    if (resolved) out.push(resolved);
  }

  return out.length ? out : null;
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
