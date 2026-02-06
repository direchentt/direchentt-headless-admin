'use client';

import { useRef } from 'react';
import ProductCard from './ProductCard';

interface ProductCarouselProps {
  title: string;
  products: any[];
  storeId: string;
}

export default function ProductCarousel({ title, products, storeId }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="product-carousel-section">
      <div className="carousel-header">
        <h2 className="carousel-title">{title}</h2>
        <div className="carousel-nav">
          <button onClick={() => scroll('left')} aria-label="Anterior">←</button>
          <button onClick={() => scroll('right')} aria-label="Siguiente">→</button>
        </div>
      </div>

      <div className="carousel-container" ref={scrollRef}>
        {products.map((product) => (
          <div key={product.id} className="carousel-item">
            <ProductCard product={product} storeId={storeId} />
          </div>
        ))}
      </div>

      <style jsx>{`
        .product-carousel-section {
          padding: 60px 20px;
          max-width: 1500px; /* Ancho un poco mayor */
          margin: 0 auto;
        }

        .carousel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end; /* Alinear abajo para mejor visual */
          margin-bottom: 30px;
        }

        .carousel-title {
          font-size: 24px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0;
          position: relative;
        }

        /* Nav moderna minimalista */
        .carousel-nav button {
          background: #fff;
          border: 1px solid #000;
          color: #000;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
          margin-left: 12px;
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
          display: none;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        
        @media (min-width: 768px) {
            .carousel-nav button {
                display: inline-flex;
            }
        }

        .carousel-nav button:hover {
          background: #000;
          color: white;
          transform: scale(1.1);
        }

        .carousel-container {
          display: flex;
          gap: 20px; /* Más aire entre productos */
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 20px;
          scrollbar-width: none;
          /* Padding extra para que no se corten las sombras o hover */
          padding-left: 5px;
          padding-right: 5px;
        }
        
        .carousel-container::-webkit-scrollbar {
            display: none;
        }

        .carousel-item {
          min-width: 220px;
          width: 50%; /* 2 visibles en mobile */
          flex-shrink: 0;
          scroll-snap-align: start;
        }

        @media (min-width: 640px) {
          .carousel-item {
            width: 33.333%; /* 3 visibles */
          }
        }

        @media (min-width: 1024px) {
          .carousel-item {
            width: 25%; /* 4 visibles - clásico */
          }
        }
        
        @media (min-width: 1400px) {
          .carousel-item {
            width: 20%; /* 5 visibles en pantallas grandes - más dinámico */
          }
        }
      `}</style>
    </section>
  );
}
