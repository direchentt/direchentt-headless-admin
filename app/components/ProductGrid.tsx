import ProductCard from './ProductCard';

interface ProductGridProps {
  products: any[];
  storeId: string;
}

export default function ProductGrid({ products, storeId }: ProductGridProps) {
  return (
    <>
      <section className="products-section">
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} storeId={storeId} />
          ))}
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .products-section {
          padding: 40px 0;
          max-width: 1400px;
          margin: 0 auto;
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        @media (min-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
          }
        }
        @media (min-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
        }
        .product-card-link {
          text-decoration: none;
          color: inherit;
        }
        .product-card {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .product-image-container {
          aspect-ratio: 3/4;
          overflow: hidden;
          background: #f5f5f5;
          margin-bottom: 15px;
        }
        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }
        .product-card:hover .product-image {
          transform: scale(1.05);
        }
        .product-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eee;
          color: #999;
          font-size: 12px;
        }
        .product-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .product-title {
          font-size: 11px;
          font-weight: 700;
          margin: 0 0 8px 0;
          line-height: 1.3;
          letter-spacing: 0.3px;
        }
        .product-price {
          font-size: 10px;
          color: #999;
          margin: 0;
          font-weight: 500;
        }
      `}} />
    </>
  );
}
