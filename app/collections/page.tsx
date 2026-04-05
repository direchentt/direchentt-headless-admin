import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ModalsWrapper from '../components/ModalsWrapper';
import ProductGrid from '../components/ProductGrid';
import CollectionsEditorialBlock from '../components/CollectionsEditorialBlock';
import {
  getStoreData,
  fetchTN,
  fetchAllPagedTNProducts,
  fetchTiendanubeStore,
  normalizeTiendanubeLogo,
  pickTiendanubeLocalizedText,
  processProducts,
  processCategories,
} from '../../lib/backend';
import { getStorefrontConfigStored } from '../../lib/storefront-db';
import { newsletterFooterImageUrl, resolveStorefrontConfig } from '../../lib/storefront-config';
import { shuffleArray } from '../../lib/product-utils';
import {
  collectUsedProductIds,
  resolveCollectionsEditorialBlocks,
} from '../../lib/collections-editorial';
import StoreUnavailable from '../components/StoreUnavailable';

const PRODUCTS_LIMIT = 48;

export const dynamic = 'force-dynamic';

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ shop?: string }> }) {
  const params = await searchParams;
  const shopParam = params.shop || '5112334';
  const storeLocal = await getStoreData(shopParam);
  if (!storeLocal) return <StoreUnavailable shopId={String(shopParam)} />;

  const storeIdNum = Number(storeLocal.storeId);

  const [productsRaw, categoriesRaw, tnStore, storedFront] = await Promise.all([
    fetchAllPagedTNProducts(
      storeLocal.storeId,
      storeLocal.accessToken,
      'published=true&sort_by=created-descending'
    ),
    fetchTN('categories', storeLocal.storeId, storeLocal.accessToken),
    fetchTiendanubeStore(storeLocal.storeId, storeLocal.accessToken),
    getStorefrontConfigStored(storeIdNum),
  ]);

  const sf = resolveStorefrontConfig(storedFront);
  const col = sf.collections;

  const products = processProducts(productsRaw as any[]);
  const categories = processCategories(categoriesRaw);
  const shuffled = shuffleArray([...products]).slice(0, PRODUCTS_LIMIT);

  /** Banner + 4 productos (2×2) por fila; filas alternadas izq/der si hay varias (URLs legacy o editorialBlocks). */
  const editorialResolved = resolveCollectionsEditorialBlocks(col, shuffled);
  const usedIds = editorialResolved?.length ? collectUsedProductIds(editorialResolved) : null;
  const restAfterEditorial = usedIds
    ? shuffled.filter((p) => p?.id != null && !usedIds.has(Number(p.id)))
    : [];
  const restProducts = editorialResolved?.length ? restAfterEditorial : [];

  const mainLang = tnStore?.main_language || 'es';
  const logoFromApi = normalizeTiendanubeLogo(tnStore?.logo);
  const displayLogo = logoFromApi || storeLocal.logo;
  const displayName =
    pickTiendanubeLocalizedText(tnStore?.name, mainLang) ||
    storeLocal.shop_name ||
    storeLocal.name ||
    'Tienda';

  const domain =
    storeLocal.domain ||
    (Array.isArray(tnStore?.domains) ? tnStore.domains[0] : undefined) ||
    tnStore?.original_domain ||
    '';

  const sid = String(storeLocal.storeId);

  return (
    <main className="collections-page">
      <ModalsWrapper products={products} storeId={storeLocal.storeId} />

      <Header logo={displayLogo} storeId={storeLocal.storeId} domain={domain} categories={categories} />

      <section className="collections-hero" aria-labelledby="collections-title">
        <div className="collections-hero-inner">
          <nav className="collections-breadcrumb" aria-label="Migas de pan">
            <Link href={`/?shop=${sid}`}>Inicio</Link>
            <span className="collections-bc-sep">|</span>
            <span className="collections-bc-current">Collections</span>
          </nav>

          <div className="collections-hero-graphic" aria-hidden="true">
            <span className="collections-hero-stroke">ALL</span>
          </div>

          <h1 id="collections-title" className="collections-title">
            Collections
          </h1>
          <p className="collections-lead">
            Curamos la vitrina como en tienda física: el orden se renueva en cada visita para que
            descubras piezas con ojos frescos.
          </p>
        </div>
      </section>

      <div className="collections-body">
        {editorialResolved && editorialResolved.length > 0 ? (
          <>
            {editorialResolved.map((block, idx) => (
              <CollectionsEditorialBlock key={idx} block={block} storeId={sid} />
            ))}
            {restProducts.length > 0 && (
              <>
                <h2 className="collections-more-title">Más productos</h2>
                <div className="collections-grid-wrap">
                  <ProductGrid products={restProducts} storeId={sid} />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="collections-grid-wrap collections-grid-wrap--solo">
            <ProductGrid products={shuffled} storeId={sid} />
          </div>
        )}
      </div>

      <Footer
        logo={displayLogo}
        storeName={displayName}
        storeId={sid}
        newsletterImageUrl={newsletterFooterImageUrl(sf.newsletter)}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .collections-page {
          min-height: 100vh;
          background: #fff;
          color: #0a0a0a;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .collections-hero {
          position: relative;
          padding: 28px max(16px, env(safe-area-inset-left)) 36px max(16px, env(safe-area-inset-right));
          overflow: hidden;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          background: linear-gradient(180deg, #f7f7f7 0%, #ffffff 55%);
        }
        @media (min-width: 768px) {
          .collections-hero {
            padding: 40px 28px 44px;
          }
        }
        .collections-hero-inner {
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .collections-breadcrumb {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 28px;
        }
        .collections-breadcrumb a {
          color: #111;
          text-decoration: none;
          font-weight: 500;
        }
        .collections-breadcrumb a:hover {
          text-decoration: underline;
        }
        .collections-bc-sep {
          margin: 0 10px;
          color: #bbb;
          font-weight: 300;
        }
        .collections-bc-current {
          color: #666;
          font-weight: 500;
        }
        .collections-hero-graphic {
          position: absolute;
          left: 50%;
          top: 56%;
          transform: translate(-50%, -50%);
          z-index: 0;
          pointer-events: none;
          width: 100%;
          text-align: center;
        }
        .collections-hero-stroke {
          font-size: clamp(4rem, 18vw, 14rem);
          font-weight: 900;
          line-height: 0.85;
          letter-spacing: -0.06em;
          color: transparent;
          -webkit-text-stroke: 1px rgba(0,0,0,0.07);
          text-transform: uppercase;
          user-select: none;
        }
        .collections-title {
          position: relative;
          z-index: 2;
          font-size: clamp(1.75rem, 4vw, 2.75rem);
          font-weight: 700;
          letter-spacing: 0.02em;
          margin: 0 0 16px;
          text-align: center;
          text-transform: none;
        }
        .collections-lead {
          position: relative;
          z-index: 2;
          max-width: 520px;
          margin: 0 auto;
          text-align: center;
          font-size: clamp(13px, 2.8vw, 15px);
          line-height: 1.6;
          color: #555;
        }
        .collections-body {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 12px 0 56px;
          box-sizing: border-box;
        }
        @media (min-width: 960px) {
          .collections-body {
            padding: 16px 0 72px;
          }
        }
        .collections-more-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #111;
          margin: 0 auto 20px;
          padding: 16px max(16px, env(safe-area-inset-left)) 0 max(16px, env(safe-area-inset-right));
          max-width: 1400px;
          border-top: 1px solid rgba(0,0,0,0.08);
        }
        .collections-grid-wrap {
          padding: 0 max(12px, env(safe-area-inset-left)) 0 max(12px, env(safe-area-inset-right));
          max-width: 1400px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .collections-grid-wrap .products-section {
          padding-top: 0;
          padding-bottom: 0;
        }
        .collections-grid-wrap--solo .products-section {
          padding-top: 8px;
        }
      `}} />
    </main>
  );
}
