'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { formatPrice, getVariantDisplayPrices } from '@/lib/product-utils';
import { useWishlist } from '../hooks/useWishlist';
import ProductCucardas from './ProductCucardas';
import StoreImage from './StoreImage';

interface ProductCardProps {
  product: any;
  storeId: string;
}

export default function ProductCard({ product, storeId }: ProductCardProps) {
  const router = useRouter();
  const { isWishlisted, toggle: toggleWishlist, lastError: wishlistError } = useWishlist(storeId);
  const [wishBusy, setWishBusy] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const didSwipeRef = useRef(false);

  const images = product.images || [];
  const currentImg = images[currentImageIndex];
  const firstVariant = product.variants?.[0];
  const { list, current, hasPromo } = getVariantDisplayPrices(firstVariant || {});

  const productName = typeof product.name === 'object'
    ? (product.name.es || product.name.en || 'Producto')
    : product.name || 'Producto';

  const href = `/product/${product.id}?shop=${storeId}`;
  const wishlisted = isWishlisted(Number(product.id));

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishBusy) return;
    setWishBusy(true);
    void toggleWishlist(Number(product.id)).finally(() => setWishBusy(false));
  };

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
      className="product-card product-card--grid"
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
      >
        {images.length > 0 ? (
          <>
            <div
              className="product-image-fill"
              style={{
                position: 'absolute',
                inset: 0,
                transition: 'opacity 0.3s ease',
                boxSizing: 'border-box',
              }}
            >
              <StoreImage
                src={currentImg.src}
                alt={productName}
                fill
                className="product-card-img"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center top',
                }}
                sizes="(max-width: 600px) 50vw, (max-width: 1024px) 25vw, 300px"
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

            <ProductCucardas product={product} />
            <button
              type="button"
              className={`product-card-wishlist${wishlisted ? ' product-card-wishlist--on' : ''}`}
              aria-label={
                wishlisted ? 'Quitar de favoritos' : 'Agregar a favoritos'
              }
              title={
                wishlistError ||
                (wishlisted ? 'En favoritos (también en este dispositivo)' : 'Guardar favorito')
              }
              disabled={wishBusy}
              onClick={handleWishlistClick}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <path d="M6 4h12a1 1 0 011 1v14l-7-4-7 4V5a1 1 0 011-1z" />
              </svg>
            </button>
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
      </div>

      <div className="pc-meta">
        <div className="pc-name-price">
          <h3 className="pc-title">{productName.toUpperCase()}</h3>
          <div className="pc-prices" aria-label={hasPromo ? 'Precio con descuento' : undefined}>
            {hasPromo ? (
              <>
                <span className="pc-price-old">{formatPrice(list)}</span>
                <span className="pc-price pc-price--sale">{formatPrice(current)}</span>
              </>
            ) : (
              <span className="pc-price">{formatPrice(current)}</span>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .product-card.product-card--grid {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 0;
          height: 100%;
          cursor: pointer;
          touch-action: manipulation;
        }
        /* Mismo tile que Novedades (3:4 + cover) */
        .product-image-container {
          width: 100%;
          position: relative;
          aspect-ratio: 3 / 4;
          background: #f5f5f5;
          overflow: hidden;
        }
        @supports not (aspect-ratio: 3 / 4) {
          .product-image-container {
            height: 0;
            padding-bottom: 133.333%;
          }
        }
        .pc-meta {
          flex: 1 0 auto;
          display: block;
          padding: 0 5px;
          margin-top: 12px;
          min-height: 0;
        }
        .pc-name-price {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
          width: 100%;
        }
        .pc-title {
          margin: 0;
          font-size: 11px;
          font-weight: 500;
          line-height: 1.2;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #000;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pc-prices {
          display: inline-flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: baseline;
          justify-content: flex-end;
          gap: 6px;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .pc-price-old {
          font-size: 10px;
          font-weight: 500;
          color: #999;
          text-decoration: line-through;
        }
        .pc-price {
          font-size: 11px;
          font-weight: 700;
          color: #000;
          line-height: 1.2;
        }
        .pc-price--sale {
          color: #c00;
        }
        .product-card--grid:hover :global(.product-card-img) {
          transform: scale(1.03);
        }
        :global(.product-card-img) {
          transition: transform 0.4s ease;
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
          background: rgba(255, 255, 255, 0.88);
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          cursor: pointer;
          transition: opacity 0.2s;
          z-index: 5;
        }
        /* Flechas un poco visibles si hay varias fotos */
        .product-card--grid .slider-arrow {
          opacity: 0.5;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
        }
        .product-card--grid .product-image-container:hover .slider-arrow {
          opacity: 1;
        }
        .slider-arrow.left {
          left: 5px;
        }
        .slider-arrow.right {
          right: 5px;
        }
        .product-card-wishlist {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 6;
          width: 36px;
          height: 36px;
          padding: 0;
          border: none;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.92);
          color: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
        }
        .product-card-wishlist:hover {
          background: #fff;
        }
        .product-card-wishlist:disabled {
          opacity: 0.5;
          cursor: wait;
        }
        .product-card-wishlist--on {
          color: #b00000;
        }
      `}</style>
    </article>
  );
}
