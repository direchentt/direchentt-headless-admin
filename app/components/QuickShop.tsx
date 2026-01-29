'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';

interface QuickShopProps {
  product: any;
  storeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickShop({ product, storeId, isOpen, onClose }: QuickShopProps) {
  const { addToCart } = useStore();
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const variants = product?.variants || [];
  const images = product?.images || [];
  
  // Encontrar variante seleccionada
  const selectedVariant = variants.find((v: any) => v.id === selectedVariantId) || variants[0];

  const price = selectedVariant?.price || 0;

  // Obtener imagen de la variante
  const getVariantImage = (variant: any) => {
    if (!variant) return images[0]?.src || '';
    const variantImage = images.find((img: any) => img.id === variant.image_id);
    return variantImage?.src || images[0]?.src || '';
  };

  const currentImage = getVariantImage(selectedVariant);

  // Seleccionar primera variante automáticamente
  useEffect(() => {
    if (variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(variants[0].id);
    }
  }, [variants, selectedVariantId]);

  // Resetear al abrir
  useEffect(() => {
    if (isOpen && variants.length > 0) {
      setSelectedVariantId(variants[0].id);
      setIsAdding(false);
    }
  }, [isOpen, variants]);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    
    setIsAdding(true);
    
    const productName = typeof product.name === 'object' 
      ? (product.name.es || product.name.en || 'Producto')
      : product.name || 'Producto';

    // Crear descripción de variante más descriptiva
    let variantDescription = '';
    if (selectedVariant.attributes && Object.keys(selectedVariant.attributes).length > 0) {
      const attributes = Object.entries(selectedVariant.attributes)
        .map(([key, value]) => {
          const labelMap: { [key: string]: string } = {
            'size': 'Talla',
            'color': 'Color',
            'talla': 'Talla',
            'Size': 'Talla',
            'Color': 'Color'
          };
          const label = labelMap[key] || key;
          return `${label}: ${value}`;
        })
        .join(', ');
      variantDescription = attributes;
    } else {
      variantDescription = selectedVariant.name || 'Variante seleccionada';
    }

    addToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      name: productName,
      variant: variantDescription,
      price: price,
      quantity: 1,
      image: currentImage
    });

    setTimeout(() => {
      setIsAdding(false);
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="quickshop-overlay" onClick={onClose} />
      <div className="quickshop-modal">
        <button className="quickshop-close" onClick={onClose}>✕</button>
        
        <div className="quickshop-content">
          {/* Imagen */}
          <div className="quickshop-image">
            {currentImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={currentImage} 
                alt={typeof product.name === 'object' ? product.name.es : product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            )}
          </div>

          {/* Info */}
          <div className="quickshop-info">
            <h3 className="quickshop-title">
              {typeof product.name === 'object' ? product.name.es : product.name}
            </h3>
            <p className="quickshop-price">$ {price.toLocaleString('es-AR')}</p>

            {/* Selector de variantes mejorado */}
            {variants.length > 1 && (() => {
              // Función para generar nombres descriptivos de variantes
              const getVariantDisplayName = (variant: any) => {
                // Si tiene atributos, usarlos para crear el nombre
                if (variant.attributes && Object.keys(variant.attributes).length > 0) {
                  const attributeNames = Object.values(variant.attributes).join(' - ');
                  if (attributeNames && attributeNames !== '' && !attributeNames.includes('undefined')) {
                    return attributeNames;
                  }
                }
                
                // Si tiene nombre propio, usarlo
                if (variant.name && variant.name !== '' && !variant.name.includes('Opción')) {
                  return variant.name;
                }
                
                // Si tiene SKU, usarlo
                if (variant.sku && variant.sku !== '') {
                  return `SKU: ${variant.sku}`;
                }
                
                // Como último recurso, usar la posición
                return `Opción ${variant.position || 1}`;
              };

              // Extraer todos los tipos de atributos únicos
              const attributeTypes = new Map();
              variants.forEach((variant: any) => {
                if (variant.attributes) {
                  Object.entries(variant.attributes).forEach(([key, value]: [string, any]) => {
                    if (value && value !== '' && value !== null && value !== undefined) {
                      if (!attributeTypes.has(key)) {
                        attributeTypes.set(key, new Set());
                      }
                      attributeTypes.get(key).add(value);
                    }
                  });
                }
              });

              // Función para obtener el nombre legible de un atributo
              const getAttributeLabel = (key: string) => {
                const labels: { [key: string]: string } = {
                  'size': 'Talla',
                  'color': 'Color',
                  'talla': 'Talla',
                  'Size': 'Talla',
                  'Color': 'Color',
                  'material': 'Material',
                  'style': 'Estilo',
                  'fit': 'Corte'
                };
                return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
              };

              // Si hay atributos estructurados, mostrar selectores por atributo
              if (attributeTypes.size > 0) {
                return (
                  <div className="quickshop-selectors">
                    {Array.from(attributeTypes.entries()).map(([attributeKey, values]) => {
                      const showImages = attributeKey.toLowerCase().includes('color') && 
                        variants.some((v: any) => v.image_id && images.find((img: any) => img.id === v.image_id));
                      
                      return (
                        <div key={attributeKey} className="attribute-selector">
                          <label className="quickshop-label">
                            {getAttributeLabel(attributeKey)}:
                          </label>
                          
                          {showImages ? (
                            // Selector con imágenes para colores
                            <div className="color-options">
                              {Array.from(values).map((value: any) => {
                                const variant = variants.find((v: any) => 
                                  v.attributes && v.attributes[attributeKey] === value
                                );
                                if (!variant) return null;
                                
                                const variantImg = getVariantImage(variant);
                                return (
                                  <button
                                    key={variant.id}
                                    className={`color-swatch ${selectedVariantId === variant.id ? 'active' : ''}`}
                                    onClick={() => setSelectedVariantId(variant.id)}
                                    title={value}
                                  >
                                    {variantImg ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img 
                                        src={variantImg} 
                                        alt={value}
                                        referrerPolicy="no-referrer"
                                        crossOrigin="anonymous"
                                      />
                                    ) : (
                                      <span className="color-name">{value}</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            // Selector de botones para tallas y otros atributos
                            <div className="size-options">
                              {Array.from(values).sort().map((value: any) => {
                                const variant = variants.find((v: any) => 
                                  v.attributes && v.attributes[attributeKey] === value
                                );
                                if (!variant) return null;
                                
                                return (
                                  <button
                                    key={variant.id}
                                    className={`size-btn ${selectedVariantId === variant.id ? 'active' : ''}`}
                                    onClick={() => setSelectedVariantId(variant.id)}
                                  >
                                    {value}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              } else {
                // Si no hay atributos, mostrar dropdown con nombres descriptivos
                return (
                  <div className="quickshop-selectors">
                    <div className="attribute-selector">
                      <label className="quickshop-label">Variante:</label>
                      <div className="variant-dropdown">
                        <select 
                          value={selectedVariantId || ''} 
                          onChange={(e) => setSelectedVariantId(Number(e.target.value))}
                          className="variant-select"
                        >
                          {variants.map((variant: any) => (
                            <option key={variant.id} value={variant.id}>
                              {getVariantDisplayName(variant)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              }
            })()}

            {/* Botón agregar */}
            <button
              className="quickshop-add-btn"
              onClick={handleAddToCart}
              disabled={isAdding || !selectedVariant}
            >
              {isAdding ? 'Agregando...' : 'Agregar al carrito'}
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .quickshop-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 9998;
          animation: fadeIn 0.2s ease;
        }
        .quickshop-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          width: 90%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          z-index: 9999;
          animation: slideUp 0.3s ease;
          border-radius: 0;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to { 
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        .quickshop-close {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          z-index: 10;
          color: #000;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .quickshop-close:hover {
          transform: rotate(90deg);
        }
        .quickshop-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        @media (max-width: 768px) {
          .quickshop-content {
            grid-template-columns: 1fr;
          }
        }
        .quickshop-image {
          aspect-ratio: 3/4;
          background: #f5f5f5;
          overflow: hidden;
        }
        .quickshop-info {
          padding: 40px 30px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .quickshop-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .quickshop-price {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          color: #000;
        }
        .quickshop-selectors {
          margin-bottom: 30px;
        }
        .attribute-selector {
          margin-bottom: 25px;
        }
        .attribute-selector:last-child {
          margin-bottom: 0;
        }
        .quickshop-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          display: block;
          color: #333;
        }

        /* Selectores de color con imágenes */
        .color-options {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .color-swatch {
          width: 60px;
          height: 60px;
          border: 2px solid #ddd;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
          overflow: hidden;
          border-radius: 8px;
          position: relative;
        }
        .color-swatch img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .color-swatch .color-name {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 10px;
          font-weight: 600;
          text-align: center;
          text-transform: uppercase;
          padding: 4px;
        }
        .color-swatch:hover {
          border-color: #666;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .color-swatch.active {
          border-color: #000;
          border-width: 3px;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        }

        /* Selectores de talla y otros atributos */
        .size-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .size-btn {
          min-width: 50px;
          height: 45px;
          border: 2px solid #ddd;
          background: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0 16px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .size-btn:hover {
          border-color: #000;
          transform: translateY(-1px);
        }
        .size-btn.active {
          background: #000;
          color: #fff;
          border-color: #000;
        }

        /* Dropdown para variantes sin estructura */
        .variant-dropdown {
          position: relative;
        }
        .variant-select {
          width: 100%;
          height: 45px;
          border: 2px solid #ddd;
          background: #fff;
          font-size: 14px;
          font-weight: 500;
          padding: 0 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 40px;
        }
        .variant-select:hover {
          border-color: #000;
        }
        .variant-select:focus {
          outline: none;
          border-color: #000;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.1);
        }
        .quickshop-add-btn {
          width: 100%;
          height: 50px;
          background: #000;
          color: #fff;
          border: none;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: auto;
        }
        .quickshop-add-btn:hover:not(:disabled) {
          background: #333;
        }
        .quickshop-add-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}} />
    </>
  );
}
