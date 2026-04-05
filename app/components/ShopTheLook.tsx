'use client';

import Link from 'next/link';
import { formatPrice, getVariantDisplayPrices } from '@/lib/product-utils';
import { normalizeStoreImageUrl } from '@/lib/store-image-url';
import ProductCucardas from './ProductCucardas';

interface ShopTheLookProps {
  mainProduct: any;
  relatedProducts: any[];
  storeId: string | number;
}

function productName(prod: any): string {
  if (typeof prod.name === 'object' && prod.name !== null) {
    return String(prod.name.es || prod.name.en || prod.name.pt || '');
  }
  return String(prod.name ?? '');
}

function primaryImgUrl(prod: any): string {
  const s = prod?.images?.[0]?.src;
  if (!s || typeof s !== 'string') return '';
  return normalizeStoreImageUrl(s) || s.trim();
}

/** Tallas únicas (primer atributo no color si existe) */
function sizeLabelsForProduct(prod: any): string[] {
  const variants = prod?.variants || [];
  const seen = new Set<string>();
  for (const v of variants) {
    const attrs = v?.attributes;
    if (attrs && typeof attrs === 'object') {
      const entries = Object.entries(attrs).filter(([k]) => !/color|colour/i.test(k));
      const val = entries.length ? String(entries[0][1]) : '';
      if (val && !seen.has(val)) seen.add(val);
    }
  }
  return Array.from(seen).slice(0, 8);
}

function LookImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}

