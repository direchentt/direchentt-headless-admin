import { redirect } from 'next/navigation';
import { loadStorefrontForAdmin } from '../actions';
import StorefrontEditor from './StorefrontEditor';

const DEFAULT_SHOP = '5112334';

export default async function AdminStorefrontPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const sp = await searchParams;
  const shopRaw = sp.shop || process.env.NEXT_PUBLIC_DEFAULT_SHOP || DEFAULT_SHOP;
  const storeId = parseInt(String(shopRaw), 10);
  if (!Number.isFinite(storeId)) {
    redirect(`/admin/storefront?shop=${DEFAULT_SHOP}`);
  }

  const config = await loadStorefrontForAdmin(storeId);
  if (!config) {
    redirect('/admin/login');
  }

  return <StorefrontEditor storeId={storeId} initialConfig={config} />;
}
