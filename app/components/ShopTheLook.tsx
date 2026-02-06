'use client';

import Link from 'next/link';
import { useRef } from 'react';

interface ShopTheLookProps {
  mainProduct: any;
  relatedProducts: any[];
  storeId: string;
}

export default function ShopTheLook({ mainProduct, relatedProducts, storeId }: ShopTheLookProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Tomamos productos complementarios
  const complementaryProducts = relatedProducts.slice(0, 4);

  // Imagen lifestyle (2da imagen o 1ra)
  const lifestyleImage = mainProduct.images[1]?.src || mainProduct.images[0]?.src;

  // Lista unificada
  const productList = [
    { ...mainProduct, isMain: true },
    ...complementaryProducts
  ];

  if (productList.length === 0) return null;

  return (
    <section className="shop-the-look">
      <div className="section-header">
        <h3>SHOP THE LOOK</h3>
        <div className="arrows">
          <button onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}>←</button>
          <button onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}>→</button>
        </div>
      </div>

      <div className="slider-container" ref={scrollRef}>

        {/* CARD 1: THE LOOK (Imagen Grande) */}
        <div className="look-card-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lifestyleImage} alt="The Look" />
          <div className="overlay-text">
            <span>COMPLETE</span>
            <span>THE SET</span>
          </div>
        </div>

        {/* PRODUCTOS */}
        {productList.map((prod) => (
          <Link key={prod.id} href={`/product/${prod.id}?shop=${storeId}`} className="look-item-card">
            <div className="item-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={prod.images[0]?.src} alt={typeof prod.name === 'object' ? (prod.name.es || prod.name.en) : prod.name} />
              {prod.isMain && <span className="tag">ANCHOR</span>}
            </div>
            <div className="item-info">
              <h4>{typeof prod.name === 'object' ? (prod.name.es || prod.name.en) : prod.name}</h4>
              <p>$ {prod.variants[0]?.price}</p>
            </div>
          </Link>
        ))}

        {/* SPACER END */}
        <div style={{ minWidth: '50px' }}></div>
      </div>

      <style jsx>{`
            .shop-the-look {
                padding: 60px 0;
                background: #fff;
                overflow: hidden;
            }
            .section-header {
                max-width: 1400px;
                margin: 0 auto 30px;
                padding: 0 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .section-header h3 {
                font-size: 24px;
                font-weight: 800;
                margin: 0;
                text-transform: uppercase;
                letter-spacing: -1px;
            }
            .arrows button {
                background: none;
                border: 1px solid #ddd;
                width: 40px; 
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                margin-left: 10px;
                font-size: 18px;
                transition: all 0.2s;
            }
            .arrows button:hover {
                background: #000;
                color: #fff;
                border-color: #000;
            }

            .slider-container {
                display: flex;
                overflow-x: auto;
                gap: 20px;
                padding: 0 20px 40px;
                max-width: 1600px;
                margin: 0 auto;
                scroll-snap-type: x mandatory;
                -webkit-overflow-scrolling: touch;
            }
            .slider-container::-webkit-scrollbar {
                height: 4px;
            }
            .slider-container::-webkit-scrollbar-thumb {
                background: #ddd;
                border-radius: 4px;
            }

            /* HERO CARD */
            .look-card-hero {
                flex: 0 0 300px;
                height: 400px;
                position: relative;
                scroll-snap-align: center;
                border-radius: 4px;
                overflow: hidden;
            }
            @media (min-width: 768px) {
                .look-card-hero {
                    flex: 0 0 400px;
                    height: 500px;
                }
            }
            .look-card-hero img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                filter: brightness(0.9);
            }
            .overlay-text {
                position: absolute;
                bottom: 20px;
                left: 20px;
                display: flex;
                flex-direction: column;
            }
            .overlay-text span {
                background: #fff;
                color: #000;
                font-weight: 900;
                font-size: 20px;
                padding: 5px 10px;
                text-transform: uppercase;
                width: fit-content;
                line-height: 0.9;
            }

            /* ITEM CARD */
            .look-item-card {
                flex: 0 0 200px;
                text-decoration: none;
                color: inherit;
                scroll-snap-align: start;
            }
            @media (min-width: 768px) {
                .look-item-card {
                    flex: 0 0 250px;
                }
            }
            .item-image {
                position: relative;
                width: 100%;
                aspect-ratio: 3/4;
                background: #f5f5f5;
                margin-bottom: 15px;
                overflow: hidden;
            }
            .item-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.4s;
            }
            .look-item-card:hover .item-image img {
                transform: scale(1.05);
            }
            
            .tag {
                position: absolute;
                top: 10px;
                left: 10px;
                background: #000;
                color: #fff;
                font-size: 9px;
                font-weight: 700;
                padding: 4px 8px;
                text-transform: uppercase;
            }

            .item-info h4 {
                font-size: 13px;
                font-weight: 700;
                margin: 0 0 5px;
                text-transform: uppercase;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .item-info p {
                font-size: 13px;
                color: #666;
                margin: 0;
            }
        `}</style>
    </section>
  );
}
