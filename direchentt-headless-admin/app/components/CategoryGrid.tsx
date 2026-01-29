'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface CategoryGridProps {
  products: any[];
  storeId: string;
  categoryName: string;
  categoryId: string;
  initialGrid: number;
  currentSort: string;
  paymentInfo: any[];
  installmentsInfo: any[];
}

export default function CategoryGrid({ 
  products, 
  storeId, 
  categoryName, 
  categoryId,
  initialGrid,
  currentSort,
  paymentInfo,
  installmentsInfo 
}: CategoryGridProps) {
  const [gridColumns, setGridColumns] = useState(initialGrid);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Calcular columnas efectivas según pantalla
  const getEffectiveColumns = () => {
    if (isMobile) return 2;
    if (isTablet) return Math.min(gridColumns, 3);
    return gridColumns;
  };

  // Manejar cambio de ordenamiento
  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort) {
      params.set('sort', sort);
    } else {
      params.delete('sort');
    }
    router.push(`/categoria/${categoryId}?${params.toString()}`);
  };

  // Formatear precio con separador de miles
  const formatPrice = (price: number | string) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Calcular cuotas (ejemplo: 3, 6, 12 cuotas sin interés)
  const calculateInstallments = (price: number | string) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return {
      tres: Math.round(num / 3),
      seis: Math.round(num / 6),
      doce: Math.round(num / 12)
    };
  };

  const effectiveColumns = getEffectiveColumns();

  return (
    <>
      <div className="category-page">
        {/* HEADER DE CATEGORÍA */}
        <div className="category-header">
          <h1 className="category-title">{categoryName.toUpperCase()}</h1>
          <span className="product-count">{products.length} productos</span>
        </div>

        {/* BARRA DE CONTROLES */}
        <div className="controls-bar">
          <div className="controls-left">
            {/* Selector de ordenamiento */}
            <select 
              className="sort-select"
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="">Más recientes</option>
              <option value="price-ascending">Menor precio</option>
              <option value="price-descending">Mayor precio</option>
              <option value="alpha-ascending">A - Z</option>
              <option value="alpha-descending">Z - A</option>
              <option value="best-selling">Más vendidos</option>
            </select>
          </div>

          <div className="controls-right">
            {/* Selector de grilla */}
            <div className="grid-selector">
              <span className="grid-label">Ver:</span>
              {[3, 4, 5].map((cols) => (
                <button
                  key={cols}
                  className={`grid-btn ${gridColumns === cols ? 'active' : ''}`}
                  onClick={() => setGridColumns(cols)}
                  title={`${cols} columnas`}
                >
                  <GridIcon columns={cols} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* INFO DE PAGOS/CUOTAS */}
        <div className="payment-banner">
          <div className="payment-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <span>Hasta <strong>12 cuotas sin interés</strong></span>
          </div>
          <div className="payment-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
            <span>Envío gratis desde $50.000</span>
          </div>
          <div className="payment-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>10% OFF con transferencia</span>
          </div>
        </div>

        {/* GRID DE PRODUCTOS */}
        {products.length > 0 ? (
          <div 
            className="products-grid"
            style={{
              display: 'grid',
              gap: '20px',
              gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`,
              alignItems: 'start'
            }}
          >
            {products.map((product) => {
              const firstVariant = product.variants?.[0];
              const images = product.images || [];
              const price = firstVariant?.price || 0;
              const comparePrice = firstVariant?.compare_at_price;
              const installments = calculateInstallments(price);
              
              const productName = typeof product.name === 'object' 
                ? (product.name.es || product.name.en || 'Producto')
                : product.name || 'Producto';

              const hasDiscount = comparePrice && parseFloat(comparePrice) > parseFloat(price);
              const discountPercent = hasDiscount 
                ? Math.round((1 - parseFloat(price) / parseFloat(comparePrice)) * 100)
                : 0;

              return (
                <Link 
                  key={product.id} 
                  href={`/product/${product.id}?shop=${storeId}`} 
                  className="product-card-link"
                >
                  <article className="product-card">
                    {/* IMAGEN */}
                    <div className="product-image-wrapper">
                      {hasDiscount && (
                        <span className="discount-badge">-{discountPercent}%</span>
                      )}
                      {images.length > 0 ? (
                        <>
                          <img 
                            src={images[0].src} 
                            alt={productName} 
                            className="product-image primary" 
                            loading="lazy" 
                          />
                          {images.length > 1 && (
                            <img 
                              src={images[1].src} 
                              alt={productName} 
                              className="product-image secondary" 
                              loading="lazy" 
                            />
                          )}
                        </>
                      ) : (
                        <div className="no-image">Sin imagen</div>
                      )}
                    </div>

                    {/* INFO */}
                    <div className="product-info">
                      <h3 className="product-name">{productName.toUpperCase()}</h3>
                      
                      <div className="price-section">
                        {hasDiscount && (
                          <span className="compare-price">${formatPrice(comparePrice)}</span>
                        )}
                        <span className="current-price">${formatPrice(price)}</span>
                      </div>

                      {/* CUOTAS */}
                      <div className="installments-info">
                        <span className="installments-text">
                          <strong>6 cuotas</strong> de ${formatPrice(installments.seis)} sin interés
                        </span>
                      </div>

                      {/* COLORES DISPONIBLES */}
                      {product.variants?.length > 1 && (
                        <span className="variants-count">
                          {product.variants.length} variantes
                        </span>
                      )}
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="no-products">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <p>No hay productos en esta categoría</p>
            <Link href={`/?shop=${storeId}`} className="back-btn">
              Volver al inicio
            </Link>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .category-page {
          max-width: 1600px;
          margin: 0 auto;
          padding: 30px 20px 60px;
        }

        /* HEADER */
        .category-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .category-title {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 3px;
          margin: 0 0 8px;
        }
        .product-count {
          font-size: 13px;
          color: #888;
          letter-spacing: 1px;
        }

        /* CONTROLES */
        .controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          gap: 15px;
          flex-wrap: wrap;
        }
        .controls-left, .controls-right {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .sort-select {
          padding: 10px 35px 10px 15px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 12px center;
          cursor: pointer;
          appearance: none;
          min-width: 150px;
        }
        .sort-select:focus {
          outline: none;
          border-color: #000;
        }

        /* GRID SELECTOR */
        .grid-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .grid-label {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }
        .grid-btn {
          width: 36px;
          height: 36px;
          border: 1px solid #ddd;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          border-radius: 4px;
        }
        .grid-btn:hover {
          border-color: #999;
        }
        .grid-btn.active {
          background: #000;
          border-color: #000;
        }
        .grid-btn.active svg rect {
          fill: #fff;
        }
        .grid-btn svg rect {
          fill: #666;
          transition: fill 0.2s;
        }

        /* PAYMENT BANNER */
        .payment-banner {
          display: flex;
          justify-content: center;
          gap: 30px;
          padding: 15px 20px;
          background: #f8f8f8;
          border-radius: 8px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .payment-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: #333;
        }
        .payment-item svg {
          color: #666;
          flex-shrink: 0;
        }
        .payment-item strong {
          font-weight: 700;
        }

        /* PRODUCT GRID - Los estilos del grid se manejan con inline styles */
        @media (min-width: 1024px) {
          .products-grid { gap: 25px; }
        }

        /* PRODUCT CARD */
        .product-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .product-card {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .product-image-wrapper {
          position: relative;
          width: 100%;
          padding-bottom: 133.33%; /* 4:3 aspect ratio (4/3 = 1.333) */
          overflow: hidden;
          background: #f5f5f5;
          margin-bottom: 12px;
        }
        .product-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          transition: opacity 0.4s ease;
        }
        .product-image.secondary {
          opacity: 0;
        }
        .product-card:hover .product-image.primary {
          opacity: 0;
        }
        .product-card:hover .product-image.secondary {
          opacity: 1;
        }
        .no-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 12px;
        }

        /* DISCOUNT BADGE */
        .discount-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #e53935;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 3px;
          z-index: 1;
        }

        /* PRODUCT INFO */
        .product-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .product-name {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: #000;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .price-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .compare-price {
          font-size: 11px;
          color: #999;
          text-decoration: line-through;
        }
        .current-price {
          font-size: 13px;
          font-weight: 700;
          color: #000;
        }

        /* INSTALLMENTS */
        .installments-info {
          margin-top: 4px;
        }
        .installments-text {
          font-size: 10px;
          color: #16a34a;
        }
        .installments-text strong {
          font-weight: 700;
        }

        /* VARIANTS */
        .variants-count {
          font-size: 10px;
          color: #888;
          margin-top: 2px;
        }

        /* NO PRODUCTS */
        .no-products {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
        }
        .no-products p {
          font-size: 16px;
          color: #666;
          margin: 20px 0;
        }
        .back-btn {
          padding: 12px 30px;
          background: #000;
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .back-btn:hover {
          background: #333;
        }

        /* RESPONSIVE */
        @media (max-width: 640px) {
          .category-title {
            font-size: 20px;
            letter-spacing: 2px;
          }
          .controls-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .controls-left, .controls-right {
            justify-content: center;
          }
          .payment-banner {
            flex-direction: column;
            gap: 12px;
            align-items: center;
          }
          .grid-selector {
            display: none;
          }
        }
      `}} />
    </>
  );
}

// Componente de icono de grilla
function GridIcon({ columns }: { columns: number }) {
  const size = 16;
  const gap = 1;
  const boxSize = (size - (columns - 1) * gap) / columns;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: columns * 2 }).map((_, i) => {
        const col = i % columns;
        const row = Math.floor(i / columns);
        return (
          <rect
            key={i}
            x={col * (boxSize + gap)}
            y={row * (boxSize + gap)}
            width={boxSize}
            height={boxSize}
            rx={1}
          />
        );
      })}
    </svg>
  );
}
