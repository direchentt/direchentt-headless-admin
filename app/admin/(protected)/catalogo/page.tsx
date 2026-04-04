import Link from 'next/link';
import { listProductsAdmin } from '../commerce-actions';
import styles from '../admin-pages.module.css';
import { getAdminDefaultShopId, withAdminShopQuery } from '@/lib/admin-shop';

function productName(p: Record<string, unknown>): string {
  const n = p.name;
  if (typeof n === 'string') return n;
  if (n && typeof n === 'object') {
    const o = n as Record<string, string>;
    return o.es || o.en || o.pt || Object.values(o)[0] || '—';
  }
  return '—';
}

function primaryImage(p: Record<string, unknown>): string | null {
  const imgs = p.images;
  if (!Array.isArray(imgs) || imgs.length === 0) return null;
  const first = imgs[0] as { src?: string };
  return first?.src || null;
}

export default async function AdminCatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const shop = sp.shop || getAdminDefaultShopId();
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const q = sp.q || '';
  const data = await listProductsAdmin(shop, page, q);

  if (!data.ok) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.pageTitle}>Catálogo</h1>
        <p className={styles.lead}>Productos publicados vía API de TiendaNube (solo lectura en este panel).</p>
        <div className={`${styles.alert} ${styles.alertErr}`}>{data.error}</div>
        <ShopBar shop={shop} q={q} />
      </div>
    );
  }

  const products = data.products as Record<string, unknown>[];
  const hasPrev = page > 1;
  const hasNext = products.length >= 24;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.pageTitle}>Catálogo</h1>
      <p className={styles.lead}>
        Listado rápido de productos publicados. Para crear o editar masivamente usá el administrador de
        Tiendanube; acá podés localizar IDs y abrir la ficha en la vitrina headless.
      </p>
      <ShopBar shop={shop} q={q} />

      <form className={styles.shopBar} method="get" action="/admin/catalogo">
        <input type="hidden" name="shop" value={shop} />
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 200px' }}>
          <span style={{ fontWeight: 600, fontSize: 12 }}>Buscar (API q)</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Nombre, SKU o término admitido por la API"
            style={{
              padding: '12px 12px',
              borderRadius: 8,
              border: '1px solid #c9cccf',
              fontSize: 16,
            }}
          />
        </label>
        <button
          type="submit"
          style={{
            alignSelf: 'flex-end',
            minHeight: 44,
            padding: '0 20px',
            borderRadius: 10,
            background: '#111',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Buscar
        </button>
      </form>

      {products.length === 0 ? (
        <p className={styles.pagerMuted}>No hay productos en esta página.</p>
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th />
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Vitrina</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const id = String(p.id ?? '');
                  const src = primaryImage(p);
                  return (
                    <tr key={id}>
                      <td style={{ width: 56 }}>
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt="" className={styles.thumb} width={48} height={64} />
                        ) : (
                          <span style={{ color: '#999', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>{id}</td>
                      <td>{productName(p)}</td>
                      <td>
                        <Link href={`/product/${id}?shop=${encodeURIComponent(shop)}`} target="_blank" rel="noopener noreferrer">
                          Ver en la tienda
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.cardList}>
            {products.map((p) => {
              const id = String(p.id ?? '');
              const src = primaryImage(p);
              return (
                <article key={id} className={styles.card}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className={styles.thumb} width={48} height={64} />
                    ) : null}
                    <div>
                      <div className={styles.cardHead}>{productName(p)}</div>
                      <div className={styles.pagerMuted}>ID {id}</div>
                    </div>
                  </div>
                  <Link href={`/product/${id}?shop=${encodeURIComponent(shop)}`} target="_blank" rel="noopener noreferrer">
                    Ver en la tienda →
                  </Link>
                </article>
              );
            })}
          </div>
        </>
      )}

      <nav className={styles.pager} aria-label="Paginación">
        <Link
          href={
            withAdminShopQuery(`/admin/catalogo?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`, shop)
          }
          style={!hasPrev ? { pointerEvents: 'none', opacity: 0.35 } : undefined}
        >
          ← Anterior
        </Link>
        <span className={styles.pagerMuted}>Página {page}</span>
        <Link
          href={
            withAdminShopQuery(`/admin/catalogo?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`, shop)
          }
          style={!hasNext ? { pointerEvents: 'none', opacity: 0.35 } : undefined}
        >
          Siguiente →
        </Link>
      </nav>
    </div>
  );
}

function ShopBar({ shop, q }: { shop: string; q: string }) {
  return (
    <div className={styles.shopBar}>
      <span>
        Tienda <strong>#{shop}</strong>
      </span>
      <span>
        URL: <code>/admin/catalogo?shop=TU_ID</code>
      </span>
      <Link href={withAdminShopQuery('/admin', shop)}>← Inicio panel</Link>
    </div>
  );
}
