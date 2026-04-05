'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatPrice, getVariantDisplayPrices } from '@/lib/product-utils';
import QuickShop from './QuickShop';
import ProductCucardas from './ProductCucardas';
import StoreImage from './StoreImage';

interface Category {
  id: number;
  name: string;
  parent?: number;
}

interface ImageObj {
  src: string;
}

interface Variant {
  id: number;
  price: string | number;
  compare_at_price?: string | number;
  image_id?: number;
  values?: { es?: string; en?: string }[];
}

interface Product {
  id: number;
  name: string | { es?: string; en?: string };
  images?: ImageObj[];
  variants?: Variant[];
  categories?: { id: number }[];
  created_at?: string;
  tags?: string | string[];
  free_shipping?: boolean;
}

interface NewArrivalsProps {
  products: Product[];
  categories: Category[];
  storeId: string;
  domain?: string;
}

// Helper para extraer nombre de forma segura
const safeGetName = (name: unknown): string => {
  if (!name) return 'Producto';
  if (typeof name === 'string') return name;
  if (typeof name === 'object' && name !== null) {
    const obj = name as Record<string, unknown>;
    return String(obj.es || obj.en || Object.values(obj)[0] || 'Producto');
  }
  return 'Producto';
};


// Verificar si es producto "nuevo" (creado en los últimos 30 días)
const isNewProduct = (product: Product): boolean => {
  if (!product.created_at) return false;
  const createdDate = new Date(product.created_at);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return createdDate > thirtyDaysAgo;
};

