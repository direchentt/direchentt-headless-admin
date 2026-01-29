'use client';

import { useState, useEffect, useCallback } from 'react';

interface HeroSliderProps {
  banners?: string[];
}

export default function HeroSlider({ banners = [] }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const slides = banners.length > 0 ? banners : [
    '/banners/HOME_HORIZONTAL_DEF_2.png',
    '/banners/HOME_horizontsal_2.webp',
    '/banners/bannermujerhorizontal.png',
    '/banners/baner1.png',
    '/banners/banner2.png',
    '/banners/banner3.png',
    '/banners/banner5.jpg',
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(nextSlide, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlay, nextSlide]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setIsAutoPlay(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (Math.abs(distance) > 50) {
      if (distance > 0) nextSlide();
      else prevSlide();
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlay(false);
  };

  return (
    <>
      <section 
        className="hero-slider"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="slides-container">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`slide ${idx === currentSlide ? 'active' : ''}`}
            >
              <img src={slide} alt={`Banner ${idx + 1}`} />
            </div>
          ))}
        </div>

        {/* Arrows */}
        <button className="nav-arrow prev" onClick={() => { prevSlide(); setIsAutoPlay(false); }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="nav-arrow next" onClick={() => { nextSlide(); setIsAutoPlay(false); }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 19l7-7-7-7" />
          </svg>
        </button>

        {/* Dots */}
        <div className="dots">
          {slides.map((_, idx) => (
            <button
              key={idx}
              className={`dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(idx)}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="progress-bar">
          <div 
            className="progress" 
            style={{ 
              width: `${((currentSlide + 1) / slides.length) * 100}%`,
              transition: 'width 0.3s ease'
            }} 
          />
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .hero-slider {
          position: relative;
          width: 100%;
          height: 85vh;
          min-height: 500px;
          max-height: 900px;
          overflow: hidden;
          background: #f5f5f5;
        }

        @media (max-width: 768px) {
          .hero-slider {
            height: 70vh;
            min-height: 400px;
          }
        }

        .slides-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          transition: opacity 0.8s ease-in-out;
        }

        .slide.active {
          opacity: 1;
          z-index: 1;
        }

        .slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        /* Navigation Arrows */
        .nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 50px;
          height: 50px;
          background: rgba(255,255,255,0.9);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .nav-arrow:hover {
          background: #fff;
          transform: translateY(-50%) scale(1.1);
        }

        .nav-arrow.prev { left: 20px; }
        .nav-arrow.next { right: 20px; }

        @media (max-width: 768px) {
          .nav-arrow {
            width: 40px;
            height: 40px;
            opacity: 0.8;
          }
          .nav-arrow.prev { left: 10px; }
          .nav-arrow.next { right: 10px; }
        }

        /* Dots */
        .dots {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 10;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dot.active {
          background: #fff;
          transform: scale(1.2);
        }

        .dot:hover {
          background: rgba(255,255,255,0.8);
        }

        /* Progress Bar */
        .progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: rgba(255,255,255,0.3);
          z-index: 10;
        }

        .progress {
          height: 100%;
          background: #fff;
        }
      `}} />
    </>
  );
}
