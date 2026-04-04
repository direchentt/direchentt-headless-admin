import type { CSSProperties } from 'react';
import HeroSlider from '../HeroSlider';
import FeaturedSection from '../FeaturedSection';
import BannerGrid from '../BannerGrid';
import ProductGrid from '../ProductGrid';
import NewArrivals from '../NewArrivals';
import ShopTheLook from '../ShopTheLook';
import CrazyCarousel from '../CrazyCarousel';
import type { StorefrontConfigResolved } from '@/lib/storefront-config';

interface HomePageBlocksProps {
  config: StorefrontConfigResolved;
  bannerImages: string[];
  products: any[];
  categories: any[];
  storeId: string;
  domain: string;
  shopTheLookProduct: any | null;
  shopTheLookRelated: any[];
}

function sectionTitleStyle(): CSSProperties {
  return {
    fontSize: '12px',
    fontWeight: 800,
    textAlign: 'center' as const,
    marginBottom: '50px',
    letterSpacing: '4px',
    textTransform: 'uppercase' as const,
  };
}

export default function HomePageBlocks({
  config,
  bannerImages,
  products,
  categories,
  storeId,
  domain,
  shopTheLookProduct,
  shopTheLookRelated,
}: HomePageBlocksProps) {
  const heroSlidesResolved = config.homeHeroSlidesResolved;
  const heroUsesStorefront = heroSlidesResolved.length > 0;

  const blocks: Record<string, React.ReactNode> = {
    hero: (
      <HeroSlider
        key="hero"
        slides={heroUsesStorefront ? heroSlidesResolved : undefined}
        banners={heroUsesStorefront ? [] : bannerImages}
      />
    ),
    featured_categories: (
      <FeaturedSection key="featured_categories" storeId={storeId} categories={categories} />
    ),
    new_arrivals: (
      <NewArrivals
        key="new_arrivals"
        products={products}
        categories={categories}
        storeId={storeId}
        domain={domain}
      />
    ),
    crazy_carousel:
      products.length > 0 ? (
        <CrazyCarousel
          key="crazy_carousel"
          products={products.slice(0, 24)}
          storeId={storeId}
          title={
            config.homeSections.find((x) => x.id === 'crazy_carousel')?.title?.trim() || 'TRENDING'
          }
        />
      ) : null,
    banner_grid_split: (
      <BannerGrid
        key="banner_grid_split"
        storeId={storeId}
        variant="split"
        split={config.bannerSplit}
      />
    ),
    shop_the_look:
      shopTheLookProduct ? (
        <ShopTheLook
          key="shop_the_look"
          mainProduct={shopTheLookProduct}
          relatedProducts={shopTheLookRelated}
          storeId={storeId}
        />
      ) : null,
    best_sellers: (() => {
      const s = config.homeSections.find((x) => x.id === 'best_sellers');
      const title = s?.title || 'BEST SELLERS';
      return (
        <section key="best_sellers" style={{ padding: '80px 0', backgroundColor: '#f8f8f8' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
            <h2 style={sectionTitleStyle()}>{title}</h2>
            <ProductGrid products={products.slice(8, 16)} storeId={storeId} />
          </div>
        </section>
      );
    })(),
    latest_products: (() => {
      const s = config.homeSections.find((x) => x.id === 'latest_products');
      const title = s?.title || 'LO ÚLTIMO';
      return (
        <section key="latest_products" style={{ padding: '80px 0', backgroundColor: '#fff' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
            <h2 style={sectionTitleStyle()}>{title}</h2>
            <ProductGrid products={products.slice(16, 24)} storeId={storeId} />
          </div>
        </section>
      );
    })(),
    newsletter_strip: (() => {
      const s = config.homeSections.find((x) => x.id === 'newsletter_strip');
      const heading = s?.title || 'NEWSLETTER';
      return (
        <section
          key="newsletter_strip"
          style={{
            padding: '80px 20px',
            backgroundColor: '#000',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '3px',
                marginBottom: '20px',
              }}
            >
              {heading}
            </h3>
            <p
              style={{
                fontSize: '24px',
                fontWeight: 300,
                marginBottom: '30px',
                lineHeight: 1.4,
              }}
            >
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
                  outline: 'none',
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
                  fontWeight: 800,
                  letterSpacing: '1px',
                  cursor: 'pointer',
                }}
              >
                SUSCRIBIRSE
              </button>
            </form>
          </div>
        </section>
      );
    })(),
  };

  const sectionNodes = config.homeSections.map((sec) => {
    if (!sec.enabled) return null;
    const node = blocks[sec.id];
    return node ?? null;
  });
  const hasVisibleBlock = sectionNodes.some((n) => n != null);

  return (
    <>
      {sectionNodes}
      {!hasVisibleBlock ? (
        <div key="fallback-hero">
          {blocks.hero}
          <p
            style={{
              textAlign: 'center',
              padding: '24px 16px 48px',
              fontSize: 13,
              color: '#666',
              maxWidth: 520,
              margin: '0 auto',
            }}
          >
            Todas las secciones de la home están desactivadas en el admin. Activá bloques en{' '}
            <strong>Tienda en línea</strong> o revisá la configuración.
          </p>
        </div>
      ) : null}
    </>
  );
}
