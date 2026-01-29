'use client';

import { useState, useEffect } from 'react';
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
  const images = product.images || [];
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Seleccionar primera variante automáticamente
  useEffect(() => {
    if (variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(variants[0].id);
    }
  }, [variants, selectedVariantId]);
  
  // Encontrar variante seleccionada
  const selectedVariant = variants.find((v: any) => v.id === selectedVariantId) || variants[0];

  const price = selectedVariant?.price || product.price || 0;
  const comparePrice = selectedVariant?.compare_at_price || product.compare_at_price;
  const hasDiscount = comparePrice && comparePrice > price;

  // Obtener imagen de la variante
  const getVariantImage = (variant: any) => {
    if (!variant) return images[0]?.src || '';
    const variantImage = images.find((img: any) => img.id === variant.image_id);
    return variantImage?.src || images[0]?.src || '';
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    
    setIsAdding(true);

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
    
    console.log('Agregando al carrito:', {
      storeId,
      domain,
      variantId: selectedVariant.id,
      productId: product.id
    });
    
    addToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      name: safeGetName(product.name),
      variant: variantDescription,
      price: price,
      quantity: 1,
      image: getVariantImage(selectedVariant)
    });

    setTimeout(() => setIsAdding(false), 500);
  };

  const handleBuyNow = () => {
    if (!selectedVariant) return;
    
    // Agregar al carrito local para tracking
    handleAddToCart();
    
    // Usar el dominio real de la tienda
    // Si domain no está definido, usar storeId.mitiendanube.com
    const tiendanubeUrl = domain || `${storeId}.mitiendanube.com`;
    
    console.log('🔍 Domain check:', { domain, storeId, tiendanubeUrl });
    
    // Extraer el handle del producto de diferentes fuentes posibles
    let productHandle = product.handle;
    
    // Si canonical_url es un objeto, extraer el valor en español
    if (!productHandle && product.canonical_url) {
      if (typeof product.canonical_url === 'object') {
        const canonicalUrl = product.canonical_url.es || product.canonical_url.en || '';
        productHandle = canonicalUrl.split('/').pop();
      } else if (typeof product.canonical_url === 'string') {
        productHandle = product.canonical_url.split('/').pop();
      }
    }
    
    // Si no hay handle, usar el ID del producto
    if (!productHandle || productHandle === '[object Object]') {
      productHandle = product.id;
    }
    
    // Redirigir directamente al producto en TiendaNube con la variante seleccionada
    const productUrl = `https://${tiendanubeUrl}/products/${productHandle}?variant=${selectedVariant.id}`;
    
    console.log('🛒 Redirigiendo a TiendaNube:', {
      productUrl,
      domain,
      tiendanubeUrl,
      productHandle,
      productId: product.id,
      variantId: selectedVariant.id,
      canonicalUrl: product.canonical_url
    });
    
    window.location.href = productUrl;
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

      {/* SELECTOR DE VARIANTES CON DETECCIÓN INTELIGENTE */}
      {variants.length > 1 && (() => {
        // Intentar extraer atributos de cualquier estructura disponible
        const attributeGroups = new Map();
        let hasValidAttributes = false;
        
        variants.forEach((variant: any) => {
          // Buscar atributos en diferentes ubicaciones
          const possibleSources = [
            variant.attributes,
            variant.attribute_values,
            variant.properties,
            variant.values,
            variant.options,
            variant.specs
          ];
          
          possibleSources.forEach((source) => {
            if (source && typeof source === 'object' && Object.keys(source).length > 0) {
              // Los atributos pueden ser arrays de objetos con idiomas
              if (Array.isArray(source)) {
                source.forEach((attrObj: any, index: number) => {
                  if (attrObj && typeof attrObj === 'object') {
                    // Extraer el valor en español o el primer valor disponible
                    const value = attrObj.es || attrObj.en || Object.values(attrObj)[0];
                    if (value && value !== '' && value !== null && value !== undefined && value !== 'null') {
                      hasValidAttributes = true;
                      
                      // Usar el índice como key del atributo (0 = primer atributo, 1 = segundo, etc.)
                      const key = index === 0 ? 'Color' : (index === 1 ? 'Protección' : `Atributo ${index + 1}`);
                      
                      if (!attributeGroups.has(key)) {
                        attributeGroups.set(key, {
                          name: key,
                          values: new Map(),
                          isColor: key.toLowerCase().includes('color') || index === 0
                        });
                      }
                      
                      if (!attributeGroups.get(key).values.has(value)) {
                        attributeGroups.get(key).values.set(value, []);
                      }
                      attributeGroups.get(key).values.get(value).push(variant);
                    }
                  }
                });
              } else {
                // Manejar como objeto normal
                Object.entries(source).forEach(([key, value]: [string, any]) => {
                  // Si el valor es un objeto multiidioma, extraer el texto
                  let finalValue = value;
                  if (value && typeof value === 'object' && !Array.isArray(value)) {
                    finalValue = value.es || value.en || Object.values(value)[0];
                  }
                  
                  if (finalValue && finalValue !== '' && finalValue !== null && finalValue !== undefined && finalValue !== 'null') {
                    hasValidAttributes = true;
                    
                    if (!attributeGroups.has(key)) {
                      attributeGroups.set(key, {
                        name: key,
                        values: new Map(),
                        isColor: key.toLowerCase().includes('color') || key.toLowerCase().includes('colour') || key.toLowerCase() === 'color'
                      });
                    }
                    
                    if (!attributeGroups.get(key).values.has(finalValue)) {
                      attributeGroups.get(key).values.set(finalValue, []);
                    }
                    attributeGroups.get(key).values.get(finalValue).push(variant);
                  }
                });
              }
            }
          });
        });

        // Función para obtener nombre de atributo en español
        const getAttributeDisplayName = (key: string) => {
          const translations: { [key: string]: string } = {
            'Color': 'Color',
            'color': 'Color',
            'Colour': 'Color',
            'colour': 'Color',
            'Talle': 'Talla',
            'talle': 'Talla',
            'Size': 'Talla',
            'size': 'Talla',
            'Material': 'Material',
            'material': 'Material'
          };
          return translations[key] || key.charAt(0).toUpperCase() + key.slice(1);
        };

        // Función para obtener el valor seleccionado de un atributo
        const getSelectedAttributeValue = (attributeKey: string, attributeData: any) => {
          if (!selectedVariant) return null;
          
          const { values } = attributeData;
          for (const [value, variantList] of values.entries()) {
            if (variantList.some((variant: any) => variant.id === selectedVariant.id)) {
              return value;
            }
          }
          return null;
        };

        // Función para obtener los valores seleccionados de todos los atributos excepto el actual
        const getOtherSelectedValues = (currentAttributeKey: string) => {
          const otherValues: { [key: string]: string } = {};
          
          Array.from(attributeGroups.entries()).forEach(([key, data]) => {
            if (key !== currentAttributeKey) {
              const selectedVal = getSelectedAttributeValue(key, data);
              if (selectedVal) {
                otherValues[key] = selectedVal;
              }
            }
          });
          
          return otherValues;
        };

        // Función para encontrar la variante que coincida con una combinación específica de atributos
        const findVariantByAttributes = (targetAttributes: { [key: string]: string }) => {
          return variants.find((variant: any) => {
            // Para cada atributo objetivo, verificar si esta variante lo tiene
            return Object.entries(targetAttributes).every(([attrKey, attrValue]) => {
              const attributeData = attributeGroups.get(attrKey);
              if (!attributeData) return false;
              
              const variantsWithValue = attributeData.values.get(attrValue);
              if (!variantsWithValue) return false;
              
              return variantsWithValue.some((v: any) => v.id === variant.id);
            });
          });
        };

        if (hasValidAttributes && attributeGroups.size > 0) {
          return (
            <div className="variant-selectors">
              {Array.from(attributeGroups.entries()).map(([attributeKey, attributeData]) => {
                const { name, values, isColor } = attributeData;
                const displayName = getAttributeDisplayName(name);
                
                // Obtener el valor seleccionado para este atributo
                const selectedValue = getSelectedAttributeValue(attributeKey, attributeData);
                
                return (
                  <div key={attributeKey} className="variant-attribute">
                    <label className="variant-label">
                      {displayName}:
                      {selectedValue && (
                        <span style={{ fontWeight: 'normal', marginLeft: '6px', color: '#666' }}>
                          {selectedValue}
                        </span>
                      )}
                    </label>
                    
                    {isColor ? (
                      // Selector visual para colores
                      <div className="color-options">
                        {Array.from(values.entries()).map((entry) => {
                          const [value, variantList] = entry as [string, any];
                          // Obtener los valores de otros atributos seleccionados
                          const otherSelectedValues = getOtherSelectedValues(attributeKey);
                          
                          // Encontrar la variante que coincida con este color + otros atributos seleccionados
                          const targetVariant = findVariantByAttributes({
                            ...otherSelectedValues,
                            [attributeKey]: value
                          });
                          
                          // Si no encontramos una variante específica, usar la primera del grupo
                          const variant = targetVariant || variantList[0];
                          const variantImg = getVariantImage(variant);
                          
                          // null o undefined significa stock ilimitado en TiendaNube
                          const hasStock = variant.stock === null || variant.stock === undefined || variant.stock > 0;
                          
                          return (
                            <button
                              key={`${attributeKey}-${value}`}
                              className={`color-swatch ${selectedVariantId === variant.id ? 'active' : ''} ${!hasStock ? 'out-of-stock' : ''}`}
                              onClick={() => hasStock && setSelectedVariantId(variant.id)}
                              title={hasStock ? value : `${value} - Sin stock`}
                              disabled={!hasStock}
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
                              {!hasStock && (
                                <div className="no-stock-overlay">
                                  <span className="no-stock-line"></span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      // Selector de botones para tallas y otros
                      <div className="size-options">
                        {Array.from(values.entries())
                          .sort(([a], [b]) => {
                            // Asegurar que a y b sean strings
                            const aStr = String(a);
                            const bStr = String(b);
                            
                            // Ordenar tallas de manera lógica
                            const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
                            const indexA = sizeOrder.indexOf(aStr);
                            const indexB = sizeOrder.indexOf(bStr);
                            
                            if (indexA !== -1 && indexB !== -1) {
                              return indexA - indexB;
                            } else if (indexA !== -1) {
                              return -1;
                            } else if (indexB !== -1) {
                              return 1;
                            }
                            
                            const numA = parseInt(aStr);
                            const numB = parseInt(bStr);
                            if (!isNaN(numA) && !isNaN(numB)) {
                              return numA - numB;
                            }
                            
                            return aStr.localeCompare(bStr);
                          })
                          .map(([value, variantList]: [string, any]) => {
                            // Obtener los valores de otros atributos seleccionados
                            const otherSelectedValues = getOtherSelectedValues(attributeKey);
                            
                            // Encontrar la variante que coincida con este valor + otros atributos seleccionados
                            const targetVariant = findVariantByAttributes({
                              ...otherSelectedValues,
                              [attributeKey]: value
                            });
                            
                            // Si no encontramos una variante específica, usar la primera del grupo
                            const variant = targetVariant || variantList[0];
                            
                            // null o undefined significa stock ilimitado en TiendaNube
                            const hasStock = variant.stock === null || variant.stock === undefined || variant.stock > 0;
                            
                            return (
                              <button
                                key={`${attributeKey}-${value}`}
                                className={`size-btn ${selectedVariantId === variant.id ? 'active' : ''} ${!hasStock ? 'out-of-stock' : ''}`}
                                onClick={() => hasStock && setSelectedVariantId(variant.id)}
                                disabled={!hasStock}
                                title={!hasStock ? 'Sin stock' : ''}
                              >
                                {value}
                                {!hasStock && <span className="no-stock-indicator"> ✕</span>}
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
        }
        return null;
      })()}

      {/* BOTONES DE ACCIÓN */}
      <div className="action-buttons">
        <button 
          className="btn-buy-now"
          onClick={handleBuyNow}
          disabled={variants.length > 1 && !selectedVariantId}
        >
          Compra ahora
        </button>
        <button 
          className={`btn-add-cart ${isAdding ? 'adding' : ''}`}
          onClick={handleAddToCart}
          disabled={variants.length > 1 && !selectedVariantId}
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

        /* SELECTORES DE VARIANTES */
        .variant-selectors {
          margin: 24px 0;
        }

        .variant-attribute {
          margin-bottom: 25px;
        }

        .variant-attribute:last-child {
          margin-bottom: 0;
        }

        .variant-label {
          font-size: 12px;
          font-weight: 700;
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
        .color-swatch:hover:not(:disabled) {
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
        .color-swatch.out-of-stock {
          opacity: 0.4;
          cursor: not-allowed;
          filter: grayscale(0.8);
        }
        .color-swatch.out-of-stock:hover {
          border-color: #ddd;
          transform: none;
          box-shadow: none;
        }
        .no-stock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .no-stock-line {
          width: 100%;
          height: 2px;
          background: #e74c3c;
          transform: rotate(-45deg);
          box-shadow: 0 0 2px rgba(0,0,0,0.5);
        }

        /* Selectores de talla y otros atributos */
        .size-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
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
          color: #999;
          border-color: #ddd;
          cursor: not-allowed;
          text-decoration: line-through;
          background-color: #f5f5f5;
        }

        .size-btn.out-of-stock:hover {
          border-color: #ddd;
          transform: none;
        }
        
        .no-stock-indicator {
          margin-left: 4px;
          font-size: 10px;
          color: #e74c3c;
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
