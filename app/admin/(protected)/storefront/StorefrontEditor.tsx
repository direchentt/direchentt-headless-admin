'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  CollectionsEditorialBlockStored,
  CollectionsGridCellMode,
  CollectionsGridCellStored,
  HomeHeroSlideStored,
  HomeSectionId,
  StorefrontConfigResolved,
} from '@/lib/storefront-config';
import { saveStorefrontFromAdmin } from '../actions';

function formatHeroInitial(config: StorefrontConfigResolved): string {
  const slides = config.homeHeroSlides;
  if (slides?.length) {
    return slides.map((s) => (s.kind === 'video' ? `video ${s.url}` : s.url)).join('\n');
  }
  return (config.heroBannerUrls || []).join('\n');
}

function isAllowedHeroUrl(u: string): boolean {
  const t = u.trim();
  if (!t) return false;
  return t.startsWith('/') || t.startsWith('http://') || t.startsWith('https://');
}

function parseHeroLines(text: string): HomeHeroSlideStored[] {
  const out: HomeHeroSlideStored[] = [];
  for (const line of text.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const lower = line.toLowerCase();
    if (lower.startsWith('video ')) {
      const url = line.slice(6).trim();
      if (isAllowedHeroUrl(url)) out.push({ url, kind: 'video' });
    } else if (lower.startsWith('video:')) {
      const url = line.slice(6).trim();
      if (isAllowedHeroUrl(url)) out.push({ url, kind: 'video' });
    } else if (isAllowedHeroUrl(line)) {
      out.push({ url: line.trim(), kind: 'image' });
    }
  }
  return out.slice(0, 20);
}

type CollectionsCellForm = {
  mode: CollectionsGridCellMode;
  productIdStr: string;
  url: string;
  mediaKind: 'image' | 'video';
};

type CollectionsBlockForm = {
  layout: 'editorial-left' | 'editorial-right';
  editorialUrl: string;
  editorialKind: 'image' | 'video';
  cells: CollectionsCellForm[];
};

function emptyCollectionsCell(): CollectionsCellForm {
  return { mode: 'random', productIdStr: '', url: '', mediaKind: 'image' };
}

function emptyCollectionsBlock(): CollectionsBlockForm {
  return {
    layout: 'editorial-left',
    editorialUrl: '',
    editorialKind: 'image',
    cells: [
      emptyCollectionsCell(),
      emptyCollectionsCell(),
      emptyCollectionsCell(),
      emptyCollectionsCell(),
    ],
  };
}

function collectionsBlocksFromInitial(
  blocks: CollectionsEditorialBlockStored[] | undefined
): CollectionsBlockForm[] {
  if (!blocks?.length) return [];
  return blocks.map((b) => {
    const cells = (b.gridCells || []).slice(0, 4).map((c) => ({
      mode: c.mode,
      productIdStr: c.productId != null ? String(c.productId) : '',
      url: c.url || '',
      mediaKind: (c.mediaKind === 'video' ? 'video' : 'image') as 'image' | 'video',
    }));
    while (cells.length < 4) cells.push(emptyCollectionsCell());
    return {
      layout: b.layout,
      editorialUrl: b.editorialUrl,
      editorialKind: b.editorialKind === 'video' ? 'video' : 'image',
      cells: cells.slice(0, 4),
    };
  });
}

function collectionsFormsToStored(forms: CollectionsBlockForm[]): CollectionsEditorialBlockStored[] {
  return forms
    .filter((f) => f.editorialUrl.trim())
    .map((f) => {
      const gridCells: CollectionsGridCellStored[] = [];
      for (const c of f.cells.slice(0, 4)) {
        if (c.mode === 'media') {
          const u = c.url.trim();
          if (!u) gridCells.push({ mode: 'random' });
          else
            gridCells.push({
              mode: 'media',
              url: u,
              mediaKind: c.mediaKind === 'video' ? 'video' : 'image',
            });
          continue;
        }
        if (c.mode === 'product') {
          const pid = parseInt(c.productIdStr.trim(), 10);
          if (!Number.isFinite(pid)) gridCells.push({ mode: 'random' });
          else gridCells.push({ mode: 'product', productId: pid });
          continue;
        }
        gridCells.push({ mode: 'random' });
      }
      while (gridCells.length < 4) gridCells.push({ mode: 'random' });
      return {
        layout: f.layout,
        editorialUrl: f.editorialUrl.trim(),
        editorialKind: f.editorialKind === 'video' ? 'video' : 'image',
        gridCells: gridCells.slice(0, 4),
      };
    });
}

