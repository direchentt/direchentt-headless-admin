'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';

interface QuickShopProps {
  product: any;
  storeId: string;
  domain?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickShop({ product, storeId, domain, isOpen, onClose }: QuickShopProps) {
  const { addToCart } = useStore();
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // Obtener datos expandidos del producto cuando se abre el modal
  useEffect(() => {
    if (isOpen && product?.id && storeId) {
      setIsLoadingProduct(true);
      
      fetch(`/api/products/${product.id}?shop=${storeId}&expand=true`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.product) {
            console.log('📦 Producto expandido obtenido:', data.product);
            setExpandedProduct(data.product);
          } else {
            setExpandedProduct(product); // Fallback al producto original
          }
        })
        .catch(error => {
          console.error('Error obteniendo producto expandido:', error);
          setExpandedProduct(product); // Fallback al producto original
        })
        .finally(() => {
          setIsLoadingProduct(false);
        });
    }
  }, [isOpen, product?.id, storeId, product]);

  // Usar producto expandido si está disponible, sino el original
  const currentProduct = expandedProduct || product;
  const variants = currentProduct?.variants || [];
  const images = currentProduct?.images || [];
  
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

    // Agregar al carrito local
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
    }, 800);
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

            {/* Selector de variantes basado en datos reales de TiendaNube */}
            {variants.length > 1 && (() => {
              // Debug completo de las variantes que llegan
              console.log('=== QUICKSHOP DEBUGGING ===');
              console.log('Producto actual:', currentProduct);
              console.log('Es producto expandido:', !!expandedProduct);
              console.log('Loading:', isLoadingProduct);
              console.log('Total variants:', variants.length);
              
              variants.forEach((variant: any, index: number) => {
                console.log(`--- Variant ${index + 1} ---`, {
                  id: variant.id,
                  name: variant.name,
                  sku: variant.sku,
                  position: variant.position,
                  image_id: variant.image_id,
                  attributes: variant.attributes,
                  // Explorar todas las propiedades disponibles
                  allProperties: Object.keys(variant)
                });
              });

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
                
                possibleSources.forEach((source, sourceIndex) => {
                  if (source && typeof source === 'object' && Object.keys(source).length > 0) {
                    console.log(`Atributos encontrados en source ${sourceIndex} para variant ${variant.id}:`, source);
                    
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

              console.log('Grupos de atributos encontrados:', Array.from(attributeGroups.entries()));
              console.log('Tiene atributos válidos:', hasValidAttributes);

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
                console.log('✅ Renderizando selectores estructurados');
                return (
                  <div className="quickshop-selectors">
                    {Array.from(attributeGroups.entries()).map(([attributeKey, attributeData]) => {
                      const { name, values, isColor } = attributeData;
                      const displayName = getAttributeDisplayName(name);
                      
                      console.log(`Renderizando atributo: ${displayName}`, { values: Array.from(values.keys()), isColor });
                      
                      // Obtener el valor seleccionado para este atributo
                      const selectedValue = getSelectedAttributeValue(attributeKey, attributeData);
                      
                      return (
                        <div key={attributeKey} className="attribute-selector">
                          <label className="quickshop-label">
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
                              {Array.from(values.entries()).map(([value, variantList]: [string, any]) => {
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
              } else {
                // Fallback: dropdown con nombres mejorados
                console.log('⚠️ Sin atributos estructurados, usando fallback');
                
                return (
                  <div className="quickshop-selectors">
                    <div className="attribute-selector">
                      <label className="quickshop-label">
                        {isLoadingProduct ? 'Cargando...' : 'Variantes:'}
                      </label>
                      <div className="variant-dropdown">
                        <select 
                          value={selectedVariantId || ''} 
                          onChange={(e) => setSelectedVariantId(Number(e.target.value))}
                          className="variant-select"
                          disabled={isLoadingProduct}
                        >
                          {variants.map((variant: any, index: number) => {
                            let displayName = 'Sin información';
                            
                            // Estrategias mejoradas para crear nombres
                            if (variant.name && !variant.name.includes('Opción') && variant.name.trim() !== '') {
                              displayName = variant.name;
                            } else if (variant.sku) {
                              const skuParts = variant.sku.split('-');
                              const lastPart = skuParts[skuParts.length - 1];
                              
                              if (/^(XS|S|M|L|XL|XXL|XXXL)$/i.test(lastPart)) {
                                displayName = `Talla ${lastPart.toUpperCase()}`;
                              } else if (/^\d{1,2}$/.test(lastPart)) {
                                displayName = `Talla ${lastPart}`;
                              } else if (lastPart && lastPart.length <= 4) {
                                displayName = `Variante ${lastPart}`;
                              } else {
                                displayName = `Opción ${index + 1}`;
                              }
                            } else {
                              displayName = `Opción ${index + 1}`;
                            }
                            
                            return (
                              <option key={variant.id} value={variant.id}>
                                {displayName}
                              </option>
                            );
                          })}
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
