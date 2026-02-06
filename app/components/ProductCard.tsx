'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ProductCardProps {
  product: any;
  storeId: string;
}

export default function ProductCard({ product, storeId }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const images = product.images || [];
  const firstVariant = product.variants?.[0];

  // Extraer nombre de forma segura
  const productName = typeof product.name === 'object'
    ? (product.name.es || product.name.en || 'Producto')
    : product.name || 'Producto';

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      prevImage();
    }

    setTouchStart(0);
    setTouchEnd(0);
  }

  const nextImage = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <Link href={`/product/${product.id}?shop=${storeId}`} className="product-card-link">
      <article className="product-card">
        {/* IMAGEN CON SLIDER */}
        <div
          className="product-image-container"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            width: '100%',
            paddingBottom: '133%',
            position: 'relative',
            background: '#f0f0f0',
            overflow: 'hidden'
          }}
        >
          {images.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[currentImageIndex].src}
                alt={productName}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'opacity 0.3s ease'
                }}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />

              {/* DOTS INDICATORS (Solo si hay más de 1 imagen) */}
              {images.length > 1 && (
                <div className="slider-dots">
                  {images.slice(0, 5).map((_: any, idx: number) => (
                    <span
                      key={idx}
                      className={`dot ${idx === currentImageIndex ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentImageIndex(idx);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* ARROWS (Visible on Hover / Desktop) */}
              {images.length > 1 && (
                <>
                  <button className="slider-arrow left" onClick={prevImage}>‹</button>
                  <button className="slider-arrow right" onClick={nextImage}>›</button>
                </>
              )}
            </>
          ) : (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#999'
            }}>Sin imagen</div>
          )}
        </div>

        {/* INFO */}
        <div className="product-info" style={{ padding: '10px 0' }}>
          <h3 style={{
            fontSize: '11px',
            fontWeight: 700,
            margin: 0,
            marginBottom: '5px'
          }}>{productName.toUpperCase()}</h3>
          <p style={{
            fontSize: '11px',
            color: '#666',
            margin: 0
          }}>$ {firstVariant?.price || 0}</p>
        </div>

        <style jsx>{`
            .slider-dots {
                position: absolute;
                bottom: 10px;
                left: 0;
                right: 0;
                display: flex;
                justify-content: center;
                gap: 5px;
                z-index: 5;
            }
            .dot {
                width: 6px;
                height: 6px;
                background: rgba(255,255,255,0.5);
                border-radius: 50%;
                cursor: pointer;
            }
            .dot.active {
                background: #000;
                transform: scale(1.2);
            }
            .slider-arrow {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255,255,255,0.8);
                border: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.2s;
                z-index: 5;
            }
            .product-image-container:hover .slider-arrow {
                opacity: 1;
            }
            .slider-arrow.left { left: 5px; }
            .slider-arrow.right { right: 5px; }
        `}</style>
      </article>
    </Link>
  );
}
