'use client';
import { useState } from 'react';

export default function VariantSelector({ product, storeDomain }: { product: any, storeDomain: string }) {
  if (!product || !product.variants) return null;
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = () => {
    setLoading(true);
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `https://${storeDomain}/cart`;
    [{ name: 'add_to_cart', value: 'true' }, { name: 'variant_id', value: selectedVariant.id }, { name: 'quantity', value: '1' }].forEach(f => {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = f.name; input.value = f.value.toString();
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="selector-scuffers">
      <h1 className="p-title">{product.name.es.toUpperCase()}</h1>
      <p className="p-price">$ {selectedVariant.price}</p>
      
      <div className="v-box">
        <p className="v-label">SELECCIONAR VARIANTE</p>
        <div className="v-grid">
          {product.variants.map((v: any) => {
            const img = product.images.find((i: any) => i.id === v.image_id)?.src || product.images[0].src;
            return (
              <button key={v.id} className={`v-btn ${selectedVariant.id === v.id ? 'active' : ''}`} onClick={() => setSelectedVariant(v)}>
                <img src={img} alt="variant" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="atc-area">
        <button onClick={handleAddToCart} className="btn-buy" disabled={loading}>
          {loading ? '...' : 'AÑADIR A LA CESTA'}
        </button>
      </div>

      <style jsx>{`
        .p-title { font-size: 24px; font-weight: 800; letter-spacing: 2px; }
        .p-price { font-size: 18px; margin: 15px 0 45px; font-weight: 300; }
        .v-label { font-size: 9px; font-weight: 800; letter-spacing: 2px; color: #999; margin-bottom: 20px; }
        .v-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(65px, 1fr)); gap: 10px; margin-bottom: 50px; }
        .v-btn { border: 1px solid #eee; background: #fff; padding: 0; cursor: pointer; aspect-ratio: 3/4; overflow: hidden; }
        .v-btn.active { border: 2px solid #000; }
        .v-btn img { width: 100%; height: 100%; object-fit: cover; }
        .btn-buy { width: 100%; background: #000; color: #fff; border: none; padding: 22px; font-weight: 800; letter-spacing: 3px; font-size: 11px; cursor: pointer; }
        @media (max-width: 1023px) {
          .atc-area { position: fixed; bottom: 0; left: 0; width: 100%; padding: 20px; background: #fff; border-top: 1px solid #000; z-index: 1001; }
        }
      `}</style>
    </div>
  );
}