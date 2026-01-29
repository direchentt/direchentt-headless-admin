'use client';

import { useState, useRef, useEffect } from 'react';

interface Image {
  id: string | number;
  src: string;
}

interface ImageCarouselProps {
  images: Image[];
  productName: string;
  variantName?: string;
}

export default function ImageCarousel({ images, productName, variantName }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (touchStart - touchEnd > 50) {
      // Swipe left - siguiente imagen
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }

    if (touchEnd - touchStart > 50) {
      // Swipe right - imagen anterior
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div className="image-carousel">
        <div className="carousel-main-image no-image">Sin imágenes</div>
      </div>
    );
  }

  return (
    <div className="image-carousel">
      <style dangerouslySetInnerHTML={{ __html: `
        .image-carousel {
          width: 100%;
        }
        .carousel-container {
          position: relative;
          width: 100%;
          margin-bottom: 0;
          overflow: visible;
        }
        .carousel-variant-label {
          font-size: 12px;
          color: #666;
          text-transform: capitalize;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
          font-weight: 500;
        }
        .carousel-main-image {
          width: 100%;
          aspect-ratio: 4/5;
          object-fit: cover;
          display: block;
          background: #f5f5f5;
          cursor: grab;
        }
        .carousel-main-image.no-image {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 14px;
        }
        .carousel-main-image:active {
          cursor: grabbing;
        }
        @media (min-width: 1024px) {
          .carousel-main-image {
            aspect-ratio: 3/4;
          }
        }
        .carousel-indicators {
          display: flex;
          gap: 6px;
          margin-top: 12px;
          padding: 0 20px;
          overflow-x: auto;
          scroll-behavior: smooth;
        }
        @media (min-width: 1024px) {
          .carousel-indicators {
            padding: 0;
            margin-top: 15px;
          }
        }
        .carousel-indicator {
          flex-shrink: 0;
          width: 50px;
          height: 50px;
          border: 2px solid #ddd;
          background: #f5f5f5;
          cursor: pointer;
          border-radius: 4px;
          overflow: hidden;
          transition: all 0.2s;
        }
        .carousel-indicator:hover {
          border-color: #000;
        }
        .carousel-indicator.active {
          border-color: #000;
          box-shadow: 0 0 0 1px #fff inset;
        }
        .carousel-indicator img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .carousel-counter {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          margin-top: 12px;
          font-size: 11px;
          color: #999;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        @media (min-width: 1024px) {
          .carousel-counter {
            padding: 0;
          }
        }
      `}} />

      <div className="carousel-container" ref={containerRef}>
        {variantName && (
          <div className="carousel-variant-label">{variantName}</div>
        )}
        <img
          src={images[currentIndex].src}
          alt={`${productName} - Imagen ${currentIndex + 1}`}
          className="carousel-main-image"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          loading="eager"
        />
      </div>

      {images.length > 1 && (
        <>
          <div className="carousel-indicators">
            {images.map((img, idx) => (
              <button
                key={img.id}
                className={`carousel-indicator ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(idx)}
                aria-label={`Ver imagen ${idx + 1}`}
                aria-current={idx === currentIndex}
              >
                <img src={img.src} alt="" />
              </button>
            ))}
          </div>

          <div className="carousel-counter">
            <span>{currentIndex + 1} / {images.length}</span>
          </div>
        </>
      )}
    </div>
  );
}
