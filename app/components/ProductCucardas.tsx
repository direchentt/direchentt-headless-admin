'use client';

type Props = {
  product: any;
  /** overlay: sobre imagen (default). inline: bajo el título / en flujo */
  layout?: 'overlay' | 'inline';
};

/**
 * Señal visible del producto según API Tiendanube: solo `free_shipping`.
 * Los `tags` del producto suelen usarse de forma interna (filtros, integraciones)
 * y no se muestran aquí.
 * @see https://tiendanube.github.io/api-documentation/resources/product
 */
export default function ProductCucardas({ product, layout = 'overlay' }: Props) {
  const freeShip = product?.free_shipping === true;
  if (!freeShip) return null;

  const isInline = layout === 'inline';

  return (
    <div className={`cucardas-root ${isInline ? 'inline' : 'overlay'}`}>
      <span className="cucarda cucarda-ship">Envío gratis</span>
      <style jsx>{`
        .cucardas-root.overlay {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 4;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          max-width: calc(100% - 48px);
          pointer-events: none;
        }
        .cucardas-root.inline {
          position: static;
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          pointer-events: none;
        }
        .cucarda {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 5px 9px;
          background: #fff;
          color: #000;
          line-height: 1.2;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        }
        .cucarda-ship {
          background: #000;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
