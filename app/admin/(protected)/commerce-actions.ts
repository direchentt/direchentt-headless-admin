'use server';

import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  getAdminPanelSettings,
  upsertAdminPanelSettings,
  type AdminPanelStored,
  type AdminPanelFlags,
  type AdminMarketingPlaybook,
} from '@/lib/admin-panel-db';
import { getMarketingInsightsSnapshot } from '@/lib/shopper-intelligence-db';
import { getStoreData } from '@/lib/backend';
import { parseAdminStoreIdParam } from '@/lib/admin-shop';
import { listMpPaymentsByStore } from '@/lib/mp-payments-db';
import { tiendanubeAdminGet } from '@/lib/tiendanube-admin-fetch';

function tnErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    const msg = o.message ?? o.error ?? o.description;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  if (status === 401 || status === 403) {
    return 'El token de la app no tiene permisos (p. ej. read_orders o read_products). Reinstalá la app con los scopes actualizados.';
  }
  return `Error de API (${status})`;
}

export async function listOrdersAdmin(shopId: string, page: number) {
  if (!(await isAdminAuthenticated())) {
    return { ok: false as const, error: 'No autorizado' };
  }
  const store = await getStoreData(shopId);
  if (!store?.accessToken) {
    return { ok: false as const, error: 'Tienda no encontrada o sin token' };
  }
  const sid = String(store.storeId);
  const r = await tiendanubeAdminGet(sid, store.accessToken, 'orders', {
    per_page: 25,
    page: Math.max(1, page),
  });
  if (!r.ok) {
    return { ok: false as const, error: tnErrorMessage(r.status, r.body) };
  }
  const orders = Array.isArray(r.body) ? r.body : [];
  return {
    ok: true as const,
    orders,
    storeId: sid,
    shopName: store.shop_name || store.name || sid,
  };
}

export async function listProductsAdmin(shopId: string, page: number, q: string) {
  if (!(await isAdminAuthenticated())) {
    return { ok: false as const, error: 'No autorizado' };
  }
  const store = await getStoreData(shopId);
  if (!store?.accessToken) {
    return { ok: false as const, error: 'Tienda no encontrada o sin token' };
  }
  const sid = String(store.storeId);
  const params: Record<string, string | number | undefined> = {
    per_page: 24,
    page: Math.max(1, page),
    published: 'true',
  };
  const trimmed = q.trim();
  if (trimmed) params.q = trimmed;

  const r = await tiendanubeAdminGet(sid, store.accessToken, 'products', params);
  if (!r.ok) {
    return { ok: false as const, error: tnErrorMessage(r.status, r.body) };
  }
  const products = Array.isArray(r.body) ? r.body : [];
  return {
    ok: true as const,
    products,
    storeId: sid,
    shopName: store.shop_name || store.name || sid,
  };
}

function strField(v: unknown): string | undefined {
  const s = String(v ?? '').trim();
  return s || undefined;
}

export async function loadAdminPanelRules(storeId: number) {
  if (!(await isAdminAuthenticated())) return null;
  const s = await getAdminPanelSettings(storeId);
  return s ?? {};
}

export type SaveAdminPanelRulesPatch = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  internalNotes: string;
  checkoutSuccessNote: string;
  checkoutLegalHint: string;
  flags: AdminPanelFlags;
  marketing: AdminMarketingPlaybook;
};

export async function saveAdminPanelRules(storeId: number, patch: SaveAdminPanelRulesPatch) {
  if (!(await isAdminAuthenticated())) {
    return { ok: false as const, error: 'No autorizado' };
  }
  try {
    const prev = (await getAdminPanelSettings(storeId)) ?? {};
    const m = patch.marketing;
    const next: AdminPanelStored = {
      ...prev,
      maintenanceMode: patch.maintenanceMode,
      maintenanceMessage: strField(patch.maintenanceMessage),
      internalNotes: strField(patch.internalNotes),
      checkoutSuccessNote: strField(patch.checkoutSuccessNote),
      checkoutLegalHint: strField(patch.checkoutLegalHint),
      flags: {
        ...prev.flags,
        experimentalCartSync: Boolean(patch.flags.experimentalCartSync),
        strictStockMessages: Boolean(patch.flags.strictStockMessages),
        logCheckoutErrors: Boolean(patch.flags.logCheckoutErrors),
        preferExpressShipping: Boolean(patch.flags.preferExpressShipping),
        lowStockUrgencyCopy: Boolean(patch.flags.lowStockUrgencyCopy),
        verboseStorefrontLogs: Boolean(patch.flags.verboseStorefrontLogs),
      },
      marketing: {
        ...prev.marketing,
        announcementEnabled: Boolean(m.announcementEnabled),
        announcementText: strField(m.announcementText),
        announcementLink: strField(m.announcementLink),
        utmCampaignTemplate: strField(m.utmCampaignTemplate),
        notasCampanas: strField(m.notasCampanas),
        objetivoConversion: strField(m.objetivoConversion),
      },
    };
    await upsertAdminPanelSettings(storeId, next);
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al guardar';
    return { ok: false as const, error: msg };
  }
}

/** Métricas agregadas desde señales del storefront (Mongo). Solo admin autenticado. */
export async function loadMarketingInsights(storeId: number) {
  if (!(await isAdminAuthenticated())) {
    return null;
  }
  return getMarketingInsightsSnapshot(storeId);
}

/** Pagos registrados vía webhook de Mercado Pago (Mongo), por tienda. */
export async function listMercadoPagoPaymentsAdmin(shop: string, page: number) {
  if (!(await isAdminAuthenticated())) {
    return { ok: false as const, error: 'No autorizado' };
  }
  const storeId = parseAdminStoreIdParam(shop);
  try {
    const { items, total } = await listMpPaymentsByStore(storeId, Math.max(1, page), 25);
    return {
      ok: true as const,
      items,
      total,
      storeId,
      page: Math.max(1, page),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al leer pagos MP';
    return { ok: false as const, error: msg };
  }
}
