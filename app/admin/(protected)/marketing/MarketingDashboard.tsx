'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { MarketingInsightsSnapshot } from '@/lib/shopper-intelligence-db';
import {
  loadMarketingInsights,
  loadActivePresenceAdmin,
  generateMarketingAiSummary,
} from '../commerce-actions';
import styles from './marketing.module.css';
import apStyles from '../admin-pages.module.css';

type Props = {
  storeId: number;
  shopParam: string;
  initial: MarketingInsightsSnapshot | null;
};

const TYPE_LABELS: Record<string, string> = {
  product_view: 'Vistas de producto',
  category_view: 'Vistas de categoría',
  add_to_cart: 'Agregados al carrito',
  remove_from_cart: 'Quitados del carrito',
  search: 'Búsquedas',
  checkout_start: 'Inicios de checkout',
  wishlist_add: 'Favoritos',
};

const PAGE_LABELS: Record<string, string> = {
  home: 'Inicio',
  product: 'Producto',
  category: 'Categoría',
  collections: 'Colecciones',
  search: 'Búsqueda',
  cart: 'Carrito',
  other: 'Otra',
};

function trend(curr: number, prev: number): { text: string; up: boolean | null } {
  if (prev <= 0 && curr <= 0) return { text: '—', up: null };
  if (prev <= 0) return { text: 'nuevo', up: true };
  const pct = Math.round(((curr - prev) / prev) * 100);
  if (pct === 0) return { text: '0%', up: null };
  return { text: `${pct > 0 ? '+' : ''}${pct}%`, up: pct > 0 };
}

function shortVisitor(v: string): string {
  if (v.length <= 10) return v;
  return `…${v.slice(-8)}`;
}

