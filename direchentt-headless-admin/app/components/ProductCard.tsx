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
        <div className="product-image-container">
          {images.length > 0 ? (
            <img src={images[0].src} alt={productName} className="product-image" loading="lazy" />
          ) : (
            <div className="product-image-placeholder">Sin imagen</div>
          )}
        </div>

        {/* INFO */}
        <div className="product-info">
          <h3 className="product-title">{productName.toUpperCase()}</h3>
          <p className="product-price">$ {firstVariant?.price || 0}</p>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .product-card {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .product-image-container {
            aspect-ratio: 1;
            overflow: hidden;
            background: #f8f8f8;
          }
          .product-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s ease;
          }
          .product-card:hover .product-image {
            transform: scale(1.02);
          }
          .product-info {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          .product-title {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            color: #000;
            margin: 0;
            line-height: 1.4;
          }
          .product-price {
            font-size: 10px;
            font-weight: 400;
            color: #666;
            margin: 0;
          }
        `}} />
      </article>
    </Link>
  );
}
