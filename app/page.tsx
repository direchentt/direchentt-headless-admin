import type { CSSProperties } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ModalsWrapper from './components/ModalsWrapper';
import HomePageBlocks from './components/home/HomePageBlocks';
import StoreUnavailable from './components/StoreUnavailable';
import {
  getStoreData,
  fetchTN,
  fetchTiendanubeStore,
  fetchAllPagedTNProducts,
  normalizeTiendanubeLogo,
  pickTiendanubeLocalizedText,
  processProducts,
  processCategories,
  processBanners,
} from '../lib/backend';
import { getRelatedProducts } from '../lib/product-utils';
import { getStorefrontConfigStored } from '../lib/storefront-db';
import { newsletterFooterImageUrl, resolveStorefrontConfig } from '../lib/storefront-config';

const defaultFont =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export default async function Home({ searchParams }: any) {
  const params = await searchParams;
  const shopParam = params.shop || '5112334';
  const storeLocal = await getStoreData(shopParam);
  if (!storeLocal) return <StoreUnavailable shopId={String(shopParam)} />;

  let apiQuery = 'published=true&sort_by=created-descending';
  if (params.category) apiQuery += `&category=${params.category}`;
  if (params.sort) apiQuery = `published=true&sort_by=${params.sort}`;

  const storeIdNum = Number(storeLocal.storeId);

  const [productsRaw, categoriesRaw, tnStore, storedFront] = await Promise.all([
    fetchAllPagedTNProducts(storeLocal.storeId, storeLocal.accessToken, apiQuery),
    fetchTN('categories', storeLocal.storeId, storeLocal.accessToken),
    fetchTiendanubeStore(storeLocal.storeId, storeLocal.accessToken),
    getStorefrontConfigStored(storeIdNum),
  ]);

  const storefrontConfig = resolveStorefrontConfig(storedFront);

  const mainLang = tnStore?.main_language || 'es';
  const logoFromApi = normalizeTiendanubeLogo(tnStore?.logo);
  const displayLogo = logoFromApi || storeLocal.logo;
  const displayName =
    pickTiendanubeLocalizedText(tnStore?.name, mainLang) ||
    storeLocal.shop_name ||
    storeLocal.name ||
    'Tienda';

  const products = processProducts(productsRaw as any[]);
  const categories = processCategories(categoriesRaw);
  const bannerImages = processBanners([], 'hero');

  const shopTheLookProduct = products[4] || products[0] || null;
  const shopTheLookRelated = shopTheLookProduct
    ? getRelatedProducts(products, shopTheLookProduct.id, shopTheLookProduct.category_id)
    : [];

  const domain =
    storeLocal.domain ||
    (Array.isArray(tnStore?.domains) ? tnStore.domains[0] : undefined) ||
    tnStore?.original_domain ||
    '';

  const mainStyle: CSSProperties = {
    backgroundColor: storefrontConfig.theme?.backgroundColor ?? '#ffffff',
    color: '#000',
    fontFamily: storefrontConfig.theme?.fontFamily ?? defaultFont,
  };

  return (
    <main style={mainStyle}>
      <ModalsWrapper products={products} storeId={storeLocal.storeId} />

      <Header
        logo={displayLogo}
        storeId={storeLocal.storeId}
        domain={domain}
        categories={categories}
      />

      <HomePageBlocks
        config={storefrontConfig}
        bannerImages={bannerImages}
        products={products}
        categories={categories}
        storeId={String(storeLocal.storeId)}
        domain={domain}
        shopTheLookProduct={shopTheLookProduct}
        shopTheLookRelated={shopTheLookRelated}
      />

      <Footer
        logo={displayLogo}
        storeName={displayName}
        storeId={String(storeLocal.storeId)}
        newsletterImageUrl={newsletterFooterImageUrl(storefrontConfig.newsletter)}
      />
    </main>
  );
}
