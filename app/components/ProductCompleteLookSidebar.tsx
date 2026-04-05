'use client';

import Link from 'next/link';
import {
  formatPrice,
  getVariantDisplayPrices,
  getProductTagsArray,
} from '@/lib/product-utils';
import StoreImage from './StoreImage';

interface ProductCompleteLookSidebarProps {
  products: any[];
  storeId: string;
}

function productName(prod: any): string {
  if (typeof prod.name === 'object' && prod.name !== null) {
    return String(prod.name.es || prod.name.en || prod.name.pt || '');
  }
  return String(prod.name ?? '');
}

function hasVariantStock(prod: any): boolean {
  if (!prod?.variants?.length) return true;
  return prod.variants.some(
    (v: any) => v.stock === null || v.stock === undefined || v.stock > 0
  );
}

/** Etiqueta Tiendanube tipo “back in stock” / reponido (documentación: tags en product) */
function showBackInStockBadge(prod: any): boolean {
  const tags = getProductTagsArray(prod).map((t) => t.toLowerCase());
  return tags.some((t) => /back|repon|re-stock|restock|reingreso/i.test(t));
}

const MOBILE_MAX = 10;
const DESKTOP_MAX = 4;

export default function ProductCompleteLookSidebar({
  products,
  storeId,
}: ProductCompleteLookSidebarProps) {
  const sid = String(storeId);
  const list = (products || []).slice(0, MOBILE_MAX);
  if (list.length === 0) return null;

  return (
    <section
      className="pdp-ctl"
      aria-label="Completa el look"
    >
      <h2 className="pdp-ctl-title">Completa el look</h2>

      <div className="pdp-ctl-inner">
        {list.map((prod, index) => {
          const v0 = prod.variants?.[0];
          const { list: listPrice, current, hasPromo } = getVariantDisplayPrices(v0 || {});
          const inStock = hasVariantStock(prod);
          const backBadge = showBackInStockBadge(prod) && inStock;
          const desktopHidden = index >= DESKTOP_MAX;

          return (
            <article
              key={prod.id}
              className={`pdp-ctl-card${desktopHidden ? ' pdp-ctl-card-desktop-extra' : ''}`}
            >
              <div className="pdp-ctl-thumb">
                <Link href={`/product/${prod.id}?shop=${sid}`} className="pdp-ctl-visual">
                  {prod.images?.[0]?.src ? (
                    <StoreImage
                      src={prod.images[0].src}
                      alt={productName(prod)}
                      fill
                      className="pdp-ctl-img"
                      style={{ objectFit: 'cover' }}
                      sizes="120px"
                    />
                  ) : null}
                  {backBadge && (
                    <span className="pdp-ctl-badge">Back in stock</span>
                  )}
                </Link>
                <button
                  type="button"
                  className="pdp-ctl-wl"
                  aria-label="Guardar en lista de deseos"
                  title="Guardar"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    aria-hidden
                  >
                    <path d="M6 4h12a1 1 0 011 1v14l-7-4-7 4V5a1 1 0 011-1z" />
                  </svg>
                </button>
              </div>
              <div className="pdp-ctl-meta">
                <div className="pdp-ctl-text">
                  <Link href={`/product/${prod.id}?shop=${sid}`} className="pdp-ctl-name">
                    {productName(prod)}
                  </Link>
                  <div className="pdp-ctl-prices">
                    {hasPromo && (
                      <span className="pdp-ctl-old">{formatPrice(listPrice)}</span>
                    )}
                    <span className={hasPromo ? 'pdp-ctl-curr' : 'pdp-ctl-price'}>
                      {formatPrice(current)}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <style jsx>{`
        .pdp-ctl {
          container-type: inline-size;
          container-name: pdp-ctl;
          margin-top: 20px;
          padding-top: 22px;
          border-top: 1px solid #e8e8e8;
        }

        @media (min-width: 1024px) {
          .pdp-ctl {
            margin-top: 8px;
            padding-top: 28px;
          }
        }

        .pdp-ctl-title {
          margin: 0 0 14px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #111;
        }

        @media (min-width: 1024px) {
          .pdp-ctl-title {
            margin-bottom: 18px;
          }
        }

        /* Móvil / tablet: fila con scroll horizontal */
        .pdp-ctl-inner {
          display: flex;
          flex-wrap: nowrap;
          gap: 12px;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding: 0 0 10px;
          margin: 0 -4px;
          padding-left: 4px;
          padding-right: 4px;
        }

        .pdp-ctl-inner::-webkit-scrollbar {
          display: none;
        }

        .pdp-ctl-card {
          flex: 0 0 calc(45vw - 12px);
          max-width: 200px;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        @media (min-width: 480px) {
          .pdp-ctl-card {
            flex: 0 0 180px;
            max-width: 200px;
          }
        }

        /* Desktop: rejilla 2×2, sin scroll */
        @media (min-width: 1024px) {
          .pdp-ctl-inner {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px 14px;
            overflow: visible;
            margin: 0;
            padding: 0 0 4px;
          }

          .pdp-ctl-card {
            flex: unset;
            max-width: none;
            width: auto;
          }

          .pdp-ctl-card-desktop-extra {
            display: none;
          }
        }

        /* Columna lateral muy estrecha → una sola columna */
        @container pdp-ctl (max-width: 300px) {
          .pdp-ctl-inner {
            grid-template-columns: 1fr;
          }
        }

        .pdp-ctl-thumb {
          position: relative;
        }

        .pdp-ctl-visual {
          position: relative;
          display: block;
          aspect-ratio: 1;
          overflow: hidden;
          background: #ececec;
          text-decoration: none;
          color: inherit;
        }

        .pdp-ctl-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }

        .pdp-ctl-visual:hover .pdp-ctl-img {
          transform: scale(1.03);
        }

        .pdp-ctl-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 7px;
          background: #fff;
          color: #000;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          max-width: calc(100% - 56px);
          line-height: 1.2;
          z-index: 1;
        }

        .pdp-ctl-wl {
          position: absolute;
          top: 6px;
          right: 6px;
          z-index: 2;
          width: 34px;
          height: 34px;
          padding: 0;
          border: none;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.92);
          color: #111;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
          opacity: 0.95;
        }

        .pdp-ctl-wl:hover {
          opacity: 1;
        }

        .pdp-ctl-meta {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-top: 10px;
        }

        .pdp-ctl-text {
          min-width: 0;
          flex: 1;
        }

        .pdp-ctl-name {
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

        .pdp-ctl-name:hover {
          text-decoration: underline;
        }

        .pdp-ctl-prices {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 6px;
          margin-top: 4px;
          font-size: 11px;
        }

        .pdp-ctl-old {
          text-decoration: line-through;
          color: #999;
          font-size: 10px;
        }

        .pdp-ctl-price,
        .pdp-ctl-curr {
          color: #111;
        }

        .pdp-ctl-curr {
          font-weight: 600;
        }
      `}</style>
    </section>
  );
}
