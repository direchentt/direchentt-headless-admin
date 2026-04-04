import type { CSSProperties } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ModalsWrapper from './components/ModalsWrapper';
import HomePageBlocks from './components/home/HomePageBlocks';
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
import { resolveStorefrontConfig } from '../lib/storefront-config';

const defaultFont =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export default async function Home({ searchParams }: any) {
  const params = await searchParams;
  const shopParam = params.shop || process.env.NEXT_PUBLIC_DEFAULT_SHOP || '5112334';
  const storeLocal = await getStoreData(String(shopParam));
  if (!storeLocal) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: defaultFont,
          background: '#fafafa',
          color: '#111',
        }}
      >
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            No se pudo cargar la tienda
          </h1>
          <p style={{ color: '#555', fontSize: 15, lineHeight: 1.6, marginBottom: 12 }}>
            No encontramos la tienda en la base de datos o la conexión a MongoDB falló (revisá{' '}
            <code style={{ fontSize: 13 }}>MONGODB_URI</code> en Vercel y Network Access en Atlas).
          </p>
          <p style={{ color: '#666', fontSize: 14 }}>
            Probá <code style={{ fontSize: 13 }}>?shop=ID</code> con el ID numérico de tu tienda.
          </p>
        </div>
      </main>
    );
  }

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

      <Footer logo={displayLogo} storeName={displayName} />
    </main>
  );
}
