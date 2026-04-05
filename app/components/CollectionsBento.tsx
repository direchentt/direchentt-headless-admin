'use client';

import ProductCard from './ProductCard';
import StoreImage from './StoreImage';

interface CollectionsBentoProps {
  editorialLeftUrl: string;
  editorialGridUrl?: string;
  /** 3 productos si hay editorialGridUrl; si no, 4 */
  products: any[];
  storeId: string;
}

export default function CollectionsBento({
  editorialLeftUrl,
  editorialGridUrl,
  products,
  storeId,
}: CollectionsBentoProps) {
  const [p0, p1, p2, p3] = products;
  const gridSlot = editorialGridUrl ? (
    <div className="bento-editorial-slot">
      <StoreImage
        src={editorialGridUrl}
        alt=""
        fill
        className="bento-editorial-img"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
        sizes="(max-width: 900px) 50vw, 25vw"
      />
    </div>
  ) : p3 ? (
    <div className="bento-product-slot">
      <ProductCard product={p3} storeId={storeId} />
    </div>
  ) : null;

  return (
    <section className="collections-bento" aria-label="Colección destacada">
      <div className="collections-bento-left">
        <StoreImage
          src={editorialLeftUrl}
          alt=""
          fill
          className="collections-bento-hero-img"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          sizes="(max-width: 900px) 100vw, 50vw"
          priority
        />
      </div>
      <div className="collections-bento-right">
        <div className="collections-bento-grid2">
          {p0 && (
            <div className="bento-product-slot">
              <ProductCard product={p0} storeId={storeId} />
            </div>
          )}
          {p1 && (
            <div className="bento-product-slot">
              <ProductCard product={p1} storeId={storeId} />
            </div>
          )}
          {p2 && (
            <div className="bento-product-slot">
              <ProductCard product={p2} storeId={storeId} />
            </div>
          )}
          {gridSlot}
        </div>
      </div>

      <style jsx>{`
        .collections-bento {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-bottom: 32px;
        }
        @media (min-width: 900px) {
          .collections-bento {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            align-items: stretch;
            min-height: min(78vh, 820px);
            max-height: 900px;
          }
        }
        .collections-bento-left {
          position: relative;
          min-height: 320px;
          background: #f2f2f2;
          overflow: hidden;
        }
        @media (min-width: 900px) {
          .collections-bento-left {
            min-height: 0;
          }
        }
        .collections-bento-hero-img {
          width: 100%;
          height: 100%;
          min-height: 320px;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        @media (min-width: 900px) {
          .collections-bento-hero-img {
            min-height: 100%;
            position: absolute;
            inset: 0;
          }
        }
        .collections-bento-right {
          min-height: 0;
          display: flex;
        }
        .collections-bento-grid2 {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 10px;
          width: 100%;
        }
        .bento-product-slot {
          min-width: 0;
          min-height: 0;
          background: #fafafa;
        }
        .bento-product-slot :global(.product-card) {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .bento-editorial-slot {
          position: relative;
          min-height: 0;
          background: #eee;
          overflow: hidden;
        }
        .bento-editorial-img {
          width: 100%;
          height: 100%;
          min-height: 180px;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        @media (min-width: 900px) {
          .bento-editorial-img {
            min-height: 0;
            position: absolute;
            inset: 0;
          }
        }
      `}</style>
    </section>
  );
}
