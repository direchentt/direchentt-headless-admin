import Link from 'next/link';
import { listOrdersAdmin } from '../commerce-actions';
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

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const shop = sp.shop || getAdminDefaultShopId();
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const data = await listOrdersAdmin(shop, page);

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
          href={withAdminShopQuery(`/admin/pedidos?page=${page - 1}`, shop)}
          aria-disabled={!hasPrev}
          style={!hasPrev ? { pointerEvents: 'none', opacity: 0.35 } : undefined}
        >
          ← Anterior
        </Link>
        <span className={styles.pagerMuted}>Página {page}</span>
        <Link
          href={withAdminShopQuery(`/admin/pedidos?page=${page + 1}`, shop)}
          aria-disabled={!hasNext}
          style={!hasNext ? { pointerEvents: 'none', opacity: 0.35 } : undefined}
        >
          Siguiente →
        </Link>
      </nav>
    </div>
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
