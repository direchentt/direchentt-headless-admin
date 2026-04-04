'use client';

import Link from 'next/link';
import { formatPrice, getVariantDisplayPrices } from '@/lib/product-utils';
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

/** Tallas únicas para fila tipo vitrina (primer atributo no color si existe) */
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

export default function ShopTheLook({ mainProduct, relatedProducts, storeId }: ShopTheLookProps) {
  if (!mainProduct) return null;

  const sid = String(storeId);
  const pool = [mainProduct, ...relatedProducts].filter(Boolean);
  const uniqueById = pool.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
  const carouselProducts = uniqueById.slice(0, 12);
  if (carouselProducts.length === 0) return null;

  return (
    <section className="ctl">
      <div className="ctl-head">
        <h2 className="ctl-title">Completa el look</h2>
        <p className="ctl-sub">Recomendado</p>
      </div>

      <div className="ctl-scroller">
        <div className="ctl-track">
          {carouselProducts.map((prod) => {
            const v0 = prod.variants?.[0];
            const { list, current, hasPromo } = getVariantDisplayPrices(v0 || {});
            const sizes = sizeLabelsForProduct(prod);
            const inStock =
              !prod.variants?.length ||
              prod.variants.some(
                (v: any) => v.stock === null || v.stock === undefined || v.stock > 0
              );

            return (
              <article key={prod.id} className="ctl-card">
                <Link href={`/product/${prod.id}?shop=${sid}`} className="ctl-card-visual">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prod.images?.[0]?.src || ''}
                    alt={productName(prod)}
                    className="ctl-img"
                  />
                  <ProductCucardas product={prod} />
                  {inStock && <span className="ctl-stock-pill">En stock</span>}
                </Link>
                <div className="ctl-body">
                  <Link href={`/product/${prod.id}?shop=${sid}`} className="ctl-name">
                    {productName(prod)}
                  </Link>
                  <div className="ctl-price-row">
                    {hasPromo && <span className="ctl-price-old">{formatPrice(list)}</span>}
                    <span className={hasPromo ? 'ctl-price-sale' : 'ctl-price'}>
                      {formatPrice(current)}
                    </span>
                  </div>
                  <Link href={`/product/${prod.id}?shop=${sid}`} className="ctl-add">
                    Añadir
                  </Link>
                  {sizes.length > 0 && (
                    <div className="ctl-sizes" aria-label="Tallas">
                      {sizes.map((s) => (
                        <Link
                          key={s}
                          href={`/product/${prod.id}?shop=${sid}`}
                          className="ctl-size-pill"
                        >
                          {s}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .ctl {
          padding: 40px 0 56px;
          background: #fff;
          border-top: 1px solid #ebebeb;
        }

        .ctl-head {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 16px 16px;
        }
        @media (min-width: 1024px) {
          .ctl-head {
            padding: 0 24px 20px;
          }
        }
        .ctl-title {
          margin: 0;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #111;
        }
        .ctl-sub {
          margin: 6px 0 0;
          font-size: 11px;
          color: #777;
          letter-spacing: 0.04em;
        }

        .ctl-scroller {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 8px;
        }
        .ctl-scroller::-webkit-scrollbar {
          display: none;
        }

        .ctl-track {
          display: flex;
          gap: 12px;
          padding: 0 16px 8px;
          width: max-content;
        }
        @media (min-width: 1024px) {
          .ctl-track {
            gap: 16px;
            padding: 0 24px 8px;
          }
        }

        .ctl-card {
          width: 42vw;
          max-width: 220px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 640px) {
          .ctl-card {
            width: 200px;
            max-width: none;
          }
        }

        .ctl-card-visual {
          position: relative;
          display: block;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #ececec;
          text-decoration: none;
          color: inherit;
        }

        .ctl-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.45s ease;
        }
        .ctl-card-visual:hover .ctl-img {
          transform: scale(1.03);
        }

        .ctl-stock-pill {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 8px;
          background: #fff;
          color: #000;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .ctl-body {
          padding-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }

        .ctl-name {
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
        .ctl-name:hover {
          text-decoration: underline;
        }

        .ctl-price-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: baseline;
          font-size: 12px;
        }
        .ctl-price-old {
          text-decoration: line-through;
          color: #999;
          font-size: 11px;
        }
        .ctl-price {
          color: #111;
        }
        .ctl-price-sale {
          color: #111;
          font-weight: 600;
        }

        .ctl-add {
          display: inline-block;
          margin-top: 2px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: underline;
          text-underline-offset: 3px;
          color: #111;
        }

        .ctl-sizes {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }
        .ctl-size-pill {
          min-width: 32px;
          height: 32px;
          padding: 0 8px;
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
        .ctl-size-pill:hover {
          border-color: #000;
        }
      `}</style>
    </section>
  );
}
