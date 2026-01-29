'use client';

import { useState, useMemo } from 'react';
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
  const [quickShopProduct, setQuickShopProduct] = useState<any>(null);

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
              <input type="checkbox" />
              <span className="toggle-slider"></span>
            </span>
            <span className="toggle-text">Just Woman</span>
          </label>
        </div>
      </div>

      {/* Product Grid */}
      <div className="arrivals-grid">
        {filteredProducts.map((product) => {
          const images = product.images || [];
          const price = getProductPrice(product);
          const comparePrice = getComparePrice(product);
          const isNew = isNewProduct(product);
          const isOnSale = comparePrice !== null && comparePrice > price;

          return (
            <Link 
              key={product.id} 
              href={`/product/${product.id}?shop=${storeId}`}
              className="product-card"
            >
              <div className="product-image" style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '133%',
                background: '#f5f5f5',
                overflow: 'hidden',
                marginBottom: '12px'
              }}>
                {images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={images[0].src} 
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
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#999'
                  }}>Sin imagen</div>
                )}
                {isOnSale && (
                  <span className="badge badge-sale">SALE</span>
                )}
                {isNew && !isOnSale && (
                  <span className="badge badge-new">NEW IN</span>
                )}
                <button 
                  className="quick-add" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setQuickShopProduct(product);
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
                {/* Cuadraditos de variantes con imagen */}
                {images && images.length > 1 && (
                  <div className="product-variants">
                    {images
                      .filter((img) => img && img.src) // Filtrar imágenes válidas
                      .slice(0, 4)
                      .map((img, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <span key={img.id || i} className="variant-thumb">
                          <img 
                            src={img.src} 
                            alt="" 
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Shop Modal */}
      <QuickShop
        product={quickShopProduct}
        storeId={storeId}
        domain={domain}
        isOpen={!!quickShopProduct}
        onClose={() => setQuickShopProduct(null)}
      />

      <style dangerouslySetInnerHTML={{__html: `
        .new-arrivals {
          padding: 60px 0 80px;
          background: #fff;
        }

        /* Header */
        .arrivals-header {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 20px;
          margin-bottom: 40px;
        }
        @media (min-width: 1024px) {
          .arrivals-header {
            flex-wrap: nowrap;
            gap: 40px;
          }
        }

        .arrivals-title {
          font-size: 28px;
          font-weight: 400;
          color: #000;
          margin: 0;
          white-space: nowrap;
        }
        @media (min-width: 768px) {
          .arrivals-title {
            font-size: 36px;
          }
        }

        /* Tabs */
        .arrivals-tabs {
          display: flex;
          align-items: center;
          gap: 20px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          flex: 1;
          padding: 5px 0;
        }
        .arrivals-tabs::-webkit-scrollbar {
          display: none;
        }
        .tab-btn {
          background: none;
          border: none;
          font-size: 13px;
          font-weight: 400;
          color: #888;
          cursor: pointer;
          padding: 8px 0;
          white-space: nowrap;
          transition: color 0.2s;
          position: relative;
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
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        @media (min-width: 640px) {
          .arrivals-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
        }
        @media (min-width: 1024px) {
          .arrivals-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
          }
        }

        /* Product Card */
        .product-card {
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .product-image {
          position: relative;
          width: 100%;
          padding-bottom: 133%;
          background: #f5f5f5;
          overflow: hidden;
          margin-bottom: 12px;
        }
        .product-image img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .product-card:hover .product-image img {
          transform: scale(1.03);
        }

        /* Badge */
        .badge {
          position: absolute;
          top: 12px;
          left: 12px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.5px;
          padding: 5px 10px;
          background: #fff;
          color: #000;
        }
        .badge-sale {
          background: #000;
          color: #fff;
        }

        /* Quick Add */
        .quick-add {
          position: absolute;
          bottom: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          background: #fff;
          border: none;
          border-radius: 50%;
          font-size: 18px;
          font-weight: 300;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
        }
        .product-card:hover .quick-add {
          opacity: 1;
        }
        .quick-add:hover {
          transform: scale(1.1);
        }

        /* Product Info */
        .product-info {
          padding: 0 5px;
        }
        .product-name-price {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 8px;
        }
        .product-name {
          font-size: 11px;
          font-weight: 500;
          color: #000;
          line-height: 1.3;
          flex: 1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .price-container {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .product-price-old {
          font-size: 11px;
          font-weight: 400;
          color: #999;
          text-decoration: line-through;
        }
        .product-price {
          font-size: 11px;
          font-weight: 500;
          color: #000;
          white-space: nowrap;
        }
        .product-price.sale {
          color: #c00;
        }

        /* Variant Thumbnails */
        .product-variants {
          display: flex;
          gap: 4px;
          margin-top: 4px;
        }
        .variant-thumb {
          width: 20px;
          height: 20px;
          border: 1px solid #e0e0e0;
          overflow: hidden;
          cursor: pointer;
        }
        .variant-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .variant-thumb:hover {
          border-color: #000;
        }

        /* No image placeholder */
        .no-image {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f0f0;
          color: #999;
          font-size: 12px;
        }
      `}} />
    </section>
  );
}