export default function NewArrivals({ products, categories, storeId, domain }: NewArrivalsProps) {
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [showAlternateImages, setShowAlternateImages] = useState(false);
  const [quickShopProduct, setQuickShopProduct] = useState<Product | null>(null);

  const subcategories = categories.filter((c) => c.parent);

  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabScrollState, setTabScrollState] = useState({ left: false, right: false, overflow: false });

  const updateTabScrollHints = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    const overflow = max > 6;
    setTabScrollState({
      left: overflow && scrollLeft > 4,
      right: overflow && scrollLeft < max - 4,
      overflow,
    });
  }, []);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    updateTabScrollHints();
    el.addEventListener('scroll', updateTabScrollHints, { passive: true });
    const ro = new ResizeObserver(updateTabScrollHints);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateTabScrollHints);
      ro.disconnect();
    };
  }, [updateTabScrollHints, subcategories.length, products.length]);

  const scrollTabsBy = (dir: -1 | 1) => {
    tabsRef.current?.scrollBy({ left: dir * Math.min(200, tabsRef.current.clientWidth * 0.7), behavior: 'smooth' });
  };

  // Filtrar productos por subcategoría activa
  const filteredProducts = useMemo(() => {
    if (activeTab === null) return products.slice(0, 10);

    return products.filter(p =>
      p.categories?.some((c) => c.id === activeTab)
    ).slice(0, 10);
  }, [activeTab, products]);

  return (
    <section className="new-arrivals" aria-labelledby="new-arrivals-heading">
      <div className="arrivals-inner">
        <div className="arrivals-header">
          <div className="arrivals-header-top">
            <h2 id="new-arrivals-heading" className="arrivals-title">
              Novedades
            </h2>
            <div className="arrivals-toggle">
              <label className="toggle-label">
                <span className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={showAlternateImages}
                    onChange={(e) => setShowAlternateImages(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </span>
                <span className="toggle-text">Otra foto</span>
              </label>
            </div>
          </div>

          <div className={`arrivals-tabs-outer ${tabScrollState.overflow ? 'has-overflow' : ''}`}>
            <button
              type="button"
              className="tabs-scroll-btn tabs-scroll-btn--prev"
              aria-label="Ver categorías anteriores"
              onClick={() => scrollTabsBy(-1)}
              disabled={!tabScrollState.left}
            >
              ‹
            </button>
            <div
              className={`tabs-fade tabs-fade--left ${tabScrollState.left ? 'visible' : ''}`}
              aria-hidden
            />
            <div ref={tabsRef} className="arrivals-tabs" role="tablist" aria-label="Filtrar por categoría">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === null}
                className={`tab-btn ${activeTab === null ? 'active' : ''}`}
                onClick={() => setActiveTab(null)}
              >
                Ver todo <span className="tab-count">{products.length}</span>
              </button>
              {subcategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === sub.id}
                  className={`tab-btn ${activeTab === sub.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(sub.id)}
                >
                  {safeGetName(sub.name)}
                  <span className="tab-count">
                    {products.filter((p) => p.categories?.some((c) => c.id === sub.id)).length}
                  </span>
                </button>
              ))}
            </div>
            <div
              className={`tabs-fade tabs-fade--right ${tabScrollState.right ? 'visible' : ''}`}
              aria-hidden
            />
            <button
              type="button"
              className="tabs-scroll-btn tabs-scroll-btn--next"
              aria-label="Ver más categorías"
              onClick={() => scrollTabsBy(1)}
              disabled={!tabScrollState.right}
            >
              ›
            </button>
          </div>
          {tabScrollState.overflow && tabScrollState.right ? (
            <p className="arrivals-scroll-hint">
              <span aria-hidden>→</span> Deslizá o usá las flechas para ver más categorías
            </p>
          ) : null}
        </div>

        <div className="arrivals-grid-wrap">
          <ul className="arrivals-grid">
            {filteredProducts.map((product) => (
              <li key={product.id} className="arrivals-grid-item">
                <NewArrivalsCard
                  product={product}
                  storeId={storeId}
                  showAlternateImages={showAlternateImages}
                  onQuickShop={() => setQuickShopProduct(product)}
                  formatPrice={formatPrice}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <QuickShop
        product={quickShopProduct}
        storeId={storeId}
        domain={domain}
        isOpen={!!quickShopProduct}
        onClose={() => setQuickShopProduct(null)}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .new-arrivals {
          padding: clamp(40px, 6vw, 72px) 0 clamp(48px, 8vw, 88px);
          background: #fff;
        }
        .arrivals-inner {
          max-width: min(1600px, 100%);
          margin: 0 auto;
          padding: 0 clamp(12px, 3vw, 32px);
        }

        .arrivals-header {
          margin-bottom: clamp(20px, 3vw, 28px);
        }
        .arrivals-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .arrivals-title {
          font-size: clamp(1.35rem, 4vw, 1.85rem);
          font-weight: 700;
          color: #111;
          margin: 0;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }

        .arrivals-tabs-outer {
          position: relative;
          display: flex;
          align-items: stretch;
          gap: 0;
          border-bottom: 1px solid #e8e8e8;
        }
        .arrivals-tabs-outer:not(.has-overflow) .tabs-scroll-btn {
          display: none;
        }
        .arrivals-tabs-outer:not(.has-overflow) .tabs-fade {
          display: none;
        }
        .tabs-scroll-btn {
          flex-shrink: 0;
          width: 44px;
          min-height: 48px;
          border: none;
          background: #fafafa;
          color: #111;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: background 0.15s, opacity 0.15s;
        }
        .tabs-scroll-btn:hover:not(:disabled) {
          background: #f0f0f0;
        }
        .tabs-scroll-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }
        .tabs-scroll-btn--prev {
          border-radius: 8px 0 0 0;
        }
        .tabs-scroll-btn--next {
          border-radius: 0 8px 0 0;
        }
        @media (min-width: 900px) {
          .tabs-scroll-btn {
            width: 40px;
          }
        }

        .tabs-fade {
          pointer-events: none;
          position: absolute;
          top: 0;
          bottom: 0;
          width: 36px;
          z-index: 2;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .tabs-fade.visible {
          opacity: 1;
        }
        .tabs-fade--left {
          left: 44px;
          background: linear-gradient(90deg, #fff 30%, transparent);
        }
        .tabs-fade--right {
          right: 44px;
          background: linear-gradient(270deg, #fff 30%, transparent);
        }
        @media (max-width: 599px) {
          .tabs-fade--left { left: 44px; }
          .tabs-fade--right { right: 44px; }
        }

        .arrivals-tabs {
          display: flex;
          align-items: center;
          gap: clamp(8px, 2vw, 20px);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          flex: 1;
          min-width: 0;
          padding: 4px 8px 0;
          scroll-padding: 0 8px;
        }
        .arrivals-tabs::-webkit-scrollbar {
          height: 4px;
        }
        .arrivals-tabs::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }

        .tab-btn {
          flex-shrink: 0;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 500;
          color: #777;
          cursor: pointer;
          padding: 12px 4px 14px;
          white-space: nowrap;
          transition: color 0.2s;
          position: relative;
          min-height: 48px;
          line-height: 1.3;
        }
        .tab-btn:hover {
          color: #000;
        }
        .tab-btn:focus-visible {
          outline: 2px solid #111;
          outline-offset: 2px;
          border-radius: 4px;
        }
        .tab-btn.active {
          color: #000;
          font-weight: 600;
        }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #000;
        }
        .tab-count {
          font-size: 11px;
          font-weight: 600;
          color: #999;
          margin-left: 4px;
        }
        .tab-btn.active .tab-count {
          color: #555;
        }

        .arrivals-scroll-hint {
          margin: 10px 0 0;
          font-size: 12px;
          color: #666;
          line-height: 1.4;
        }

        .arrivals-toggle {
          flex-shrink: 0;
        }
        .toggle-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          inset: 0;
          background: #ddd;
          border-radius: 24px;
          transition: 0.3s;
        }
        .toggle-slider::before {
          content: '';
          position: absolute;
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background: #fff;
          border-radius: 50%;
          transition: 0.3s;
        }
        .toggle-switch input:checked + .toggle-slider {
          background: #000;
        }
        .toggle-switch input:checked + .toggle-slider::before {
          transform: translateX(20px);
        }
        .toggle-text {
          font-size: 13px;
          font-weight: 500;
          color: #333;
        }

        .arrivals-grid-wrap {
          margin: 0 calc(-1 * clamp(12px, 3vw, 32px));
          padding: 0 clamp(12px, 3vw, 32px);
        }
        .arrivals-grid {
          list-style: none;
          margin: 0;
          padding: 4px 0 8px;
          display: flex;
          gap: clamp(12px, 2vw, 20px);
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scroll-padding-inline: clamp(12px, 3vw, 32px);
        }
        .arrivals-grid::-webkit-scrollbar {
          height: 6px;
        }
        .arrivals-grid::-webkit-scrollbar-thumb {
          background: #d0d0d0;
          border-radius: 6px;
        }

        .arrivals-grid-item {
          flex: 0 0 calc(50vw - clamp(28px, 6vw, 48px));
          max-width: 320px;
          min-width: 156px;
          scroll-snap-align: start;
        }

        @media (min-width: 640px) {
          .arrivals-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: clamp(16px, 2vw, 24px);
            overflow-x: visible;
            scroll-snap-type: none;
          }
          .arrivals-grid-item {
            flex: unset;
            max-width: none;
            min-width: 0;
            scroll-snap-align: unset;
          }
        }
        @media (min-width: 900px) {
          .arrivals-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        @media (min-width: 1200px) {
          .arrivals-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
        }
      `}} />
    </section>
  );
}

