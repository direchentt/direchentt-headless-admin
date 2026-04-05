'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  formatPrice,
  getVariantDisplayPrices,
  getProductPrimaryImageUrl,
} from '@/lib/product-utils';
import StoreImage from './StoreImage';

interface CrazyCarouselProps {
  products: any[];
  title?: string;
  storeId: string;
}

function safeProductName(product: any): string {
  if (!product?.name) return 'Producto';
  if (typeof product.name === 'object' && product.name !== null) {
    return String(product.name.es || product.name.en || product.name.pt || '');
  }
  return String(product.name);
}

/** Una fila de productos únicos para móvil (sin marquee). */
function buildMobileStrip(products: any[], max: number): any[] {
  const seen = new Set<number>();
  const out: any[] = [];
  for (const p of products) {
    const id = Number(p?.id);
    if (!Number.isFinite(id) || seen.has(id)) continue;
    if (!getProductPrimaryImageUrl(p)) continue;
    seen.add(id);
    out.push(p);
    if (out.length >= max) break;
  }
  return out;
}

export default function CrazyCarousel({ products, title = 'TRENDING', storeId }: CrazyCarouselProps) {
  const { baseList, mobileStrip } = useMemo(() => {
    let list = (products || []).filter((p) => getProductPrimaryImageUrl(p));
    if (list.length === 0) return { baseList: [] as any[], mobileStrip: [] as any[] };
    while (list.length < 4) {
      list = [...list, ...list];
    }
    list = list.slice(0, 24);
    return { baseList: list, mobileStrip: buildMobileStrip(list, 18) };
  }, [products]);

  if (baseList.length === 0) return null;

  const midPoint = Math.ceil(baseList.length / 2);
  let row1 = baseList.slice(0, midPoint);
  let row2 = baseList.slice(midPoint);
  if (row2.length === 0) row2 = [...row1];

  const copies = 4;
  const loopRow1 = Array(copies).fill(row1).flat();
  const loopRow2 = Array(copies).fill(row2).flat();
  const pct = 100 / copies;

  return (
    <section className="cc-section" aria-labelledby="cc-heading">
      <div className="cc-inner">
        <header className="cc-header">
          <h2 id="cc-heading" className="cc-heading">
            {title}
          </h2>
          <p className="cc-sub">Deslizá para ver más — en escritorio, carrusel continuo.</p>
        </header>

        {/* Móvil: una sola franja horizontal, cards compactas fijas (sin animación). */}
        <div className="cc-mobile">
          <div className="cc-strip" role="list">
            {mobileStrip.map((product) => (
              <div key={`m-${product.id}`} className="cc-strip-item" role="listitem">
                <TrendingCard product={product} storeId={storeId} layout="strip" />
              </div>
            ))}
          </div>
        </div>

        {/* Escritorio / tablet: doble carril marquee */}
        <div className="cc-desktop" aria-hidden={false}>
          <div className="cc-bg-title" aria-hidden="true">
            {title}
          </div>

          <div className="cc-rows">
            <div className="cc-row">
              <div
                className="cc-track cc-track--left"
                style={{ ['--cc-marquee-pct' as string]: `${pct}%` }}
              >
                {loopRow1.map((product, index) => (
                  <TrendingCard
                    key={`r1-${product.id}-${index}`}
                    product={product}
                    storeId={storeId}
                    layout="marquee"
                  />
                ))}
              </div>
            </div>

            <div className="cc-row">
              <div
                className="cc-track cc-track--right"
                style={{ ['--cc-marquee-pct' as string]: `${pct}%` }}
              >
                {loopRow2.map((product, index) => (
                  <TrendingCard
                    key={`r2-${product.id}-${index}`}
                    product={product}
                    storeId={storeId}
                    layout="marquee"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cc-section {
          padding: clamp(32px, 5vw, 56px) 0;
          background: #fff;
          overflow: hidden;
          position: relative;
        }

        .cc-inner {
          position: relative;
          max-width: min(1440px, 100%);
          margin: 0 auto;
          padding: 0 clamp(12px, 3vw, 28px);
        }

        .cc-header {
          position: relative;
          z-index: 2;
          text-align: left;
          margin-bottom: 14px;
        }
        @media (min-width: 768px) {
          .cc-header {
            text-align: center;
            margin-bottom: clamp(10px, 2vw, 18px);
            max-width: 32rem;
            margin-left: auto;
            margin-right: auto;
          }
        }

        .cc-heading {
          margin: 0 0 4px;
          font-size: clamp(0.95rem, 2.8vw, 1.15rem);
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #111;
        }
        .cc-sub {
          margin: 0;
          font-size: 12px;
          color: #777;
          line-height: 1.4;
        }
        @media (min-width: 768px) {
          .cc-sub {
            font-size: 13px;
          }
        }

        .cc-mobile {
          display: block;
        }
        .cc-desktop {
          display: none;
        }
        @media (min-width: 768px) {
          .cc-mobile {
            display: none;
          }
          .cc-desktop {
            display: block;
          }
        }

        .cc-strip {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          gap: 10px;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x mandatory;
          scroll-padding: 0 12px;
          padding: 4px 0 12px;
          margin: 0 -12px;
          padding-left: 12px;
          padding-right: 12px;
        }
        .cc-strip::-webkit-scrollbar {
          height: 4px;
        }
        .cc-strip::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }
        .cc-strip-item {
          flex: 0 0 auto;
          scroll-snap-align: start;
          width: 132px;
        }
        @media (min-width: 480px) {
          .cc-strip-item {
            width: 144px;
          }
        }

        .cc-bg-title {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 0;
          pointer-events: none;
          text-align: center;
          font-size: clamp(3rem, 12vw, 6.5rem);
          font-weight: 800;
          text-transform: uppercase;
          line-height: 0.92;
          margin: 0;
          color: rgba(0, 0, 0, 0.03);
          letter-spacing: -0.02em;
          user-select: none;
        }

        .cc-rows {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: clamp(16px, 3vw, 32px) 0;
        }

        .cc-row {
          width: 100%;
          overflow: hidden;
          position: relative;
        }

        .cc-track {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: 14px;
          width: max-content;
          will-change: transform;
        }

        .cc-row:hover .cc-track {
          animation-play-state: paused;
        }

        .cc-track--left {
          animation: ccSlideLeft 72s linear infinite;
        }

        .cc-track--right {
          animation: ccSlideRight 72s linear infinite;
        }

        @keyframes ccSlideLeft {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-1 * var(--cc-marquee-pct, 25%)));
          }
        }

        @keyframes ccSlideRight {
          0% {
            transform: translateX(calc(-1 * var(--cc-marquee-pct, 25%)));
          }
          100% {
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cc-track--left,
          .cc-track--right {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}

function TrendingCard({
  product,
  storeId,
  layout,
}: {
  product: any;
  storeId: string;
  layout: 'strip' | 'marquee';
}) {
  const { current } = getVariantDisplayPrices(product.variants?.[0] || {});
  const src = getProductPrimaryImageUrl(product);
  const name = safeProductName(product);

  return (
    <Link href={`/product/${product.id}?shop=${storeId}`} className={`t-card t-card--${layout}`}>
      <div className="t-img">
        {src ? (
          <StoreImage
            src={src}
            alt=""
            fill
            className="t-img-el"
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
            sizes="(max-width: 768px) 40vw, 188px"
          />
        ) : null}
      </div>
      <div className="t-meta">
        <span className="t-name">{name}</span>
        <span className="t-price">{formatPrice(current)}</span>
      </div>

      <style jsx>{`
        .t-card {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: #111;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
          border: 1px solid #ececec;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .t-card--strip {
          width: 100%;
        }
        .t-card--marquee {
          width: 160px;
        }
        @media (min-width: 900px) {
          .t-card--marquee {
            width: 176px;
          }
        }
        @media (min-width: 1200px) {
          .t-card--marquee {
            width: 188px;
          }
        }

        .t-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        }

        .t-img {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          background: #f4f4f4;
          overflow: hidden;
        }
        .t-img-el {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center top;
        }

        .t-meta {
          padding: 8px 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .t-name {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .t-price {
          font-size: 11px;
          font-weight: 700;
          color: #111;
        }
      `}</style>
    </Link>
  );
}
