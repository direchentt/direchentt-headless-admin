'use client';

import Link from 'next/link';
import {
  formatPrice,
  getVariantDisplayPrices,
  getProductPrimaryImageUrl,
} from '@/lib/product-utils';

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

export default function CrazyCarousel({ products, title = 'TRENDING', storeId }: CrazyCarouselProps) {
  let list = (products || []).filter((p) => getProductPrimaryImageUrl(p));
  if (list.length === 0) return null;

  while (list.length < 4) {
    list = [...list, ...list];
  }
  list = list.slice(0, 24);

  let midPoint = Math.ceil(list.length / 2);
  let row1 = list.slice(0, midPoint);
  let row2 = list.slice(midPoint);
  if (row2.length === 0) {
    row2 = [...row1];
  }

  const copies = 4;
  const loopRow1 = Array(copies).fill(row1).flat();
  const loopRow2 = Array(copies).fill(row2).flat();
  const pct = 100 / copies;

  return (
    <section className="cc-section" aria-labelledby="cc-heading">
      <div className="cc-inner">
        <p id="cc-heading" className="cc-sr-only">
          {title}: carrusel de productos destacados
        </p>
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
                <ProductCardStream
                  key={`r1-${product.id}-${index}`}
                  product={product}
                  storeId={storeId}
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
                <ProductCardStream
                  key={`r2-${product.id}-${index}`}
                  product={product}
                  storeId={storeId}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cc-section {
          padding: clamp(40px, 8vw, 72px) 0;
          background: #fff;
          overflow: hidden;
          position: relative;
        }

        .cc-inner {
          position: relative;
          max-width: 100vw;
          margin: 0 auto;
        }

        .cc-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
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
          font-size: clamp(2.5rem, 11vw, 9rem);
          font-weight: 900;
          text-transform: uppercase;
          line-height: 0.95;
          margin: 0;
          color: transparent;
          -webkit-text-stroke: 1px rgba(0, 0, 0, 0.08);
          letter-spacing: -0.04em;
          user-select: none;
        }

        @media (min-width: 1024px) {
          .cc-bg-title {
            font-size: clamp(5rem, 12vw, 10rem);
            -webkit-text-stroke: 1px rgba(0, 0, 0, 0.1);
          }
        }

        .cc-rows {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: clamp(14px, 3vw, 24px);
          padding: clamp(24px, 5vw, 48px) 0;
        }

        .cc-row {
          width: 100%;
          overflow: hidden;
          position: relative;
          mask-image: linear-gradient(
            90deg,
            transparent 0%,
            black 4%,
            black 96%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            90deg,
            transparent 0%,
            black 4%,
            black 96%,
            transparent 100%
          );
        }

        .cc-track {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: clamp(10px, 2vw, 18px);
          width: max-content;
          will-change: transform;
        }

        .cc-row:hover .cc-track {
          animation-play-state: paused;
        }

        .cc-track--left {
          animation: ccSlideLeft 55s linear infinite;
        }

        .cc-track--right {
          animation: ccSlideRight 55s linear infinite;
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

function ProductCardStream({ product, storeId }: { product: any; storeId: string }) {
  const { current } = getVariantDisplayPrices(product.variants?.[0] || {});
  const src = getProductPrimaryImageUrl(product);
  const name = safeProductName(product);

  return (
    <Link href={`/product/${product.id}?shop=${storeId}`} className="cc-card">
      <div className="cc-img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="cc-img" width={280} height={360} />
        <div className="cc-overlay">
          <span className="cc-price">{formatPrice(current)}</span>
        </div>
      </div>
      <div className="cc-meta">
        <span className="cc-name">{name}</span>
      </div>

      <style jsx>{`
        .cc-card {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          width: clamp(150px, 38vw, 220px);
          text-decoration: none;
          color: #111;
          transition: filter 0.35s ease, opacity 0.35s ease, transform 0.35s ease;
          filter: grayscale(100%);
          opacity: 0.88;
        }

        @media (min-width: 480px) {
          .cc-card {
            width: clamp(170px, 32vw, 240px);
          }
        }

        @media (min-width: 1024px) {
          .cc-card {
            width: 220px;
          }
        }

        .cc-card:hover {
          filter: grayscale(0%);
          opacity: 1;
          transform: translateY(-4px);
          z-index: 2;
        }

        .cc-img-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          background: #f4f4f4;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .cc-img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
        }

        .cc-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .cc-card:hover .cc-overlay {
          opacity: 1;
        }

        .cc-price {
          background: #fff;
          padding: 6px 14px;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.02em;
        }

        .cc-meta {
          width: 100%;
          min-height: 2.6em;
        }

        .cc-name {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          line-height: 1.35;
          word-break: break-word;
        }
      `}</style>
    </Link>
  );
}
