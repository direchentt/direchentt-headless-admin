import Link from 'next/link';
import { getMarketingInsightsSnapshot } from '@/lib/shopper-intelligence-db';
import { enrichMarketingInsightsSnapshot } from '@/lib/marketing-insights-enrich';
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
  const rawInsights = await getMarketingInsightsSnapshot(storeId);
  const initial = await enrichMarketingInsightsSnapshot(shop, rawInsights);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.pageTitle}>Marketing e inteligencia</h1>
      <p className={mstyles.lead}>
        Métricas desde <strong>señales del storefront headless</strong> (MongoDB): embudo, productos y
        categorías con nombre, UTMs/canal/referrer por evento, y enriquecimiento de títulos vía{' '}
        <strong>API de Tiendanube</strong> cuando la app tiene token. No duplica el informe analítico
        nativo del admin de Tiendanube; lo complementa con lo que ocurre en tu vitrina propia.
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
