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
      `}} />
    </>
  );
}
