'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { formatPrice, getVariantDisplayPrices } from '@/lib/product-utils';
import ProductCucardas from './ProductCucardas';
import StoreImage from './StoreImage';

interface ProductCardProps {
  product: any;
  storeId: string;
}

export default function ProductCard({ product, storeId }: ProductCardProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const didSwipeRef = useRef(false);

  const images = product.images || [];
  const firstVariant = product.variants?.[0];
  const { list, current, hasPromo } = getVariantDisplayPrices(firstVariant || {});

  const productName = typeof product.name === 'object'
    ? (product.name.es || product.name.en || 'Producto')
    : product.name || 'Producto';

  const href = `/product/${product.id}?shop=${storeId}`;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchStartX.current = e.targetTouches[0].clientX;
    didSwipeRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 50) {
      didSwipeRef.current = true;
      if (distance > 0) {
        if (images.length > 1) {
          setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }
      } else if (images.length > 1) {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }
  };

  const navigateToProduct = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    router.push(href);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <article
      className="product-card"
      role="link"
      tabIndex={0}
      onClick={navigateToProduct}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(href);
        }
      }}
    >
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
          overflow: 'hidden',
        }}
      >
        {images.length > 0 ? (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transition: 'opacity 0.3s ease',
              }}
            >
              <StoreImage
                src={images[currentImageIndex].src}
                alt={productName}
                fill
                className="product-card-img"
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 280px"
              />
            </div>

            {images.length > 1 && (
              <div className="slider-dots">
                {images.slice(0, 5).map((_: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    className={`dot ${idx === currentImageIndex ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    aria-label={`Imagen ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {images.length > 1 && (
              <>
                <button type="button" className="slider-arrow left" onClick={prevImage} aria-label="Imagen anterior">
                  ‹
                </button>
                <button type="button" className="slider-arrow right" onClick={nextImage} aria-label="Imagen siguiente">
                  ›
                </button>
              </>
            )}
          </>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#999',
            }}
          >
            Sin imagen
          </div>
        )}
        <ProductCucardas product={product} />
      </div>

      <div className="product-info" style={{ padding: '10px 0' }}>
        <h3
          style={{
            fontSize: '11px',
            fontWeight: 700,
            margin: 0,
            marginBottom: '5px',
          }}
        >
          {productName.toUpperCase()}
        </h3>
        <p
          style={{
            fontSize: '11px',
            color: '#666',
            margin: 0,
          }}
        >
          {hasPromo && (
            <span style={{ textDecoration: 'line-through', color: '#999', marginRight: 8 }}>
              {formatPrice(list)}
            </span>
          )}
          <span style={{ color: hasPromo ? '#b00000' : undefined }}>{formatPrice(current)}</span>
        </p>
      </div>

      <style jsx>{`
        .product-card {
          cursor: pointer;
          touch-action: manipulation;
        }
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
          width: 8px;
          height: 8px;
          padding: 0;
          border: none;
          background: rgba(255, 255, 255, 0.55);
          border-radius: 50%;
          cursor: pointer;
        }
        .dot.active {
          background: #000;
          transform: scale(1.15);
        }
        .slider-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.8);
          border: none;
          width: 28px;
          height: 28px;
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
        .slider-arrow.left {
          left: 5px;
        }
        .slider-arrow.right {
          right: 5px;
        }
      `}</style>
    </article>
  );
}
