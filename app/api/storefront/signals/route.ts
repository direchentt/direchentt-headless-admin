import { NextResponse } from 'next/server';
import { verifyStorefrontSession } from '@/lib/storefront-session';
import {
  applyStorefrontSignals,
  type StorefrontSignalType,
} from '@/lib/shopper-intelligence-db';

const ALLOWED = new Set<StorefrontSignalType>([
  'product_view',
  'category_view',
  'add_to_cart',
  'remove_from_cart',
  'search',
  'checkout_start',
  'wishlist_add',
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseShopId(shop: string | null): number | null {
  if (!shop) return null;
  const n = parseInt(shop, 10);
  return Number.isFinite(n) ? n : null;
}

function bearerToken(req: Request): string | null {
  const h = req.headers.get('authorization');
  if (!h?.toLowerCase().startsWith('bearer ')) return null;
  return h.slice(7).trim() || null;
}

function sanitizePayload(p: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  let k = 0;
  for (const [key, val] of Object.entries(p)) {
    if (k++ > 40) break;
    if (typeof val === 'string') clean[key] = val.length > 500 ? val.slice(0, 500) : val;
    else if (typeof val === 'number' && Number.isFinite(val)) clean[key] = val;
    else if (typeof val === 'boolean') clean[key] = val;
  }
  return clean;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const shop = typeof b.shop === 'string' ? b.shop : null;
  const visitorId = typeof b.visitorId === 'string' ? b.visitorId : null;
  const eventsRaw = b.events;

  const storeId = parseShopId(shop);
  if (storeId === null || !visitorId || !UUID_RE.test(visitorId)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }
  if (!Array.isArray(eventsRaw) || eventsRaw.length === 0) {
    return NextResponse.json({ ok: true });
  }
  if (eventsRaw.length > 40) {
    return NextResponse.json({ error: 'Demasiados eventos' }, { status: 400 });
  }

  const events: { type: StorefrontSignalType; payload: Record<string, unknown> }[] = [];
  for (const ev of eventsRaw) {
    if (!ev || typeof ev !== 'object' || Array.isArray(ev)) continue;
    const e = ev as Record<string, unknown>;
    const type = e.type;
    if (typeof type !== 'string' || !ALLOWED.has(type as StorefrontSignalType)) continue;
    const payload = e.payload;
    const raw =
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {};
    events.push({ type: type as StorefrontSignalType, payload: sanitizePayload(raw) });
  }

  if (events.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const token = bearerToken(req);
  const session = token ? verifyStorefrontSession(token) : null;
  const userSub = session?.sub;

  try {
    await applyStorefrontSignals({
      storeId,
      visitorId,
      userSub,
      events,
    });
  } catch (e) {
    console.error('[storefront/signals]', e);
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
