import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ImageGallery from '../../components/ImageGallery';
import ProductInfo from '../../components/ProductInfo';
import ModalsWrapper from '../../components/ModalsWrapper';
import ProductCarousel from '../../components/ProductCarousel';
import RoutineShowcase from '../../components/RoutineShowcase';
import {
  getStoreData,
  fetchTN,
  fetchTiendanubeStore,
  normalizeTiendanubeLogo,
  fetchTiendanubeProductMetafields,
} from '../../../lib/backend';
import {
  processProduct,
  getRelatedProducts,
  getCrossSellProducts,
  getBestSellers,
  modelNoteFromMetafields,
} from '../../../lib/product-utils';
import { getStorefrontConfigStored } from '../../../lib/storefront-db';
import { newsletterFooterImageUrl, resolveStorefrontConfig } from '../../../lib/storefront-config';
import { buildRoutineShowcaseSteps } from '../../../lib/routine-showcase';

export default async function ProductPage({ params, searchParams }: any) {
  const { id } = await params;
  const { shop } = await searchParams;
  const storeLocal = await getStoreData(shop);
  if (!storeLocal) return notFound();

  const storeIdNum = Number(storeLocal.storeId);

  const [product, categories, products, tnStore, productMetafields, storedFront] = await Promise.all([
    fetchTN(`products/${id}?expand=variants`, storeLocal.storeId, storeLocal.accessToken),
    fetchTN('categories', storeLocal.storeId, storeLocal.accessToken),
    fetchTN('products', storeLocal.storeId, storeLocal.accessToken, 'limit=60&published=true'),
    fetchTiendanubeStore(storeLocal.storeId, storeLocal.accessToken),
    fetchTiendanubeProductMetafields(storeLocal.storeId, storeLocal.accessToken, String(id)),
    getStorefrontConfigStored(storeIdNum),
  ]);

  const storefrontConfig = resolveStorefrontConfig(storedFront);

  if (!product) return notFound();

  const allProducts = Array.isArray(products) ? products : (products?.result || []);

  const relatedProducts = getRelatedProducts(allProducts, product.id, product.category_id);
  const crossSellGroups = getCrossSellProducts(allProducts, product.category_id);
  const bestSellers = getBestSellers(allProducts);

  const logoFromApi = normalizeTiendanubeLogo(tnStore?.logo);
  const displayLogo = logoFromApi || storeLocal.logo;

  const baseProcessed = processProduct(product);
  const modelFromMeta = modelNoteFromMetafields(productMetafields);
  const processedProduct = baseProcessed
    ? {
        ...baseProcessed,
        modelWearingNote: modelFromMeta || baseProcessed.modelWearingNote,
      }
    : null;
  if (!processedProduct) return notFound();

  const routineSteps = buildRoutineShowcaseSteps(
    product,
    relatedProducts,
    processedProduct.name || ''
  );

  // Helper para obtener nombre de categoría
  const getCategoryName = (catId: number) => {
    const cat = categories.find((c: any) => c.id == catId);
    return cat ? (cat.name.es || cat.name.en || cat.name) : 'Destacados';
  };

  return (
    <main className="pdp-page">
      <Header
        logo={displayLogo}
        storeId={storeLocal.storeId}
        domain={storeLocal.domain}
        categories={categories || []}
      />

      <div className="pdp-layout">
        {/* GALERÍA DE IMÁGENES */}
        <div className="pdp-gallery-col">
          <ImageGallery
            images={processedProduct?.images || []}
            productName={processedProduct?.name || ''}
            productId={product.id}
          />
        </div>

        {/* INFORMACIÓN DEL PRODUCTO */}
        <div className="pdp-info-col">
          <ProductInfo
            product={processedProduct}
            storeId={storeLocal.storeId}
            domain={storeLocal.domain}
            completeLookProducts={relatedProducts}
          />
        </div>
      </div>

      {routineSteps.length >= 2 ? (
        <RoutineShowcase
          storeId={String(storeLocal.storeId)}
          title="ARMÁ TU RUTINA"
          subtitle="Recorré los pasos como en una rutina de maquillaje: cada número cambia el foco y la imagen con una transición suave."
          steps={routineSteps}
        />
      ) : null}

      {/* CARRUSELES DE PRODUCTOS */}
      <div className="related-section">

        {/* 1. Mismos productos de la categoría */}
        {relatedProducts.length > 0 && (
          <ProductCarousel
            title="Podría gustarte"
            products={relatedProducts}
            storeId={storeLocal.storeId}
          />
        )}

        {/* 2. Productos de otras categorías (Cross-Sell) */}
        {crossSellGroups.map((group: any, index: number) => (
          <ProductCarousel
            key={group.categoryId}
            title={index === 0 ? 'Completa tu look' : getCategoryName(group.categoryId)}
            products={group.products}
            storeId={storeLocal.storeId}
          />
        ))}

        {/* 3. Carrusel extra: Más Vendidos (Simulado con aleatorios) */}
        {bestSellers.length > 0 && (
          <ProductCarousel
            title="Más Vendidos"
            products={bestSellers}
            storeId={storeLocal.storeId}
          />
        )}

      </div>

      <Footer
        logo={displayLogo}
        storeName={storeLocal.name || 'DIRECHENTT'}
        storeId={String(storeLocal.storeId)}
        newsletterImageUrl={newsletterFooterImageUrl(storefrontConfig.newsletter)}
      />
      <ModalsWrapper products={allProducts} storeId={storeLocal.storeId} />

      <style dangerouslySetInnerHTML={{
        __html: `
        .pdp-page {
          background: #fff;
          min-height: 100vh;
        }

        /* Layout tipo EME: galería fluida + columna de compra fija */
        .pdp-layout {
          display: flex;
          flex-direction: column;
        }

        .pdp-gallery-col {
          width: 100%;
        }

        .pdp-info-col {
          width: 100%;
        }

        @media (min-width: 1024px) {
          .pdp-layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(340px, 440px);
            align-items: stretch;
            column-gap: 0;
          }

          .pdp-gallery-col {
            min-width: 0;
          }

          /* Misma altura que la galería: el sticky del bloque de compra dura todo el scroll de fotos */
          .pdp-info-col {
            border-left: 1px solid #ebebeb;
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-self: stretch;
          }
        }

        @media (min-width: 1440px) {
          .pdp-layout {
            grid-template-columns: minmax(0, 1fr) minmax(380px, 460px);
          }
        }

        /* ========== SECCIÓN RELACIONADOS ========== */
        .related-section {
          padding: 48px 0 64px;
          border-top: 1px solid #ebebeb;
          background: #fff;
        }
      `}} />
    </main>
  );
}
