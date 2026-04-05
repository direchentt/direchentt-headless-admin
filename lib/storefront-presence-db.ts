import { getMongoClient } from '@/lib/backend';

const DB_NAME = 'direchentt-headless-admin';
const COLLECTION = 'storefront_presence';

export type PresenceDoc = {
  storeId: number;
  visitorId: string;
  path: string;
  pageType: string;
  productId?: number;
  categoryId?: number;
  lastSeen: Date;
  /** Primeros caracteres del user-agent (opcional) */
  deviceHint?: string;
};

let idx: Promise<void> | null = null;

function ensureIndexes(): Promise<void> {
  if (!idx) {
    idx = (async () => {
      const client = await getMongoClient();
      const c = client.db(DB_NAME).collection(COLLECTION);
      await c.createIndex(
        { storeId: 1, visitorId: 1 },
        { unique: true, name: 'presence_store_visitor' }
      );
      await c.createIndex({ storeId: 1, lastSeen: -1 }, { name: 'presence_store_seen' });
      try {
        await c.createIndex({ lastSeen: 1 }, { expireAfterSeconds: 600, name: 'presence_ttl_10m' });
      } catch {
        /* índice TTL ya existe con otra config */
      }
    })().catch((e) => {
      idx = null;
      console.warn('[presence-db] índices:', e);
    });
  }
  return idx;
}

export async function upsertPresence(input: {
  storeId: number;
  visitorId: string;
  path: string;
  pageType: string;
  productId?: number;
  categoryId?: number;
  deviceHint?: string;
}): Promise<void> {
  await ensureIndexes();
  const client = await getMongoClient();
  const now = new Date();
  const coll = client.db(DB_NAME).collection<PresenceDoc>(COLLECTION);
  const $set: Record<string, unknown> = {
    path: input.path.slice(0, 512),
    pageType: input.pageType.slice(0, 64),
    lastSeen: now,
  };
  const $unset: Record<string, string> = {};

  if (input.productId != null && Number.isFinite(input.productId)) {
    $set.productId = Math.floor(input.productId);
  } else {
    $unset.productId = '';
  }
  if (input.categoryId != null && Number.isFinite(input.categoryId)) {
    $set.categoryId = Math.floor(input.categoryId);
  } else {
    $unset.categoryId = '';
  }
  if (input.deviceHint) {
    $set.deviceHint = input.deviceHint.slice(0, 120);
  }

  const update: Record<string, unknown> = {
    $set,
    $setOnInsert: { storeId: input.storeId, visitorId: input.visitorId },
  };
  if (Object.keys($unset).length) update.$unset = $unset;

  await coll.updateOne({ storeId: input.storeId, visitorId: input.visitorId }, update, {
    upsert: true,
  });
}

export type PresenceRow = {
  visitorId: string;
  path: string;
  pageType: string;
  productId?: number;
  categoryId?: number;
  lastSeen: string;
  deviceHint?: string;
  secondsAgo: number;
};

/** Visitantes con ping reciente (ventana en segundos, default 2 min). */
export async function listActivePresence(
  storeId: number,
  windowSec: number = 120
): Promise<PresenceRow[]> {
  await ensureIndexes();
  const client = await getMongoClient();
  const since = new Date(Date.now() - windowSec * 1000);
  const rows = await client
    .db(DB_NAME)
    .collection<PresenceDoc>(COLLECTION)
    .find({ storeId, lastSeen: { $gte: since } })
    .sort({ lastSeen: -1 })
    .limit(80)
    .toArray();

  const now = Date.now();
  return rows.map((r) => ({
    visitorId: r.visitorId,
    path: r.path,
    pageType: r.pageType,
    productId: r.productId,
    categoryId: r.categoryId,
    lastSeen: r.lastSeen.toISOString(),
    deviceHint: r.deviceHint,
    secondsAgo: Math.max(0, Math.round((now - r.lastSeen.getTime()) / 1000)),
  }));
}

export async function countActivePresence(storeId: number, windowSec: number = 120): Promise<number> {
  await ensureIndexes();
  const client = await getMongoClient();
  const since = new Date(Date.now() - windowSec * 1000);
  return client
    .db(DB_NAME)
    .collection(COLLECTION)
    .countDocuments({ storeId, lastSeen: { $gte: since } });
}
