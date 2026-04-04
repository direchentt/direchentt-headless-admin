/**
 * Llamadas a la API de TiendaNube sin caché de Next (uso en panel admin).
 * @see https://tiendanube.github.io/api-documentation/
 */

export type TiendanubeAdminResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

export async function tiendanubeAdminGet(
  storeId: string,
  accessToken: string,
  resourcePath: string,
  searchParams: Record<string, string | number | undefined>
): Promise<TiendanubeAdminResult> {
  const u = new URL(`https://api.tiendanube.com/v1/${storeId}/${resourcePath.replace(/^\//, '')}`);
  for (const [k, v] of Object.entries(searchParams)) {
    if (v === undefined || v === '') continue;
    u.searchParams.set(k, String(v));
  }

  const res = await fetch(u.toString(), {
    headers: {
      Authentication: `bearer ${accessToken}`,
      'User-Agent': 'Direchentt',
    },
    cache: 'no-store',
  });

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = { raw: text };
    }
  }

  return { ok: res.ok, status: res.status, body };
}
