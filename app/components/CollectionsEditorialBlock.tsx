'use client';

import ProductCard from './ProductCard';
import StoreImage from './StoreImage';
import type {
  ResolvedCollectionsCell,
  ResolvedCollectionsEditorialBlock,
} from '@/lib/collections-editorial';

function EditorialHero({ kind, url }: { kind: 'image' | 'video'; url: string }) {
  return (
    <div className="ce-hero-wrap">
      {kind === 'video' ? (
        <video className="ce-hero-media" src={url} muted playsInline autoPlay loop aria-label="" />
      ) : (
        <StoreImage
          className="ce-hero-media"
          src={url}
          alt=""
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          sizes="(max-width: 959px) 100vw, 48vw"
          priority
        />
      )}
      <style jsx>{`
        .ce-hero-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 260px;
          overflow: hidden;
        }
        @media (min-width: 960px) {
          .ce-hero-wrap {
            min-height: 100%;
            position: absolute;
            inset: 0;
          }
        }
        .ce-hero-media {
          width: 100%;
          height: 100%;
          min-height: 260px;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        @media (min-width: 960px) {
          .ce-hero-media {
            min-height: 100%;
            position: absolute;
            inset: 0;
          }
        }
      `}</style>
    </div>
  );
}

function GridCell({ cell, storeId }: { cell: ResolvedCollectionsCell; storeId: string }) {
  if (cell.type === 'product') {
    return (
      <div className="ce-cell ce-cell--product">
        <ProductCard product={cell.product} storeId={storeId} />
        <style jsx>{`
          .ce-cell--product {
            display: flex;
            flex-direction: column;
            min-height: 0;
            min-width: 0;
            height: 100%;
          }
          .ce-cell--product :global(.product-card) {
            width: 100%;
            height: 100%;
            min-height: 0;
            display: flex;
            flex-direction: column;
            flex: 1;
          }
        `}</style>
      </div>
    );
  }
  return (
    <div className="ce-cell ce-cell--media">
      {cell.type === 'video' ? (
        <video className="ce-slot-media" src={cell.url} muted playsInline autoPlay loop aria-label="" />
      ) : (
        <StoreImage
          className="ce-slot-media"
          src={cell.url}
          alt=""
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          sizes="(max-width: 959px) 45vw, 22vw"
        />
      )}
      <style jsx>{`
        .ce-cell--media {
          position: relative;
          flex: 1 1 0;
          min-height: 140px;
          background: #fafafa;
          overflow: hidden;
        }
        @media (min-width: 960px) {
          .ce-cell--media {
            min-height: 0;
            height: 100%;
          }
        }
        .ce-slot-media {
          width: 100%;
          height: 100%;
          min-height: 140px;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        @media (min-width: 960px) {
          .ce-slot-media {
            min-height: 0;
            position: absolute;
            inset: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function CollectionsEditorialBlock({
  block,
  storeId,
}: {
  block: ResolvedCollectionsEditorialBlock;
  storeId: string;
}) {
  const inverted = block.layout === 'editorial-right';

  return (
    <section
      className={`ce-block${inverted ? ' ce-block--inv' : ''}`}
      aria-label="Bloque de colección"
    >
      <div className="ce-editorial">
        <EditorialHero kind={block.editorial.kind} url={block.editorial.url} />
      </div>
      <div className="ce-grid">
        {block.cells.map((cell, i) => (
          <GridCell key={i} cell={cell} storeId={storeId} />
        ))}
      </div>

      <style jsx>{`
        /* ——— Móvil / tablet: banner arriba, grilla 2×2 abajo ——— */
        .ce-block {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin: 0 auto 32px;
          max-width: 1400px;
          padding: 0 12px;
          box-sizing: border-box;
          background: transparent;
          border: none;
        }
        .ce-editorial {
          position: relative;
          background: #f0f0f0;
          border-radius: 14px;
          overflow: hidden;
          width: 100%;
          min-height: min(52vw, 420px);
          max-height: 70vh;
          aspect-ratio: 3 / 4;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.07);
        }
        @supports not (aspect-ratio: 1) {
          .ce-editorial {
            min-height: 320px;
            max-height: 520px;
          }
        }
        .ce-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: repeat(2, auto);
          gap: 10px;
          width: 100%;
          align-items: stretch;
        }
        .ce-cell {
          display: flex;
          flex-direction: column;
          min-height: 0;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #ebebeb;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        }

        /* ——— Desktop: mitad banner | mitad 2×2, misma altura ——— */
        @media (min-width: 960px) {
          .ce-block {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: minmax(460px, min(62vh, 720px));
            column-gap: 22px;
            row-gap: 0;
            align-items: stretch;
            margin-bottom: 44px;
            padding: 0 20px;
            gap: 0;
          }
          .ce-block--inv .ce-editorial {
            order: 2;
          }
          .ce-block--inv .ce-grid {
            order: 1;
          }
          .ce-editorial {
            aspect-ratio: auto;
            min-height: 0;
            max-height: none;
            height: 100%;
            border-radius: 16px;
            align-self: stretch;
          }
          .ce-grid {
            gap: 12px;
            height: 100%;
            min-height: 0;
            align-self: stretch;
            grid-template-rows: 1fr 1fr;
          }
          .ce-cell {
            border-radius: 12px;
          }
        }

        @media (min-width: 768px) {
          .ce-grid {
            gap: 15px;
          }
        }
        @media (min-width: 1024px) {
          .ce-grid {
            gap: 20px;
          }
        }

        @media (min-width: 1200px) {
          .ce-block {
            column-gap: 28px;
            padding: 0 28px;
          }
        }
      `}</style>
    </section>
  );
}
