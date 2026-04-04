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

export type HomeHeroSlideKind = 'image' | 'video';

/** Slides del hero: imagen o video (URL directa mp4/webm, etc.) */
export interface HomeHeroSlideStored {
  url: string;
  kind: HomeHeroSlideKind;
}

/** Banners mitad y mitad bajo la home (reemplaza placeholders si cargás URLs) */
export interface HomeBannerSplitStored {
  leftUrl?: string;
  rightUrl?: string;
  leftHref?: string;
  rightHref?: string;
  leftLabel?: string;
  rightLabel?: string;
}

/** Ajustes del popup newsletter (GET público `/api/storefront-config?shop=`) */
export interface StorefrontNewsletter {
  popupDelayMs?: number;
  cooldownDays?: number;
  /** Cierres antes del cooldown largo (default 3 cierres → 7 días) */
  dismissBeforeCooldown?: number;
  /** Si es false, no se muestra el popup */
  popupEnabled?: boolean;
  popupTitle?: string;
  popupSubtitle?: string;
  popupImageUrl?: string;
  popupDisclaimer?: string;
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
  /** Hero con tipo por slide (preferido sobre heroBannerUrls si tiene ítems) */
  homeHeroSlides?: HomeHeroSlideStored[];
  /** Banners dobles (split) en home */
  bannerSplit?: HomeBannerSplitStored;
  /** Página /collections: imagen editorial + slot en grilla (moderás vos las URLs) */
  collections?: CollectionsPageStored;
}

export type CollectionsGridCellMode = 'random' | 'product' | 'media';

/** Una celda de la grilla 2×2 junto al editorial */
export interface CollectionsGridCellStored {
  mode: CollectionsGridCellMode;
  /** ID numérico de producto Tiendanube (modo product) */
  productId?: number;
  /** URL imagen o video (modo media) */
  url?: string;
  mediaKind?: 'image' | 'video';
}

/** Bloque “de 6”: 1 editorial grande + grilla 2×2 (4 celdas). Siguiente bloque puede ir invertido. */
export interface CollectionsEditorialBlockStored {
  layout: 'editorial-left' | 'editorial-right';
  editorialUrl: string;
  editorialKind?: 'image' | 'video';
  gridCells: CollectionsGridCellStored[];
}

/** Configuración visual de /collections */
export interface CollectionsPageStored {
  /** Columna izquierda grande (legacy; si hay editorialBlocks se ignora en la página) */
  editorialLeftUrl?: string;
  /** Celda inferior derecha legacy */
  editorialGridUrl?: string;
  /** Bloques editorial + 2×2 alternables (preferido) */
  editorialBlocks?: CollectionsEditorialBlockStored[];
}

export interface StorefrontConfigResolved extends StorefrontConfigStored {
  version: number;
  homeSections: HomeSectionResolved[];
  /** Slides efectivos del hero (homeHeroSlides o derivado de heroBannerUrls) */
  homeHeroSlidesResolved: HomeHeroSlideStored[];
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

function isAllowedAssetUrl(u: string): boolean {
  const t = u.trim();
  if (!t || t.length > 2048) return false;
  return t.startsWith('/') || t.startsWith('http://') || t.startsWith('https://');
}

function computeHomeHeroSlides(stored: StorefrontConfigStored | null | undefined): HomeHeroSlideStored[] {
  const slides = stored?.homeHeroSlides;
  if (Array.isArray(slides) && slides.length > 0) {
    return slides
      .filter(
        (s) =>
          s &&
          typeof s.url === 'string' &&
          isAllowedAssetUrl(s.url) &&
          (s.kind === 'video' || s.kind === 'image')
      )
      .map((s) => ({ url: s.url.trim(), kind: s.kind === 'video' ? 'video' : 'image' }));
  }
  const urls = stored?.heroBannerUrls;
  if (Array.isArray(urls) && urls.length > 0) {
    return urls
      .filter((u) => typeof u === 'string' && isAllowedAssetUrl(u))
      .map((url) => ({ url: url.trim(), kind: 'image' as const }));
  }
  return [];
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
    homeHeroSlides: stored?.homeHeroSlides,
    bannerSplit: stored?.bannerSplit,
    collections: stored?.collections,
    homeSections,
    homeHeroSlidesResolved: computeHomeHeroSlides(stored),
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
    if ('popupEnabled' in n) {
      if (typeof n.popupEnabled !== 'boolean') {
        return { ok: false, error: 'popupEnabled debe ser booleano' };
      }
      patch.newsletter.popupEnabled = n.popupEnabled;
    }
    if ('popupTitle' in n) {
      if (typeof n.popupTitle !== 'string') {
        return { ok: false, error: 'popupTitle inválido' };
      }
      patch.newsletter.popupTitle = n.popupTitle.trim().slice(0, 200);
    }
    if ('popupSubtitle' in n) {
      if (typeof n.popupSubtitle !== 'string') {
        return { ok: false, error: 'popupSubtitle inválido' };
      }
      patch.newsletter.popupSubtitle = n.popupSubtitle.trim().slice(0, 400);
    }
    if ('popupImageUrl' in n) {
      if (typeof n.popupImageUrl !== 'string') {
        return { ok: false, error: 'popupImageUrl inválido' };
      }
      const t = n.popupImageUrl.trim().slice(0, 2048);
      if (!t) patch.newsletter.popupImageUrl = '';
      else if (isAllowedAssetUrl(t)) patch.newsletter.popupImageUrl = t;
    }
    if ('popupDisclaimer' in n) {
      if (typeof n.popupDisclaimer !== 'string') {
        return { ok: false, error: 'popupDisclaimer inválido' };
      }
      patch.newsletter.popupDisclaimer = n.popupDisclaimer.trim().slice(0, 600);
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
      if (isAllowedAssetUrl(u)) {
        urls.push(u.trim());
      }
    }
    patch.heroBannerUrls = urls.slice(0, 20);
  }

