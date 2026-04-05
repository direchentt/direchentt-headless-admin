'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ProductImageLightbox from './ProductImageLightbox';
import ProductReviewsDrawer from './ProductReviewsDrawer';
import StoreImage from './StoreImage';

const SWIPE_HINT_KEY = 'pdp-gallery-swipe-hint-dismissed';

interface Image {
  id: string | number;
  src: string;
}

interface ImageGalleryProps {
  images: Image[];
  productName: string;
  productId?: string | number;
}

export default function ImageGallery({ images, productName, productId = 0 }: ImageGalleryProps) {
  const [mainIndex, setMainIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    try {
      if (!localStorage.getItem(SWIPE_HINT_KEY)) setShowSwipeHint(true);
    } catch {
      setShowSwipeHint(true);
    }
  }, [images?.length]);

  const dismissSwipeHint = useCallback(() => {
    setShowSwipeHint(false);
    try {
      localStorage.setItem(SWIPE_HINT_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!showSwipeHint) return;
    const t = window.setTimeout(() => dismissSwipeHint(), 7000);
    return () => clearTimeout(t);
  }, [showSwipeHint, dismissSwipeHint]);

  if (!images || images.length === 0) {
    return (
      <div className="pdp-gallery">
        <div className="gallery-placeholder">Sin imágenes</div>
        <style dangerouslySetInnerHTML={{ __html: `
          .gallery-placeholder {
            width: 100%;
            aspect-ratio: 3/4;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
            color: #999;
            font-size: 14px;
          }
        `}} />
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const goNext = useCallback(() => {
    setMainIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setMainIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const start = touchStartX.current;
    const end = touchEndX.current;
    const dx = end - start;
    const threshold = 42;
    if (Math.abs(dx) < threshold) return;
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 400);
    dismissSwipeHint();
    if (dx < 0) goNext();
    else goPrev();
  };

  const handleHeroClick = () => {
    if (suppressClickRef.current) return;
    openLightbox(mainIndex);
  };

  return (
    <div className="pdp-gallery">
      <div className="gallery-mobile-eme">
        <div
          className="gallery-hero-frame"
          role="group"
          aria-label={`Galería del producto, imagen ${mainIndex + 1} de ${images.length}`}
        >
          <button
            type="button"
            className="gallery-hero-btn"
            onClick={handleHeroClick}
            onTouchStart={images.length > 1 ? handleTouchStart : undefined}
            onTouchMove={images.length > 1 ? handleTouchMove : undefined}
            onTouchEnd={images.length > 1 ? handleTouchEnd : undefined}
            aria-label={`Ampliar imagen ${mainIndex + 1} de ${images.length}. Deslizá para otras fotos.`}
          >
            <div className="gallery-hero-track" key={mainIndex}>
              <StoreImage
                src={images[mainIndex].src}
                alt={`${productName} — vista ${mainIndex + 1} de ${images.length}`}
                fill
                className="gallery-hero-img"
                style={{ objectFit: 'cover', objectPosition: 'center top' }}
                sizes="(max-width: 1023px) 100vw, 50vw"
                priority={mainIndex === 0}
                loading={mainIndex === 0 ? 'eager' : 'lazy'}
              />
            </div>
          </button>

          {images.length > 1 && showSwipeHint && (
            <div className="gallery-swipe-hint" role="status">
              <span className="gallery-swipe-hint-text">Deslizá para más fotos</span>
              <span className="gallery-swipe-hint-arrows" aria-hidden>
                ‹ ›
              </span>
              <button
                type="button"
                className="gallery-swipe-hint-close"
                onClick={dismissSwipeHint}
                aria-label="Cerrar indicación"
              >
                ×
              </button>
            </div>
          )}

          {images.length > 1 && (
            <div className="gallery-hero-chrome" aria-hidden="false">
              <span className="gallery-hero-counter">
                {mainIndex + 1} / {images.length}
              </span>
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="gallery-thumb-strip" role="tablist" aria-label="Vistas del producto">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                role="tab"
                aria-selected={idx === mainIndex}
                className={`gallery-thumb-cell ${idx === mainIndex ? 'active' : ''}`}
                onClick={() => {
                  setMainIndex(idx);
                  dismissSwipeHint();
                }}
                aria-label={`Vista ${idx + 1} de ${images.length}`}
              >
                <StoreImage
                  src={img.src}
                  alt=""
                  width={52}
                  height={52}
                  className="gallery-thumb-img"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          className="gallery-reviews-rail"
          onClick={() => setReviewsOpen(true)}
          aria-label="Ver reseñas"
        >
          Reseñas
        </button>
      </div>

      <div className="gallery-desktop">
        {images.map((img, idx) => (
          <div key={img.id} className="gallery-item">
            <StoreImage
              src={img.src}
              alt={`${productName} — ${idx + 1}`}
              fill
              className="gallery-desktop-img"
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 1400px) 50vw, 700px"
              priority={idx < 2}
              loading={idx < 2 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      <ProductImageLightbox
        images={images}
        productName={productName}
        isOpen={lightboxOpen}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />

      <ProductReviewsDrawer
        productId={productId}
        productName={productName}
        isOpen={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .pdp-gallery {
          width: 100%;
        }

        .gallery-mobile-eme {
          display: block;
          position: relative;
          background: #f0f0f0;
        }
        @media (min-width: 1024px) {
          .gallery-mobile-eme {
            display: none;
          }
        }

        .gallery-hero-frame {
          position: relative;
          touch-action: pan-y;
        }

        .gallery-hero-btn {
          display: block;
          width: 100%;
          padding: 0;
          margin: 0;
          border: none;
          background: #f0f0f0;
          cursor: zoom-in;
          position: relative;
          aspect-ratio: 3/4;
          touch-action: pan-y pinch-zoom;
        }

        .gallery-hero-track {
          position: absolute;
          inset: 0;
          overflow: hidden;
          animation: galleryHeroSwap 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes galleryHeroSwap {
          from {
            opacity: 0.65;
            transform: scale(1.02);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .gallery-hero-img {
          width: 100%;
          height: 100%;
          display: block;
        }

        .gallery-swipe-hint {
          position: absolute;
          left: 50%;
          bottom: 18px;
          transform: translateX(-50%);
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px 10px 16px;
          background: rgba(255,255,255,0.94);
          border: 1px solid #e0e0e0;
          border-radius: 999px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          animation: galleryHintIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both,
            galleryHintPulse 2.2s ease-in-out 0.6s infinite;
          max-width: calc(100% - 48px);
          pointer-events: auto;
        }

        @keyframes galleryHintIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes galleryHintPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          50% { box-shadow: 0 4px 24px rgba(180, 0, 0, 0.12); }
        }

        .gallery-swipe-hint-text {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #111;
          white-space: nowrap;
        }

        .gallery-swipe-hint-arrows {
          font-size: 14px;
          font-weight: 600;
          color: #b00000;
          letter-spacing: 0.2em;
        }

        .gallery-swipe-hint-close {
          margin-left: 4px;
          padding: 0 4px;
          border: none;
          background: none;
          font-size: 18px;
          line-height: 1;
          color: #666;
          cursor: pointer;
        }

        .gallery-hero-chrome {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 3;
          pointer-events: none;
        }

        .gallery-hero-counter {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #fff;
          background: rgba(0,0,0,0.55);
          padding: 6px 10px;
          border-radius: 2px;
        }

        .gallery-thumb-strip {
          display: flex;
          flex-direction: row;
          gap: 8px;
          padding: 10px 12px 14px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          background: #fff;
        }
        .gallery-thumb-strip::-webkit-scrollbar {
          display: none;
        }

        .gallery-thumb-cell {
          flex: 0 0 auto;
          width: 52px;
          height: 52px;
          padding: 0;
          border: 1px solid #c8c8c8;
          border-radius: 2px;
          overflow: hidden;
          cursor: pointer;
          background: #f5f5f5;
          box-sizing: border-box;
        }
        .gallery-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .gallery-thumb-cell.active {
          border: 3px solid #000;
        }

        .gallery-reviews-rail {
          position: absolute;
          right: 0;
          top: 12%;
          bottom: 28%;
          width: 26px;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #222;
          font-family: inherit;
          cursor: pointer;
          background: rgba(255,255,255,0.88);
          border: none;
          border-left: 1px solid #e0e0e0;
          padding: 0;
        }

        .gallery-desktop {
          display: none;
        }
        @media (min-width: 1024px) {
          .gallery-desktop {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 2px;
          }
        }

        .gallery-item {
          width: 100%;
          overflow: hidden;
          background: #f5f5f5;
          position: relative;
          aspect-ratio: 3/4;
        }

        .gallery-desktop-img {
          width: 100%;
          height: 100%;
          display: block;
          transition: transform 0.45s ease;
        }

        .gallery-item:hover .gallery-desktop-img {
          transform: scale(1.015);
        }

        .gallery-placeholder {
          width: 100%;
          aspect-ratio: 3/4;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          color: #999;
          font-size: 14px;
        }
      `}} />
    </div>
  );
}
