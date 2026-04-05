import { Suspense } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ModalsWrapper from '../../components/ModalsWrapper';
import CategoryGrid from '../../components/CategoryGrid';
import StoreUnavailable from '../../components/StoreUnavailable';
import {
  getStoreData,
  fetchTN,
  processProducts,
  fetchTiendanubeStore,
  normalizeTiendanubeLogo,
} from '../../../lib/backend';
import { getStorefrontConfigStored } from '../../../lib/storefront-db';
import { newsletterFooterImageUrl, resolveStorefrontConfig } from '../../../lib/storefront-config';
import {
  normalizeCategorySortParam,
  sortCategoryProducts,
} from '../../../lib/category-sort';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ shop?: string; sort?: string; grid?: string; page?: string }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const shopParam = query.shop || '5112334';

  const storeLocal = await getStoreData(shopParam);
  if (!storeLocal) return <StoreUnavailable shopId={String(shopParam)} />;

  const sortSafe = normalizeCategorySortParam(query.sort);

  let apiQuery = `&category_id=${encodeURIComponent(id)}&published=true`;
  if (sortSafe) apiQuery += `&sort_by=${encodeURIComponent(sortSafe)}`;

  const storeIdNum = Number(storeLocal.storeId);

  const [productsRaw, categories, storeInfo, tnStore, storedFront] = await Promise.all([
    fetchTN('products', storeLocal.storeId, storeLocal.accessToken, apiQuery, {
      bypassCache: true,
    }),
    fetchTN('categories', storeLocal.storeId, storeLocal.accessToken),
    fetchTN('', storeLocal.storeId, storeLocal.accessToken),
    fetchTiendanubeStore(storeLocal.storeId, storeLocal.accessToken),
    getStorefrontConfigStored(storeIdNum),
  ]);

  const storefrontConfig = resolveStorefrontConfig(storedFront);

  const rawList = Array.isArray(productsRaw) ? productsRaw : [];
  const processed = processProducts(rawList);
  const products = sortCategoryProducts(processed, sortSafe);

  const gridParsed = query.grid ? parseInt(query.grid, 10) : 4;
  const gridColumns = [3, 4, 5].includes(gridParsed) ? gridParsed : 4;
  const displayLogo = normalizeTiendanubeLogo(tnStore?.logo) || storeLocal.logo;
  
  // Obtener nombre de la categoría actual
  const currentCategory = categories.find((c: any) => String(c.id) === String(id));
  const categoryName = currentCategory 
    ? (typeof currentCategory.name === 'object' 
        ? (currentCategory.name.es || currentCategory.name.en || 'Categoría')
        : (currentCategory.name || 'Categoría'))
    : 'Categoría';

  // Extraer info de pagos/cuotas de la tienda (si está disponible)
  const paymentInfo = storeInfo?.payment_methods || [];
  const installmentsInfo = storeInfo?.installments || [];

  return (
    <main style={{ backgroundColor: '#ffffff', color: '#000', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', minHeight: '100vh' }}>
      <ModalsWrapper products={products} storeId={storeLocal.storeId} />
      
      <Header
        logo={displayLogo}
        storeId={storeLocal.storeId}
        domain={storeLocal.domain}
        categories={categories}
      />
      
      <Suspense
        fallback={
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#888', fontSize: 14 }}>
            Cargando categoría…
          </div>
        }
      >
        <CategoryGrid
          products={products}
          storeId={storeLocal.storeId}
          categoryName={categoryName}
          categoryId={id}
          initialGrid={gridColumns}
          currentSort={sortSafe}
          paymentInfo={paymentInfo}
          installmentsInfo={installmentsInfo}
        />
      </Suspense>
      
      <Footer
        logo={displayLogo}
        storeName={storeLocal.name || 'DIRECHENTT'}
        storeId={String(storeLocal.storeId)}
        newsletterImageUrl={newsletterFooterImageUrl(storefrontConfig.newsletter)}
      />
    </main>
  );
}
