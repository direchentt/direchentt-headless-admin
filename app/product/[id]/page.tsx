import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ImageGallery from '../../components/ImageGallery';
import ProductInfo from '../../components/ProductInfo';
import ModalsWrapper from '../../components/ModalsWrapper';
import ShopTheLook from '../../components/ShopTheLook';
import ProductCarousel from '../../components/ProductCarousel';
import { getStoreData, fetchTN } from '../../../lib/backend';
import { processProduct, getRelatedProducts, getCrossSellProducts, getBestSellers } from '../../../lib/product-utils';

export default async function ProductPage({ params, searchParams }: any) {
  const { id } = await params;
  const { shop } = await searchParams;
  const storeLocal = await getStoreData(shop);
  if (!storeLocal) return notFound();

  const [product, categories, products] = await Promise.all([
    fetchTN(`products/${id}?expand=variants`, storeLocal.storeId, storeLocal.accessToken),
    fetchTN('categories', storeLocal.storeId, storeLocal.accessToken),
    fetchTN('products', storeLocal.storeId, storeLocal.accessToken, 'limit=60&published=true')
  ]);

  if (!product) return notFound();

  const allProducts = Array.isArray(products) ? products : (products?.result || []);

  const relatedProducts = getRelatedProducts(allProducts, product.id, product.category_id);
  const crossSellGroups = getCrossSellProducts(allProducts, product.category_id);
  const bestSellers = getBestSellers(allProducts);

  const processedProduct = processProduct(product);
  // Helper para obtener nombre de categoría
  const getCategoryName = (catId: number) => {
    const cat = categories.find((c: any) => c.id == catId);
    return cat ? (cat.name.es || cat.name.en || cat.name) : 'Destacados';
  };

  return (
    <main className="pdp-page">
      <Header
        logo={storeLocal.logo}
        storeId={storeLocal.storeId}
        domain={storeLocal.domain}
        categories={categories || []}
      />

      <div className="pdp-layout">
        {/* GALERÍA DE IMÁGENES */}
        <div className="pdp-gallery-col">
          <ImageGallery
            images={processProduct(product).images || []}
            productName={processProduct(product).name}
          />
        </div>

        {/* INFORMACIÓN DEL PRODUCTO */}
        <div className="pdp-info-col">
          <ProductInfo
            product={processProduct(product)}
            storeId={storeLocal.storeId}
            domain={storeLocal.domain}
          />
        </div>
      </div>

      {/* SHOP THE LOOK */}
      <ShopTheLook
        mainProduct={processedProduct}
        relatedProducts={relatedProducts}
        storeId={storeLocal.storeId}
      />

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

      <Footer logo={storeLocal.logo} storeName={storeLocal.name || 'DIRECHENTT'} />
      <ModalsWrapper products={allProducts} storeId={storeLocal.storeId} />

      <style dangerouslySetInnerHTML={{
        __html: `
        .pdp-page {
          background: #fff;
          min-height: 100vh;
        }

        /* ========== LAYOUT PRINCIPAL ========== */
        .pdp-layout {
          display: flex;
          flex-direction: column;
        }

        @media (min-width: 1024px) {
          .pdp-layout {
            display: grid;
            grid-template-columns: 1fr 450px;
            min-height: calc(100vh - 100px);
          }
        }

        @media (min-width: 1280px) {
          .pdp-layout {
            grid-template-columns: 1fr 500px;
          }
        }

        .pdp-gallery-col {
          width: 100%;
        }

        .pdp-info-col {
          width: 100%;
        }

        @media (min-width: 1024px) {
          .pdp-info-col {
            border-left: 1px solid #e5e5e5;
          }
        }

        /* ========== SECCIÓN RELACIONADOS ========== */
        .related-section {
          padding: 40px 0;
          border-top: 1px solid #e5e5e5;
          background: #fff;
        }
      `}} />
    </main>
  );
}
