'use server';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  mergeStorefrontPatch,
  parseStorefrontConfigPatch,
  resolveStorefrontConfig,
} from '@/lib/storefront-config';
import {
  getStorefrontConfigStored,
  upsertStorefrontConfigStored,
} from '@/lib/storefront-db';

export async function loadStorefrontForAdmin(storeId: number) {
  if (!(await isAdminAuthenticated())) return null;
  const stored = await getStorefrontConfigStored(storeId);
  return resolveStorefrontConfig(stored);
}

export async function saveStorefrontFromAdmin(storeId: number, body: unknown) {
  if (!(await isAdminAuthenticated())) {
    return { ok: false as const, error: 'No autorizado' };
  }
  const parsed = parseStorefrontConfigPatch(body);
  if (!parsed.ok) {
    return { ok: false as const, error: parsed.error };
  }
  try {
    const existing = await getStorefrontConfigStored(storeId);
    const merged = mergeStorefrontPatch(existing, parsed.patch);
    await upsertStorefrontConfigStored(storeId, merged);
    return { ok: true as const, config: resolveStorefrontConfig(merged) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al guardar';
    return { ok: false as const, error: msg };
  }
}
