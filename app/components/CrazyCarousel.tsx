'use client';

import Link from 'next/link';
import { useRef } from 'react';

interface CrazyCarouselProps {
  products: any[];
  title?: string;
  storeId: string;
}

export default function CrazyCarousel({ products, title = "TRENDING", storeId }: CrazyCarouselProps) {
  // Dividir productos en dos filas
  const midPoint = Math.ceil(products.length / 2);
  const row1 = products.slice(0, midPoint);
  const row2 = products.slice(midPoint);

  // Asegurar suficientes items para el loop infinito (duplicar varias veces)
  const loopRow1 = [...row1, ...row1, ...row1, ...row1];
  const loopRow2 = [...row2, ...row2, ...row2, ...row2];

  return (
    <section className="stream-section">
      <div className="stream-header">
        <h2 className="stream-title">{title}</h2>
      </div>

      <div className="stream-container">

        {/* ROW 1: Izquierda */}
        <div className="stream-row row-left">
          <div className="marquee-track track-left">
            {loopRow1.map((product, index) => (
              <ProductCardStream
                key={`r1-${product.id}-${index}`}
                product={product}
                storeId={storeId}
              />
            ))}
          </div>
        </div>

        {/* ROW 2: Derecha */}
        <div className="stream-row row-right">
          <div className="marquee-track track-right">
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

      <style jsx>{`
        .stream-section {
          padding: 80px 0;
          background: #fff;
          overflow: hidden;
          position: relative;
        }

        .stream-header {
          text-align: center;
          margin-bottom: 40px;
          position: relative;
          z-index: 2;
        }

        .stream-title {
          font-size: 14vw;
          font-weight: 900;
          text-transform: uppercase;
          line-height: 0.8;
          margin: 0;
          color: transparent;
          -webkit-text-stroke: 1px #e5e5e5;
          opacity: 0.5;
          letter-spacing: -5px;
        }
        
        @media (min-width: 1024px) {
            .stream-title {
                font-size: 180px;
            }
        }

        .stream-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          transform: rotate(-2deg) scale(1.05); /* Leve inclinación general */
        }

        .stream-row {
          width: 100%;
          overflow: hidden;
          position: relative;
        }

        /* Efecto FOCUS: Al hacer hover en la ROW, los items se apagan un poco */
        .marquee-track {
          display: flex;
          gap: 20px;
          width: max-content;
        }
        
        .stream-row:hover .marquee-track {
           animation-play-state: paused;
        }

        .track-left {
          animation: slideLeft 60s linear infinite;
        }

        .track-right {
          animation: slideRight 60s linear infinite;
        }

        @keyframes slideLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); } /* Ajustado según duplicación (x4) -> 25% es un set */
        }

        @keyframes slideRight {
          0% { transform: translateX(-25%); }
          100% { transform: translateX(0); }
        }

      `}</style>
    </section>
  );
}

function ProductCardStream({ product, storeId }: { product: any, storeId: string }) {
  return (
    <>
      <Link href={`/product/${product.id}?shop=${storeId}`} className="stream-card">
        <div className="img-box">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.images[0]?.src} alt={product.name} />
          <div className="overlay">
            <span className="price">$ {product.variants[0]?.price}</span>
          </div>
        </div>
        <div className="info-box">
          <h4>{typeof product.name === 'object' ? (product.name.es || product.name.en) : product.name}</h4>
        </div>
      </Link>

      <style jsx>{`
        .stream-card {
           display: block;
           width: 250px;
           text-decoration: none;
           color: #000;
           transition: all 0.5s ease;
           filter: grayscale(100%);
           opacity: 0.8;
        }

        /* INTERACCIÓN INNOVADORA */
        /* Al hacer hover en el row (padre), todos los hijos bajan opacidad (definido abajo) */
        
        /* Al hacer hover en ESTE card, se "enciende" */
        .stream-card:hover {
            filter: grayscale(0%);
            opacity: 1;
            transform: scale(1.1);
            z-index: 10;
        }

        .img-box {
            width: 100%;
            height: 320px;
            background: #f0f0f0;
            margin-bottom: 10px;
            overflow: hidden;
            position: relative;
        }

        .img-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;
        }

        .stream-card:hover .overlay {
            opacity: 1;
        }

        .price {
            background: #fff;
            padding: 5px 15px;
            font-weight: 700;
            font-size: 14px;
        }

        .info-box h4 {
            margin: 0;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
      `}</style>
    </>
  )
}
