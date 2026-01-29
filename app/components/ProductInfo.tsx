'use client';

import { useState } from 'react';
import { useStore } from '../context/StoreContext';

interface ProductInfoProps {
  product: any;
  storeId: string;
  domain: string;
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

export default function ProductInfo({ product, storeId, domain }: ProductInfoProps) {
  const { addToCart } = useStore();
  const variants = product.variants || [];
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Extraer tallas únicas con tipado correcto
  const sizes: string[] = [...new Set(variants.map((v: any) => v.attributes?.size || v.name).filter(Boolean))] as string[];
  
  // Encontrar variante seleccionada
  const selectedVariant = variants.find((v: any) => 
    (v.attributes?.size || v.name) === selectedSize
  ) || variants[0];

  const price = selectedVariant?.price || product.price || 0;
  const comparePrice = selectedVariant?.compare_at_price || product.compare_at_price;
  const hasDiscount = comparePrice && comparePrice > price;

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    
    setIsAdding(true);
    
    addToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      name: safeGetName(product.name),
      variant: selectedSize || 'Default',
      price: price,
      quantity: 1,
      image: product.images?.[0]?.src || ''
    });

    setTimeout(() => setIsAdding(false), 500);
  };

  const handleBuyNow = () => {
    // Redirigir a TiendaNube para checkout
    const variantParam = selectedVariant ? `?variant=${selectedVariant.id}` : '';
    window.open(`https://${domain}/products/${product.id}${variantParam}`, '_blank');
  };

  return (
    <div className="product-info">
      {/* NOMBRE Y PRECIO */}
      <div className="product-header">
        <h1 className="product-title">{safeGetName(product.name)}</h1>
        <div className="product-price-block">
          {hasDiscount && (
            <span className="product-compare-price">${comparePrice.toLocaleString('es-AR')}</span>
          )}
          <span className="product-price">${price.toLocaleString('es-AR')}</span>
        </div>
      </div>

      {/* DESCRIPCIÓN CORTA */}
      {product.description && (
        <details className="product-accordion" open>
          <summary>DETALLES</summary>
          <div 
            className="accordion-content"
            dangerouslySetInnerHTML={{ 
              __html: typeof product.description === 'object' 
                ? (product.description.es || product.description.en || '') 
                : product.description 
            }} 
          />
        </details>
      )}

      {/* ENVÍOS */}
      <details className="product-accordion">
        <summary>ENVIOS</summary>
        <div className="accordion-content">
          <p>Envíos a todo el país. El costo de envío se calcula en el checkout.</p>
          <p>Tiempo estimado de entrega: 3-7 días hábiles.</p>
        </div>
      </details>

      {/* GUÍA DE TALLAS */}
      <details className="product-accordion">
        <summary>GUIA DE TALLAS</summary>
        <div className="accordion-content">
          <p>Model wearing size M - 185 cm.</p>
          <p>Para más información sobre tallas, contactanos.</p>
        </div>
      </details>

      {/* SELECTOR DE TALLAS */}
      {sizes.length > 0 && (
        <div className="size-selector">
          <label className="size-label">Size</label>
          <div className="size-grid">
            {sizes.map((size: string) => {
              const sizeVariant = variants.find((v: any) => 
                (v.attributes?.size || v.name) === size
              );
              const isOutOfStock = sizeVariant?.stock === 0;
              
              return (
                <button
                  key={size}
                  className={`size-btn ${selectedSize === size ? 'active' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                  onClick={() => !isOutOfStock && setSelectedSize(size)}
                  disabled={isOutOfStock}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* BOTONES DE ACCIÓN */}
      <div className="action-buttons">
        <button 
          className="btn-buy-now"
          onClick={handleBuyNow}
          disabled={sizes.length > 0 && !selectedSize}
        >
          Compra ahora
        </button>
        <button 
          className={`btn-add-cart ${isAdding ? 'adding' : ''}`}
          onClick={handleAddToCart}
          disabled={sizes.length > 0 && !selectedSize}
        >
          {isAdding ? '✓ Agregado' : 'Agregar al carrito'}
        </button>
      </div>

      {/* BADGES DE CONFIANZA */}
      <div className="trust-badges">
        <div className="trust-item">
          <span className="trust-icon">🌍</span>
          <span>Worldwide shipping available.</span>
        </div>
        <div className="trust-item">
          <span className="trust-icon">↩️</span>
          <span>Hassle-free returns.</span>
        </div>
        <div className="trust-item">
          <span className="trust-icon">⭐</span>
          <span>Premium quality products made to last.</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .product-info {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        @media (min-width: 1024px) {
          .product-info {
            padding: 40px;
            position: sticky;
            top: 100px;
            max-height: calc(100vh - 120px);
            overflow-y: auto;
          }
        }

        /* HEADER */
        .product-header {
          margin-bottom: 24px;
        }

        .product-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 12px 0;
          line-height: 1.3;
          letter-spacing: 0.5px;
        }
        @media (min-width: 1024px) {
          .product-title {
            font-size: 24px;
          }
        }

        .product-price-block {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .product-price {
          font-size: 20px;
          font-weight: 700;
        }

        .product-compare-price {
          font-size: 16px;
          color: #999;
          text-decoration: line-through;
        }

        /* ACORDEONES */
        .product-accordion {
          border-bottom: 1px solid #e5e5e5;
        }

        .product-accordion summary {
          list-style: none;
          padding: 16px 0;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .product-accordion summary::-webkit-details-marker {
          display: none;
        }

        .product-accordion summary::after {
          content: '+';
          font-size: 16px;
          font-weight: 400;
        }

        .product-accordion[open] summary::after {
          content: '−';
        }

        .accordion-content {
          padding: 0 0 16px 0;
          font-size: 13px;
          line-height: 1.7;
          color: #666;
        }

        .accordion-content p {
          margin: 0 0 8px 0;
        }

        .accordion-content p:last-child {
          margin-bottom: 0;
        }

        /* SELECTOR DE TALLAS */
        .size-selector {
          margin: 24px 0;
        }

        .size-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        .size-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .size-btn {
          min-width: 48px;
          height: 40px;
          padding: 0 16px;
          border: 1px solid #ddd;
          background: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .size-btn:hover:not(:disabled) {
          border-color: #000;
        }

        .size-btn.active {
          background: #000;
          color: #fff;
          border-color: #000;
        }

        .size-btn.out-of-stock {
          opacity: 0.4;
          cursor: not-allowed;
          text-decoration: line-through;
        }

        /* BOTONES */
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 24px 0;
        }

        .btn-buy-now {
          width: 100%;
          padding: 16px;
          background: #000;
          color: #fff;
          border: none;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-buy-now:hover:not(:disabled) {
          background: #333;
        }

        .btn-buy-now:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-add-cart {
          width: 100%;
          padding: 16px;
          background: #fff;
          color: #000;
          border: 1px solid #000;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-cart:hover:not(:disabled) {
          background: #f5f5f5;
        }

        .btn-add-cart:disabled {
          border-color: #ccc;
          color: #ccc;
          cursor: not-allowed;
        }

        .btn-add-cart.adding {
          background: #22c55e;
          color: #fff;
          border-color: #22c55e;
        }

        /* TRUST BADGES */
        .trust-badges {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 24px;
          border-top: 1px solid #e5e5e5;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: #666;
        }

        .trust-icon {
          font-size: 16px;
        }
      `}} />
    </div>
  );
}
