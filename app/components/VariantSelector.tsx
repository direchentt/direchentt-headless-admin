'use client';

import { useState } from 'react';
import { useAddToCart } from '../hooks/useAddToCart';

interface VariantSelectorProps {
  product: any;
  storeId: string;
  domain: string;
  onVariantSelect?: (variantName: string) => void;
}

export default function VariantSelector({ product, storeId, domain, onVariantSelect }: VariantSelectorProps) {
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  // Si tienes el email del usuario, pásalo aquí. Si no, puedes dejarlo undefined.
  const userEmail = undefined; // <-- reemplaza esto si tienes el email

  const { addToCart, isLoading: isAddingToCart, error } = useAddToCart();

  const handleAddToCart = async () => {
    if (selectedVariant?.id) {
      await addToCart(selectedVariant.id.toString(), 1, userEmail);
    } else {
      alert('Por favor, selecciona una variante del producto.');
    }
  };

  // Agrupar variantes por color y talla
  const variantsByColor = new Map();
  variants.forEach((v: any) => {
    const color = v.attributes?.color || 'Sin color';
    if (!variantsByColor.has(color)) {
      variantsByColor.set(color, []);
    }
    variantsByColor.get(color).push(v);
  });

  const colorOptions = Array.from(variantsByColor.keys());
  const selectedColorVariants = selectedVariant?.attributes?.color 
    ? variantsByColor.get(selectedVariant.attributes.color) 
    : variants;

  return (
    <section className="variant-section">
      {/* PRECIO */}
      {selectedVariant && (
        <div className="variant-price-header">
          <span className="variant-price-label">Precio</span>
          <span className="variant-price-value">
            ${typeof selectedVariant.price === 'number' 
              ? selectedVariant.price.toLocaleString('es-AR')
              : selectedVariant.price
            }
          </span>
        </div>
      )}

      {/* ... (código de selección de variantes sin cambios) ... */}

      {/* BOTÓN AÑADIR AL CARRITO */}
      <button 
        className="add-to-cart-btn" 
        onClick={handleAddToCart}
        disabled={isAddingToCart || !selectedVariant}
      >
        {isAddingToCart ? 'PROCESANDO...' : 'AÑADIR AL CARRITO'}
      </button>
      
      <style dangerouslySetInnerHTML={{__html: `
        .variant-section {
          padding: 0;
          background: #fff;
        }
        .variant-price-header {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 1px solid #f0f0f0;
        }
        .variant-price-label {
          font-size: 11px;
          font-weight: 800;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .variant-price-value {
          font-size: 32px;
          font-weight: 800;
          color: #000;
          letter-spacing: -0.5px;
        }
        .variant-group {
          margin-bottom: 35px;
        }
        .variant-label {
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 15px;
          letter-spacing: 1px;
          text-transform: uppercase;
          display: block;
          color: #000;
        }
        .variant-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          gap: 10px;
        }
        .variant-btn {
          aspect-ratio: 1;
          border: 2px solid #ddd;
          background: #fff;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #fff;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          text-align: center;
          position: relative;
          overflow: hidden;
          background-size: cover;
          background-position: center;
        }
        .variant-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4));
          z-index: 1;
        }
        .variant-btn-label {
          position: relative;
          z-index: 2;
          background: rgba(0,0,0,0.6);
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 9px;
          white-space: normal;
          line-height: 1.2;
          margin-bottom: 4px;
        }
        .variant-btn:hover {
          border-color: #000;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
        }
        .variant-btn.active {
          border-color: #000;
          box-shadow: 0 0 0 2px #fff, 0 0 0 4px #000;
        }
        .variant-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .variant-btn-stock {
          display: none;
        }
        .variant-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .variant-description {
          font-size: 13px;
          color: #666;
          line-height: 1.7;
          margin: 30px 0;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 4px;
        }
        .variant-description p {
          margin: 0 0 12px 0;
        }
        .variant-description p:last-child {
          margin-bottom: 0;
        }
        .variant-description ul,
        .variant-description ol {
          margin: 12px 0;
          padding-left: 20px;
        }
        .variant-description li {
          margin: 6px 0;
        }
        .add-to-cart-btn {
          width: 100%;
          padding: 16px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: all 0.2s;
          margin-top: 20px;
        }
        .add-to-cart-btn:hover {
          background: #333;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .add-to-cart-btn:disabled {
          background: #888;
          cursor: not-allowed;
        }
      `}} />
    </section>
  );
}
