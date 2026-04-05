import { getMongoClient } from '@/lib/backend';

const DB_NAME = 'direchentt-headless-admin';
const COL_PROFILES = 'shopper_profiles';
const COL_EVENTS = 'storefront_events';

export type StorefrontSignalType =
  | 'product_view'
  | 'category_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'search'
  | 'checkout_start'
  | 'wishlist_add';

export type StorefrontEventDoc = {
  storeId: number;
  visitorId: string;
  userSub?: string;
  type: StorefrontSignalType;
  payload: Record<string, unknown>;
  createdAt: Date;
};

export type ShopperProfileDoc = {
  storeId: number;
  visitorId: string;
  userSub?: string;
  createdAt: Date;
  updatedAt: Date;
  /** Más recientes primero (máx. 40) */
  recentProductIds: number[];
  /** Productos agregados al carrito (afinidad; máx. 30) */
  cartAffinityIds: number[];
  /** Peso por categoría (id numérico como string) */
  categoryWeights: Record<string, number>;
  /** Últimas búsquedas normalizadas (máx. 20) */
  recentQueries: string[];
  totals: {
    views: number;
    cartAdds: number;
    searches: number;
  };
};

let indexesDone: Promise<void> | null = null;

function ensureIndexes(): Promise<void> {
  if (!indexesDone) {
    indexesDone = (async () => {
      const client = await getMongoClient();
      const db = client.db(DB_NAME);
      await db.collection(COL_PROFILES).createIndex(
        { storeId: 1, visitorId: 1 },
        { unique: true, name: 'shopper_store_visitor' }
      );
      await db.collection(COL_PROFILES).createIndex(
        { storeId: 1, userSub: 1 },
        { sparse: true, name: 'shopper_store_user' }
      );
      await db.collection(COL_EVENTS).createIndex(
        { storeId: 1, createdAt: -1 },
        { name: 'events_store_time' }
      );
      await db.collection(COL_EVENTS).createIndex(
        { visitorId: 1, createdAt: -1 },
        { name: 'events_visitor_time' }
      );
      try {
        await db
          .collection(COL_EVENTS)
          .createIndex({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60, name: 'events_ttl_90d' });
      } catch {
        /* TTL ya existe o versión antigua */
      }
    })().catch((e) => {
      indexesDone = null;
      console.warn('[shopper-intelligence] índices:', e);
    });
  }
  return indexesDone;
}

function numCatKey(id: unknown): string | null {
  const n = typeof id === 'number' ? id : parseInt(String(id), 10);
  return Number.isFinite(n) && n > 0 ? String(n) : null;
}

function dedupeRecent(ids: number[], cap: number): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const id of ids) {
    if (!Number.isFinite(id) || id <= 0) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= cap) break;
  }
  return out;
}

export async function insertStorefrontEvents(
  docs: Omit<StorefrontEventDoc, 'createdAt'>[]
): Promise<void> {
  if (docs.length === 0) return;
  await ensureIndexes();
  const client = await getMongoClient();
  const coll = client.db(DB_NAME).collection<StorefrontEventDoc>(COL_EVENTS);
  const now = new Date();
  await coll.insertMany(
    docs.map((d) => ({
      ...d,
      createdAt: now,
    }))
  );
}

/**
 * Aplica un lote de señales al perfil y registra eventos crudos (marketing / análisis).
 */
