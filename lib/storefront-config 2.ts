/**
 * Configuración del storefront headless (orden de bloques, textos, tema).
 * Persistida en MongoDB; la API expone GET público y PUT con secreto admin.
 */

export const STOREFRONT_CONFIG_VERSION = 1 as const;

/** Identificadores de bloques de la home (deben coincidir con HomePageBlocks). */
export type HomeSectionId =
  | 'hero'
  | 'featured_categories'
  | 'new_arrivals'
  | 'crazy_carousel'
  | 'banner_grid_split'
  | 'shop_the_look'
  | 'best_sellers'
  | 'latest_products'
  | 'newsletter_strip';

export interface HomeSectionResolved {
  id: HomeSectionId;
  enabled: boolean;
  /** Título sobreescrito; vacío = usar el del componente */
  title?: string;
}

export interface StorefrontTheme {
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
}

/** Ajustes del popup newsletter (el cliente puede leerlos vía GET si lo conectás después) */
export interface StorefrontNewsletter {
  popupDelayMs?: number;
  cooldownDays?: number;
  /** Cierres antes del cooldown largo (default 3 cierres → 7 días) */
  dismissBeforeCooldown?: number;
}

/** Lo que guardás en Mongo (parcial sobre defaults) */
export interface StorefrontConfigStored {
  version?: number;
  /** Orden de secciones en home; si falta alguna id, se agrega al final con default */
  homeSectionOrder?: HomeSectionId[];
  /** Por id: enabled y título opcional */
  sections?: Partial<
    Record<HomeSectionId, { enabled?: boolean; title?: string }>
  >;
  theme?: StorefrontTheme;
  newsletter?: StorefrontNewsletter;
  /** URLs absolutas o rutas `/banners/...` para el hero; vacío = lógica actual (local/TN/defaults) */
  heroBannerUrls?: string[];
  /** Página /collections: imagen editorial + slot en grilla (moderás vos las URLs) */
  collections?: CollectionsPageStored;
}

/** Configuración visual de /collections (productos siguen aleatorios en el servidor) */
export interface CollectionsPageStored {
  /** Columna izquierda grande (lifestyle), ej. https://... o /banners/... */
  editorialLeftUrl?: string;
  /** Celda inferior derecha de la grilla 2×2 (opcional); si falta, van 4 productos */
  editorialGridUrl?: string;
}

export interface StorefrontConfigResolved extends StorefrontConfigStored {
  version: number;
  homeSections: HomeSectionResolved[];
}

const DEFAULT_ORDER: HomeSectionId[] = [
  'hero',
  'featured_categories',
  'new_arrivals',
  'crazy_carousel',
  'banner_grid_split',
  'shop_the_look',
  'best_sellers',
  'latest_products',
  'newsletter_strip',
];

const DEFAULT_ENABLED: Record<HomeSectionId, boolean> = {
  hero: true,
  featured_categories: true,
  new_arrivals: true,
  crazy_carousel: true,
  banner_grid_split: true,
  shop_the_look: true,
  best_sellers: true,
  latest_products: true,
  newsletter_strip: true,
};

const VALID_IDS = new Set<HomeSectionId>(DEFAULT_ORDER);

export function isHomeSectionId(id: string): id is HomeSectionId {
  return VALID_IDS.has(id as HomeSectionId);
}

