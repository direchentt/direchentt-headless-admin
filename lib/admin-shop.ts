/** ID de tienda por defecto en URLs del panel (?shop=). */
export function getAdminDefaultShopId(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_SHOP?.trim() || '5112334';
}

export function parseAdminStoreIdParam(shop: string | undefined): number {
  const raw = shop?.trim() || getAdminDefaultShopId();
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : parseInt(getAdminDefaultShopId(), 10);
}

export function withAdminShopQuery(path: string, shopId: string): string {
  const u = path.includes('?') ? `${path}&` : `${path}?`;
  return `${u}shop=${encodeURIComponent(shopId)}`;
}