function NewArrivalsCard({ product, storeId, showAlternateImages, onQuickShop, formatPrice }: { product: Product, storeId: string, showAlternateImages: boolean, onQuickShop: () => void, formatPrice: (price: any) => string }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    if (showAlternateImages && product.images && product.images.length > 1) {
      setCurrentImageIndex(1);
    } else {
      setCurrentImageIndex(0);
    }
  }, [showAlternateImages, product.images]);

  const images = product.images || [];
  const v0 = product.variants?.[0];
  const { list, current, hasPromo } = getVariantDisplayPrices(v0 || {});
  const isNew = isNewProduct(product);
  const isOnSale = hasPromo;
  const comparePrice = isOnSale ? list : null;
  const price = current;

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) nextImage();
    if (distance < -50) prevImage();
    setTouchStart(0);
    setTouchEnd(0);
  }

  const nextImage = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (images.length > 1) setCurrentImageIndex((p) => (p + 1) % images.length);
  }

  const prevImage = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (images.length > 1) setCurrentImageIndex((p) => (p - 1 + images.length) % images.length);
  }

  const imageToUse = images[currentImageIndex];

  return (
    <Link href={`/product/${product.id}?shop=${storeId}`} className="product-card">
      <div
        className="product-image"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '133%',
          background: '#f5f5f5',
          overflow: 'hidden',
          marginBottom: '12px'
        }}
      >
        {imageToUse ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transition: 'transform 0.4s ease',
            }}
          >
            <StoreImage
              src={imageToUse.src}
              alt={safeGetName(product.name)}
              fill
              className="na-card-main-img"
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="no-image">Sin imagen</div>
        )}

        {/* Dots / Arrows */}
        {images.length > 1 && (
          <>
            <div className="slider-dots">
              {images.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className={`dot ${idx === currentImageIndex ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(idx); }}
                />
              ))}
            </div>
            {/* Arrows hidden on touch, visible on hover */}
            <button className="slider-arrow left" onClick={prevImage}>‹</button>
            <button className="slider-arrow right" onClick={nextImage}>›</button>
          </>
        )}

        {isOnSale ? <span className="badge badge-sale">Sale</span> : null}
        {isNew && !isOnSale ? (
          <span className="badge badge-new" title="Producto nuevo">
            Nuevo
          </span>
        ) : null}
        <button
          type="button"
          className="quick-add"
          aria-label="Compra rápida"
          onClick={(e) => {
            e.preventDefault();
            onQuickShop();
          }}
        >
          +
        </button>
      </div>

      <ProductCucardas product={product} layout="inline" />

      <div className="product-info">
        <div className="product-name-price">
          <span className="product-name">{safeGetName(product.name)}</span>
          <div className="price-container">
            {isOnSale && comparePrice && (
              <span className="product-price-old">{formatPrice(comparePrice)}</span>
            )}
            <span className={`product-price ${isOnSale ? 'sale' : ''}`}>{formatPrice(price)}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
                .product-card { text-decoration: none; color: inherit; display: block; }
                .product-image .na-card-main-img { transition: transform 0.4s ease; }
                .product-card:hover .product-image .na-card-main-img { transform: scale(1.03); }

                .slider-dots {
                    position: absolute;
                    bottom: 15px;
                    left: 0;
                    right: 0;
                    display: flex;
                    justify-content: center;
                    gap: 6px;
                    z-index: 5;
                    pointer-events: none; /* Let clicks pass to link unless direct on dot */
                }
                .dot {
                    width: 6px;
                    height: 6px;
                    background: rgba(255,255,255,0.6);
                    border-radius: 50%;
                    pointer-events: auto;
                    cursor: pointer;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                }
                .dot.active { background: #000; transform: scale(1.2); }

                .slider-arrow {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(255,255,255,0.9);
                    border: none;
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    line-height: 1;
                    padding-bottom: 2px;
                    cursor: pointer;
                    opacity: 0;
                    transition: opacity 0.2s;
                    z-index: 6;
                    color: #000;
                }
                .product-image:hover .slider-arrow { opacity: 1; }
                .slider-arrow.left { left: 8px; }
                .slider-arrow.right { right: 8px; }

                .badge {
                  position: absolute;
                  top: 8px;
                  left: 8px;
                  right: auto;
                  font-size: 9px;
                  font-weight: 700;
                  letter-spacing: 0.06em;
                  text-transform: uppercase;
                  padding: 4px 7px;
                  border-radius: 3px;
                  z-index: 3;
                  max-width: calc(100% - 56px);
                  line-height: 1.2;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
                }
                .badge-new {
                  background: rgba(255,255,255,0.92);
                  color: #111;
                  border: 1px solid rgba(0,0,0,0.08);
                }
                .badge-sale { background: #111; color: #fff; border: none; }

                .quick-add {
                  position: absolute;
                  bottom: 10px;
                  right: 10px;
                  width: 40px;
                  height: 40px;
                  background: rgba(255,255,255,0.95);
                  border: 1px solid rgba(0,0,0,0.1);
                  border-radius: 50%;
                  font-size: 20px;
                  line-height: 1;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  z-index: 10;
                  color: #000;
                  opacity: 1;
                  transition: transform 0.2s, background 0.2s;
                }
                @media (hover: hover) and (pointer: fine) {
                  .quick-add { opacity: 0; }
                  .product-card:hover .quick-add { opacity: 1; }
                }
                .quick-add:hover { transform: scale(1.06); background: #111; color: #fff; border-color: #111; }

                .product-info { padding: 0 5px; }
                .product-name-price { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 8px; }
                .product-name { font-size: 11px; font-weight: 500; color: #000; line-height: 1.2; flex: 1; min-width: 0; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .price-container { display: inline-flex; flex-direction: row; flex-wrap: nowrap; align-items: baseline; justify-content: flex-end; gap: 6px; flex-shrink: 0; white-space: nowrap; }
                .product-price-old { font-size: 10px; font-weight: 500; color: #999; text-decoration: line-through; }
                .product-price { font-size: 11px; font-weight: 700; color: #000; line-height: 1.2; }
                .product-price.sale { color: #c00; }
                .no-image { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #999; font-size: 12px; }
            `}</style>
    </Link>
  )
}
