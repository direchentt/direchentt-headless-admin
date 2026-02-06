'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchModalProps {
  products: any[];
  storeId: string;
}

export default function SearchModal({ products, storeId }: SearchModalProps) {
  const { searchOpen, setSearchOpen } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = 'hidden';
      // Auto focus logic could go here
    } else {
      document.body.style.overflow = '';
      setSearchTerm('');
    }
  }, [searchOpen]);

  // Derivar categorías únicas de los productos reales
  const suggestions = useMemo(() => {
    const uniqueCategories = new Set<string>();
    products.forEach(p => {
      if (p.categories) {
        p.categories.forEach((c: any) => {
          const name = typeof c.name === 'object' ? (c.name.es || c.name.en) : c.name;
          if (name) uniqueCategories.add(name);
        });
      }
    });
    return Array.from(uniqueCategories).slice(0, 5); // Top 5
  }, [products]);

  // Filtrar productos en tiempo real
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const lowerTerm = searchTerm.toLowerCase();
    return products.filter(p => {
      const name = typeof p.name === 'object' ? (p.name.es || p.name.en) : p.name;
      return name?.toLowerCase().includes(lowerTerm);
    }).slice(0, 4); // Max 4 resultados directos
  }, [searchTerm, products]);

  // Filtrar categorías sugeridas en tiempo real
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lowerTerm = searchTerm.toLowerCase();
    return suggestions.filter(cat => cat.toLowerCase().includes(lowerTerm)).slice(0, 3);
  }, [searchTerm, suggestions]);


  if (!searchOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchOpen(false);
      // Redirigir a search results (asumiendo que existe o usando home con query)
      // Como no tenemos pagina de busqueda especifica, filtramos en home
      // Pero idealmente seria /search?q=...
      // Por ahora cerramos
      console.log('Searching for:', searchTerm);
    }
  };

  const close = () => setSearchOpen(false);

  return (
    <div className="search-modal-overlay">
      <div className="search-modal">
        <div className="search-header">
          <form onSubmit={handleSearch} className="search-form">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="search-icon">
              <circle cx="9" cy="9" r="7" stroke="#000" strokeWidth="1.5" />
              <path d="M15 15l3 3" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              autoFocus
            />
            {searchTerm && (
              <button type="button" className="clear-btn" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </form>
          <button className="close-btn" onClick={close}>CANCELAR</button>
        </div>

        <div className="search-content">
          {/* Si no hay busqueda, mostrar sugerencias populares (categorías) */}
          {!searchTerm && (
            <div className="suggestions-section">
              <h3>SUGERENCIAS POPULARES</h3>
              <div className="tags-cloud">
                {suggestions.map((cat, idx) => (
                  <Link
                    key={idx}
                    href={`/?category=${encodeURIComponent(cat)}&shop=${storeId}`} // Simple link a home filtrada o categoria
                    onClick={close}
                    className="search-tag"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Resultados en tiempo real */}
          {searchTerm && (
            <div className="results-section">
              {filteredCategories.length > 0 && (
                <div className="category-results">
                  <h3>CATEGORÍAS</h3>
                  {filteredCategories.map((cat, i) => (
                    <Link
                      key={i}
                      href={`/?category=${encodeURIComponent(cat)}&shop=${storeId}`}
                      onClick={close}
                      className="result-link"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              )}

              {filteredProducts.length > 0 ? (
                <div className="product-results">
                  <h3>PRODUCTOS - ({filteredProducts.length})</h3>
                  <div className="search-products-grid">
                    {filteredProducts.map(prod => (
                      <Link
                        key={prod.id}
                        href={`/product/${prod.id}?shop=${storeId}`}
                        onClick={close}
                        className="search-product-item"
                      >
                        <div className="sp-image">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={prod.images[0]?.src} alt="" />
                        </div>
                        <div className="sp-info">
                          <h4>{typeof prod.name === 'object' ? (prod.name.es || prod.name.en) : prod.name}</h4>
                          <p>$ {prod.variants[0]?.price}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-results">
                  <p>No encontramos productos para &quot;{searchTerm}&quot;</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .search-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(255,255,255,0.98);
          z-index: 3000;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .search-modal {
            max-width: 800px;
            margin: 0 auto;
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .search-header {
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            border-bottom: 1px solid #eee;
        }

        .search-form {
            flex: 1;
            display: flex;
            align-items: center;
            background: #f5f5f5;
            padding: 0 15px;
            height: 50px;
            border-radius: 4px;
        }

        .search-input {
            flex: 1;
            border: none;
            background: none;
            height: 100%;
            font-size: 16px;
            margin: 0 10px;
            outline: none;
        }

        .clear-btn {
            background: none;
            border: none;
            font-size: 14px;
            cursor: pointer;
            color: #999;
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 1px;
            cursor: pointer;
        }

        .search-content {
            flex: 1;
            padding: 30px 20px;
            overflow-y: auto;
        }

        h3 {
            font-size: 11px;
            font-weight: 700;
            color: #999;
            letter-spacing: 1px;
            margin-bottom: 20px;
        }

        .tags-cloud {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .search-tag {
            padding: 8px 15px;
            background: #fff;
            border: 1px solid #eee;
            border-radius: 20px;
            text-decoration: none;
            color: #000;
            font-size: 13px;
            transition: all 0.2s;
        }
        .search-tag:hover {
            border-color: #000;
            background: #000;
            color: #fff;
        }

        .result-link {
            display: block;
            padding: 10px 0;
            text-decoration: none;
            color: #000;
            font-size: 14px;
            border-bottom: 1px solid #f9f9f9;
        }
        .result-link:hover {
            color: #666;
        }

        .search-products-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        @media (min-width: 640px) {
            .search-products-grid {
                grid-template-columns: repeat(4, 1fr);
            }
        }

        .search-product-item {
            text-decoration: none;
            color: inherit;
        }

        .sp-image {
            width: 100%;
            aspect-ratio: 3/4;
            background: #f0f0f0;
            margin-bottom: 10px;
            overflow: hidden;
        }
        .sp-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .sp-info h4 {
            font-size: 12px;
            font-weight: 600;
            margin: 0 0 5px;
            text-transform: uppercase;
        }
        .sp-info p {
            font-size: 12px;
            color: #666;
            margin: 0;
        }
        
        .no-results {
            text-align: center;
            color: #666;
            margin-top: 50px;
        }
      `}</style>
    </div>
  );
}
