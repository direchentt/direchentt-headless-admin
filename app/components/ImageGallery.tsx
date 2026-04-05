'use client';

import { useState } from 'react';
import ProductImageLightbox from './ProductImageLightbox';
import ProductReviewsDrawer from './ProductReviewsDrawer';
import StoreImage from './StoreImage';

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

  return (
    <div className="pdp-gallery">
      {/* MOBILE: imagen principal + franja horizontal de miniaturas (referencia EME) */}
      <div className="gallery-mobile-eme">
        <button
          type="button"
          className="gallery-hero-btn"
          onClick={() => openLightbox(mainIndex)}
          aria-label="Ampliar galería"
        >
          <StoreImage
            src={images[mainIndex].src}
            alt={`${productName} — vista principal`}
            fill
            className="gallery-hero-img"
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
            sizes="(max-width: 1023px) 100vw, 50vw"
            priority
          />
        </button>

        {images.length > 1 && (
          <div className="gallery-thumb-strip" role="tablist" aria-label="Vistas del producto">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                role="tab"
                aria-selected={idx === mainIndex}
                className={`gallery-thumb-cell ${idx === mainIndex ? 'active' : ''}`}
                onClick={() => setMainIndex(idx)}
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

      {/* DESKTOP: grid 2 columnas */}
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
        }

        .gallery-hero-img {
          width: 100%;
          height: 100%;
          display: block;
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
          z-index: 2;
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
