'use client';

import { useStore } from '../context/StoreContext';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface SearchModalProps {
  products: any[];
  storeId: string;
}

export default function SearchModal({ products, storeId }: SearchModalProps) {
  const { isSearchOpen, setSearchOpen, searchQuery, setSearchQuery, searchResults, performSearch } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState('');

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(localQuery, products);
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, products]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setSearchOpen]);

  if (!isSearchOpen) return null;

  const getProductName = (product: any) => {
    return typeof product.name === 'object' 
      ? (product.name.es || product.name.en || 'Producto')
      : (product.name || 'Producto');
  };

  const getProductImage = (product: any) => {
    return product.images?.[0]?.src || '';
  };

  return (
    <>
      <div className="search-modal-overlay" onClick={() => setSearchOpen(false)} />
      <div className="search-modal">
        <div className="search-modal-header">
          <div className="search-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar productos..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="search-input"
            />
            {localQuery && (
              <button className="search-clear" onClick={() => setLocalQuery('')}>✕</button>
            )}
          </div>
          <button className="search-close" onClick={() => setSearchOpen(false)}>
            CERRAR
          </button>
        </div>

        <div className="search-results">
          {localQuery && searchResults.length === 0 && (
            <p className="search-no-results">No se encontraron resultados para "{localQuery}"</p>
          )}
          
          {searchResults.map((product) => (
            <Link 
              key={product.id} 
              href={`/product/${product.id}?shop=${storeId}`}
              className="search-result-item"
              onClick={() => setSearchOpen(false)}
            >
              <div className="search-result-image">
                {getProductImage(product) ? (
                  <img src={getProductImage(product)} alt={getProductName(product)} />
                ) : (
                  <div className="search-result-placeholder">Sin imagen</div>
                )}
              </div>
              <div className="search-result-info">
                <h4>{getProductName(product).toUpperCase()}</h4>
                <p>$ {product.variants?.[0]?.price || 0}</p>
              </div>
            </Link>
          ))}

          {!localQuery && (
            <div className="search-suggestions">
              <p className="search-suggestions-title">BÚSQUEDAS POPULARES</p>
              <div className="search-suggestions-list">
                {['Remeras', 'Pantalones', 'Buzos', 'Accesorios'].map(term => (
                  <button 
                    key={term} 
                    className="search-suggestion"
                    onClick={() => setLocalQuery(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .search-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 9998;
          animation: fadeIn 0.2s ease;
        }
        .search-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #fff;
          z-index: 9999;
          max-height: 80vh;
          overflow-y: auto;
          animation: slideDown 0.3s ease;
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .search-modal-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          border-bottom: 1px solid #f0f0f0;
        }
        .search-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f5f5f5;
          padding: 12px 16px;
          border-radius: 0;
        }
        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 16px;
          outline: none;
          font-family: inherit;
        }
        .search-clear {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #999;
        }
        .search-close {
          background: none;
          border: none;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          cursor: pointer;
          padding: 10px;
        }
        .search-results {
          padding: 20px;
          min-height: 200px;
        }
        .search-no-results {
          text-align: center;
          color: #666;
          font-size: 14px;
          padding: 40px 0;
        }
        .search-result-item {
          display: flex;
          gap: 15px;
          padding: 15px 0;
          border-bottom: 1px solid #f0f0f0;
          text-decoration: none;
          color: inherit;
          transition: background 0.2s;
        }
        .search-result-item:hover {
          background: #f9f9f9;
        }
        .search-result-image {
          width: 80px;
          height: 80px;
          background: #f5f5f5;
          flex-shrink: 0;
        }
        .search-result-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .search-result-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #999;
        }
        .search-result-info h4 {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          margin: 0 0 8px 0;
        }
        .search-result-info p {
          font-size: 12px;
          color: #666;
          margin: 0;
        }
        .search-suggestions {
          padding: 20px 0;
        }
        .search-suggestions-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #999;
          margin: 0 0 15px 0;
        }
        .search-suggestions-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .search-suggestion {
          background: #f5f5f5;
          border: none;
          padding: 10px 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .search-suggestion:hover {
          background: #000;
          color: #fff;
        }
      `}} />
    </>
  );
}
