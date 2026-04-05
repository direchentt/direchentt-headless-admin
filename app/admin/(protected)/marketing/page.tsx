import Link from 'next/link';
import { getMarketingInsightsSnapshot } from '@/lib/shopper-intelligence-db';
import { getAdminDefaultShopId, parseAdminStoreIdParam, withAdminShopQuery } from '@/lib/admin-shop';
import MarketingDashboard from './MarketingDashboard';
import styles from '../admin-pages.module.css';
import mstyles from './marketing.module.css';

export default async function AdminMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const sp = await searchParams;
  const shop = sp.shop?.trim() || getAdminDefaultShopId();
  const storeId = parseAdminStoreIdParam(shop);
  const initial = await getMarketingInsightsSnapshot(storeId);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.pageTitle}>Marketing e inteligencia</h1>
      <p className={mstyles.lead}>
        Métricas calculadas desde las <strong>señales del storefront</strong> (MongoDB): vistas, carrito,
        búsquedas, checkout y favoritos. Compará la semana actual con la anterior en cada tipo de evento.
      </p>
      <div className={styles.shopBar}>
        <span>
          Tienda <strong>#{shop}</strong>
        </span>
        <Link href={withAdminShopQuery('/admin/reglas', shop)}>Reglas y playbook →</Link>
        <Link href={withAdminShopQuery('/admin', shop)}>← Inicio panel</Link>
      </div>

      <MarketingDashboard storeId={storeId} shopParam={shop} initial={initial} />
    </div>
  );
}
