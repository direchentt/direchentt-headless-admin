import Header from './components/Header';
import HeroSlider from './components/HeroSlider';
import FeaturedSection from './components/FeaturedSection';
import BannerGrid from './components/BannerGrid';
import ProductGrid from './components/ProductGrid';
import Footer from './components/Footer';
import ModalsWrapper from './components/ModalsWrapper';
import { getStoreData, fetchTN, processProducts, processBanners } from '../lib/backend';

export default async function Home({ searchParams }: any) {
  const params = await searchParams;
  const storeLocal = await getStoreData(params.shop || "5112334");
  if (!storeLocal) return null;

  let apiQuery = "";
  if (params.category) apiQuery += `&category=${params.category}`;
  if (params.sort) apiQuery += `&sort_by=${params.sort}`;

  const [productsRaw, categories, banners] = await Promise.all([
    fetchTN('products', storeLocal.storeId, storeLocal.accessToken, apiQuery),
    fetchTN('categories', storeLocal.storeId, storeLocal.accessToken),
    fetchTN('banners', storeLocal.storeId, storeLocal.accessToken)
  ]);

  // Procesar datos usando funciones de utilidad
  const products = processProducts(productsRaw);
  const bannerImages = processBanners(banners, 'hero');

  return (
    <main style={{ backgroundColor: '#ffffff', color: '#000', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      {/* Modales globales */}
      <ModalsWrapper products={products} storeId={storeLocal.storeId} />
      
      <Header 
        logo={storeLocal.logo} 
        storeId={storeLocal.storeId} 
        domain={storeLocal.domain}
        categories={categories}
      />
      
      {/* Hero Slider con banners locales */}
      <HeroSlider banners={bannerImages} />
      
      {/* Grid de 3 categorías principales */}
      <FeaturedSection storeId={storeLocal.storeId} categories={categories} />
      
      {/* Sección NOVEDADES */}
      <section style={{ padding: '80px 0', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ 
            fontSize: '12px', 
            fontWeight: '800', 
            textAlign: 'center', 
            marginBottom: '50px',
            letterSpacing: '4px',
            textTransform: 'uppercase'
          }}>
            NOVEDADES
          </h2>
          <ProductGrid products={products.slice(0, 8)} storeId={storeLocal.storeId} />
        </div>
      </section>

      {/* Banner Split - Mujer / Hombre */}
      <BannerGrid storeId={storeLocal.storeId} variant="split" />

      {/* Sección BEST SELLERS */}
      <section style={{ padding: '80px 0', backgroundColor: '#f8f8f8' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ 
            fontSize: '12px', 
            fontWeight: '800', 
            textAlign: 'center', 
            marginBottom: '50px',
            letterSpacing: '4px',
            textTransform: 'uppercase'
          }}>
            BEST SELLERS
          </h2>
          <ProductGrid products={products.slice(8, 16)} storeId={storeLocal.storeId} />
        </div>
      </section>

      {/* Banner Full Width - Collection */}
      <BannerGrid storeId={storeLocal.storeId} variant="full" />

      {/* Sección ÚLTIMOS PRODUCTOS */}
      <section style={{ padding: '80px 0', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ 
            fontSize: '12px', 
            fontWeight: '800', 
            textAlign: 'center', 
            marginBottom: '50px',
            letterSpacing: '4px',
            textTransform: 'uppercase'
          }}>
            LO ÚLTIMO
          </h2>
          <ProductGrid products={products.slice(16, 24)} storeId={storeLocal.storeId} />
        </div>
      </section>

      {/* Newsletter Banner */}
      <section style={{ 
        padding: '80px 20px', 
        backgroundColor: '#000',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ 
            fontSize: '11px', 
            fontWeight: '800', 
            letterSpacing: '3px',
            marginBottom: '20px'
          }}>
            NEWSLETTER
          </h3>
          <p style={{ 
            fontSize: '24px', 
            fontWeight: '300', 
            marginBottom: '30px',
            lineHeight: '1.4'
          }}>
            Suscribite y obtené un 10% de descuento
          </p>
          <form style={{ display: 'flex', gap: '0', maxWidth: '450px', margin: '0 auto' }}>
            <input 
              type="email" 
              placeholder="Tu email" 
              style={{ 
                flex: 1,
                padding: '16px 20px',
                border: 'none',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button 
              type="submit"
              style={{ 
                padding: '16px 30px',
                background: '#fff',
                color: '#000',
                border: 'none',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '1px',
                cursor: 'pointer'
              }}
            >
              SUSCRIBIRSE
            </button>
          </form>
        </div>
      </section>
      
      <Footer 
        logo={storeLocal.logo} 
        storeName={storeLocal.name || 'DIRECHENTT'}
      />
    </main>
  );
}