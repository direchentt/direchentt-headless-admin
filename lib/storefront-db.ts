import { getMongoClient } from '@/lib/backend';
import type { StorefrontConfigStored } from '@/lib/storefront-config';

const DB_NAME = 'direchentt-headless-admin';
const COLLECTION = 'storefront_config';

export async function getStorefrontConfigStored(
  storeId: number
): Promise<StorefrontConfigStored | null> {
  try {
    const client = await getMongoClient();
    const doc = await client
      .db(DB_NAME)
      .collection(COLLECTION)
      .findOne<{ config: StorefrontConfigStored }>({ storeId });
    return doc?.config ?? null;
  } catch {
    return null;
  }
}

export async function upsertStorefrontConfigStored(
  storeId: number,
  config: StorefrontConfigStored
): Promise<void> {
  const client = await getMongoClient();
  await client.db(DB_NAME).collection(COLLECTION).updateOne(
    { storeId },
    {
      $set: {
        storeId,
        config,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}
