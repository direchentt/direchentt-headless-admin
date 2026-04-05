import Link from 'next/link';
import styles from './AdminHomePage.module.css';
import {
  getAdminDefaultShopId,
  parseAdminStoreIdParam,
  withAdminShopQuery,
} from '@/lib/admin-shop';
import { getMarketingInsightsSnapshot } from '@/lib/shopper-intelligence-db';

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const sp = await searchParams;
  const shop = sp.shop?.trim() || getAdminDefaultShopId();
  const storeId = parseAdminStoreIdParam(shop);
  const insights = await getMarketingInsightsSnapshot(storeId);

  return (
    <div className={styles.wrap}>
      <header className={styles.intro}>
        <h1 className={styles.title}>Bienvenido al panel</h1>
        <p className={styles.lead}>
          Gestioná la <strong>vitrina headless</strong>, las <strong>métricas de comportamiento</strong> y
          consultá <strong>pedidos y catálogo</strong> vía Tiendanube. Reglas y playbook se guardan en
          MongoDB.
        </p>
        <p className={styles.shopLine}>
          Tienda activa: <strong>#{shop}</strong> — usá <code>?shop=ID</code> en la URL del panel para
          cambiar de tienda.
        </p>
      </header>

      {insights ? (
        <section className={styles.pulseStrip} aria-label="Resumen de marketing últimos 7 días">
          <div className={styles.pulseCard}>
            <span className={styles.pulseLabel}>Pulso</span>
            <span className={styles.pulseVal}>{insights.activityPulse}</span>
          </div>
          <div className={styles.pulseCard}>
            <span className={styles.pulseLabel}>Visitantes</span>
            <span className={styles.pulseVal}>{insights.activeVisitorsApprox}</span>
          </div>
          <div className={styles.pulseCard}>
            <span className={styles.pulseLabel}>Al carrito</span>
            <span className={styles.pulseVal}>{insights.funnel.addToCart}</span>
          </div>
          <div className={styles.pulseCard}>
            <span className={styles.pulseLabel}>Checkout</span>
            <span className={styles.pulseVal}>{insights.funnel.checkoutStart}</span>
          </div>
          <Link href={withAdminShopQuery('/admin/marketing', shop)} className={styles.pulseCta}>
            Ver marketing →
          </Link>
        </section>
      ) : null}

      <ul className={styles.steps}>
        <li>
          <span className={styles.stepNum}>1</span>
          <strong>Tienda en línea</strong>: home, hero, colecciones y newsletter.
        </li>
        <li>
          <span className={styles.stepNum}>2</span>
          <strong>Marketing</strong>: embudo, búsquedas y top productos en carrito (señales Mongo).
        </li>
        <li>
          <span className={styles.stepNum}>3</span>
          <strong>Pedidos / Catálogo</strong>: lectura rápida; la operación plena sigue en Tiendanube.
        </li>
        <li>
          <span className={styles.stepNum}>4</span>
          <strong>Reglas</strong>: mantenimiento, playbook de campañas, flags técnicos.
        </li>
      </ul>

      <div className={styles.grid}>
        <Link href={withAdminShopQuery('/admin/storefront', shop)} className={styles.cardLink}>
          <div className={styles.card}>
            <div className={styles.cardIco} aria-hidden>
              ◉
            </div>
            <div className={styles.cardTitle}>Tienda en línea</div>
            <div className={styles.cardDesc}>
              Orden de secciones en la home, bloques visibles, colores, hero y página Colecciones.
            </div>
            <span className={styles.cardCta}>Abrir editor →</span>
          </div>
        </Link>

        <Link href={withAdminShopQuery('/admin/marketing', shop)} className={styles.cardLink}>
          <div className={styles.card}>
            <div className={styles.cardIco} aria-hidden>
              ◎
            </div>
            <div className={styles.cardTitle}>Marketing e inteligencia</div>
            <div className={styles.cardDesc}>
              Embudo, tendencias por tipo de evento, búsquedas frecuentes y productos más agregados al
              carrito.
            </div>
            <span className={styles.cardCta}>Abrir métricas →</span>
          </div>
        </Link>

        <Link href={withAdminShopQuery('/admin/pedidos', shop)} className={styles.cardLink}>
          <div className={styles.card}>
            <div className={styles.cardIco} aria-hidden>
              ▤
            </div>
            <div className={styles.cardTitle}>Pedidos</div>
            <div className={styles.cardDesc}>
              Listado paginado con totales, pago y estado. Requiere scope <code>read_orders</code> en la
              app.
            </div>
            <span className={styles.cardCta}>Ver pedidos →</span>
          </div>
        </Link>

        <Link href={withAdminShopQuery('/admin/catalogo', shop)} className={styles.cardLink}>
          <div className={styles.card}>
            <div className={styles.cardIco} aria-hidden>
              ▣
            </div>
            <div className={styles.cardTitle}>Catálogo</div>
            <div className={styles.cardDesc}>
              Productos publicados, miniatura e ID. Enlace a la ficha en la vitrina headless.
            </div>
            <span className={styles.cardCta}>Explorar catálogo →</span>
          </div>
        </Link>

        <Link href={withAdminShopQuery('/admin/reglas', shop)} className={styles.cardLink}>
          <div className={styles.card}>
            <div className={styles.cardIco} aria-hidden>
              ⚙
            </div>
            <div className={styles.cardTitle}>Reglas y módulos</div>
            <div className={styles.cardDesc}>
              Mantenimiento, checkout, flags técnicos y playbook de campañas (UTM, anuncios, notas).
            </div>
            <span className={styles.cardCta}>Configurar →</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
