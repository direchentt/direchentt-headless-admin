import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loadAdminPanelRules } from '../commerce-actions';
import ReglasEditor from './ReglasEditor';
import styles from '../admin-pages.module.css';
import { getAdminDefaultShopId, parseAdminStoreIdParam, withAdminShopQuery } from '@/lib/admin-shop';

export default async function AdminReglasPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const sp = await searchParams;
  const shop = sp.shop || getAdminDefaultShopId();
  const storeId = parseAdminStoreIdParam(shop);

  const initial = await loadAdminPanelRules(storeId);
  if (initial === null) {
    redirect('/admin/login');
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.pageTitle}>Reglas y módulos</h1>
      <p className={styles.lead}>
        Configuración avanzada guardada en tu base (MongoDB). Los pedidos y el catálogo siguen viviendo en
        Tiendanube; acá definís flags, textos de referencia y notas para el equipo.
      </p>
      <div className={styles.shopBar}>
        <span>
          Tienda <strong>#{shop}</strong>
        </span>
        <span>
          URL: <code>/admin/reglas?shop=TU_ID</code>
        </span>
        <Link href={withAdminShopQuery('/admin', shop)}>← Inicio panel</Link>
      </div>

      <ReglasEditor storeId={storeId} shopParam={shop} initial={initial} />
    </div>
  );
}
