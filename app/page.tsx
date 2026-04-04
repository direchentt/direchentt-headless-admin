import Header from './components/Header';
import HeroSlider from './components/HeroSlider';
import CategoryTabs from './components/CategoryTabs';
import ProductGrid from './components/ProductGrid';
import Footer from './components/Footer';
import ModalsWrapper from './components/ModalsWrapper';
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

export default async function Home({ searchParams }: any) {
  const params = await searchParams;
  const storeLocal = await getStoreData(params.shop || "5112334");
  if (!storeLocal) return null;

  let apiQuery = "published=true&sort_by=created-descending";
  if (params.category) apiQuery += `&category=${params.category}`;
  if (params.sort) apiQuery = `published=true&sort_by=${params.sort}`;

  const [productsRaw, categoriesRaw, tnStore] = await Promise.all([
    fetchAllPagedTNProducts(storeLocal.storeId, storeLocal.accessToken, apiQuery),
    fetchTN('categories', storeLocal.storeId, storeLocal.accessToken),
    fetchTiendanubeStore(storeLocal.storeId, storeLocal.accessToken),
  ]);

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

  // Segmentar productos por tipo
  const newProducts = products.slice(0, 12);
  const bestSellers = products.slice(12, 24);
  const backInStock = products.slice(24, 36);
  const allProducts = products.slice(0, 20);

  return (
    <main style={{ backgroundColor: '#ffffff', color: '#000', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <ModalsWrapper products={products} storeId={storeLocal.storeId} />

      <Header
        logo={displayLogo}
        storeId={storeLocal.storeId}
        domain={
          storeLocal.domain ||
          (Array.isArray(tnStore?.domains) ? tnStore.domains[0] : undefined) ||
          tnStore?.original_domain ||
          ''
        }
        categories={categories}
      />

      {/* HERO SLIDER - Grande y impactante */}
      <HeroSlider banners={bannerImages} />

      {/* CATEGORY TABS SECTION - Scuffers Style */}
      <section style={{ padding: '60px 0', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
          <CategoryTabs 
            newProducts={newProducts}
            bestSellers={bestSellers}
            backInStock={backInStock}
            storeId={storeLocal.storeId}
          />
        </div>
      </section>

      {/* FEATURED PRODUCTS - "LOS MÁS DESEADOS" */}
      {products.length > 0 && (
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
              Los Más Deseados
            </h2>
            <ProductGrid products={products.slice(0, 6)} storeId={storeLocal.storeId} />
          </div>
        </section>
      )}

      {/* TRUST BADGES SECTION */}
      <section style={{
        padding: '60px 20px',
        backgroundColor: '#fff',
        borderTop: '1px solid #f0f0f0',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🛡️</div>
            <h3 style={{ fontSize: '12px', fontWeight: '800', marginBottom: '8px', letterSpacing: '2px' }}>100% PROTEGIDO</h3>
            <p style={{ fontSize: '13px', color: '#666' }}>Compra segura garantizada</p>
          </div>
          <div>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📦</div>
            <h3 style={{ fontSize: '12px', fontWeight: '800', marginBottom: '8px', letterSpacing: '2px' }}>ENVÍOS A TODO EL PAÍS</h3>
            <p style={{ fontSize: '13px', color: '#666' }}>Entrega en 3-7 días hábiles</p>
          </div>
          <div>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>↩️</div>
            <h3 style={{ fontSize: '12px', fontWeight: '800', marginBottom: '8px', letterSpacing: '2px' }}>DEVOLUCIONES FÁCILES</h3>
            <p style={{ fontSize: '13px', color: '#666' }}>Sin complicaciones</p>
          </div>
          <div>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⭐</div>
            <h3 style={{ fontSize: '12px', fontWeight: '800', marginBottom: '8px', letterSpacing: '2px' }}>CALIDAD PREMIUM</h3>
            <p style={{ fontSize: '13px', color: '#666' }}>Prendas duraderas</p>
          </div>
        </div>
      </section>

      {/* ALL PRODUCTS SHOWCASE */}
      {products.length > 0 && (
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
              Explorar Todo
            </h2>
            <ProductGrid products={allProducts} storeId={storeLocal.storeId} />
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button style={{
                padding: '12px 40px',
                border: '1px solid #000',
                background: '#fff',
                color: '#000',
                fontSize: '12px',
                fontWeight: '800',
                letterSpacing: '2px',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}>
                Ver Todo
              </button>
            </div>
          </div>
        </section>
      )}

      {/* NEWSLETTER - Mejorado con beneficio visual */}
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
            marginBottom: '20px',
            textTransform: 'uppercase'
          }}>
            Newsletter
          </h3>
          <p style={{
            fontSize: '24px',
            fontWeight: '300',
            marginBottom: '10px',
            lineHeight: '1.4'
          }}>
            Suscríbete y obtén
          </p>
          <p style={{
            fontSize: '32px',
            fontWeight: '800',
            marginBottom: '30px',
            lineHeight: '1.2'
          }}>
            10% de Descuento
          </p>
          <p style={{
            fontSize: '13px',
            color: '#ccc',
            marginBottom: '30px'
          }}>
            Recibe novedades sobre colecciones, reposiciones y ofertas exclusivas
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
                outline: 'none',
                backgroundColor: '#fff',
                color: '#000'
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
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              Suscribirse
            </button>
          </form>
          <p style={{
            fontSize: '11px',
            color: '#999',
            marginTop: '15px'
          }}>
            ✓ Descuentos exclusivos • ✓ Acceso anticipado • ✓ Contenidos especiales
          </p>
        </div>
      </section>

      <Footer
        logo={displayLogo}
        storeName={displayName}
      />
    </main>
  );
}
