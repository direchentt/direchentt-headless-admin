/** Rutas típicas de CDNs de video (p. ej. Shopify) sin depender de la extensión en la query. */
const VIDEO_PATH_RE = /\/videos?\//i;

/**
 * True si la URL apunta a un archivo de video: no debe pasarse a `next/image`.
 */
export function isVideoAssetUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (VIDEO_PATH_RE.test(t)) return true;
  const pathOnly = t.split('?')[0].split('#')[0].toLowerCase();
  return /\.(mp4|webm|ogg|mov|m4v|ogv)$/.test(pathOnly);
}
