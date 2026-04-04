import Link from 'next/link';
import styles from './AdminHomePage.module.css';
import { getAdminDefaultShopId, withAdminShopQuery } from '@/lib/admin-shop';

export default function AdminHomePage() {
  const shop = getAdminDefaultShopId();

  return (
    <div className={styles.wrap}>
      <header className={styles.intro}>
        <h1 className={styles.title}>Bienvenido al panel</h1>
        <p className={styles.lead}>
          Gestioná la <strong>vitrina headless</strong> (diseño y bloques) y consultá{' '}
          <strong>pedidos y catálogo</strong> desde la API de Tiendanube. Las reglas avanzadas y flags se
          guardan en MongoDB para tu equipo.
        </p>
        <p className={styles.shopLine}>
          Tienda activa por defecto: <strong>#{shop}</strong> — usá <code>?shop=ID</code> en cada sección
          para otra tienda.
        </p>
        <ul className={styles.steps}>
          <li>
            <span className={styles.stepNum}>1</span>
            <strong>Tienda en línea</strong>: home, hero, colecciones y newsletter.
          </li>
          <li>
            <span className={styles.stepNum}>2</span>
            <strong>Pedidos / Catálogo</strong>: lectura rápida; la operación completa sigue en Tiendanube.
          </li>
          <li>
            <span className={styles.stepNum}>3</span>
            <strong>Reglas y módulos</strong>: mantenimiento, textos de referencia y flags técnicos.
          </li>
        </ul>
      </header>
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

        <Link href={withAdminShopQuery('/admin/pedidos', shop)} className={styles.cardLink}>
          <div className={styles.card}>
            <div className={styles.cardIco} aria-hidden>
              ▤
            </div>
            <div className={styles.cardTitle}>Pedidos</div>
            <div className={styles.cardDesc}>
              Listado paginado con totales, pago y estado. Requiere scope <code>read_orders</code> en la app.
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
              Productos publicados, miniatura e ID. Enlace directo a la ficha en la vitrina headless.
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
              Modo mantenimiento, notas internas, textos de checkout y flags (cart, stock, logs).
            </div>
            <span className={styles.cardCta}>Configurar →</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