function normalizeOrder(order: HomeSectionId[] | undefined): HomeSectionId[] {
  const seen = new Set<HomeSectionId>();
  const out: HomeSectionId[] = [];
  for (const id of order || []) {
    if (VALID_IDS.has(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  for (const id of DEFAULT_ORDER) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

export function resolveStorefrontConfig(
  stored: StorefrontConfigStored | null | undefined
): StorefrontConfigResolved {
  const order = normalizeOrder(stored?.homeSectionOrder);
  const sections = stored?.sections || {};

  const homeSections: HomeSectionResolved[] = order.map((id) => {
    const o = sections[id];
    return {
      id,
      enabled: o?.enabled ?? DEFAULT_ENABLED[id],
      title: o?.title?.trim() || undefined,
    };
  });

  return {
    version: stored?.version ?? STOREFRONT_CONFIG_VERSION,
    homeSectionOrder: order,
    sections: stored?.sections,
    theme: stored?.theme,
    newsletter: stored?.newsletter,
    heroBannerUrls: stored?.heroBannerUrls,
    collections: stored?.collections,
    homeSections,
  };
}

/** Valida y limpia body de PUT (solo claves conocidas) */
export function parseStorefrontConfigPatch(body: unknown): {
  ok: true;
  patch: StorefrontConfigStored;
} | { ok: false; error: string } {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Body debe ser un objeto JSON' };
  }

  const b = body as Record<string, unknown>;
  const patch: StorefrontConfigStored = {};

  if (b.homeSectionOrder !== undefined) {
    if (!Array.isArray(b.homeSectionOrder)) {
      return { ok: false, error: 'homeSectionOrder debe ser un array de ids' };
    }
    const order: HomeSectionId[] = [];
    for (const x of b.homeSectionOrder) {
      if (typeof x !== 'string' || !isHomeSectionId(x)) {
        return { ok: false, error: `Id de sección inválido: ${String(x)}` };
      }
      order.push(x);
    }
    patch.homeSectionOrder = order;
  }

  if (b.sections !== undefined) {
    if (typeof b.sections !== 'object' || b.sections === null || Array.isArray(b.sections)) {
      return { ok: false, error: 'sections debe ser un objeto' };
    }
    const sec: StorefrontConfigStored['sections'] = {};
    for (const [key, val] of Object.entries(b.sections as Record<string, unknown>)) {
      if (!isHomeSectionId(key)) continue;
      if (val === null || typeof val !== 'object' || Array.isArray(val)) continue;
      const v = val as Record<string, unknown>;
      const entry: { enabled?: boolean; title?: string } = {};
      if (typeof v.enabled === 'boolean') entry.enabled = v.enabled;
      if (typeof v.title === 'string') entry.title = v.title.slice(0, 200);
      if (Object.keys(entry).length) sec[key as HomeSectionId] = entry;
    }
    if (Object.keys(sec).length) patch.sections = sec;
  }

  if (b.theme !== undefined) {
    if (typeof b.theme !== 'object' || b.theme === null || Array.isArray(b.theme)) {
      return { ok: false, error: 'theme debe ser un objeto' };
    }
    const t = b.theme as Record<string, unknown>;
    patch.theme = {};
    if (typeof t.primaryColor === 'string') patch.theme.primaryColor = t.primaryColor.slice(0, 32);
    if (typeof t.backgroundColor === 'string')
      patch.theme.backgroundColor = t.backgroundColor.slice(0, 32);
    if (typeof t.fontFamily === 'string') patch.theme.fontFamily = t.fontFamily.slice(0, 200);
    if (Object.keys(patch.theme).length === 0) delete patch.theme;
  }

  if (b.newsletter !== undefined) {
    if (typeof b.newsletter !== 'object' || b.newsletter === null || Array.isArray(b.newsletter)) {
      return { ok: false, error: 'newsletter debe ser un objeto' };
    }
    const n = b.newsletter as Record<string, unknown>;
    patch.newsletter = {};
    if (typeof n.popupDelayMs === 'number' && Number.isFinite(n.popupDelayMs)) {
      patch.newsletter.popupDelayMs = Math.max(5_000, Math.min(n.popupDelayMs, 3_600_000));
    }
    if (typeof n.cooldownDays === 'number' && Number.isFinite(n.cooldownDays)) {
      patch.newsletter.cooldownDays = Math.max(1, Math.min(Math.floor(n.cooldownDays), 90));
    }
    if (typeof n.dismissBeforeCooldown === 'number' && Number.isFinite(n.dismissBeforeCooldown)) {
      patch.newsletter.dismissBeforeCooldown = Math.max(1, Math.min(Math.floor(n.dismissBeforeCooldown), 20));
    }
    if (Object.keys(patch.newsletter).length === 0) delete patch.newsletter;
  }

  if (b.heroBannerUrls !== undefined) {
    if (!Array.isArray(b.heroBannerUrls)) {
      return { ok: false, error: 'heroBannerUrls debe ser un array de strings' };
    }
    const urls: string[] = [];
    for (const u of b.heroBannerUrls) {
      if (typeof u !== 'string' || u.length > 2048) continue;
      if (u.startsWith('/') || u.startsWith('http://') || u.startsWith('https://')) {
        urls.push(u);
      }
    }
    patch.heroBannerUrls = urls.slice(0, 20);
  }

  if (typeof b.version === 'number' && Number.isInteger(b.version) && b.version > 0) {
    patch.version = b.version;
  }

  if (b.collections !== undefined) {
    if (typeof b.collections !== 'object' || b.collections === null || Array.isArray(b.collections)) {
      return { ok: false, error: 'collections debe ser un objeto' };
    }
    const c = b.collections as Record<string, unknown>;
    const col: CollectionsPageStored = {};
    if ('editorialLeftUrl' in c) {
      const left = c.editorialLeftUrl;
      if (typeof left === 'string' && left.length <= 2048) {
        if (left.trim() === '') col.editorialLeftUrl = '';
        else if (left.startsWith('/') || left.startsWith('http://') || left.startsWith('https://')) {
          col.editorialLeftUrl = left.trim();
        }
      }
    }
    if ('editorialGridUrl' in c) {
      const grid = c.editorialGridUrl;
      if (typeof grid === 'string' && grid.length <= 2048) {
        if (grid.trim() === '') col.editorialGridUrl = '';
        else if (grid.startsWith('/') || grid.startsWith('http://') || grid.startsWith('https://')) {
          col.editorialGridUrl = grid.trim();
        }
      }
    }
    patch.collections = col;
  }

  return { ok: true, patch };
}

export function mergeStorefrontPatch(
  existing: StorefrontConfigStored | null,
  patch: StorefrontConfigStored
): StorefrontConfigStored {
  const base = existing || {};
  const merged: StorefrontConfigStored = {
    ...base,
    ...patch,
    sections: {
      ...(base.sections || {}),
      ...(patch.sections || {}),
    },
    theme: { ...(base.theme || {}), ...(patch.theme || {}) },
    newsletter: { ...(base.newsletter || {}), ...(patch.newsletter || {}) },
  };
  if (patch.heroBannerUrls !== undefined) merged.heroBannerUrls = patch.heroBannerUrls;
  if (patch.homeSectionOrder !== undefined) merged.homeSectionOrder = patch.homeSectionOrder;
  if (patch.collections !== undefined) {
    const next: CollectionsPageStored = { ...(base.collections || {}) };
    for (const key of ['editorialLeftUrl', 'editorialGridUrl'] as const) {
      if (!(key in patch.collections!)) continue;
      const v = patch.collections![key];
      if (typeof v === 'string' && v.trim()) next[key] = v.trim();
      else delete next[key];
    }
    merged.collections = Object.keys(next).length ? next : undefined;
  }
  merged.version = STOREFRONT_CONFIG_VERSION;
  return merged;
}