export default function ShopTheLook({ mainProduct, relatedProducts, storeId }: ShopTheLookProps) {
  if (!mainProduct) return null;

  const sid = String(storeId);
  const pool = [mainProduct, ...relatedProducts].filter(Boolean);
  const uniqueById = pool.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
  const carouselProducts = uniqueById.slice(0, 12);
  if (carouselProducts.length === 0) return null;

  const hero = carouselProducts[0];
  const related = carouselProducts.slice(1);
  const heroUrl = primaryImgUrl(hero);
  const heroName = productName(hero);
  const heroV0 = hero.variants?.[0];
  const heroPrices = getVariantDisplayPrices(heroV0 || {});
  const heroInStock =
    !hero.variants?.length ||
    hero.variants.some(
      (v: any) => v.stock === null || v.stock === undefined || v.stock > 0
    );

  return (
    <section className="stl" aria-labelledby="stl-heading">
      <div className="stl-inner">
        <header className="stl-head">
          <h2 id="stl-heading" className="stl-kicker">
            Completa el look
          </h2>
          <p className="stl-lead">Shop the look — piezas para armar tu outfit.</p>
        </header>

        {/* Pieza principal — layout editorial (imagen grande + copy) */}
        <div className="stl-hero">
          <div className="stl-hero-visual">
            <Link href={`/product/${hero.id}?shop=${sid}`} className="stl-hero-link">
              <div className="stl-hero-img-wrap">
                {heroUrl ? (
                  <LookImage src={heroUrl} alt={heroName} className="stl-hero-img" />
                ) : null}
              </div>
              <ProductCucardas product={hero} />
              {heroInStock ? <span className="stl-pill">En stock</span> : null}
            </Link>
          </div>
          <div className="stl-hero-copy">
            <p className="stl-hero-label">Pieza principal</p>
            <Link href={`/product/${hero.id}?shop=${sid}`} className="stl-hero-title">
              {heroName}
            </Link>
            <div className="stl-hero-prices">
              {heroPrices.hasPromo ? (
                <span className="stl-old">{formatPrice(heroPrices.list)}</span>
              ) : null}
              <span className={heroPrices.hasPromo ? 'stl-sale' : 'stl-price'}>
                {formatPrice(heroPrices.current)}
              </span>
            </div>
            <Link href={`/product/${hero.id}?shop=${sid}`} className="stl-hero-cta">
              Ver producto
            </Link>
          </div>
        </div>

        {/* Complementos — carrusel horizontal */}
        {related.length > 0 ? (
          <>
            <h3 className="stl-strip-title">Combina con</h3>
            <div className="stl-scroller">
              <div className="stl-track">
                {related.map((prod) => {
                  const v0 = prod.variants?.[0];
                  const { list, current, hasPromo } = getVariantDisplayPrices(v0 || {});
                  const sizes = sizeLabelsForProduct(prod);
                  const url = primaryImgUrl(prod);
                  const name = productName(prod);
                  const inStock =
                    !prod.variants?.length ||
                    prod.variants.some(
                      (v: any) => v.stock === null || v.stock === undefined || v.stock > 0
                    );

                  return (
                    <article key={prod.id} className="stl-card">
                      <div className="stl-card-shell">
                        <Link href={`/product/${prod.id}?shop=${sid}`} className="stl-card-visual">
                          <div className="stl-card-img-wrap">
                            {url ? <LookImage src={url} alt={name} className="stl-card-img" /> : null}
                          </div>
                          <ProductCucardas product={prod} />
                          {inStock ? <span className="stl-pill stl-pill--sm">En stock</span> : null}
                        </Link>
                        <div className="stl-card-body">
                          <Link href={`/product/${prod.id}?shop=${sid}`} className="stl-card-name">
                            {name}
                          </Link>
                          <div className="stl-card-prices">
                            {hasPromo ? <span className="stl-old">{formatPrice(list)}</span> : null}
                            <span className={hasPromo ? 'stl-sale' : 'stl-price'}>
                              {formatPrice(current)}
                            </span>
                          </div>
                          <Link href={`/product/${prod.id}?shop=${sid}`} className="stl-card-add">
                            Añadir
                          </Link>
                          {sizes.length > 0 ? (
                            <div className="stl-sizes" aria-label="Tallas">
                              {sizes.map((s) => (
                                <Link
                                  key={s}
                                  href={`/product/${prod.id}?shop=${sid}`}
                                  className="stl-size-pill"
                                >
                                  {s}
                                </Link>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <style jsx>{`
        .stl {
          padding: clamp(48px, 8vw, 80px) 0;
          background: #fafafa;
          border-top: 1px solid #ebebeb;
        }
        .stl-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 16px;
        }
        @media (min-width: 1024px) {
          .stl-inner {
            padding: 0 28px;
          }
        }

        .stl-head {
          text-align: center;
          margin-bottom: clamp(28px, 5vw, 40px);
        }
        .stl-kicker {
          margin: 0;
          font-size: clamp(10px, 1.2vw, 11px);
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #111;
        }
        .stl-lead {
          margin: 10px 0 0;
          font-size: 14px;
          color: #555;
          letter-spacing: 0.02em;
        }
        @media (min-width: 768px) {
          .stl-lead {
            font-size: 15px;
          }
        }

        /* —— Hero editorial —— */
        .stl-hero {
          display: grid;
          gap: 24px;
          margin-bottom: clamp(32px, 6vw, 48px);
        }
        @media (min-width: 900px) {
          .stl-hero {
            grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
            gap: clamp(24px, 4vw, 48px);
            align-items: center;
          }
        }

        .stl-hero-visual {
          min-width: 0;
        }
        .stl-hero-link {
          position: relative;
          display: block;
          text-decoration: none;
          color: inherit;
          border-radius: 2px;
          overflow: hidden;
          background: #e8e8e8;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.06);
        }
        .stl-hero-img-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          max-height: min(78vh, 820px);
          overflow: hidden;
        }
        @media (min-width: 900px) {
          .stl-hero-img-wrap {
            aspect-ratio: 4 / 5;
          }
        }
        .stl-hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .stl-hero-link:hover .stl-hero-img {
          transform: scale(1.02);
        }

        .stl-pill {
          position: absolute;
          top: 14px;
          right: 14px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 10px;
          background: #fff;
          color: #000;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }
        .stl-pill--sm {
          top: 10px;
          right: 10px;
          font-size: 8px;
          padding: 5px 8px;
        }

        .stl-hero-copy {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          padding: 8px 0;
        }
        @media (min-width: 900px) {
          .stl-hero-copy {
            padding: 24px 0 24px 8px;
            max-width: 360px;
          }
        }
        .stl-hero-label {
          margin: 0;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #888;
        }
        .stl-hero-title {
          margin: 0;
          font-size: clamp(1.25rem, 2.5vw, 1.75rem);
          font-weight: 500;
          line-height: 1.25;
          color: #111;
          text-decoration: none;
          letter-spacing: -0.02em;
        }
        .stl-hero-title:hover {
          text-decoration: underline;
          text-underline-offset: 4px;
        }
        .stl-hero-prices {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: baseline;
          font-size: 15px;
        }
        .stl-old {
          text-decoration: line-through;
          color: #999;
          font-size: 14px;
        }
        .stl-price {
          color: #111;
        }
        .stl-sale {
          color: #111;
          font-weight: 600;
        }
        .stl-hero-cta {
          margin-top: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0 28px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          color: #fff;
          background: #111;
          border-radius: 2px;
          transition: background 0.2s, transform 0.2s;
        }
        .stl-hero-cta:hover {
          background: #333;
        }
        .stl-hero-cta:active {
          transform: scale(0.98);
        }

        .stl-strip-title {
          margin: 0 0 16px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #666;
        }

        .stl-scroller {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          margin: 0 -16px;
          padding: 0 16px 12px;
        }
        @media (min-width: 1024px) {
          .stl-scroller {
            margin: 0 -28px;
            padding: 0 28px 12px;
          }
        }

        .stl-track {
          display: flex;
          gap: 14px;
          width: max-content;
          padding-bottom: 4px;
        }

        .stl-card {
          flex-shrink: 0;
          width: 150px;
        }
        @media (min-width: 480px) {
          .stl-card {
            width: 168px;
          }
        }
        @media (min-width: 768px) {
          .stl-card {
            width: 188px;
          }
        }

        .stl-card-shell {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .stl-card-visual {
          position: relative;
          display: block;
          text-decoration: none;
          color: inherit;
          border-radius: 2px;
          overflow: hidden;
          background: #ececec;
        }
        .stl-card-img-wrap {
          position: relative;
          width: 100%;
          height: calc(150px * 4 / 3);
        }
        @media (min-width: 480px) {
          .stl-card-img-wrap {
            height: calc(168px * 4 / 3);
          }
        }
        @media (min-width: 768px) {
          .stl-card-img-wrap {
            height: calc(188px * 4 / 3);
          }
        }
        .stl-card-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          transition: transform 0.45s ease;
        }
        .stl-card-visual:hover .stl-card-img {
          transform: scale(1.03);
        }

        .stl-card-body {
          padding-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: flex-start;
          min-width: 0;
        }
        .stl-card-name {
          font-size: 11px;
          font-weight: 500;
          line-height: 1.35;
          color: #111;
          text-decoration: none;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .stl-card-name:hover {
          text-decoration: underline;
        }
        .stl-card-prices {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: baseline;
          font-size: 12px;
        }
        .stl-card-add {
          margin-top: 2px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: underline;
          text-underline-offset: 3px;
          color: #111;
        }
        .stl-sizes {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }
        .stl-size-pill {
          min-width: 30px;
          height: 30px;
          padding: 0 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 500;
          border: 1px solid #ccc;
          color: #111;
          text-decoration: none;
          background: #fff;
        }
        .stl-size-pill:hover {
          border-color: #000;
        }
      `}</style>
    </section>
  );
}