export async function applyStorefrontSignals(input: {
  storeId: number;
  visitorId: string;
  userSub?: string;
  events: { type: StorefrontSignalType; payload: Record<string, unknown>; ts?: number }[];
}): Promise<void> {
  const { storeId, visitorId, userSub } = input;
  const events = input.events.filter((e) => e && typeof e.type === 'string');
  if (events.length === 0) return;

  await ensureIndexes();
  const client = await getMongoClient();
  const coll = client.db(DB_NAME).collection<ShopperProfileDoc>(COL_PROFILES);

  const now = new Date();
  const existing = await coll.findOne({ storeId, visitorId });

  let recentProductIds = existing?.recentProductIds ?? [];
  let cartAffinityIds = existing?.cartAffinityIds ?? [];
  const categoryWeights = { ...(existing?.categoryWeights ?? {}) };
  let recentQueries = [...(existing?.recentQueries ?? [])];
  const totals = {
    views: existing?.totals?.views ?? 0,
    cartAdds: existing?.totals?.cartAdds ?? 0,
    searches: existing?.totals?.searches ?? 0,
  };

  const eventDocs: Omit<StorefrontEventDoc, 'createdAt'>[] = [];

  for (const ev of events) {
    const p = ev.payload || {};
    eventDocs.push({
      storeId,
      visitorId,
      userSub,
      type: ev.type,
      payload: p,
    });

    switch (ev.type) {
      case 'product_view': {
        const pid = typeof p.productId === 'number' ? p.productId : parseInt(String(p.productId), 10);
        if (Number.isFinite(pid) && pid > 0) {
          recentProductIds = dedupeRecent([pid, ...recentProductIds.filter((x) => x !== pid)], 40);
          totals.views += 1;
        }
        const ck = numCatKey(p.categoryId);
        if (ck) categoryWeights[ck] = (categoryWeights[ck] ?? 0) + 1;
        break;
      }
      case 'category_view': {
        const ck = numCatKey(p.categoryId);
        if (ck) categoryWeights[ck] = (categoryWeights[ck] ?? 0) + 2;
        break;
      }
      case 'add_to_cart': {
        const pid = typeof p.productId === 'number' ? p.productId : parseInt(String(p.productId), 10);
        if (Number.isFinite(pid) && pid > 0) {
          cartAffinityIds = dedupeRecent([pid, ...cartAffinityIds.filter((x) => x !== pid)], 30);
          recentProductIds = dedupeRecent([pid, ...recentProductIds.filter((x) => x !== pid)], 40);
          totals.cartAdds += 1;
        }
        const ck = numCatKey(p.categoryId);
        if (ck) categoryWeights[ck] = (categoryWeights[ck] ?? 0) + 1.5;
        break;
      }
      case 'remove_from_cart': {
        /* opcional: no quitamos afinidad; solo evento para funnels */
        break;
      }
      case 'search': {
        const q = typeof p.query === 'string' ? p.query.trim().toLowerCase().slice(0, 120) : '';
        if (q.length >= 2) {
          recentQueries = [q, ...recentQueries.filter((x) => x !== q)].slice(0, 20);
          totals.searches += 1;
        }
        break;
      }
      case 'checkout_start':
      case 'wishlist_add': {
        const pid = typeof p.productId === 'number' ? p.productId : parseInt(String(p.productId), 10);
        if (Number.isFinite(pid) && pid > 0) {
          recentProductIds = dedupeRecent([pid, ...recentProductIds.filter((x) => x !== pid)], 40);
        }
        break;
      }
      default:
        break;
    }
  }

  const doc: ShopperProfileDoc = {
    storeId,
    visitorId,
    userSub: userSub ?? existing?.userSub,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    recentProductIds,
    cartAffinityIds,
    categoryWeights,
    recentQueries,
    totals,
  };

  await coll.replaceOne({ storeId, visitorId }, doc, { upsert: true });

  if (eventDocs.length > 0) {
    await insertStorefrontEvents(eventDocs);
  }
}

export async function getShopperProfile(
  storeId: number,
  visitorId: string
): Promise<ShopperProfileDoc | null> {
  await ensureIndexes();
  const client = await getMongoClient();
  return client.db(DB_NAME).collection<ShopperProfileDoc>(COL_PROFILES).findOne({ storeId, visitorId });
}

/** Top categorías por peso (ids numéricos). */
export function topCategoryIdsFromProfile(profile: ShopperProfileDoc | null, limit: number): number[] {
  if (!profile?.categoryWeights) return [];
  const entries = Object.entries(profile.categoryWeights)
    .filter(([k]) => /^\d+$/.test(k))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => parseInt(k, 10));
  return entries.filter((n) => Number.isFinite(n));
}
