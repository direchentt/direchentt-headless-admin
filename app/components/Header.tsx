'use client';

import Link from 'next/link';
import { useStore } from '../context/StoreContext';

interface HeaderProps {
  logo?: string;
  storeId: string;
  domain: string;
  categories: any[];
}

export default function Header({ logo, storeId, domain, categories }: HeaderProps) {
  const { setSearchOpen, setAuthOpen, setCartOpen, cartCount, isLoggedIn, user } = useStore();

  return (
    <>
      <header className="scuffers-header">
        <div className="header-container">
          {/* BURGER MENU */}
          <input type="checkbox" id="menu-toggle" className="menu-checkbox" />
          <label htmlFor="menu-toggle" className="burger-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </label>

          {/* LOGO */}
          <Link href={`/?shop=${storeId}`} className="logo-link">
            {logo ? (
              <img src={logo} alt="DIRECHENTT" className="logo-img" />
            ) : (
              <span className="logo-text">DIRECHENTT</span>
            )}
          </Link>

          {/* HEADER ACTIONS */}
          <div className="header-actions">
            <button 
              onClick={() => setSearchOpen(true)}
              className="icon-btn" 
              aria-label="Buscar"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              onClick={() => setAuthOpen(true)}
              className="icon-btn" 
              aria-label="Cuenta"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 17v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {isLoggedIn && <span className="user-indicator" />}
            </button>
            <button 
              onClick={() => setCartOpen(true)}
              className="icon-btn cart-btn" 
              aria-label="Carrito"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3h2l.4 2M7 13h10l2-7H6l-1.6-8M7 13L5.4 5M7 13l-1.293 1.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-10 0a2 2 0 100 4 2 2 0 000-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
          </div>

          {/* DRAWER MENU */}
          <div className="drawer-menu">
            <div className="drawer-content">
              <div className="drawer-header">
                <label htmlFor="menu-toggle" className="close-btn">✕ CERRAR</label>
              </div>
              <nav className="drawer-nav">
                {/* Enlace al sitio principal */}
                <div className="nav-item">
                  <a 
                    href="https://www.direchentt.com.ar" 
                    className="nav-title site-main-link" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    🏠 IR AL SITIO PRINCIPAL
                  </a>
                </div>
                
                {/* Categorías locales */}
                {categories.filter((c: any) => !c.parent).map((cat: any) => (
                  <div key={cat.id} className="nav-item">
                    <Link href={`/categoria/${cat.id}?shop=${storeId}`} className="nav-title">
                      {typeof cat.name === 'object' 
                        ? (cat.name.es?.toUpperCase() || cat.name.en?.toUpperCase() || 'Categoría')
                        : (cat.name?.toUpperCase() || 'Categoría')
                      }
                    </Link>
                    {categories.filter((s: any) => s.parent === cat.id).length > 0 && (
                      <div className="nav-submenu">
                        {categories.filter((s: any) => s.parent === cat.id).map((sub: any) => (
                          <Link key={sub.id} href={`/categoria/${sub.id}?shop=${storeId}`} className="nav-sub">
                            {typeof sub.name === 'object' 
                              ? (sub.name.es || sub.name.en || 'Subcategoría')
                              : (sub.name || 'Subcategoría')
                            }
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
            <label htmlFor="menu-toggle" className="drawer-overlay"></label>
          </div>
        </div>
      </header>

      <style dangerouslySetInnerHTML={{__html: `
        .scuffers-header {
          position: sticky;
          top: 0;
          background: #ffffff;
          border-bottom: 1px solid #f0f0f0;
          height: 70px;
          display: flex;
          align-items: center;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        .header-container {
          width: 100%;
          max-width: 100%;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 50px 1fr 140px;
          align-items: center;
          gap: 10px;
        }
        @media (min-width: 768px) {
          .header-container {
            padding: 0 30px;
            grid-template-columns: 50px 1fr 160px;
            max-width: 1400px;
            margin: 0 auto;
          }
        }
        .menu-checkbox {
          display: none;
        }
        .burger-icon {
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          padding: 0;
          color: #000;
          transition: opacity 0.2s;
        }
        .burger-icon:hover {
          opacity: 0.6;
        }
        .logo-link {
          text-decoration: none;
          color: #000;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-img {
          height: 28px;
          width: auto;
          max-width: 150px;
        }
        @media (min-width: 768px) {
          .logo-img {
            height: 32px;
          }
        }
        .logo-text {
          font-weight: 700;
          font-size: 22px;
          letter-spacing: 0.5px;
          color: #000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: flex-end;
        }
        @media (min-width: 768px) {
          .header-actions {
            gap: 12px;
          }
        }
        .icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          color: #000;
          text-decoration: none;
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.2s;
          position: relative;
        }
        .icon-btn:hover {
          opacity: 0.6;
        }
        .cart-count {
          position: absolute;
          top: 2px;
          right: 2px;
          background: #000;
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .user-indicator {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          border: 2px solid #fff;
        }
        .drawer-menu {
          position: fixed;
          inset: 0;
          visibility: hidden;
          z-index: 2000;
          pointer-events: none;
        }
        .menu-checkbox:checked ~ .drawer-menu {
          visibility: visible;
          pointer-events: all;
        }
        .drawer-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .menu-checkbox:checked ~ .drawer-menu .drawer-overlay {
          opacity: 1;
        }
        .drawer-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 85%;
          max-width: 320px;
          height: 100vh;
          background: #fff;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
          padding: 25px 20px;
          overflow-y: auto;
          z-index: 2001;
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
        }
        .menu-checkbox:checked ~ .drawer-menu .drawer-content {
          transform: translateX(0);
        }
        .drawer-header {
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e5e5;
        }
        .close-btn {
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          letter-spacing: 1.5px;
          color: #000;
          display: block;
          transition: opacity 0.2s;
        }
        .close-btn:hover {
          opacity: 0.6;
        }
        .drawer-nav {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .nav-item {
          border-bottom: 1px solid #e5e5e5;
          padding: 18px 0;
        }
        .nav-item:last-child {
          border-bottom: none;
        }
        .nav-title {
          display: block;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          color: #000;
          letter-spacing: 1px;
          margin-bottom: 12px;
          transition: opacity 0.2s;
        }
        .nav-title:hover {
          opacity: 0.6;
        }
        .nav-submenu {
          padding-left: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .nav-sub {
          font-size: 13px;
          color: #666;
          text-decoration: none;
          display: block;
          padding-left: 15px;
          transition: color 0.2s;
        }
        .nav-sub:hover {
          color: #000;
        }
        .site-main-link {
          background: linear-gradient(135deg, #000 0%, #333 100%);
          color: #fff !important;
          padding: 12px 15px;
          border-radius: 6px;
          text-align: center;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 0 !important;
          box-shadow: 0 3px 12px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }
        .site-main-link:hover {
          background: linear-gradient(135deg, #333 0%, #555 100%);
          transform: translateY(-1px);
          opacity: 1 !important;
          color: #fff !important;
        }

        @media (max-width: 768px) {
          .burger-icon {
            display: flex;
          }
        }
      `}} />
    </>
  );
}