  if (b.homeHeroSlides !== undefined) {
    if (!Array.isArray(b.homeHeroSlides)) {
      return { ok: false, error: 'homeHeroSlides debe ser un array' };
    }
    const items: HomeHeroSlideStored[] = [];
    for (const raw of b.homeHeroSlides) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
      const o = raw as Record<string, unknown>;
      const url = o.url;
      const kind = o.kind;
      if (typeof url !== 'string' || !isAllowedAssetUrl(url)) continue;
      const k = kind === 'video' ? 'video' : 'image';
      items.push({ url: url.trim(), kind: k });
    }
    patch.homeHeroSlides = items.slice(0, 20);
  }

  if (b.bannerSplit !== undefined) {
    if (typeof b.bannerSplit !== 'object' || b.bannerSplit === null || Array.isArray(b.bannerSplit)) {
      return { ok: false, error: 'bannerSplit debe ser un objeto' };
    }
    const s = b.bannerSplit as Record<string, unknown>;
    const split: HomeBannerSplitStored = {};
    const strFields: (keyof HomeBannerSplitStored)[] = [
      'leftUrl',
      'rightUrl',
      'leftHref',
      'rightHref',
      'leftLabel',
      'rightLabel',
    ];
    for (const key of strFields) {
      if (!(key in s)) continue;
      const v = s[key];
      if (typeof v !== 'string' || v.length > 2048) continue;
      if (v.trim() === '') {
        (split as Record<string, string>)[key] = '';
      } else if (key === 'leftLabel' || key === 'rightLabel') {
        split[key] = v.trim().slice(0, 80);
      } else if (key === 'leftHref' || key === 'rightHref') {
        const h = v.trim();
        if (h.startsWith('/') || h.startsWith('http://') || h.startsWith('https://')) {
          split[key] = h.slice(0, 2048);
        }
      } else if (isAllowedAssetUrl(v)) {
        split[key] = v.trim();
      }
    }
    patch.bannerSplit = split;
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
    if ('editorialBlocks' in c) {
      const arr = c.editorialBlocks;
      if (!Array.isArray(arr)) {
        return { ok: false, error: 'collections.editorialBlocks debe ser un array' };
      }
      const blocks: CollectionsEditorialBlockStored[] = [];
      for (const raw of arr.slice(0, 12)) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
        const o = raw as Record<string, unknown>;
        const layout = o.layout;
        if (layout !== 'editorial-left' && layout !== 'editorial-right') continue;
        const editorialUrl = o.editorialUrl;
        if (typeof editorialUrl !== 'string' || editorialUrl.length > 2048) continue;
        const eu = editorialUrl.trim();
        if (!eu || !isAllowedAssetUrl(eu)) continue;
        const editorialKind = o.editorialKind === 'video' ? 'video' : 'image';
        const cellsRaw = o.gridCells;
        if (!Array.isArray(cellsRaw)) continue;
        const gridCells: CollectionsGridCellStored[] = [];
        for (const cell of cellsRaw.slice(0, 4)) {
          if (!cell || typeof cell !== 'object' || Array.isArray(cell)) continue;
          const ce = cell as Record<string, unknown>;
          const mode = ce.mode;
          if (mode !== 'random' && mode !== 'product' && mode !== 'media') continue;
          const entry: CollectionsGridCellStored = { mode };
          if (mode === 'product') {
            const pid = ce.productId;
            if (typeof pid === 'number' && Number.isFinite(pid)) {
              entry.productId = Math.floor(pid);
            } else if (typeof pid === 'string' && /^\d+$/.test(pid.trim())) {
              entry.productId = parseInt(pid.trim(), 10);
            }
          }
          if (mode === 'media') {
            const u = typeof ce.url === 'string' ? ce.url.trim() : '';
            if (u && isAllowedAssetUrl(u)) {
              entry.url = u.slice(0, 2048);
              entry.mediaKind = ce.mediaKind === 'video' ? 'video' : 'image';
              gridCells.push(entry);
            } else {
              gridCells.push({ mode: 'random' });
            }
            continue;
          }
          gridCells.push(entry);
        }
        while (gridCells.length < 4) {
          gridCells.push({ mode: 'random' });
        }
        blocks.push({
          layout,
          editorialUrl: eu,
          editorialKind,
          gridCells: gridCells.slice(0, 4),
        });
      }
      col.editorialBlocks = blocks;
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
  const { newsletter: patchNewsletter, ...patchRest } = patch;
  const merged: StorefrontConfigStored = {
    ...base,
    ...patchRest,
    sections: {
      ...(base.sections || {}),
      ...(patch.sections || {}),
    },
    theme: { ...(base.theme || {}), ...(patch.theme || {}) },
  };
  if (patch.heroBannerUrls !== undefined) merged.heroBannerUrls = patch.heroBannerUrls;
  if (patch.homeSectionOrder !== undefined) merged.homeSectionOrder = patch.homeSectionOrder;

  if (patch.homeHeroSlides !== undefined) {
    if (patch.homeHeroSlides.length > 0) {
      merged.homeHeroSlides = patch.homeHeroSlides;
      merged.heroBannerUrls = undefined;
    } else {
      merged.homeHeroSlides = undefined;
    }
  }

  if (patch.bannerSplit !== undefined) {
    const next: HomeBannerSplitStored = { ...(base.bannerSplit || {}) };
    for (const key of [
      'leftUrl',
      'rightUrl',
      'leftHref',
      'rightHref',
      'leftLabel',
      'rightLabel',
    ] as const) {
      if (!(key in patch.bannerSplit!)) continue;
      const v = patch.bannerSplit![key];
      if (typeof v === 'string' && v.trim()) (next as Record<string, string>)[key] = v.trim();
      else delete (next as Record<string, string>)[key];
    }
    merged.bannerSplit = Object.keys(next).length ? next : undefined;
  }

  if (patch.collections !== undefined) {
    const next: CollectionsPageStored = { ...(base.collections || {}) };
    if ('editorialBlocks' in patch.collections!) {
      const eb = patch.collections!.editorialBlocks;
      if (Array.isArray(eb) && eb.length > 0) {
        next.editorialBlocks = eb;
      } else {
        delete next.editorialBlocks;
      }
    }
    for (const key of ['editorialLeftUrl', 'editorialGridUrl'] as const) {
      if (!(key in patch.collections!)) continue;
      const v = patch.collections![key];
      if (typeof v === 'string' && v.trim()) next[key] = v.trim();
      else delete next[key];
    }
    merged.collections = Object.keys(next).length ? next : undefined;
  }

  if (patchNewsletter !== undefined) {
    const nk: StorefrontNewsletter = { ...(base.newsletter || {}), ...patchNewsletter };
    for (const k of ['popupTitle', 'popupSubtitle', 'popupImageUrl', 'popupDisclaimer'] as const) {
      const v = nk[k];
      if (typeof v === 'string' && v.trim() === '') {
        delete nk[k];
      }
    }
    merged.newsletter = Object.keys(nk).length ? nk : undefined;
  } else {
    merged.newsletter = base.newsletter;
  }

  merged.version = STOREFRONT_CONFIG_VERSION;
  return merged;
}
