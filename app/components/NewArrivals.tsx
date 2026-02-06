'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QuickShop from './QuickShop';

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

// Helper para obtener precio del producto
const getProductPrice = (product: Product): number => {
  const firstVariant = product.variants?.[0];
  if (!firstVariant) return 0;
  const price = firstVariant.price;
  return typeof price === 'number' ? price : parseFloat(price) || 0;
};

// Helper para obtener precio comparativo (precio tachado)
const getComparePrice = (product: Product): number | null => {
  const firstVariant = product.variants?.[0];
  if (!firstVariant?.compare_at_price) return null;
  const price = firstVariant.compare_at_price;
  const parsed = typeof price === 'number' ? price : parseFloat(price);
  return parsed > 0 ? parsed : null;
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

  // Obtener subcategorías
  const subcategories = categories.filter((c) => c.parent).slice(0, 6);

  // Filtrar productos por subcategoría activa
  const filteredProducts = useMemo(() => {
    if (activeTab === null) return products.slice(0, 10);

    return products.filter(p =>
      p.categories?.some((c) => c.id === activeTab)
    ).slice(0, 10);
  }, [activeTab, products]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  };


  return (
    <section className="new-arrivals">


      {/* Header con título y tabs */}
      <div className="arrivals-header">
        <h2 className="arrivals-title">New Arrivals</h2>
        <div className="arrivals-tabs">
          <button
            className={`tab-btn ${activeTab === null ? 'active' : ''}`}
            onClick={() => setActiveTab(null)}
          >
            Ver todo <sup>{products.length}</sup>
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub.id}
              className={`tab-btn ${activeTab === sub.id ? 'active' : ''}`}
              onClick={() => setActiveTab(sub.id)}
            >
              {safeGetName(sub.name)}
              <sup>{products.filter(p => p.categories?.some((c) => c.id === sub.id)).length}</sup>
            </button>
          ))}
        </div>
        <div className="arrivals-toggle">
          <label className="toggle-label">
            <span className="toggle-switch">
              <input
                type="checkbox"
                checked={showAlternateImages}
                onChange={(e) => setShowAlternateImages(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </span>
            <span className="toggle-text">Tocalo para ver qué hace 😜</span>
          </label>
        </div>
      </div>

      {/* Product Grid */}
      <div className="arrivals-grid">
        {filteredProducts.map((product) => (
          <NewArrivalsCard
            key={product.id}
            product={product}
            storeId={storeId}
            showAlternateImages={showAlternateImages}
            onQuickShop={() => setQuickShopProduct(product)}
            formatPrice={formatPrice}
          />
        ))}
      </div>

      {/* Quick Shop Modal */}
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
          padding: 60px 0 80px;
          background: #fff;
        }

        /* Header */
        .arrivals-header {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 16px;
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          gap: 12px;
          margin-bottom: 0;
          min-height: 48px;
          border-bottom: none;
          background: #fff;
        }
        @media (min-width: 1024px) {
          .arrivals-header {
            gap: 18px;
          }
        }

        .arrivals-title {
          font-size: 22px;
          font-weight: 600;
          color: #111;
          margin: 0 18px 0 0;
          white-space: nowrap;
          letter-spacing: 0.01em;
        }
        @media (min-width: 768px) {
          .arrivals-title {
            font-size: 28px;
          }
        }

        /* Tabs */
        .arrivals-tabs {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          flex: 1;
          padding: 0;
          min-height: 48px;
        }
        .arrivals-tabs::-webkit-scrollbar {
          display: none;
        }
        .tab-btn {
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 400;
          color: #888;
          cursor: pointer;
          padding: 0 2px;
          white-space: nowrap;
          transition: color 0.2s;
          position: relative;
          height: 48px;
          line-height: 48px;
        }
        .tab-btn:hover {
          color: #000;
        }
        .tab-btn.active {
          color: #000;
          font-weight: 500;
        }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: #000;
        }
        .tab-btn sup {
          font-size: 9px;
          margin-left: 2px;
          vertical-align: super;
        }

        /* Toggle */
        .arrivals-toggle {
          display: none;
        }
        @media (min-width: 1024px) {
          .arrivals-toggle {
            display: block;
          }
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
          color: #000;
        }

        /* Product Grid */
        .arrivals-grid {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex; /* Flex para scroll horizontal */
          gap: 15px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 20px; /* Espacio para scrollbar si aparece */
        }
        
        .arrivals-grid::-webkit-scrollbar {
            display: none;
        }

        /* En mobile, los items tienen ancho fijo para que se pueda scrollear */
        .arrivals-grid > :global(.product-card) {
            flex: 0 0 45vw; /* 45% del ancho para ver un poco del siguiente */
            scroll-snap-align: start;
            min-width: 160px;
        }

        @media (min-width: 640px) {
          .arrivals-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            overflow-x: visible;
            padding-bottom: 0;
          }
          .arrivals-grid > :global(.product-card) {
            flex: unset;
            width: auto;
          }
        }
        @media (min-width: 1024px) {
          .arrivals-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
          }
        }
      `}} />
    </section>
  );
}

function NewArrivalsCard({ product, storeId, showAlternateImages, onQuickShop, formatPrice }: { product: Product, storeId: string, showAlternateImages: boolean, onQuickShop: () => void, formatPrice: (price: number) => string }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Reset index when toggle changes
  useMemo(() => {
    if (showAlternateImages && product.images && product.images.length > 1) {
      setCurrentImageIndex(1);
    } else {
      setCurrentImageIndex(0);
    }
  }, [showAlternateImages, product.images]);

  const images = product.images || [];
  const price = getProductPrice(product);
  const comparePrice = getComparePrice(product);
  const isNew = isNewProduct(product);
  const isOnSale = comparePrice !== null && comparePrice > price;

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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageToUse.src}
            alt={safeGetName(product.name)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s ease'
            }}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
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

        {isOnSale && <span className="badge badge-sale">SALE</span>}
        {isNew && !isOnSale && <span className="badge badge-new">NEW IN</span>}
        <button
          className="quick-add"
          onClick={(e) => {
            e.preventDefault();
            onQuickShop();
          }}
        >
          +
        </button>
      </div>

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
                .product-image img { transition: transform 0.4s ease; }
                .product-card:hover .product-image img { transform: scale(1.03); }

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

                .badge { position: absolute; top: 12px; left: 12px; font-size: 10px; font-weight: 600; padding: 5px 10px; background: #fff; color: #000; z-index: 2; }
                .badge-sale { background: #000; color: #fff; }

                .quick-add { position: absolute; bottom: 12px; right: 12px; width: 32px; height: 32px; background: #fff; border: 1px solid #eee; border-radius: 50%; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: all 0.2s; z-index: 10; color: #000;}
                .product-card:hover .quick-add { opacity: 1; }
                .quick-add:hover { transform: scale(1.1); background: #000; color: #fff; border-color: #000; }

                .product-info { padding: 0 5px; }
                .product-name-price { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
                .product-name { font-size: 11px; font-weight: 500; color: #000; line-height: 1.3; flex: 1; text-transform: uppercase; }
                .price-container { display: flex; flex-direction: column; align-items: flex-end; }
                .product-price-old { font-size: 11px; color: #999; text-decoration: line-through; }
                .product-price { font-size: 11px; font-weight: 500; color: #000; }
                .product-price.sale { color: #c00; }
                .no-image { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #999; font-size: 12px; }
            `}</style>
    </Link>
  )
}
