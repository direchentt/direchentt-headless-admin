'use client';

import { useState, useRef } from 'react';

interface Image {
  id: string | number;
  src: string;
}

interface ImageGalleryProps {
  images: Image[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    } else if (diff < -50) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

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
            background: #f5f5f5;
            color: #999;
            font-size: 14px;
          }
        `}} />
      </div>
    );
  }

  return (
    <div className="pdp-gallery">
      {/* MOBILE: Carrusel horizontal */}
      <div className="gallery-mobile">
        <div 
          className="gallery-slider"
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={images[currentIndex].src}
            alt={`${productName} - Imagen ${currentIndex + 1}`}
            className="gallery-main-img"
          />
        </div>
        
        {images.length > 1 && (
          <div className="gallery-dots">
            {images.map((_, idx) => (
              <button
                key={idx}
                className={`gallery-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ver imagen ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* DESKTOP: Grid de imágenes estilo Scuffers */}
      <div className="gallery-desktop">
        {images.map((img, idx) => (
          <div key={img.id} className="gallery-item">
            <img
              src={img.src}
              alt={`${productName} - Imagen ${idx + 1}`}
              loading={idx < 2 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .pdp-gallery {
          width: 100%;
        }

        /* ========== MOBILE ========== */
        .gallery-mobile {
          display: block;
        }
        @media (min-width: 1024px) {
          .gallery-mobile {
            display: none;
          }
        }

        .gallery-slider {
          width: 100%;
          overflow: hidden;
          touch-action: pan-y;
        }

        .gallery-main-img {
          width: 100%;
          aspect-ratio: 3/4;
          object-fit: cover;
          display: block;
          background: #f5f5f5;
        }

        .gallery-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          padding: 16px;
        }

        .gallery-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: #ddd;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        .gallery-dot.active {
          background: #000;
          transform: scale(1.2);
        }

        /* ========== DESKTOP ========== */
        .gallery-desktop {
          display: none;
        }
        @media (min-width: 1024px) {
          .gallery-desktop {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 4px;
          }
        }

        .gallery-item {
          width: 100%;
          overflow: hidden;
        }

        .gallery-item img {
          width: 100%;
          aspect-ratio: 3/4;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }

        .gallery-item:hover img {
          transform: scale(1.02);
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
