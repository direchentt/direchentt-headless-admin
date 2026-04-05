'use client';

import Link from 'next/link';
import {
  formatPrice,
  getVariantDisplayPrices,
  getProductTagsArray,
} from '@/lib/product-utils';
import { decodeHtmlEntities } from '@/lib/html-text';
import { normalizeStoreImageUrl } from '@/lib/store-image-url';
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

function displayName(prod: any): string {
  return decodeHtmlEntities(productName(prod)).trim();
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
    <section className="pdp-ctl" aria-label="Completa el look">
      <h2 className="pdp-ctl-title">Completa el look</h2>

      <div className="pdp-ctl-inner">
        {list.map((prod, index) => {
          const v0 = prod.variants?.[0];
          const { list: listPrice, current, hasPromo } = getVariantDisplayPrices(v0 || {});
          const inStock = hasVariantStock(prod);
          const backBadge = showBackInStockBadge(prod) && inStock;
          const desktopHidden = index >= DESKTOP_MAX;
          const name = displayName(prod);
          const rawImg = prod.images?.[0]?.src;
          const imgUrl = normalizeStoreImageUrl(rawImg);

          return (
            <article
              key={prod.id}
              className={`pdp-ctl-card${desktopHidden ? ' pdp-ctl-card-desktop-extra' : ''}`}
            >
              <Link
                href={`/product/${prod.id}?shop=${sid}`}
                className="pdp-ctl-card-link"
              >
                <div className="pdp-ctl-visual">
                  {imgUrl ? (
                    <StoreImage
                      src={rawImg}
                      alt={name || 'Producto'}
                      fill
                      className="pdp-ctl-img"
                      style={{ objectFit: 'cover', objectPosition: 'center top' }}
                      sizes="(max-width: 1023px) 72vw, (max-width: 1400px) 28vw, 320px"
                      loading="lazy"
                    />
                  ) : (
                    <div className="pdp-ctl-ph" aria-hidden />
                  )}
                  {backBadge && (
                    <span className="pdp-ctl-badge">Back in stock</span>
                  )}
                </div>
                <div className="pdp-ctl-meta">
                  <span className="pdp-ctl-kicker">Incluído en el look</span>
                  <span className="pdp-ctl-name">{name}</span>
                  <div className="pdp-ctl-prices" aria-label="Precio">
                    {hasPromo && (
                      <span className="pdp-ctl-old">{formatPrice(listPrice)}</span>
                    )}
                    <span className={hasPromo ? 'pdp-ctl-curr' : 'pdp-ctl-price'}>
                      {formatPrice(current)}
                    </span>
                  </div>
                </div>
              </Link>
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
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        @media (min-width: 1024px) {
          .pdp-ctl {
            margin-top: 8px;
            padding-top: 28px;
          }
        }

        .pdp-ctl-title {
          margin: 0 0 16px;
          font-size: clamp(12px, 2.5cqw, 13px);
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #000;
        }

        @media (min-width: 1024px) {
          .pdp-ctl-title {
            margin-bottom: 20px;
          }
        }

        .pdp-ctl-inner {
          display: flex;
          flex-wrap: nowrap;
          gap: 14px;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          padding: 0 0 12px;
          margin: 0 -2px;
          padding-left: 2px;
          padding-right: 2px;
          scroll-snap-type: x mandatory;
        }

        .pdp-ctl-inner::-webkit-scrollbar {
          height: 4px;
        }

        .pdp-ctl-inner::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 2px;
        }

        .pdp-ctl-card {
          flex: 0 0 min(78vw, 280px);
          min-width: min(78vw, 280px);
          max-width: 280px;
          scroll-snap-align: start;
        }

        @media (min-width: 480px) {
          .pdp-ctl-card {
            flex: 0 0 240px;
            min-width: 240px;
          }
        }

        @media (min-width: 1024px) {
          .pdp-ctl-inner {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px 16px;
            overflow: visible;
            margin: 0;
            padding: 0 0 4px;
            scroll-snap-type: none;
          }

          .pdp-ctl-card {
            flex: unset;
            min-width: 0;
            max-width: none;
            width: auto;
            scroll-snap-align: unset;
          }

          .pdp-ctl-card-desktop-extra {
            display: none;
          }
        }

        @container pdp-ctl (max-width: 300px) {
          .pdp-ctl-inner {
            grid-template-columns: 1fr;
          }
        }

        .pdp-ctl-card-link {
          display: block;
          text-decoration: none;
          color: inherit;
          touch-action: manipulation;
          position: relative;
          z-index: 1;
          -webkit-tap-highlight-color: transparent;
        }

        .pdp-ctl-visual {
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #f0f0f0;
          border: 1px solid #ebebeb;
          border-radius: 2px;
        }

        .pdp-ctl-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .pdp-ctl-card-link:hover .pdp-ctl-img {
          transform: scale(1.04);
        }

        .pdp-ctl-ph {
          position: absolute;
          inset: 0;
          background: linear-gradient(160deg, #e8e8e8, #d4d4d4);
        }

        .pdp-ctl-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 6px 8px;
          background: #fff;
          color: #000;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          max-width: calc(100% - 24px);
          line-height: 1.2;
          z-index: 1;
        }

        .pdp-ctl-meta {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-start;
        }

        .pdp-ctl-kicker {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #888;
        }

        .pdp-ctl-name {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          line-height: 1.35;
          color: #000;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pdp-ctl-card-link:hover .pdp-ctl-name {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .pdp-ctl-prices {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 8px;
          margin-top: 2px;
          font-size: 12px;
        }

        .pdp-ctl-old {
          text-decoration: line-through;
          color: #999;
          font-size: 11px;
          font-weight: 500;
        }

        .pdp-ctl-price,
        .pdp-ctl-curr {
          color: #000;
        }

        .pdp-ctl-curr {
          font-weight: 700;
        }
      `}</style>
    </section>
  );
}
