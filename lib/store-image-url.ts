/** Normaliza URLs de imágenes de TiendaNube / CDNs (protocolo-relativo, etc.). */
export function normalizeStoreImageUrl(src: string | null | undefined): string | null {
  if (src == null || typeof src !== 'string') return null;
  const t = src.trim();
  if (!t) return null;
  if (t.startsWith('//')) return `https:${t}`;
  return t;
}
