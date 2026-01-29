'use client';

import { useState } from 'react';
import ImageCarousel from './ImageCarousel';
import VariantSelector from './VariantSelector';

interface ProductDetailClientProps {
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

export default function ProductDetailClient({
  product,
  storeId,
  domain,
}: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();

  return (
    <>
      <div className="pdp-container">
        {/* GALERÍA - IMAGE CAROUSEL */}
        <div className="pdp-gallery-section">
          <ImageCarousel
            images={product.images || []}
            productName={safeGetName(product.name)}
            variantName={selectedVariant}
          />
        </div>

        {/* INFORMACIÓN Y COMPRA */}
        <div className="pdp-info-section">
          <VariantSelector
            product={product}
            storeId={storeId}
            domain={domain}
            onVariantSelect={setSelectedVariant}
          />

          {/* INFORMACIÓN ADICIONAL */}
          <div className="product-extra-info">
            {product.stock && (
              <div className="info-row">
                <span className="info-label">Disponibilidad:</span>
                <span className="info-value">{product.stock} unidades</span>
              </div>
            )}
            {product.sku && (
              <div className="info-row">
                <span className="info-label">SKU:</span>
                <span className="info-value">{product.sku}</span>
              </div>
            )}
            {product.description && (
              <div className="product-description">
                <h3>Descripción</h3>
                <div
                  dangerouslySetInnerHTML={{
                    __html: product.description,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .pdp-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0;
        }
        @media (min-width: 1024px) {
          .pdp-container {
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            padding: 60px;
          }
        }
        
        .pdp-gallery-section {
          display: flex;
          flex-direction: column;
          width: 100%;
          padding: 0;
        }
        @media (min-width: 1024px) {
          .pdp-gallery-section {
            position: sticky;
            top: 60px;
          }
        }
        
        .pdp-info-section {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        @media (min-width: 1024px) {
          .pdp-info-section {
            padding: 0;
          }
        }

        .product-extra-info {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-top: 0;
          border-top: none;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          padding: 8px 0;
        }
        
        .info-label {
          font-weight: 600;
          color: #000;
        }
        
        .info-value {
          color: #666;
        }

        .product-description {
          margin-top: 30px;
          padding-top: 0;
          border-top: none;
        }

        .product-description h3 {
          font-size: 13px;
          font-weight: 700;
          margin: 0 0 15px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .product-description p {
          font-size: 14px;
          line-height: 1.6;
          color: #666;
          margin: 0 0 10px 0;
        }
      `}} />
    </>
  );
}
