import { getMongoClient } from '@/lib/backend';

const DB_NAME = 'direchentt-headless-admin';
const COLLECTION = 'wishlist_items';

export type WishlistDoc = {
  storeId: number;
  userSub: string;
  productId: number;
  addedAt: Date;
};

let indexesPromise: Promise<void> | null = null;

/** Índices una sola vez por proceso (no requiere Compass ni scripts). */
function ensureWishlistIndexes(): Promise<void> {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const client = await getMongoClient();
      const coll = client.db(DB_NAME).collection(COLLECTION);
      await coll.createIndex(
        { storeId: 1, userSub: 1, productId: 1 },
        { unique: true, name: 'wishlist_store_user_product' }
      );
      await coll.createIndex(
        { storeId: 1, userSub: 1, addedAt: -1 },
        { name: 'wishlist_user_added' }
      );
    })().catch((err) => {
      indexesPromise = null;
      console.warn('[wishlist-db] No se pudieron crear índices:', err);
    });
  }
  return indexesPromise;
}

export async function wishlistAdd(
  storeId: number,
  userSub: string,
  productId: number
): Promise<void> {
  await ensureWishlistIndexes();
  const client = await getMongoClient();
  const coll = client.db(DB_NAME).collection<WishlistDoc>(COLLECTION);
  const now = new Date();
  await coll.updateOne(
    { storeId, userSub, productId },
    { $setOnInsert: { addedAt: now } },
    { upsert: true }
  );
}

export async function wishlistRemove(
  storeId: number,
  userSub: string,
  productId: number
): Promise<void> {
  await ensureWishlistIndexes();
  const client = await getMongoClient();
  const coll = client.db(DB_NAME).collection<WishlistDoc>(COLLECTION);
  await coll.deleteOne({ storeId, userSub, productId });
}

export async function wishlistHas(
  storeId: number,
  userSub: string,
  productId: number
): Promise<boolean> {
  await ensureWishlistIndexes();
  const client = await getMongoClient();
  const coll = client.db(DB_NAME).collection<WishlistDoc>(COLLECTION);
  const n = await coll.countDocuments({ storeId, userSub, productId }, { limit: 1 });
  return n > 0;
}

export async function wishlistListProductIds(
  storeId: number,
  userSub: string
): Promise<{ productId: number; addedAt: Date }[]> {
  await ensureWishlistIndexes();
  const client = await getMongoClient();
  const coll = client.db(DB_NAME).collection<WishlistDoc>(COLLECTION);
  const rows = await coll
    .find({ storeId, userSub })
    .sort({ addedAt: -1 })
    .project({ productId: 1, addedAt: 1, _id: 0 })
    .toArray();
  return rows.map((r) => ({
    productId: r.productId,
    addedAt: r.addedAt instanceof Date ? r.addedAt : new Date(),
  }));
}

export async function wishlistCount(
  storeId: number,
  userSub: string
): Promise<number> {
  await ensureWishlistIndexes();
  const client = await getMongoClient();
  const coll = client.db(DB_NAME).collection<WishlistDoc>(COLLECTION);
  return coll.countDocuments({ storeId, userSub });
}
