import { getMongoClient } from '@/lib/backend';

const DB_NAME = 'direchentt-headless-admin';
const COLLECTION = 'admin_panel_settings';

/** Flags que podés activar para comportamiento futuro en storefront / checkout */
export type AdminPanelFlags = {
  experimentalCartSync?: boolean;
  strictStockMessages?: boolean;
  logCheckoutErrors?: boolean;
};

/**
 * Configuración del panel headless (reglas, avisos, flags).
 * No inventa campos de la API de TiendaNube: solo metadatos propios del proyecto.
 */
export type AdminPanelStored = {
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  internalNotes?: string;
  checkoutSuccessNote?: string;
  /** Texto legal extra en checkout (referencia interna; integración en UI aparte) */
  checkoutLegalHint?: string;
  flags?: AdminPanelFlags;
};

export type AdminPanelDoc = {
  storeId: number;
  settings: AdminPanelStored;
  updatedAt: Date;
};

export async function getAdminPanelSettings(storeId: number): Promise<AdminPanelStored | null> {
  try {
    const client = await getMongoClient();
    const doc = await client
      .db(DB_NAME)
      .collection(COLLECTION)
      .findOne<AdminPanelDoc>({ storeId });
    return doc?.settings ?? null;
  } catch {
    return null;
  }
}

export async function upsertAdminPanelSettings(
  storeId: number,
  settings: AdminPanelStored
): Promise<void> {
  const client = await getMongoClient();
  await client.db(DB_NAME).collection(COLLECTION).updateOne(
    { storeId },
    {
      $set: {
        storeId,
        settings,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}
