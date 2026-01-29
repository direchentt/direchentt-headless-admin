import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ImageGallery from '../../components/ImageGallery';
import ProductInfo from '../../components/ProductInfo';
import ModalsWrapper from '../../components/ModalsWrapper';
import { getStoreData, fetchTN } from '../../../lib/backend';
import { processProduct, getRelatedProducts } from '../../../lib/product-utils';

export default async function ProductPage({ params, searchParams }: any) {
  const { id } = await params;
  const { shop } = await searchParams;
  const storeLocal = await getStoreData(shop);
  if (!storeLocal) return notFound();

  const [product, categories, products] = await Promise.all([
    fetchTN(`products/${id}?expand=variants`, storeLocal.storeId, storeLocal.accessToken),
    fetchTN('categories', storeLocal.storeId, storeLocal.accessToken),
    fetchTN('products', storeLocal.storeId, storeLocal.accessToken, 'limit=20&published=true')
  ]);
  
  if (!product) return notFound();

  const relatedProducts = getRelatedProducts(products?.result || [], product.id, product.category_id);
  const processedProduct = processProduct(product);

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
            images={processedProduct.images || []}
            productName={processedProduct.name}
          />
        </div>

        {/* INFORMACIÓN DEL PRODUCTO */}
        <div className="pdp-info-col">
          <ProductInfo
            product={processedProduct}
            storeId={storeLocal.storeId}
            domain={storeLocal.domain}
          />
        </div>
      </div>

      {/* PRODUCTOS RELACIONADOS */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="related-section">
          <h2 className="related-title">Podría gustarte</h2>
          <div className="related-grid">
            {relatedProducts.slice(0, 4).map((related: any) => {
              const relName = typeof related.name === 'object' 
                ? (related.name.es || related.name.en) 
                : related.name;
              const relPrice = related.variants?.[0]?.price || 0;
              const relImage = related.images?.[0]?.src || '/placeholder.jpg';
              
              return (
                <Link 
                  key={related.id} 
                  href={`/product/${related.id}?shop=${shop}`}
                  className="related-card"
                >
                  <div className="related-image">
                    <img src={relImage} alt={relName} />
                  </div>
                  <h3 className="related-name">{relName}</h3>
                  <p className="related-price">${relPrice.toLocaleString('es-AR')}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <Footer logo={storeLocal.logo} storeName={storeLocal.name || 'DIRECHENTT'} />
      <ModalsWrapper products={products?.result || []} storeId={storeLocal.storeId} />

      <style dangerouslySetInnerHTML={{__html: `
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

        /* ========== PRODUCTOS RELACIONADOS ========== */
        .related-section {
          padding: 60px 20px;
          border-top: 1px solid #e5e5e5;
        }

        @media (min-width: 768px) {
          .related-section {
            padding: 80px 40px;
          }
        }

        .related-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 30px 0;
          letter-spacing: 0.5px;
        }

        @media (min-width: 768px) {
          .related-title {
            font-size: 20px;
            margin-bottom: 40px;
          }
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (min-width: 768px) {
          .related-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
        }

        .related-card {
          text-decoration: none;
          color: inherit;
        }

        .related-image {
          width: 100%;
          aspect-ratio: 3/4;
          overflow: hidden;
          background: #f5f5f5;
          margin-bottom: 12px;
        }

        .related-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .related-card:hover .related-image img {
          transform: scale(1.05);
        }

        .related-name {
          font-size: 13px;
          font-weight: 600;
          margin: 0 0 6px 0;
          line-height: 1.4;
        }

        .related-price {
          font-size: 14px;
          font-weight: 700;
          margin: 0;
        }
      `}} />
    </main>
  );
}
