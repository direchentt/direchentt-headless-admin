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
          sizes="(max-width: 900px) 100vw, 50vw"
          priority
        />
      )}
      <style jsx>{`
        .ce-hero-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 320px;
          overflow: hidden;
        }
        @media (min-width: 900px) {
          .ce-hero-wrap {
            min-height: 100%;
            position: absolute;
            inset: 0;
          }
        }
        .ce-hero-media {
          width: 100%;
          height: 100%;
          min-height: 320px;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        @media (min-width: 900px) {
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
          .ce-cell--product :global(.product-card-link) {
            height: 100%;
            display: flex;
          }
          .ce-cell--product :global(.product-card) {
            width: 100%;
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
          sizes="(max-width: 900px) 50vw, 25vw"
        />
      )}
      <style jsx>{`
        .ce-cell--media {
          position: relative;
          background: #fafafa;
          min-height: 0;
          overflow: hidden;
        }
        .ce-slot-media {
          width: 100%;
          height: 100%;
          min-height: 180px;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        @media (min-width: 900px) {
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
        .ce-block {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1px;
          margin-bottom: 24px;
          background: rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.12);
        }
        @media (min-width: 900px) {
          .ce-block {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: minmax(360px, min(78vh, 820px));
            max-height: 900px;
            align-items: stretch;
            margin-bottom: 28px;
          }
          .ce-block--inv .ce-editorial {
            order: 2;
          }
          .ce-block--inv .ce-grid {
            order: 1;
          }
        }
        .ce-editorial {
          position: relative;
          background: #f2f2f2;
          min-height: 320px;
          overflow: hidden;
        }
        @media (min-width: 900px) {
          .ce-editorial {
            min-height: 0;
          }
        }
        .ce-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 1px;
          background: rgba(0, 0, 0, 0.1);
          min-height: 0;
        }
        .ce-cell {
          background: #fff;
          min-width: 0;
          min-height: 0;
        }
      `}</style>
    </section>
  );
}
