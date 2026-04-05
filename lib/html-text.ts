/**
 * Decodifica entidades HTML comunes en texto plano (p. ej. descripciones TN con &eacute;).
 * Uso en servidor y cliente sin DOM.
 */
export function decodeHtmlEntities(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let s = input;
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
    const n = parseInt(h, 16);
    return Number.isFinite(n) ? String.fromCodePoint(n) : _;
  });
  s = s.replace(/&#(\d+);/g, (_, d) => {
    const n = parseInt(d, 10);
    return Number.isFinite(n) && n > 0 ? String.fromCodePoint(n) : _;
  });
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    eacute: 'é',
    egrave: 'è',
    ecirc: 'ê',
    agrave: 'à',
    aacute: 'á',
    acirc: 'â',
    iacute: 'í',
    oacute: 'ó',
    uacute: 'ú',
    ntilde: 'ñ',
    ordm: 'º',
    copy: '©',
    reg: '®',
  };
  s = s.replace(/&([a-zA-Z]+);/g, (full, name: string) => {
    const v = named[name.toLowerCase()];
    return v !== undefined ? v : full;
  });
  return s;
}
