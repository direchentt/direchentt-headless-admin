'use client';

import Link from 'next/link';

interface ProductCardProps {
  product: any;
  storeId: string;
}

export default function ProductCard({ product, storeId }: ProductCardProps) {
  const firstVariant = product.variants?.[0];
  const images = product.images || [];
  // Extraer nombre de forma segura
  const productName = typeof product.name === 'object' 
    ? (product.name.es || product.name.en || 'Producto')
    : product.name || 'Producto';

  return (
    <Link href={`/product/${product.id}?shop=${storeId}`} className="product-card-link">
      <article className="product-card">
        {/* IMAGEN */}
        <div className="product-image-container" style={{
          width: '100%',
          paddingBottom: '133%',
          position: 'relative',
          background: '#f0f0f0'
        }}>
          {images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={images[0].src} 
              alt={productName} 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
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
        </div>

        {/* INFO */}
        <div className="product-info" style={{ padding: '10px 0' }}>
          <h3 style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            margin: 0,
            marginBottom: '5px'
          }}>{productName.toUpperCase()}</h3>
          <p style={{
            fontSize: '11px',
            color: '#666',
            margin: 0
          }}>$ {firstVariant?.price || 0}</p>
        </div>
      </article>
    </Link>
  );
}
