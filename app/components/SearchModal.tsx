'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import Link from 'next/link';

interface SearchModalProps {
  products: any[];
  storeId: string;
}

export default function SearchModal({ products, storeId }: SearchModalProps) {
  const { isSearchOpen, setSearchOpen } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      // Pequeño delay para asegurar que la animación no interfiera con el focus
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSearchTerm('');
    }
  }, [isSearchOpen]);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setSearchOpen]);

  // --- DATA LOGIC ---

  // 1. "Lo más buscado" (Simulado o derivado de categorias top)
  const popularSearches = useMemo(() => {
    // Extraemos categorias unicas de los productos
    const cats = new Set<string>();
    products.forEach(p => {
      p.categories?.forEach((c: any) => {
        const name = typeof c.name === 'object' ? (c.name.es || c.name.en) : c.name;
        if (name) cats.add(name.toLowerCase());
      });
    });
    // Devolvemos las primeras 5 o hardcodeamos estilo Scuffers si prefieres
    // Para simular "popular", mezclamos algunas fixed con reales
    const fixed = ['sudaderas', 'pantalones', 'camisetas', 'gorras'];
    const real = Array.from(cats);
    return [...new Set([...fixed, ...real])].slice(0, 6);
  }, [products]);

  // 2. "Productos Recomendados" (Random trending products)
  const recommendedProducts = useMemo(() => {
    // Mezclar productos para que parezca aleatorio/trending
    return [...products].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, [products]);

  // 3. Resultados de búsqueda en tiempo real
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lower = searchTerm.toLowerCase();

    return products.filter(p => {
      // 1. Check Name
      const name = typeof p.name === 'object' ? (p.name.es || p.name.en) : p.name;
      if (name?.toLowerCase().includes(lower)) return true;

      // 2. Check Categories
      if (p.categories) {
        return p.categories.some((c: any) => {
          const cName = typeof c.name === 'object' ? (c.name.es || c.name.en) : c.name;
          return cName?.toLowerCase().includes(lower);
        });
      }

      return false;
    }).slice(0, 8); // Max 8 para grid
  }, [searchTerm, products]);


  if (!isSearchOpen) return null;

  return (
    <>
      <div className="search-overlay" onClick={() => setSearchOpen(false)} />
      <div className="search-drawer">
        {/* TOP BAR */}
        <div className="search-header">
          <div className="input-container">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="search-icon">
              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Encuentra tu estilo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="close-btn" onClick={() => setSearchOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="search-content">
          {!searchTerm ? (
            // STATE A: DISCOVERY (Split Layout)
            <div className="discovery-layout">
              <div className="col-left">
                <h3>Lo más buscado</h3>
                <ul>
                  {popularSearches.map(term => (
                    <li key={term}>
                      <button onClick={() => setSearchTerm(term)}>{term}</button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-right">
                <h3>Productos recomendados</h3>
                <div className="rec-grid">
                  {recommendedProducts.map(prod => (
                    <Link key={prod.id} href={`/product/${prod.id}?shop=${storeId}`} onClick={() => setSearchOpen(false)} className="rec-card">
                      <div className="img-wrapper">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={prod.images[0]?.src} alt="" />
                      </div>
                      <div className="info">
                        <p className="name">{typeof prod.name === 'object' ? (prod.name.es || prod.name.en) : prod.name}</p>
                        <p className="price">$ {prod.variants[0]?.price}</p>
                      </div>
                      <button className="add-btn">+</button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // STATE B: SEARCH RESULTS
            <div className="results-layout">
              {searchResults.length > 0 ? (
                <>
                  <h3>Resultados para &quot;{searchTerm}&quot;</h3>
                  <div className="results-grid">
                    {searchResults.map(prod => (
                      <Link key={prod.id} href={`/product/${prod.id}?shop=${storeId}`} onClick={() => setSearchOpen(false)} className="result-card">
                        <div className="img-wrapper">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={prod.images[0]?.src} alt="" />
                        </div>
                        <div className="info">
                          <p className="name">{typeof prod.name === 'object' ? (prod.name.es || prod.name.en) : prod.name}</p>
                          <p className="price">$ {prod.variants[0]?.price}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <div className="no-results">
                  <p>No encontramos resultados para &quot;{searchTerm}&quot;</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
            .search-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.3);
                backdrop-filter: blur(2px);
                z-index: 2000;
                animation: fade 0.3s;
            }
            .search-drawer {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                background: #fff;
                z-index: 2001;
                padding: 20px 40px 40px;
                animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
            @keyframes fade {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            /* HEADER */
            .search-header {
                display: flex;
                align-items: center;
                border-bottom: 1px solid #eee;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .input-container {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 15px;
            }
            .search-icon {
                color: #000;
                width: 20px;
                height: 20px;
            }
            .input-container input {
                width: 100%;
                font-size: 24px;
                border: none;
                outline: none;
                font-weight: 300;
                color: #000;
                background: transparent;
            }
            .input-container input::placeholder {
                color: #999;
            }
            .close-btn {
                background: none;
                border: none;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .close-btn:hover {
                transform: rotate(90deg);
            }

            /* DISCOVERY LAYOUT */
            .discovery-layout {
                display: flex;
                gap: 40px;
            }
            .col-left {
                width: 250px;
                flex-shrink: 0;
            }
            .col-right {
                flex: 1;
            }

            h3 {
                font-size: 18px;
                font-weight: 400;
                margin-bottom: 20px;
                color: #000;
            }

            /* Lo mas buscado list */
            .col-left ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .col-left li {
                margin-bottom: 12px;
            }
            .col-left button {
                background: none;
                border: none;
                padding: 0;
                font-size: 15px;
                color: #666;
                cursor: pointer;
                text-align: left;
                transition: color 0.2s;
            }
            .col-left button:hover {
                color: #000;
                text-decoration: underline;
            }

            /* Recommended Grid */
            .rec-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 20px;
            }
            .rec-card {
                text-decoration: none;
                color: inherit;
                position: relative;
                group: hover;
            }
            .img-wrapper {
                width: 100%;
                aspect-ratio: 3/4;
                background: #f5f5f5;
                margin-bottom: 10px;
                position: relative;
                overflow: hidden;
            }
            .img-wrapper img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s;
            }
            .rec-card:hover .img-wrapper img {
                transform: scale(1.05);
            }
            .info .name {
                font-size: 12px;
                font-weight: 600;
                margin: 0 0 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .info .price {
                font-size: 12px;
                color: #666;
                margin: 0;
            }
            .add-btn {
                position: absolute;
                bottom: 60px;
                right: 10px;
                width: 30px;
                height: 30px;
                background: #fff;
                border: none;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                cursor: pointer;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.2s;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .rec-card:hover .add-btn {
                opacity: 1;
                transform: translateY(0);
            }

            /* RESPONSIVE */
            @media (max-width: 768px) {
                .discovery-layout {
                    flex-direction: column;
                }
                .col-left {
                    width: 100%;
                    margin-bottom: 30px;
                }
                .rec-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                .search-drawer {
                    padding: 20px;
                }
                .input-container input {
                    font-size: 18px;
                }
            }

            /* RESULTS GRID */
            .results-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
            }
            .result-card {
                text-decoration: none;
                color: inherit;
            }
            .result-card .img-wrapper {
                aspect-ratio: 3/4;
                margin-bottom: 10px;
            }
            .result-card .img-wrapper img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        `}</style>
    </>
  );
}
