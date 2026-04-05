'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAddToCart } from '../hooks/useAddToCart';
import { useWishlist } from '../hooks/useWishlist';
import { formatPrice, getVariantDisplayPrices } from '@/lib/product-utils';
import ProductCompleteLookSidebar from './ProductCompleteLookSidebar';
import ExpressCheckoutModal from './ExpressCheckoutModal';
import StoreImage from './StoreImage';
import { queueStorefrontSignals } from '@/lib/storefront-signals-client';

interface ProductInfoProps {
  product: any;
  storeId: string;
  domain: string;
  /** Relacionados para “Completa el look” en columna desktop (rejilla 2×2) */
  completeLookProducts?: any[];
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

/** Primeras líneas de la descripción como texto (info de modelo, etc.) */
function descriptionLeadPlain(product: any): string | null {
  const raw =
    typeof product?.description === 'object' && product.description !== null
      ? String(product.description.es || product.description.en || '')
      : String(product?.description || '');
  if (!raw) return null;
  const plain = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  if (!plain) return null;
  const lines = plain.split('\n').map((l) => l.trim()).filter(Boolean);
  const shortLines = lines.slice(0, 2).map((l) => (l.length > 140 ? `${l.slice(0, 137)}…` : l));
  const head = shortLines.join('\n');
  if (head.length > 220) return `${head.slice(0, 217)}…`;
  return head;
}

export default function ProductInfo({
  product,
  storeId,
  domain,
  completeLookProducts = [],
}: ProductInfoProps) {
  const { addToCart: addToLocalCart } = useStore();
  const { addToCart: redirectToCheckout, isLoading: checkoutRedirectLoading } = useAddToCart(storeId);
  const {
    isWishlisted,
    toggle: toggleWishlist,
  } = useWishlist(storeId);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const variants = product.variants || [];
  const images = product.images || [];
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [expressCheckoutOpen, setExpressCheckoutOpen] = useState(false);
  /** Móvil: hasta que el usuario toque una variante, solo se muestra el CTA crema tipo EME */
  const [pdpVariantAck, setPdpVariantAck] = useState(false);

  useEffect(() => {
    setPdpVariantAck(false);
  }, [product.id]);

  // Seleccionar primera variante automáticamente
  useEffect(() => {
    if (variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(variants[0].id);
    }
  }, [variants, selectedVariantId]);

  useEffect(() => {
    if (!storeId || product?.id == null) return;
    const pid =
      typeof product.id === 'number' ? product.id : parseInt(String(product.id), 10);
    if (!Number.isFinite(pid) || pid <= 0) return;
    const cat0 = product.categories?.[0];
    const categoryId = typeof cat0?.id === 'number' ? cat0.id : undefined;
    const t = setTimeout(() => {
      queueStorefrontSignals(storeId, [
        {
          type: 'product_view',
          payload: {
            productId: pid,
            ...(categoryId != null ? { categoryId } : {}),
          },
        },
      ]);
    }, 1200);
    return () => clearTimeout(t);
  }, [product?.id, storeId]);
  
  // Encontrar variante seleccionada
  const selectedVariant = variants.find((v: any) => v.id === selectedVariantId) || variants[0];

  const { list, current, hasPromo } = getVariantDisplayPrices(selectedVariant || {});
  const hasDiscount = hasPromo;

  // Obtener imagen de la variante
  const getVariantImage = (variant: any) => {
    if (!variant) return images[0]?.src || '';
    const variantImage = images.find((img: any) => img.id === variant.image_id);
    return variantImage?.src || images[0]?.src || '';
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    
    setIsAdding(true);

    // Crear descripción de variante más descriptiva para el carrito local
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
    
    const cat0 = product.categories?.[0];
    const categoryId = typeof cat0?.id === 'number' ? cat0.id : undefined;

    addToLocalCart(
      {
        productId: product.id,
        variantId: selectedVariant.id,
        name: safeGetName(product.name),
        variant: variantDescription,
        price: current,
        quantity: 1,
        image: getVariantImage(selectedVariant),
      },
      { storeId, ...(categoryId != null ? { categoryId } : {}) }
    );

    setTimeout(() => setIsAdding(false), 500);
  };

  const handleSelectSizeCta = () => {
    const el = document.querySelector('.pdp-size-options');
    if (el) {
      (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setPdpVariantAck(true);
    }
  };

  const leadCopy = descriptionLeadPlain(product);
  const modelNote = String(product?.modelWearingNote || '').trim();
  const showLeadCopy = Boolean(leadCopy && (!modelNote || leadCopy !== modelNote));
  const mobileGateCta = variants.length > 1 && !pdpVariantAck;

  const inWishlist = isWishlisted(Number(product.id));

  const handleWishlistClick = async () => {
    setWishlistBusy(true);
    try {
      await toggleWishlist(Number(product.id));
    } finally {
      setWishlistBusy(false);
    }
  };

  return (
    <div className="product-info pdp-eme">
      <div className="product-header">
        <div className="product-title-row">
          <h1 className="product-title">{safeGetName(product.name)}</h1>
          <button
            type="button"
            className={`pdp-wishlist${inWishlist ? ' pdp-wishlist--active' : ''}`}
            aria-label={
              inWishlist ? 'Quitar de lista de deseos' : 'Guardar en lista de deseos'
            }
            title={inWishlist ? 'En favoritos' : 'Guardar'}
            disabled={wishlistBusy}
            onClick={() => void handleWishlistClick()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" aria-hidden>
              <path d="M6 4h12a1 1 0 011 1v14l-7-4-7 4V5a1 1 0 011-1z" />
            </svg>
          </button>
        </div>
        <div className="product-price-block">
          {hasDiscount && <span className="product-compare-price">{formatPrice(list)}</span>}
          <span className="product-price">{formatPrice(current)}</span>
        </div>
        {modelNote && <p className="product-model-note">{modelNote}</p>}
        {showLeadCopy && leadCopy && <p className="product-lead">{leadCopy}</p>}
      </div>

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
                      const key = index === 0 ? 'Color' : (index === 1 ? 'Talla' : `Atributo ${index + 1}`);
                      
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
            'Protección': 'Talla',
            'Proteccion': 'Talla',
            'PROTECCIÓN': 'Talla',
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
            <div className="variant-selectors" id="pdp-variant-anchor">
              {Array.from(attributeGroups.entries()).map(([attributeKey, attributeData]) => {
                const { name, values, isColor } = attributeData;
                const displayName = getAttributeDisplayName(name);
                
                // Obtener el valor seleccionado para este atributo
                const selectedValue = getSelectedAttributeValue(attributeKey, attributeData);
                
                return (
                  <div key={attributeKey} className="variant-attribute">
                    <label className="variant-label">
                      <span className="variant-label-key">{displayName}</span>
                      {selectedValue && (
                        <span className="variant-label-val">{String(selectedValue)}</span>
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
                              onClick={() => {
                                if (!hasStock) return;
                                setPdpVariantAck(true);
                                setSelectedVariantId(variant.id);
                              }}
                              title={hasStock ? value : `${value} - Sin stock`}
                              disabled={!hasStock}
                            >
                              {variantImg ? (
                                <StoreImage
                                  src={variantImg}
                                  alt={value}
                                  width={52}
                                  height={68}
                                  sizes="52px"
                                  style={{ objectFit: 'cover' }}
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
                      <div className={`size-options ${!isColor ? 'pdp-size-options' : ''}`}>
                        {Array.from(values.entries())
                          .sort((entryA, entryB) => {
                            const [a] = entryA as [any, any];
                            const [b] = entryB as [any, any];
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
                          .map((entry) => {
                            const [value, variantList] = entry as [string, any];
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
                                onClick={() => {
                                  if (!hasStock) return;
                                  setPdpVariantAck(true);
                                  setSelectedVariantId(variant.id);
                                }}
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

      <div className={`pdp-cta-wrap ${mobileGateCta ? 'gate-active' : ''}`}>
        <button
          type="button"
          className="btn-eme-select"
          onClick={handleSelectSizeCta}
        >
          Seleccionar una talla
        </button>
        <div className="action-buttons">
          <button
            type="button"
            className={`btn-atc ${isAdding ? 'adding' : ''}`}
            onClick={handleAddToCart}
            disabled={(variants.length > 1 && !selectedVariantId) || !selectedVariant}
          >
            {isAdding ? '✓ Agregado' : 'Añadir al carrito'}
          </button>
          <button
            type="button"
            className="btn-express"
            onClick={() => {
              const pid =
                typeof product.id === 'number'
                  ? product.id
                  : parseInt(String(product.id), 10);
              if (Number.isFinite(pid) && pid > 0) {
                const cat0 = product.categories?.[0];
                const categoryId = typeof cat0?.id === 'number' ? cat0.id : undefined;
                queueStorefrontSignals(storeId, [
                  {
                    type: 'checkout_start',
                    payload: {
                      productId: pid,
                      source: 'pdp_express',
                      ...(categoryId != null ? { categoryId } : {}),
                    },
                  },
                ]);
              }
              setExpressCheckoutOpen(true);
            }}
            disabled={(variants.length > 1 && !selectedVariantId) || !selectedVariant}
          >
            Pago exprés
          </button>
        </div>
      </div>

      {product.description && (
        <details className="product-accordion">
          <summary>Detalles del producto</summary>
          <div
            className="accordion-content"
            dangerouslySetInnerHTML={{
              __html:
                typeof product.description === 'object'
                  ? product.description.es || product.description.en || ''
                  : product.description,
            }}
          />
        </details>
      )}

      <details className="product-accordion">
        <summary>Guía de cuidado de ropa</summary>
        <div className="accordion-content">
          <p>
            Lavar según indicaciones de la etiqueta. No usar lejía en prendas con estampado o
            delicadas.
          </p>
          <p>Planchar a temperatura media si la composición lo permite.</p>
        </div>
      </details>

      <details className="product-accordion">
        <summary>Envíos y devoluciones</summary>
        <div className="accordion-content">
          <p>Envíos a todo el país. El costo se calcula en el checkout.</p>
          <p>Tiempo estimado de entrega: 3 a 7 días hábiles.</p>
          <p>Para cambios y devoluciones, consultá las políticas de la tienda.</p>
        </div>
      </details>

      {selectedVariant ? (
        <ExpressCheckoutModal
          open={expressCheckoutOpen}
          onClose={() => setExpressCheckoutOpen(false)}
          storeId={storeId}
          summary={`${safeGetName(product.name)} × 1 — ${formatPrice(getVariantDisplayPrices(selectedVariant).current)}`}
          items={[
            {
              variantId: selectedVariant.id,
              name: safeGetName(product.name),
              price: getVariantDisplayPrices(selectedVariant).current,
              quantity: 1,
            },
          ]}
        />
      ) : null}

      <ProductCompleteLookSidebar products={completeLookProducts} storeId={storeId} />

      <style dangerouslySetInnerHTML={{ __html: `
        .product-info.pdp-eme {
          padding: 22px 18px 28px;
          display: flex;
          flex-direction: column;
          gap: 0;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          background: #fff;
          border-radius: 14px 14px 0 0;
          margin: -8px 0 0;
          border: 1px solid #e6e6e6;
          border-bottom: none;
          border-left: none;
          border-right: none;
          box-shadow: 0 -2px 16px rgba(0,0,0,0.04);
        }
        @media (min-width: 1024px) {
          .product-info.pdp-eme {
            margin: 0;
            border-radius: 0;
            border: none;
            box-shadow: none;
            padding: 32px 28px 48px;
            padding-bottom: 48px;
            position: sticky;
            top: var(--header-sticky-offset, 60px);
            align-self: flex-start;
            width: 100%;
            max-height: calc(100vh - var(--header-sticky-offset, 60px));
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
        }

        .product-header {
          margin-bottom: 18px;
        }

        .product-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }

        .product-title {
          flex: 1;
          font-size: 15px;
          font-weight: 600;
          margin: 0;
          line-height: 1.3;
          letter-spacing: -0.01em;
          color: #0a0a0a;
        }
        @media (min-width: 1024px) {
          .product-title {
            font-size: 16px;
          }
        }

        .pdp-wishlist {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          margin: -6px -6px 0 0;
          padding: 0;
          border: none;
          background: transparent;
          color: #111;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.85;
        }
        .pdp-wishlist:hover {
          opacity: 1;
        }
        .pdp-wishlist:disabled {
          opacity: 0.45;
          cursor: wait;
        }
        .pdp-wishlist--active {
          color: #b00000;
          opacity: 1;
        }

        .product-price-block {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .product-price {
          font-size: 15px;
          font-weight: 500;
          color: #111;
        }

        .product-compare-price {
          font-size: 14px;
          color: #8a8a8a;
          text-decoration: line-through;
          font-weight: 400;
        }

        .product-model-note {
          margin: 0 0 10px;
          font-size: 12px;
          line-height: 1.55;
          color: #333;
          white-space: pre-line;
        }
        @media (max-width: 1023px) {
          .product-model-note {
            background: #ececec;
            border-radius: 8px;
            padding: 12px 14px;
          }
        }

        .product-lead {
          margin: 0;
          font-size: 12px;
          line-height: 1.55;
          color: #444;
          white-space: pre-line;
        }
        @media (max-width: 1023px) {
          .product-lead {
            background: #ececec;
            border-radius: 8px;
            padding: 12px 14px;
            margin-top: 2px;
          }
        }

        /* Acordeones estilo vitrina */
        .product-accordion {
          border-bottom: 1px solid #e8e8e8;
        }

        .product-accordion summary {
          list-style: none;
          padding: 18px 0;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #111;
        }

        .product-accordion summary::-webkit-details-marker {
          display: none;
        }

        .product-accordion summary::after {
          content: '+';
          font-size: 18px;
          font-weight: 300;
          color: #000;
        }

        .product-accordion[open] summary::after {
          content: '−';
        }

        .accordion-content {
          padding: 0 0 18px 0;
          font-size: 12px;
          line-height: 1.65;
          color: #555;
        }

        .accordion-content p {
          margin: 0 0 10px 0;
        }

        .accordion-content p:last-child {
          margin-bottom: 0;
        }

        .variant-selectors {
          margin: 8px 0 22px;
        }

        .variant-attribute {
          margin-bottom: 25px;
        }

        .variant-attribute:last-child {
          margin-bottom: 0;
        }

        .variant-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 10px;
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 6px 8px;
          color: #111;
        }
        .variant-label-val {
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: none;
          color: #6b6b6b;
          font-size: 11px;
        }

        .color-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .color-swatch {
          width: 52px;
          height: 68px;
          border: 1px solid #d4d4d4;
          background: #fff;
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          padding: 0;
          overflow: hidden;
          border-radius: 0;
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
          border-color: #888;
        }
        .color-swatch.active {
          border-color: #000;
          border-width: 3px;
          box-shadow: none;
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
          min-width: 44px;
          height: 44px;
          padding: 0 14px;
          border: 1px solid #ccc;
          background: #fff;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
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

        .pdp-cta-wrap {
          margin: 4px 0 24px;
        }

        .btn-eme-select {
          display: none;
          width: 100%;
          padding: 16px 18px;
          margin: 0;
          background: #ebe6df;
          color: #111;
          border: 1px solid #ddd8d0;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .btn-eme-select:hover {
          background: #e4dfd7;
        }
        @media (max-width: 1023px) {
          .pdp-cta-wrap.gate-active .btn-eme-select {
            display: block;
          }
          .pdp-cta-wrap.gate-active .action-buttons {
            display: none !important;
          }
          .pdp-cta-wrap:not(.gate-active) .btn-eme-select {
            display: none !important;
          }
        }
        @media (min-width: 1024px) {
          .btn-eme-select {
            display: none !important;
          }
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .btn-atc {
          width: 100%;
          padding: 15px 18px;
          background: #000;
          color: #fff;
          border: 1px solid #000;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .btn-atc:hover:not(:disabled) {
          background: #222;
        }

        .btn-atc:disabled {
          background: #b0b0b0;
          border-color: #b0b0b0;
          cursor: not-allowed;
        }

        .btn-atc.adding {
          background: #1a7f37;
          border-color: #1a7f37;
        }

        .btn-express {
          width: 100%;
          padding: 14px 18px;
          background: #fff;
          color: #000;
          border: 1px solid #000;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-express:hover:not(:disabled) {
          background: #f7f7f7;
        }

        .btn-express:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}} />
    </div>
  );
}
