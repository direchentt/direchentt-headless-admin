import Link from 'next/link';
import styles from './AdminHomePage.module.css';

export default function AdminHomePage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: '#202223' }}>
        Inicio
      </h1>
      <p style={{ color: '#6d7175', marginBottom: 28, fontSize: 14 }}>
        Gestioná la vitrina headless. El catálogo y los pedidos siguen en Tiendanube.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        <Link href="/admin/storefront" className={styles.cardLink}>
          <div className={styles.card}>
            <div className={styles.cardIco}>◉</div>
            <div className={styles.cardTitle}>Tienda en línea</div>
            <div className={styles.cardDesc}>
              Orden de la home, bloques visibles, tema y banners del hero.
            </div>
          </div>
        </Link>
        <div className={styles.cardMuted}>
          <div className={styles.cardIco}>◇</div>
          <div className={styles.cardTitle}>Pedidos</div>
          <div className={styles.cardDesc}>Próximamente: enlaces al admin de Tiendanube.</div>
        </div>
      </div>
    </div>
  );
}
