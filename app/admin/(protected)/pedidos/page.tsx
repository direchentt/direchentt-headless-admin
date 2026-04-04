import Link from 'next/link';
import { listMercadoPagoPaymentsAdmin, listOrdersAdmin } from '../commerce-actions';
import styles from '../admin-pages.module.css';
import { getAdminDefaultShopId, withAdminShopQuery } from '@/lib/admin-shop';

function formatOrderTotal(order: Record<string, unknown>): string {
  const t = order.total;
  const cur = (order.currency as string) || '';
  if (t && typeof t === 'object' && t !== null && 'value' in t) {
    const o = t as { value?: string | number; currency?: string };
    return `${o.currency || cur} ${o.value ?? ''}`.trim();
  }
  if (typeof t === 'string' || typeof t === 'number') {
    return `${cur} ${t}`.trim();
  }
  return '—';
}

function pedidosHref(shop: string, page: number, mppage: number): string {
  let q = `shop=${encodeURIComponent(shop)}&page=${Math.max(1, page)}`;
  if (mppage > 1) q += `&mppage=${mppage}`;
  return `/admin/pedidos?${q}`;
}

function formatMpAmount(amount: number | undefined, cur: string | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return '—';
  const c = cur || 'ARS';
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: c }).format(amount);
  } catch {
    return `${c} ${amount}`;
  }
}

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; page?: string; mppage?: string }>;
}) {
  const sp = await searchParams;
  const shop = sp.shop || getAdminDefaultShopId();
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const mpPage = Math.max(1, parseInt(sp.mppage || '1', 10) || 1);
  const [data, mpData] = await Promise.all([
    listOrdersAdmin(shop, page),
    listMercadoPagoPaymentsAdmin(shop, mpPage),
  ]);

  if (!data.ok) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.pageTitle}>Pedidos</h1>
        <p className={styles.lead}>
          Vista de lectura de pedidos vía API de TiendaNube. Para cambiar estado de pago o envío usá el
          administrador de tu tienda.
        </p>
        <div className={`${styles.alert} ${styles.alertErr}`}>{data.error}</div>
        <AdminShopBar shop={shop} />
        {mpData.ok ? (
          <MercadoPagoPaymentsBlock shop={shop} tnPage={page} mpPage={mpPage} mpData={mpData} />
        ) : (
          <div className={`${styles.alert} ${styles.alertErr}`} style={{ marginTop: 16 }}>
            Pagos MP: {mpData.error}
          </div>
        )}
      </div>
    );
  }

  const orders = data.orders as Record<string, unknown>[];
  const hasPrev = page > 1;
  const hasNext = orders.length >= 25;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.pageTitle}>Pedidos</h1>
      <p className={styles.lead}>
        Últimos pedidos de <strong>{data.shopName}</strong>. Los datos vienen de la API oficial; el
        cumplimiento y facturación los gestionás en Tiendanube.
      </p>
        <AdminShopBar shop={shop} />

      <div className={`${styles.alert} ${styles.alertInfo}`}>
        Tip: si ves error de permisos, la app debe incluir el scope <code>read_orders</code> al
        instalarla.
      </div>

      {orders.length === 0 ? (
        <p className={styles.pagerMuted}>No hay pedidos en esta página.</p>
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={String(o.id)}>
                    <td>
                      <strong>{String(o.number ?? o.id ?? '—')}</strong>
                    </td>
                    <td>{String(o.created_at ?? '—').slice(0, 16).replace('T', ' ')}</td>
                    <td>{String(o.contact_email ?? '—')}</td>
                    <td>{formatOrderTotal(o)}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeMuted}`}>
                        {String(o.payment_status ?? '—')}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeOk}`}>
                        {String(o.status ?? '—')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.cardList}>
            {orders.map((o) => (
              <article key={String(o.id)} className={styles.card}>
                <div className={styles.cardHead}>Pedido #{String(o.number ?? o.id)}</div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Fecha</span>
                  <span className={styles.cardVal}>
                    {String(o.created_at ?? '—').slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Cliente</span>
                  <span className={styles.cardVal}>{String(o.contact_email ?? '—')}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Total</span>
                  <span className={styles.cardVal}>{formatOrderTotal(o)}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Pago</span>
                  <span className={styles.cardVal}>{String(o.payment_status ?? '—')}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Estado</span>
                  <span className={styles.cardVal}>{String(o.status ?? '—')}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <nav className={styles.pager} aria-label="Paginación">
        <Link
          href={pedidosHref(shop, page - 1, mpPage)}
          aria-disabled={!hasPrev}
          style={!hasPrev ? { pointerEvents: 'none', opacity: 0.35 } : undefined}
        >
          ← Anterior
        </Link>
        <span className={styles.pagerMuted}>Página {page}</span>
        <Link
          href={pedidosHref(shop, page + 1, mpPage)}
          aria-disabled={!hasNext}
          style={!hasNext ? { pointerEvents: 'none', opacity: 0.35 } : undefined}
        >
          Siguiente →
        </Link>
      </nav>

      {mpData.ok ? (
        <MercadoPagoPaymentsBlock shop={shop} tnPage={page} mpPage={mpPage} mpData={mpData} />
      ) : (
        <div className={`${styles.alert} ${styles.alertErr}`} style={{ marginTop: 24 }}>
          Pagos Mercado Pago: {mpData.error}
        </div>
      )}
    </div>
  );
}

type MpListOk = Extract<Awaited<ReturnType<typeof listMercadoPagoPaymentsAdmin>>, { ok: true }>;

function MercadoPagoPaymentsBlock({
  shop,
  tnPage,
  mpPage,
  mpData,
}: {
  shop: string;
  tnPage: number;
  mpPage: number;
  mpData: MpListOk;
}) {
  const perPage = 25;
  const totalPages = Math.max(1, Math.ceil(mpData.total / perPage));
  const hasMpPrev = mpPage > 1;
  const hasMpNext = mpPage < totalPages;

  const hrefMp = (p: number) => pedidosHref(shop, tnPage, Math.max(1, p));

  return (
    <section id="pagos-mercadopago" style={{ marginTop: 40 }}>
      <h2 className={styles.pageTitle} style={{ fontSize: '1.15rem' }}>
        Pagos Mercado Pago (headless)
      </h2>
      <p className={styles.lead}>
        Cobros que notifica Mercado Pago al webhook <code>/api/checkout/mercadopago/webhook</code>. Se guardan en
        MongoDB (<code>mercadopago_payments</code>) aunque TiendaNube no cree el pedido.
      </p>
      <div className={`${styles.alert} ${styles.alertInfo}`}>
        En el panel de MP configurá la URL de notificación apuntando a tu sitio público en HTTPS, misma base que el
        checkout (p. ej. <code>https://tudominio.com/api/checkout/mercadopago/webhook</code>).
      </div>

      {mpData.items.length === 0 ? (
        <p className={styles.pagerMuted}>Todavía no hay pagos registrados para la tienda #{mpData.storeId}.</p>
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Actualizado</th>
                  <th>Estado</th>
                  <th>Monto</th>
                  <th>Comprador</th>
                  <th>TN orden</th>
                  <th>Variantes</th>
                </tr>
              </thead>
              <tbody>
                {mpData.items.map((row) => (
                  <tr key={row.paymentId}>
                    <td>
                      <code style={{ fontSize: 11 }}>{row.paymentId}</code>
                    </td>
                    <td>{row.updatedAt ? new Date(row.updatedAt).toISOString().slice(0, 16).replace('T', ' ') : '—'}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          row.status === 'approved' ? styles.badgeOk : styles.badgeMuted
                        }`}
                      >
                        {row.status}
                      </span>
                      {row.statusDetail ? (
                        <span style={{ fontSize: 11, display: 'block', color: '#666' }}>{row.statusDetail}</span>
                      ) : null}
                    </td>
                    <td>{formatMpAmount(row.transactionAmount, row.currencyId)}</td>
                    <td>{row.payerEmail || '—'}</td>
                    <td>
                      {row.tiendanubeSync?.ok && row.tiendanubeSync.orderId != null ? (
                        <span className={`${styles.badge} ${styles.badgeOk}`}>#{row.tiendanubeSync.orderId}</span>
                      ) : row.tiendanubeSync?.attempted && !row.tiendanubeSync.ok ? (
                        <span className={`${styles.badge} ${styles.badgeWarn}`} title={row.tiendanubeSync.error}>
                          Error TN
                        </span>
                      ) : (
                        <span className={styles.pagerMuted}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {row.cartItems?.length
                        ? row.cartItems.map((c) => `${c.variantId ?? '?'}×${c.quantity ?? 1}`).join(', ')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className={styles.pager} aria-label="Paginación pagos MP" style={{ marginTop: 16 }}>
            <Link
              href={hrefMp(mpPage - 1)}
              aria-disabled={!hasMpPrev}
              style={!hasMpPrev ? { pointerEvents: 'none', opacity: 0.35 } : undefined}
            >
              ← Anterior
            </Link>
            <span className={styles.pagerMuted}>
              Página {mpPage} / {totalPages} ({mpData.total} pagos)
            </span>
            <Link
              href={hrefMp(mpPage + 1)}
              aria-disabled={!hasMpNext}
              style={!hasMpNext ? { pointerEvents: 'none', opacity: 0.35 } : undefined}
            >
              Siguiente →
            </Link>
          </nav>
        </>
      )}
    </section>
  );
}

function AdminShopBar({ shop }: { shop: string }) {
  return (
    <div className={styles.shopBar}>
      <span>
        Tienda <strong>#{shop}</strong>
      </span>
      <span>
        Otra tienda: <code>/admin/pedidos?shop=TU_ID</code>
      </span>
      <Link href={withAdminShopQuery('/admin', shop)}>← Inicio panel</Link>
    </div>
  );
}
