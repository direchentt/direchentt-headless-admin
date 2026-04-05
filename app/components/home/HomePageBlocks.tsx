import type { CSSProperties } from 'react';
import HeroSlider from '../HeroSlider';
import FeaturedSection from '../FeaturedSection';
import BannerGrid from '../BannerGrid';
import ProductGrid from '../ProductGrid';
import NewArrivals from '../NewArrivals';
import PersonalizedProductRail from '../PersonalizedProductRail';
import ShopTheLook from '../ShopTheLook';
import CrazyCarousel from '../CrazyCarousel';
import NewsletterHomeStrip from '../NewsletterHomeStrip';
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
    for_you: (() => {
      const s = config.homeSections.find((x) => x.id === 'for_you');
      const title = s?.title?.trim() || 'PARA VOS';
      return (
        <PersonalizedProductRail
          key="for_you"
          products={products}
          storeId={storeId}
          title={title}
        />
      );
    })(),
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
      return <NewsletterHomeStrip key="newsletter_strip" storeId={storeId} heading={heading} />;
    })(),
  };

  return (
    <>
      {config.homeSections.map((sec) => {
        if (!sec.enabled) return null;
        const node = blocks[sec.id];
        return node ?? null;
      })}
    </>
  );
}
