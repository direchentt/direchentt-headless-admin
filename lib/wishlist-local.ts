/**
 * Favoritos en el dispositivo (funciona sin sesión; se fusiona con Mongo al iniciar sesión).
 */
const PREFIX = 'direchentt_wishlist_ids_v1';

function key(storeId: string): string {
  return `${PREFIX}:${String(storeId).trim()}`;
}

export function readLocalWishlistIds(storeId: string): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key(storeId));
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    const out: number[] = [];
    const seen = new Set<number>();
    for (const x of arr) {
      const n = typeof x === 'number' ? x : parseInt(String(x), 10);
      if (!Number.isFinite(n) || n <= 0 || seen.has(n)) continue;
      seen.add(n);
      out.push(n);
    }
    return out;
  } catch {
    return [];
  }
}

export function writeLocalWishlistIds(storeId: string, ids: number[]): void {
  if (typeof window === 'undefined') return;
  try {
    const seen = new Set<number>();
    const clean: number[] = [];
    for (const id of ids) {
      if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
      seen.add(id);
      clean.push(id);
    }
    localStorage.setItem(key(storeId), JSON.stringify(clean));
  } catch {
    /* quota / private mode */
  }
}
