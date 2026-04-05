'use client';

import { useMemo, useState, useTransition } from 'react';
import type { MarketingInsightsSnapshot } from '@/lib/shopper-intelligence-db';
import { loadMarketingInsights } from '../commerce-actions';
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

function trend(curr: number, prev: number): { text: string; up: boolean | null } {
  if (prev <= 0 && curr <= 0) return { text: '—', up: null };
  if (prev <= 0) return { text: 'nuevo', up: true };
  const pct = Math.round(((curr - prev) / prev) * 100);
  if (pct === 0) return { text: '0%', up: null };
  return { text: `${pct > 0 ? '+' : ''}${pct}%`, up: pct > 0 };
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

  if (!data) {
    return (
      <div className={`${apStyles.alert} ${apStyles.alertErr}`} role="status">
        No se pudieron cargar métricas (¿MongoDB conectado y colección de eventos?). Reintentá más
        tarde.
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.refreshBtn} onClick={refresh} disabled={pending}>
          {pending ? 'Actualizando…' : 'Actualizar datos'}
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
          <strong>Cómo leer esto:</strong> los porcentajes son ratios entre pasos consecutivos sobre tus
          propios eventos headless, no reemplazan Google Analytics. Sirven para ver si mucha gente mira
          pero pocos agregan al carrito, o si el carrito no avanza al checkout.
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
                          <span style={{ marginLeft: 6, fontSize: 11, color: '#6d7175' }}>{tr.text}</span>
                        )}
                      </span>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${(count / maxType) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
          </ul>
          {Object.keys(data.eventsByType).length === 0 ? (
            <p className={styles.empty}>Todavía no hay eventos en esta ventana. Navegá la vitrina con
            señales activas o esperá a que entren visitas.</p>
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
          <p className={styles.empty}>Nadie agregó al carrito en esta ventana (o aún no hay tracking).</p>
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
    </div>
  );
}
