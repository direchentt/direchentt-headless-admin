'use client';

const KEY_VISITOR = 'direchentt_visitor_id';
const KEY_FIRST_TOUCH = 'direchentt_mkt_first';
const KEY_SESS_REF = 'direchentt_mkt_refhost';

function parseUtmFromSearchParams(sp: URLSearchParams): Record<string, string> {
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
  const o: Record<string, string> = {};
  for (const k of keys) {
    const v = sp.get(k)?.trim();
    if (v) o[k] = v.slice(0, 160);
  }
  return o;
}

function ensureFirstTouchFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(KEY_FIRST_TOUCH)) return;
    const cur = parseUtmFromSearchParams(new URLSearchParams(window.location.search));
    if (Object.keys(cur).length > 0) {
      sessionStorage.setItem(KEY_FIRST_TOUCH, JSON.stringify(cur));
    }
  } catch {
    /* ignore */
  }
}

function captureSessionReferrerHost(): void {
  if (typeof document === 'undefined') return;
  try {
    if (sessionStorage.getItem(KEY_SESS_REF)) return;
    if (!document.referrer) return;
    const host = new URL(document.referrer).hostname;
    if (host) sessionStorage.setItem(KEY_SESS_REF, host.slice(0, 160));
  } catch {
    /* ignore */
  }
}

/**
 * Atribución para mezclar en cada evento: primer toque UTM (sesión), UTM actual, referrer y canal heurístico.
 */
function attributionPayload(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  ensureFirstTouchFromUrl();
  captureSessionReferrerHost();

  const out: Record<string, string> = {};
  try {
    const raw = sessionStorage.getItem(KEY_FIRST_TOUCH);
    if (raw) {
      const first = JSON.parse(raw) as Record<string, unknown>;
      for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
        const v = first[k];
        if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, 160);
      }
    }
  } catch {
    /* ignore */
  }

  const cur = parseUtmFromSearchParams(new URLSearchParams(window.location.search));
  Object.assign(out, cur);

  try {
    const sessRef = sessionStorage.getItem(KEY_SESS_REF);
    if (sessRef) out.referrerHost = sessRef;
    else if (document.referrer) {
      out.referrerHost = new URL(document.referrer).hostname.slice(0, 160);
    }
  } catch {
    /* ignore */
  }

  const src = (out.utm_source || '').toLowerCase();
  const med = (out.utm_medium || '').toLowerCase();
  if (src) {
    if (med.includes('cpc') || med.includes('ppc') || med.includes('paid'))
      out.trafficChannel = 'CPC / pago (UTM)';
    else if (med.includes('email') || med.includes('mail')) out.trafficChannel = 'Email (UTM)';
    else if (
      med.includes('social') ||
      /instagram|facebook|fb\.|tiktok|twitter|x\.com|linkedin/.test(src)
    )
      out.trafficChannel = 'Social (UTM)';
    else out.trafficChannel = `UTM: ${(out.utm_source || 'campo').slice(0, 40)}`;
  } else if (out.referrerHost) {
    out.trafficChannel = 'Referido';
  } else {
    out.trafficChannel = 'Directo / sin UTM';
  }

  return out;
}

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
  const attr = attributionPayload();
  for (const e of events) {
    if (!e?.type) continue;
    const raw =
      e.payload && typeof e.payload === 'object' && !Array.isArray(e.payload)
        ? (e.payload as Record<string, unknown>)
        : {};
    const merged: Record<string, unknown> = { ...attr };
    for (const [k, v] of Object.entries(raw)) {
      merged[k] = v;
    }
    q.push({
      type: e.type,
      payload: merged,
    });
  }
  if (q.length > 120) q.splice(0, q.length - 120);

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flushAll(), 700);
}