function LiveNowPanel({ storeId }: { storeId: number }) {
  const [live, setLive] = useState<Awaited<ReturnType<typeof loadActivePresenceAdmin>>>(null);

  useEffect(() => {
    let cancelled = false;
    const pull = () => {
      void loadActivePresenceAdmin(storeId).then((r) => {
        if (!cancelled) setLive(r ?? { rows: [], count: 0, windowSec: 150 });
      });
    };
    pull();
    const t = setInterval(pull, 8000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [storeId]);

  const byType = useMemo(() => {
    const m: Record<string, number> = {};
    if (!live?.rows) return m;
    for (const r of live.rows) {
      m[r.pageType] = (m[r.pageType] ?? 0) + 1;
    }
    return m;
  }, [live]);

  if (!live) {
    return (
      <div className={styles.panel}>
        <p className={styles.empty}>Cargando presencia en vivo…</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.liveHeader}>
        <h2 className={styles.panelTitle} style={{ margin: 0, border: 'none', padding: 0 }}>
          En la tienda ahora
        </h2>
        <span className={styles.liveBadge}>
          <span className={styles.liveDot} aria-hidden />
          {live.count} visitante{live.count !== 1 ? 's' : ''} · últimos {Math.round(live.windowSec / 60)}{' '}
          min
        </span>
      </div>
      <p className={styles.meta} style={{ marginBottom: 12 }}>
        Cada visitante envía su página cada ~12 s. Es anónimo (ID local); sirve para ver en qué sección
        están.
      </p>

      {Object.keys(byType).length > 0 ? (
        <div className={styles.tagRow} style={{ marginBottom: 14 }}>
          {Object.entries(byType)
            .sort((a, b) => b[1] - a[1])
            .map(([k, n]) => (
              <span key={k} className={styles.tag}>
                {PAGE_LABELS[k] ?? k}
                <small>{n}</small>
              </span>
            ))}
        </div>
      ) : null}

      {live.rows.length === 0 ? (
        <p className={styles.empty}>
          Nadie activo en la ventana reciente. Abrí la vitrina en otra pestaña para probar.
        </p>
      ) : (
        <>
          <div className={styles.liveTableWrap}>
            <table className={styles.liveTable}>
              <thead>
                <tr>
                  <th>Visitante</th>
                  <th>Dónde</th>
                  <th>Ruta</th>
                  <th>Hace</th>
                </tr>
              </thead>
              <tbody>
                {live.rows.map((r) => (
                  <tr key={`${r.visitorId}-${r.lastSeen}`}>
                    <td title={r.visitorId}>{shortVisitor(r.visitorId)}</td>
                    <td>
                      <span className={styles.typePill}>{PAGE_LABELS[r.pageType] ?? r.pageType}</span>
                      {r.productId != null ? (
                        <span style={{ marginLeft: 8, fontSize: 12, color: '#45494d' }}>
                          #{r.productId}
                        </span>
                      ) : null}
                      {r.categoryId != null ? (
                        <span style={{ marginLeft: 8, fontSize: 12, color: '#45494d' }}>
                          cat. {r.categoryId}
                        </span>
                      ) : null}
                    </td>
                    <td className={styles.livePath} title={r.path}>
                      {r.path}
                    </td>
                    <td>{r.secondsAgo}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.liveCards} aria-hidden={false}>
            {live.rows.map((r) => (
              <div key={`${r.visitorId}-c-${r.lastSeen}`} className={styles.liveCard}>
                <div className={styles.liveCardRow}>
                  <strong>{shortVisitor(r.visitorId)}</strong>
                  <span>{r.secondsAgo}s</span>
                </div>
                <div>
                  <span className={styles.typePill}>{PAGE_LABELS[r.pageType] ?? r.pageType}</span>
                  {r.productId != null ? ` · producto #${r.productId}` : ''}
                  {r.categoryId != null ? ` · categoría ${r.categoryId}` : ''}
                </div>
                <div className={styles.livePath} style={{ marginTop: 6, maxWidth: '100%' }} title={r.path}>
                  {r.path}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AiBriefPanel({ storeId }: { storeId: number }) {
  const [text, setText] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className={`${styles.panel} ${styles.aiPanel}`}>
      <h2 className={styles.panelTitle}>Inteligencia artificial (resumen)</h2>
      <p className={styles.meta} style={{ marginBottom: 12 }}>
        Usa OpenAI con tus métricas y la muestra “en vivo”. Configurá{' '}
        <code style={{ fontSize: 12 }}>OPENAI_API_KEY</code> en el servidor (Vercel → Environment
        Variables). Opcional: <code>OPENAI_MARKETING_MODEL</code> (default gpt-4o-mini).
      </p>
      <button
        type="button"
        className={styles.aiBtn}
        disabled={pending}
        onClick={() => {
          setErr(null);
          setText(null);
          startTransition(async () => {
            const r = await generateMarketingAiSummary(storeId);
            if (r.ok) setText(r.text);
            else setErr(r.error);
          });
        }}
      >
        {pending ? 'Generando…' : 'Generar resumen con IA'}
      </button>
      {err ? (
        <p className={`${apStyles.alert} ${apStyles.alertErr}`} style={{ marginTop: 12 }} role="alert">
          {err}
        </p>
      ) : null}
      {text ? (
        <div className={styles.aiOut} role="region" aria-label="Resumen generado">
          {text}
        </div>
      ) : null}
      <p className={styles.aiHint}>
        El modelo no accede a Tiendanube ni a datos personales: solo agregados que ya ves en este panel.
        Revisá siempre las recomendaciones antes de aplicar cambios en producción.
      </p>
    </div>
  );
}

export default function MarketingDashboard({ storeId, shopParam, initial }: Props) {
  const [data, setData] = useState<MarketingInsightsSnapshot | null>(initial);
  const [pending, startTransition] = useTransition();

  const maxType = useMemo(() => {
    if (!data) return 1;
    let m = 1;
    for (const v of Object.values(data.eventsByType)) m = Math.max(m, v);
    return m;
  }, [data]);

  const maxCart = useMemo(() => {
    if (!data?.topCartProductIds.length) return 1;
    return Math.max(...data.topCartProductIds.map((x) => x.count), 1);
  }, [data]);

  const funnelPct = useMemo(() => {
    if (!data) return { cart: 0, co: 0 };
    const v = Math.max(data.funnel.productViews, 1);
    return {
      cart: Math.min(100, Math.round((data.funnel.addToCart / v) * 1000) / 10),
      co: Math.min(
        100,
        Math.round((data.funnel.checkoutStart / Math.max(data.funnel.addToCart, 1)) * 1000) / 10
      ),
    };
  }, [data]);

  function refresh() {
    startTransition(async () => {
      const next = await loadMarketingInsights(storeId);
      setData(next);
    });
  }

  return (
    <div className={styles.wrap}>
      <AiBriefPanel storeId={storeId} />
      <LiveNowPanel storeId={storeId} />

      {!data ? (
        <div className={`${apStyles.alert} ${apStyles.alertErr}`} role="status">
          No se pudieron cargar las métricas históricas (eventos 7 días). Verificá MongoDB. La sección
          “en vivo” arriba puede seguir funcionando.
        </div>
      ) : (
        <>
          <div className={styles.toolbar}>
            <button type="button" className={styles.refreshBtn} onClick={refresh} disabled={pending}>
              {pending ? 'Actualizando…' : 'Actualizar métricas'}
            </button>
            <p className={styles.meta}>
              Ventana: últimos {data.windowDays} días · generado{' '}
              {new Date(data.generatedAt).toLocaleString('es-AR')}
            </p>
          </div>

          <div className={styles.grid}>
            <div className={`${styles.kpi} ${styles.kpiPulse}`}>
              <span className={styles.kpiLabel}>Pulso de actividad</span>
              <span className={styles.kpiValue}>{data.activityPulse}</span>
              <span className={styles.kpiHint}>
                Combina carritos, checkout, búsquedas y vistas (heurística interna).
              </span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Visitantes activos (aprox.)</span>
              <span className={styles.kpiValue}>{data.activeVisitorsApprox}</span>
              <span className={styles.kpiHint}>IDs distintos con al menos un evento en 7 días.</span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Perfiles con preferencias</span>
              <span className={styles.kpiValue}>{data.profileCount}</span>
              <span className={styles.kpiHint}>Documentos en shopper_profiles para esta tienda.</span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Nuevos favoritos</span>
              <span className={styles.kpiValue}>{data.wishlistAdds}</span>
              <span className={styles.kpiHint}>Eventos wishlist_add en la ventana.</span>
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Embudo simplificado</h2>
            <div className={styles.funnel}>
              <div className={styles.funnelStep}>
                <span className={styles.funnelLabel}>Vistas de producto</span>
                <div className={styles.funnelBar}>
                  <div className={styles.funnelFill} style={{ width: '100%' }} />
                </div>
                <span className={styles.funnelPct}>{data.funnel.productViews} base</span>
              </div>
              <div className={styles.funnelStep}>
                <span className={styles.funnelLabel}>→ Agregado al carrito</span>
                <div className={styles.funnelBar}>
                  <div className={styles.funnelFill} style={{ width: `${funnelPct.cart}%` }} />
                </div>
                <span className={styles.funnelPct}>
                  {data.funnel.addToCart} ({funnelPct.cart}% vs vistas)
                </span>
              </div>
              <div className={styles.funnelStep}>
                <span className={styles.funnelLabel}>→ Checkout exprés / inicio</span>
                <div className={styles.funnelBar}>
                  <div
                    className={styles.funnelFill}
                    style={{
                      width: `${Math.min(100, funnelPct.co)}%`,
                      opacity: 0.85,
                    }}
                  />
                </div>
                <span className={styles.funnelPct}>
                  {data.funnel.checkoutStart} ({funnelPct.co}% vs agregados)
                </span>
              </div>
            </div>
            <div className={styles.algoBox}>
              <strong>Cómo leer esto:</strong> los porcentajes son ratios entre pasos consecutivos sobre
              tus propios eventos headless, no reemplazan Google Analytics. Sirven para ver si mucha gente
              mira pero pocos agregan al carrito, o si el carrito no avanza al checkout.
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Eventos por tipo (7 días)</h2>
              <ul className={styles.barList}>
                {Object.entries(data.eventsByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, count]) => {
                    const prev = data.eventsByTypePrevPeriod[key] ?? 0;
                    const tr = trend(count, prev);
                    return (
                      <li key={key}>
                        <div className={styles.barRow}>
                          <span className={styles.barName}>{TYPE_LABELS[key] ?? key}</span>
                          <span className={styles.barCount}>
                            {count}
                            {tr.up !== null ? (
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontSize: 11,
                                  color: tr.up ? '#008060' : '#c52828',
                                }}
                              >
                                {tr.text}
                              </span>
                            ) : (
                              <span style={{ marginLeft: 6, fontSize: 11, color: '#6d7175' }}>
                                {tr.text}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFill}
                            style={{ width: `${(count / maxType) * 100}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
              </ul>
              {Object.keys(data.eventsByType).length === 0 ? (
                <p className={styles.empty}>
                  Todavía no hay eventos en esta ventana. Navegá la vitrina con señales activas o esperá a
                  que entren visitas.
                </p>
              ) : null}
            </div>

            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Búsquedas frecuentes</h2>
              {data.topSearches.length === 0 ? (
                <p className={styles.empty}>Sin búsquedas registradas en 7 días.</p>
              ) : (
                <div className={styles.tagRow}>
                  {data.topSearches.map((s) => (
                    <span key={s.query} className={styles.tag}>
                      {s.query}
                      <small>{s.count}</small>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Productos más agregados al carrito</h2>
            {data.topCartProductIds.length === 0 ? (
              <p className={styles.empty}>
                Nadie agregó al carrito en esta ventana (o aún no hay tracking).
              </p>
            ) : (
              <ul className={styles.productLinks}>
                {data.topCartProductIds.map((row) => (
                  <li key={row.productId}>
                    <a
                      href={`/product/${row.productId}?shop=${encodeURIComponent(shopParam)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>Producto #{row.productId}</span>
                      <span>{row.count}×</span>
                    </a>
                    <div className={styles.barTrack} style={{ marginTop: 6 }}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${(row.count / maxCart) * 100}%`, opacity: 0.7 }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
