'use client';

import { useState, useEffect, useRef } from 'react';

interface BannerSectionProps {
  banners?: string[];
  type?: 'vertical' | 'medium' | 'grid';
  title?: string;
  autoHeight?: boolean;
}

export default function BannerSection({ 
  banners = [], 
  type = 'medium',
  title,
  autoHeight = false 
}: BannerSectionProps) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (banners.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && banners.length > 1) {
      handleNext();
    }
    if (isRightSwipe && banners.length > 1) {
      handlePrev();
    }
  };

  const handleNext = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (!isLoaded || banners.length === 0) {
    return null;
  }

  const renderVerticalBanner = () => (
    <div className="banner-vertical-container">
      <div 
        className="banner-vertical-slider"
        ref={sliderRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {banners.map((banner, index) => (
          <div
            key={index}
            className={`banner-vertical-slide ${index === currentBanner ? 'active' : ''}`}
            style={{
              backgroundImage: `url(${banner})`,
              transform: `translateX(${(index - currentBanner) * 100}%)`
            }}
          />
        ))}
      </div>
      
      {banners.length > 1 && (
        <>
          <button className="banner-nav banner-prev" onClick={handlePrev}>‹</button>
          <button className="banner-nav banner-next" onClick={handleNext}>›</button>
          
          <div className="banner-indicators">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`banner-indicator ${index === currentBanner ? 'active' : ''}`}
                onClick={() => setCurrentBanner(index)}
              />
            ))}
          </div>
        </>
      )}
      
      <div className="banner-vertical-content">
        <h3 className="grid-item-title">COLECCIONES</h3>
      </div>
    </div>
  );

  const renderMediumBanner = () => (
    <div className="banner-medium-container">
      <div 
        className="banner-medium-slider"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="banner-medium-track"
          style={{ transform: `translateX(-${currentBanner * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={index} className="banner-medium-slide">
              <img 
                src={banner} 
                alt={`Banner ${index + 1}`}
                className="banner-medium-image"
              />
              <div className="banner-medium-overlay">
                <h3>{title || 'Ofertas Especiales'}</h3>
                <button className="banner-cta">Explorar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {banners.length > 1 && (
        <>
          <button className="banner-nav banner-prev" onClick={handlePrev}>‹</button>
          <button className="banner-nav banner-next" onClick={handleNext}>›</button>
          
          <div className="banner-dots">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`banner-dot ${index === currentBanner ? 'active' : ''}`}
                onClick={() => setCurrentBanner(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderGridBanners = () => (
    <div className="banner-grid-wrapper">
      <div className="banner-grid-container">
        {banners.slice(0, 3).map((banner, index) => {
            const labels = ['MUJER', 'HOMBRE', 'ACCESORIOS'];
            const label = labels[index] || 'COLECCIÓN';
            return (
              <div 
                key={index} 
                className="banner-grid-item"
              >
                <img src={banner} alt={label} />
                <div className="banner-grid-overlay">
                  <div className="grid-item-content">
                    <h3 className="grid-item-title">{label}</h3>
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );

  const renderBanner = () => {
    switch (type) {
      case 'vertical':
        return renderVerticalBanner();
      case 'grid':
        return renderGridBanners();
      default:
        return renderMediumBanner();
    }
  };

  return (
    <section className={`banner-section banner-${type}`}>
      {title && type !== 'vertical' && (
        <div className="banner-section-header">
          <h2>{title}</h2>
        </div>
      )}
      {renderBanner()}
      
      <style jsx>{`
        .banner-section {
          margin: 0;
          padding: 0;
          max-width: 100%;
          width: 100%;
        }

        .banner-section-header {
          display: none;
        }

        /* =================== VERTICAL BANNERS =================== */
        .banner-vertical-container {
          position: relative;
          height: 85vh;
          min-height: 600px;
          max-height: 1000px;
          overflow: hidden;
          background: #f9f9f9;
        }

        .banner-vertical-slider {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .banner-vertical-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transition: transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .banner-vertical-content {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        /* =================== MEDIUM BANNERS =================== */
        .banner-medium-container {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .banner-medium-slider {
          position: relative;
          height: 600px;
          overflow: hidden;
        }

        .banner-medium-track {
          display: flex;
          width: ${banners.length * 100}%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .banner-medium-slide {
          position: relative;
          flex: 0 0 ${100 / (banners.length || 1)}%;
          height: 100%;
        }

        .banner-medium-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .banner-medium-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          text-align: center;
        }

        .banner-medium-overlay h3 {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin: 0;
          background: #fff;
          color: #000;
          padding: 15px 30px;
          display: inline-block;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        /* =================== GRID BANNERS =================== */
        .banner-grid-wrapper {
          width: 100%;
          padding: 0;
        }

        .banner-grid-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: 700px;
          gap: 0; /* SIN ESPACIOS */
          width: 100%;
        }

        .banner-grid-item {
          position: relative;
          height: 700px;
          overflow: hidden;
          cursor: pointer;
          background: #f4f4f4;
        }

        .banner-grid-item img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
          transition: transform 1.5s cubic-bezier(0.165, 0.84, 0.44, 1), opacity 0.5s ease;
          opacity: 0.95;
        }

        .banner-grid-item:hover img {
          transform: scale(1.05);
          opacity: 1;
        }

        .banner-grid-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .grid-item-content {
          text-align: center;
          z-index: 2;
        }

        .grid-item-title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin: 0;
          background: #fff;
          color: #000;
          padding: 18px 35px;
          display: inline-block;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          border: none;
        }

        .banner-grid-item:hover .grid-item-title {
          background: #000;
          color: #fff;
        }

        /* =================== NAVIGATION =================== */
        .banner-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.8);
          border: none;
          width: 45px;
          height: 45px;
          border-radius: 0; /* Cuadrados */
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: #000;
          cursor: pointer;
          z-index: 15;
          transition: all 0.2s ease;
        }

        .banner-nav:hover {
          background: #fff;
        }

        .banner-prev { left: 0; }
        .banner-next { right: 0; }

        /* =================== INDICATORS =================== */
        .banner-indicators {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 15;
        }

        .banner-indicator {
          width: 8px;
          height: 8px;
          border: 1px solid #fff;
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .banner-indicator.active {
          background: #fff;
        }

        /* =================== RESPONSIVE DESIGN =================== */
        @media (max-width: 1024px) {
          .banner-grid-container {
            grid-template-columns: 1fr;
            grid-auto-rows: 600px;
          }
          .banner-grid-item {
            height: 600px;
          }
        }

        @media (max-width: 768px) {
          .banner-vertical-container {
            height: 70vh;
          }
          .banner-grid-container {
            grid-auto-rows: 500px;
          }
          .banner-grid-item {
            height: 500px;
          }
          .grid-item-title {
            padding: 15px 30px;
            font-size: 10px;
          }
        }
      `}</style>
    </section>
  );
}