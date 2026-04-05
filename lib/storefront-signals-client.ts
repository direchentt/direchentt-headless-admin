'use client';

const KEY_VISITOR = 'direchentt_visitor_id';

/** UUID v4 (incl. variantes en minúsculas). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getOrCreateVisitorId(): string | null {
  if (typeof window === 'undefined') return null;
  let v = localStorage.getItem(KEY_VISITOR);
  if (v && UUID_RE.test(v)) return v;
  v = crypto.randomUUID();
  localStorage.setItem(KEY_VISITOR, v);
  return v;
}

type Queued = { type: string; payload: Record<string, unknown> };

const pendingByStore = new Map<string, Queued[]>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function authHeader(): Record<string, string> {
  try {
    const raw = localStorage.getItem('direchentt_session');
    if (!raw) return {};
    const p = JSON.parse(raw) as { token?: string };
    if (typeof p.token === 'string' && p.token) {
      return { Authorization: `Bearer ${p.token}` };
    }
  } catch {
    /* ignore */
  }
  return {};
}

async function postBatch(storeId: string, visitorId: string, batch: Queued[]) {
  await fetch('/api/storefront/signals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({ shop: storeId, visitorId, events: batch }),
  });
}

async function flushAll() {
  flushTimer = null;
  const visitorId = getOrCreateVisitorId();
  if (!visitorId) return;

  for (const [storeId, q] of pendingByStore.entries()) {
    if (q.length === 0) continue;
    const batch = q.splice(0, 28);
    try {
      await postBatch(storeId, visitorId, batch);
    } catch {
      /* v1: no reintento */
    }
  }
}

/**
 * Encola señales de comportamiento (debounce ~700 ms) para perfil + eventos en Mongo.
 */
export function queueStorefrontSignals(
  storeId: string,
  events: { type: string; payload?: Record<string, unknown> }[]
): void {
  if (!storeId || events.length === 0) return;
  const visitorId = getOrCreateVisitorId();
  if (!visitorId) return;

  let q = pendingByStore.get(storeId);
  if (!q) {
    q = [];
    pendingByStore.set(storeId, q);
  }
  for (const e of events) {
    if (!e?.type) continue;
    q.push({
      type: e.type,
      payload: e.payload && typeof e.payload === 'object' && !Array.isArray(e.payload) ? e.payload : {},
    });
  }
  if (q.length > 120) q.splice(0, q.length - 120);

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flushAll(), 700);
}