const LABELS: Record<HomeSectionId, string> = {
  hero: 'Hero (carrusel principal)',
  featured_categories: 'Categorías destacadas',
  new_arrivals: 'Novedades',
  crazy_carousel: 'Carrusel de productos',
  banner_grid_split: 'Banners (split)',
  shop_the_look: 'Completa el look',
  best_sellers: 'Más vendidos',
  latest_products: 'Lo último',
  newsletter_strip: 'Franja newsletter',
};

interface Props {
  storeId: number;
  initialConfig: StorefrontConfigResolved;
}

export default function StorefrontEditor({ storeId, initialConfig }: Props) {
  const router = useRouter();
  const [order, setOrder] = useState<HomeSectionId[]>(() =>
    initialConfig.homeSections.map((s) => s.id)
  );
  const [sections, setSections] = useState(() => {
    const m: Record<string, { enabled: boolean; title: string }> = {};
    for (const s of initialConfig.homeSections) {
      m[s.id] = { enabled: s.enabled, title: s.title || '' };
    }
    return m as Record<HomeSectionId, { enabled: boolean; title: string }>;
  });
  const [theme, setTheme] = useState({
    primaryColor: initialConfig.theme?.primaryColor || '',
    backgroundColor: initialConfig.theme?.backgroundColor || '',
    fontFamily: initialConfig.theme?.fontFamily || '',
  });
  const [newsletter, setNewsletter] = useState({
    popupEnabled: initialConfig.newsletter?.popupEnabled !== false,
    popupDelayMs: initialConfig.newsletter?.popupDelayMs ?? '',
    cooldownDays: initialConfig.newsletter?.cooldownDays ?? '',
    dismissBeforeCooldown: initialConfig.newsletter?.dismissBeforeCooldown ?? '',
    popupTitle: initialConfig.newsletter?.popupTitle ?? '',
    popupSubtitle: initialConfig.newsletter?.popupSubtitle ?? '',
    popupImageUrl: initialConfig.newsletter?.popupImageUrl ?? '',
    popupDisclaimer: initialConfig.newsletter?.popupDisclaimer ?? '',
  });
  const [heroUrls, setHeroUrls] = useState(() => formatHeroInitial(initialConfig));
  const bs = initialConfig.bannerSplit || {};
  const [splitLeftUrl, setSplitLeftUrl] = useState(bs.leftUrl || '');
  const [splitRightUrl, setSplitRightUrl] = useState(bs.rightUrl || '');
  const [splitLeftHref, setSplitLeftHref] = useState(bs.leftHref || '');
  const [splitRightHref, setSplitRightHref] = useState(bs.rightHref || '');
  const [splitLeftLabel, setSplitLeftLabel] = useState(bs.leftLabel || '');
  const [splitRightLabel, setSplitRightLabel] = useState(bs.rightLabel || '');
  const [collectionsLeft, setCollectionsLeft] = useState(
    initialConfig.collections?.editorialLeftUrl || ''
  );
  const [collectionsGrid, setCollectionsGrid] = useState(
    initialConfig.collections?.editorialGridUrl || ''
  );
  const [colBlocks, setColBlocks] = useState<CollectionsBlockForm[]>(() =>
    collectionsBlocksFromInitial(initialConfig.collections?.editorialBlocks)
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');

  const orderedSections = useMemo(
    () => order.map((id) => ({ id, ...sections[id] })),
    [order, sections]
  );

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  function toggleEnabled(id: HomeSectionId) {
    setSections((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
  }

  function setTitle(id: HomeSectionId, title: string) {
    setSections((prev) => ({
      ...prev,
      [id]: { ...prev[id], title },
    }));
  }

  async function save() {
    setStatus('saving');
    setMsg('');
    const heroParsed = parseHeroLines(heroUrls);
    const body: Record<string, unknown> = {
      homeSectionOrder: order,
      sections: {} as Record<string, { enabled: boolean; title?: string }>,
    };
    for (const id of order) {
      const s = sections[id];
      const entry: { enabled: boolean; title?: string } = { enabled: s.enabled };
      if (s.title.trim()) entry.title = s.title.trim();
      (body.sections as Record<string, unknown>)[id] = entry;
    }
    const t: Record<string, string> = {};
    if (theme.primaryColor.trim()) t.primaryColor = theme.primaryColor.trim();
    if (theme.backgroundColor.trim()) t.backgroundColor = theme.backgroundColor.trim();
    if (theme.fontFamily.trim()) t.fontFamily = theme.fontFamily.trim();
    if (Object.keys(t).length) body.theme = t;

    const nl: Record<string, unknown> = {
      popupEnabled: newsletter.popupEnabled,
      popupTitle: newsletter.popupTitle,
      popupSubtitle: newsletter.popupSubtitle,
      popupImageUrl: newsletter.popupImageUrl,
      popupDisclaimer: newsletter.popupDisclaimer,
    };
    if (newsletter.popupDelayMs !== '' && newsletter.popupDelayMs !== null) {
      const v = Number(newsletter.popupDelayMs);
      if (Number.isFinite(v)) nl.popupDelayMs = v;
    }
    if (newsletter.cooldownDays !== '' && newsletter.cooldownDays !== null) {
      const v = Number(newsletter.cooldownDays);
      if (Number.isFinite(v)) nl.cooldownDays = v;
    }
    if (
      newsletter.dismissBeforeCooldown !== '' &&
      newsletter.dismissBeforeCooldown !== null
    ) {
      const v = Number(newsletter.dismissBeforeCooldown);
      if (Number.isFinite(v)) nl.dismissBeforeCooldown = v;
    }
    body.newsletter = nl;

    body.homeHeroSlides = heroParsed;
    body.heroBannerUrls = [];

    body.bannerSplit = {
      leftUrl: splitLeftUrl,
      rightUrl: splitRightUrl,
      leftHref: splitLeftHref,
      rightHref: splitRightHref,
      leftLabel: splitLeftLabel,
      rightLabel: splitRightLabel,
    };

    body.collections = {
      editorialLeftUrl: collectionsLeft,
      editorialGridUrl: collectionsGrid,
      editorialBlocks: collectionsFormsToStored(colBlocks),
    };

    const res = await saveStorefrontFromAdmin(storeId, body);
    if (res.ok) {
      setStatus('ok');
      setMsg('Cambios guardados.');
      router.refresh();
    } else {
      setStatus('err');
      setMsg(res.error);
    }
  }

  return (
    <div className="sf">
      <div className="sf-head">
        <div className="sf-head-text">
          <h1 className="sf-title">Tienda en línea</h1>
          <p className="sf-sub">
            Editás la home y colecciones que ven tus clientes. Los productos siguen en Tiendanube.
          </p>
        </div>
        <div className="sf-head-actions">
          <label className="sf-shop">
            ID de tienda (Nuvemshop)
            <input
              type="number"
              value={storeId}
              readOnly
              className="sf-shop-input"
              title="Cambiá de tienda con ?shop= en la barra de direcciones"
            />
          </label>
          <button
            type="button"
            className="sf-btn primary sf-btn-desktop"
            onClick={save}
            disabled={status === 'saving'}
          >
            {status === 'saving' ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <aside className="sf-intro" aria-label="Ayuda rápida">
        <p className="sf-intro-title">En 3 pasos</p>
        <ol className="sf-intro-list">
          <li>Activá o desactivá bloques y subí las URLs del hero o banners.</li>
          <li>Tocá <strong>Guardar cambios</strong> (abajo en el celular también).</li>
          <li>Abrí la tienda pública con <code>?shop={storeId}</code> y recargá para ver el resultado.</li>
        </ol>
      </aside>

      {msg ? (
        <p className={status === 'err' ? 'sf-banner err' : 'sf-banner ok'} role="status">
          {msg}
        </p>
      ) : null}
      <p className="sf-hint">
        Otra tienda: en el navegador usá la ruta{' '}
        <code>/admin/storefront?shop=TU_ID</code>
      </p>

      <section className="sf-panel">
        <h2 className="sf-h2">Bloques de la home</h2>
        <p className="sf-p">
          Usá <strong>Subir / Bajar</strong> para el orden vertical. Desmarcá un bloque para ocultarlo en
          la tienda pública.
        </p>
        <ul className="sf-list">
          {orderedSections.map((row, idx) => (
            <li key={row.id} className="sf-row">
              <div className="sf-row-move">
                <button type="button" className="sf-icon-btn" onClick={() => move(idx, -1)} disabled={idx === 0}>
                  ↑
                </button>
                <button
                  type="button"
                  className="sf-icon-btn"
                  onClick={() => move(idx, 1)}
                  disabled={idx === order.length - 1}
                >
                  ↓
                </button>
              </div>
              <label className="sf-check">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={() => toggleEnabled(row.id)}
                />
                <span className="sf-label-text">{LABELS[row.id]}</span>
              </label>
              <input
                type="text"
                className="sf-title-input"
                placeholder="Título opcional"
                value={row.title}
                onChange={(e) => setTitle(row.id, e.target.value)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="sf-panel">
        <h2 className="sf-h2">Tema (CSS básico)</h2>
        <div className="sf-grid">
          <label className="sf-field">
            Color de fondo (main)
            <input
              value={theme.backgroundColor}
              onChange={(e) => setTheme((t) => ({ ...t, backgroundColor: e.target.value }))}
              placeholder="#ffffff"
            />
          </label>
          <label className="sf-field">
            Color primario (reservado)
            <input
              value={theme.primaryColor}
              onChange={(e) => setTheme((t) => ({ ...t, primaryColor: e.target.value }))}
              placeholder="#111111"
            />
          </label>
          <label className="sf-field span-2">
            Tipografía (font-family)
            <input
              value={theme.fontFamily}
              onChange={(e) => setTheme((t) => ({ ...t, fontFamily: e.target.value }))}
              placeholder="-apple-system, BlinkMacSystemFont, sans-serif"
            />
          </label>
        </div>
      </section>

      <section className="sf-panel">
        <h2 className="sf-h2">Hero (imágenes y videos)</h2>
        <p className="sf-p">
          Una línea por slide. Imagen: URL directa (<code>/banners/...</code> o <code>https://</code>).
          Video: línea que empiece con <code>video </code> y la URL del archivo (mp4/webm). Vacío =
          banners por defecto del tema.
        </p>
        <textarea
          className="sf-textarea"
          rows={6}
          value={heroUrls}
          onChange={(e) => setHeroUrls(e.target.value)}
          placeholder={'https://cdn.../foto.jpg\nvideo https://cdn.../loop.mp4'}
        />
      </section>

      <section className="sf-panel">
        <h2 className="sf-h2">Banners mitad y mitad (home)</h2>
        <p className="sf-p">
          Si dejás vacías las URLs, se usan las imágenes por defecto del proyecto. Los enlaces pueden
          ser rutas internas (<code>/categoria/ID</code>) o <code>https://</code>.
        </p>
        <div className="sf-grid">
          <label className="sf-field">
            Imagen izquierda (URL)
            <input
              value={splitLeftUrl}
              onChange={(e) => setSplitLeftUrl(e.target.value)}
              placeholder="/banners/....png"
            />
          </label>
          <label className="sf-field">
            Imagen derecha (URL)
            <input
              value={splitRightUrl}
              onChange={(e) => setSplitRightUrl(e.target.value)}
              placeholder="/banners/....png"
            />
          </label>
          <label className="sf-field">
            Enlace izquierdo
            <input
              value={splitLeftHref}
              onChange={(e) => setSplitLeftHref(e.target.value)}
              placeholder="/categoria/32586185"
            />
          </label>
          <label className="sf-field">
            Enlace derecho
            <input
              value={splitRightHref}
              onChange={(e) => setSplitRightHref(e.target.value)}
              placeholder="/categoria/32586186"
            />
          </label>
          <label className="sf-field">
            Texto izquierda
            <input
              value={splitLeftLabel}
              onChange={(e) => setSplitLeftLabel(e.target.value)}
              placeholder="MUJER"
            />
          </label>
          <label className="sf-field">
            Texto derecha
            <input
              value={splitRightLabel}
              onChange={(e) => setSplitRightLabel(e.target.value)}
              placeholder="HOMBRE"
            />
          </label>
        </div>
      </section>

      <section className="sf-panel">
        <h2 className="sf-h2">Página /collections — bloques editorial + 4 celdas</h2>
        <p className="sf-p">
          Cada bloque es <strong>1 imagen o video grande</strong> + <strong>grilla 2×2</strong> (4 celdas).
          Podés alternar: <em>Editorial izquierda</em> o <em>invertido</em> (grilla izquierda, editorial
          derecha). En cada celda: producto aleatorio, producto por ID de Tiendanube, o URL de imagen/video.
          Si hay al menos un bloque con URL editorial, esta sección tiene prioridad sobre el modo antiguo de
          abajo.
        </p>
        <button
          type="button"
          className="sf-btn primary"
          style={{ marginBottom: 16 }}
          onClick={() => setColBlocks((prev) => [...prev, emptyCollectionsBlock()])}
        >
          + Añadir bloque
        </button>
        {colBlocks.map((block, bi) => (
          <div
            key={bi}
            className="sf-panel"
            style={{
              marginBottom: 14,
              padding: 16,
              border: '1px solid #e1e3e5',
              borderRadius: 10,
              background: '#fafbfb',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <strong style={{ fontSize: 14 }}>Bloque {bi + 1}</strong>
              <button
                type="button"
                className="sf-icon-btn"
                onClick={() => setColBlocks((prev) => prev.filter((_, i) => i !== bi))}
              >
                Quitar bloque
              </button>
            </div>
            <div className="sf-grid">
              <label className="sf-field">
                Disposición
                <select
                  value={block.layout}
                  onChange={(e) =>
                    setColBlocks((prev) =>
                      prev.map((b, i) =>
                        i === bi
                          ? {
                              ...b,
                              layout: e.target.value as CollectionsBlockForm['layout'],
                            }
                          : b
                      )
                    )
                  }
                >
                  <option value="editorial-left">Editorial izquierda · grilla derecha</option>
                  <option value="editorial-right">Invertido · grilla izquierda</option>
                </select>
              </label>
              <label className="sf-field">
                Tipo editorial
                <select
                  value={block.editorialKind}
                  onChange={(e) =>
                    setColBlocks((prev) =>
                      prev.map((b, i) =>
                        i === bi
                          ? {
                              ...b,
                              editorialKind: e.target.value as 'image' | 'video',
                            }
                          : b
                      )
                    )
                  }
                >
                  <option value="image">Imagen</option>
                  <option value="video">Video (URL mp4/webm)</option>
                </select>
              </label>
              <label className="sf-field span-2">
                URL editorial (grande)
                <input
                  value={block.editorialUrl}
                  onChange={(e) =>
                    setColBlocks((prev) =>
                      prev.map((b, i) => (i === bi ? { ...b, editorialUrl: e.target.value } : b))
                    )
                  }
                  placeholder="https://... o /banners/....jpg"
                />
              </label>
            </div>
            <p className="sf-p" style={{ marginTop: 12, marginBottom: 8 }}>
              Celdas 2×2 (orden: fila1 col1, col2, fila2 col1, col2):
            </p>
            <div className="sf-grid">
              {block.cells.map((cell, ci) => (
                <div
                  key={ci}
                  className="sf-field span-2"
                  style={{
                    borderTop: '1px solid #e1e3e5',
                    paddingTop: 10,
                    marginTop: 4,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6d7175' }}>
                    Celda {ci + 1}
                  </span>
                  <select
                    value={cell.mode}
                    onChange={(e) =>
                      setColBlocks((prev) =>
                        prev.map((b, i) => {
                          if (i !== bi) return b;
                          const cells = b.cells.map((c, j) =>
                            j === ci
                              ? {
                                  ...c,
                                  mode: e.target.value as CollectionsGridCellMode,
                                }
                              : c
                          );
                          return { ...b, cells };
                        })
                      )
                    }
                    style={{ marginTop: 6, marginBottom: 6, width: '100%', padding: 8 }}
                  >
                    <option value="random">Producto aleatorio</option>
                    <option value="product">Producto por ID</option>
                    <option value="media">Imagen o video (URL)</option>
                  </select>
                  {cell.mode === 'product' ? (
                    <input
                      placeholder="ID numérico del producto (Tiendanube)"
                      value={cell.productIdStr}
                      onChange={(e) =>
                        setColBlocks((prev) =>
                          prev.map((b, i) => {
                            if (i !== bi) return b;
                            const cells = b.cells.map((c, j) =>
                              j === ci ? { ...c, productIdStr: e.target.value } : c
                            );
                            return { ...b, cells };
                          })
                        )
                      }
                    />
                  ) : null}
                  {cell.mode === 'media' ? (
                    <>
                      <input
                        placeholder="URL imagen o video"
                        value={cell.url}
                        onChange={(e) =>
                          setColBlocks((prev) =>
                            prev.map((b, i) => {
                              if (i !== bi) return b;
                              const cells = b.cells.map((c, j) =>
                                j === ci ? { ...c, url: e.target.value } : c
                              );
                              return { ...b, cells };
                            })
                          )
                        }
                        style={{ marginBottom: 6 }}
                      />
                      <select
                        value={cell.mediaKind}
                        onChange={(e) =>
                          setColBlocks((prev) =>
                            prev.map((b, i) => {
                              if (i !== bi) return b;
                              const cells = b.cells.map((c, j) =>
                                j === ci
                                  ? {
                                      ...c,
                                      mediaKind: e.target.value as 'image' | 'video',
                                    }
                                  : c
                              );
                              return { ...b, cells };
                            })
                          )
                        }
                      >
                        <option value="image">Imagen</option>
                        <option value="video">Video</option>
                      </select>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}

        <h3 className="sf-h2" style={{ marginTop: 8 }}>
          Modo antiguo (una sola fila)
        </h3>
        <p className="sf-p">
          Solo se usa si <strong>no hay bloques</strong> con URL editorial arriba. Una imagen grande a la
          izquierda y hasta una imagen fija en una celda de la grilla.
        </p>
        <div className="sf-grid">
          <label className="sf-field span-2">
            Imagen grande — columna izquierda
            <input
              value={collectionsLeft}
              onChange={(e) => setCollectionsLeft(e.target.value)}
              placeholder="https://... o /banners/tu-foto.jpg"
            />
          </label>
          <label className="sf-field span-2">
            Imagen opcional — celda abajo derecha
            <input
              value={collectionsGrid}
              onChange={(e) => setCollectionsGrid(e.target.value)}
              placeholder="Vacío = 4 productos aleatorios"
            />
          </label>
        </div>
      </section>

      <section className="sf-panel">
        <h2 className="sf-h2">Newsletter (popup global)</h2>
        <p className="sf-p">
          El popup lee esta config con <code>?shop=</code> en la URL (o tienda por defecto). Título,
          textos e imagen vacíos = textos por defecto del sitio.
        </p>
        <label className="sf-check" style={{ marginBottom: 12, display: 'flex' }}>
          <input
            type="checkbox"
            checked={newsletter.popupEnabled}
            onChange={(e) =>
              setNewsletter((n) => ({ ...n, popupEnabled: e.target.checked }))
            }
          />
          <span className="sf-label-text">Mostrar popup de newsletter</span>
        </label>
        <div className="sf-grid">
          <label className="sf-field">
            Delay (ms)
            <input
              type="number"
              value={newsletter.popupDelayMs}
              onChange={(e) => setNewsletter((n) => ({ ...n, popupDelayMs: e.target.value }))}
              placeholder="300000"
            />
          </label>
          <label className="sf-field">
            Días de pausa
            <input
              type="number"
              value={newsletter.cooldownDays}
              onChange={(e) => setNewsletter((n) => ({ ...n, cooldownDays: e.target.value }))}
              placeholder="7"
            />
          </label>
          <label className="sf-field">
            Cierres antes de pausa
            <input
              type="number"
              value={newsletter.dismissBeforeCooldown}
              onChange={(e) =>
                setNewsletter((n) => ({ ...n, dismissBeforeCooldown: e.target.value }))
              }
              placeholder="3"
            />
          </label>
          <label className="sf-field span-2">
            Título del popup
            <input
              value={newsletter.popupTitle}
              onChange={(e) => setNewsletter((n) => ({ ...n, popupTitle: e.target.value }))}
              placeholder="SUSCRIBITE A NUESTRO NEWSLETTER"
            />
          </label>
          <label className="sf-field span-2">
            Subtítulo / cuerpo
            <input
              value={newsletter.popupSubtitle}
              onChange={(e) => setNewsletter((n) => ({ ...n, popupSubtitle: e.target.value }))}
              placeholder="Recibí novedades y ofertas..."
            />
          </label>
          <label className="sf-field span-2">
            Imagen lateral (URL, opcional)
            <input
              value={newsletter.popupImageUrl}
              onChange={(e) => setNewsletter((n) => ({ ...n, popupImageUrl: e.target.value }))}
              placeholder="https://... o /banners/..."
            />
          </label>
          <label className="sf-field span-2">
            Texto legal / disclaimer
            <textarea
              className="sf-textarea"
              rows={2}
              value={newsletter.popupDisclaimer}
              onChange={(e) => setNewsletter((n) => ({ ...n, popupDisclaimer: e.target.value }))}
              placeholder="Al suscribirte..."
            />
          </label>
        </div>
      </section>

      <div className="sf-save-dock">
        <button type="button" className="sf-btn primary sf-btn-block" onClick={save} disabled={status === 'saving'}>
          {status === 'saving' ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      <style jsx>{`
        .sf {
          max-width: min(880px, 100%);
          padding-bottom: 0;
        }
        .sf-head {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }
        .sf-head-text {
          min-width: 0;
          flex: 1 1 200px;
        }
        .sf-title {
          margin: 0 0 8px;
          font-size: clamp(1.25rem, 4vw, 1.5rem);
          font-weight: 700;
          color: #202223;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .sf-sub {
          margin: 0;
          color: #45494d;
          font-size: 14px;
          line-height: 1.5;
          max-width: 36rem;
        }
        .sf-intro {
          background: linear-gradient(135deg, #f0faf7 0%, #fff 100%);
          border: 1px solid #c5e6dc;
          border-radius: 12px;
          padding: 16px 18px;
          margin-bottom: 18px;
        }
        .sf-intro-title {
          margin: 0 0 10px;
          font-size: 13px;
          font-weight: 700;
          color: #004c3f;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .sf-intro-list {
          margin: 0;
          padding-left: 1.2rem;
          font-size: 14px;
          color: #202223;
          line-height: 1.55;
        }
        .sf-intro-list li {
          margin-bottom: 6px;
        }
        .sf-intro-list code {
          background: rgba(0, 0, 0, 0.06);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
        .sf-head-actions {
          display: flex;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 12px;
        }
        .sf-shop {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #202223;
        }
        .sf-shop-input {
          width: 120px;
          min-height: 44px;
          padding: 10px 12px;
          border: 1px solid #c9cccf;
          border-radius: 10px;
          font-size: 16px;
        }
        .sf-btn-block {
          width: 100%;
          min-height: 48px;
        }
        .sf-save-dock {
          display: none;
        }
        .sf-btn {
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          border: none;
        }
        .sf-btn.primary {
          background: #008060;
          color: #fff;
        }
        .sf-btn.primary:hover:not(:disabled) {
          background: #006e52;
        }
        .sf-btn:disabled {
          opacity: 0.6;
        }
        .sf-banner {
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 16px;
        }
        .sf-banner.ok {
          background: #e3f1df;
          color: #0d470d;
        }
        .sf-banner.err {
          background: #fed3d1;
          color: #8a2316;
        }
        .sf-hint {
          font-size: 12px;
          color: #6d7175;
          margin: 0 0 20px;
        }
        .sf-hint code {
          background: #e4e5e7;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
        }
        .sf-panel {
          background: #fff;
          border: 1px solid #e1e3e5;
          border-radius: 12px;
          padding: 20px 22px;
          margin-bottom: 16px;
        }
        .sf-h2 {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 700;
          color: #202223;
          padding-bottom: 8px;
          border-bottom: 2px solid #e3f1ed;
        }
        .sf-p {
          margin: 0 0 16px;
          font-size: 14px;
          color: #45494d;
          line-height: 1.55;
        }
        .sf-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .sf-row {
          display: grid;
          grid-template-columns: auto 1fr 1fr;
          gap: 12px;
          align-items: start;
          padding: 14px 0;
          border-bottom: 1px solid #e1e3e5;
        }
        .sf-row:last-child {
          border-bottom: none;
        }
        .sf-row-move {
          display: flex;
          gap: 4px;
        }
        .sf-icon-btn {
          min-width: 44px;
          min-height: 44px;
          width: 44px;
          height: 44px;
          border: 1px solid #c9cccf;
          background: #fff;
          border-radius: 10px;
          cursor: pointer;
          font-size: 16px;
        }
        .sf-icon-btn:hover:not(:disabled) {
          background: #f6f6f7;
        }
        .sf-icon-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .sf-check {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 13px;
        }
        .sf-label-text {
          font-weight: 500;
        }
        .sf-title-input {
          min-height: 44px;
          padding: 10px 12px;
          border: 1px solid #c9cccf;
          border-radius: 10px;
          font-size: 16px;
        }
        .sf-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .sf-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #202223;
        }
        .sf-field input,
        .sf-field select,
        .sf-field textarea {
          padding: 12px 12px;
          border: 1px solid #c9cccf;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 400;
        }
        .sf-field select {
          min-height: 48px;
          background: #fff;
        }
        .sf-field.span-2 {
          grid-column: span 2;
        }
        .sf-textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 12px;
          border: 1px solid #c9cccf;
          border-radius: 10px;
          font-size: 15px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          line-height: 1.45;
        }
        .sf-hint code {
          word-break: break-all;
        }
        @media (max-width: 767px) {
          .sf-row {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .sf-row-move {
            flex-direction: row;
            justify-content: flex-start;
          }
          .sf-grid {
            grid-template-columns: 1fr;
          }
          .sf-field.span-2 {
            grid-column: span 1;
          }
          .sf-head-actions {
            flex: 1 1 100%;
            flex-direction: column;
            align-items: stretch;
          }
          .sf-shop {
            width: 100%;
          }
          .sf-shop-input {
            width: 100%;
          }
          .sf-btn-desktop {
            display: none;
          }
          .sf-save-dock {
            display: block;
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 60;
            padding: 12px 16px;
            padding-bottom: max(12px, env(safe-area-inset-bottom));
            background: rgba(255, 255, 255, 0.94);
            -webkit-backdrop-filter: blur(12px);
            backdrop-filter: blur(12px);
            border-top: 1px solid #e1e3e5;
            box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.06);
          }
          .sf {
            padding-bottom: 100px;
          }
          .sf-panel {
            padding: 18px 16px;
          }
        }
        @media (min-width: 768px) {
          .sf-shop-input {
            font-size: 14px;
          }
          .sf-title-input {
            font-size: 14px;
          }
          .sf-field input,
          .sf-field select,
          .sf-field textarea {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
