'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { normalizeStoreImageUrl } from '@/lib/store-image-url';
import { useStore } from '../context/StoreContext';

interface HeaderProps {
  logo?: string;
  storeId: string;
  domain: string;
  categories: any[];
}

export default function Header({ logo, storeId, domain, categories }: HeaderProps) {
  const { setSearchOpen, setAuthOpen, setCartOpen, cartCount, isLoggedIn, isCartOpen } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [logo]);

  const toggleCategory = (catId: number) => {
    setExpandedCategories(prev =>
      prev.includes(catId)
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    );
  };

  const parentCategories = categories.filter((c: any) => !c.parent);

  const getCategoryName = (cat: any): string => {
    if (!cat.name) return 'Categoría';
    if (typeof cat.name === 'string') return cat.name;
    if (typeof cat.name === 'object') {
      return String(cat.name.es || cat.name.en || Object.values(cat.name)[0] || 'Categoría');
    }
    return 'Categoría';
  };

  const getSubcategories = (parentId: number) => {
    return categories.filter((c: any) => c.parent === parentId);
  };

  const normCatName = (name: string) => name.toLowerCase().trim();

  function resolveParentId(c: any): number | null {
    const p = c?.parent;
    if (p == null || p === '') return null;
    if (typeof p === 'object' && p != null && p.id != null) return Number(p.id);
    const n = Number(p);
    return Number.isFinite(n) ? n : null;
  }

  /** Nombre / padre parece SALE u ofertas (para tipografía roja). */
  function looksLikeSale(text: string): boolean {
    const t = normCatName(text);
    if (/\brebajas?\b/.test(t) || /\boutlet\b/.test(t) || /\bofertas?\b/.test(t) || /\bliquidaci/.test(t))
      return true;
    if (/\bsale\b/.test(t) || t === 'sale' || t.startsWith('sale ') || t.includes(' sale')) return true;
    return false;
  }

  function isSaleSubLink(cat: any, parentCat: any): boolean {
    if (parentCat && looksLikeSale(getCategoryName(parentCat))) return true;
    if (looksLikeSale(getCategoryName(cat))) return true;
    const h = cat?.handle;
    if (typeof h === 'string' && looksLikeSale(h.replace(/-/g, ' '))) return true;
    return false;
  }

  /** Raíces (menú superior / drawer): no repetir en la barra de abajo por id ni por nombre. */
  const parentIdSet = new Set(
    parentCategories.map((c: any) => Number(c.id)).filter((id: number) => Number.isFinite(id))
  );
  const parentNameSet = new Set(
    parentCategories.map((c: any) => normCatName(getCategoryName(c)))
  );

  /** Subcategorías: `parent` definido (Tiendanube), excluidas si duplican una categoría principal. */
  const subNavCategories = categories
    .filter((c: any) => {
      const p = c?.parent;
      if (p == null || p === '') return false;
      if (typeof p === 'object' && p.id == null) return false;
      return true;
    })
    .filter((c: any) => {
      const id = Number(c.id);
      if (parentIdSet.has(id)) return false;
      if (parentNameSet.has(normCatName(getCategoryName(c)))) return false;
      return true;
    });

  const categoryById = new Map<number, any>();
  for (const c of categories) {
    const id = Number(c.id);
    if (Number.isFinite(id)) categoryById.set(id, c);
  }

  type SubNavGroup = { parentId: number; parentLabel: string; items: any[] };

  const subNavGroups: SubNavGroup[] = [];
  const subNavAssigned = new Set<number>();

  for (const p of parentCategories) {
    const pid = Number(p.id);
    const children = subNavCategories
      .filter((c: any) => resolveParentId(c) === pid)
      .sort((a: any, b: any) =>
        getCategoryName(a).localeCompare(getCategoryName(b), 'es', { sensitivity: 'base' })
      );
    if (children.length === 0) continue;
    for (const c of children) subNavAssigned.add(Number(c.id));
    subNavGroups.push({
      parentId: pid,
      parentLabel: getCategoryName(p),
      items: children,
    });
  }

  const leftover = subNavCategories.filter((c: any) => !subNavAssigned.has(Number(c.id)));
  if (leftover.length > 0) {
    const byPid = new Map<number, any[]>();
    for (const c of leftover) {
      const pid = resolveParentId(c);
      if (pid == null) continue;
      if (!byPid.has(pid)) byPid.set(pid, []);
      byPid.get(pid)!.push(c);
    }
    const extra = [...byPid.entries()]
      .map(([pid, items]) => {
        const sorted = [...items].sort((a: any, b: any) =>
          getCategoryName(a).localeCompare(getCategoryName(b), 'es', { sensitivity: 'base' })
        );
        const pc = categoryById.get(pid);
        return {
          parentId: pid,
          parentLabel: pc ? getCategoryName(pc) : 'Más',
          items: sorted,
        };
      })
      .sort((a, b) => a.parentLabel.localeCompare(b.parentLabel, 'es', { sensitivity: 'base' }));
    subNavGroups.push(...extra);
  }

  useEffect(() => {
    const offsetPx = subNavGroups.length > 0 ? 104 : 60;
    document.documentElement.style.setProperty('--header-sticky-offset', `${offsetPx}px`);
    return () => {
      document.documentElement.style.removeProperty('--header-sticky-offset');
    };
  }, [subNavGroups.length]);

  return (
    <>
      <div className="header-sticky-wrap">
      <header className="scuffers-header">
        <div className="header-container">
          {/* LEFT SIDE - Burger (mobile) + Desktop Nav */}
          <div className="header-left">
            {/* Burger solo mobile */}
            <button
              type="button"
              className="burger-icon"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              aria-controls="site-nav-drawer"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {/* Desktop Navigation */}
            <nav className="desktop-nav">
              <Link href={`/?shop=${storeId}`} className="desktop-link">Shop</Link>
              <Link href={`/collections?shop=${storeId}`} className="desktop-link">
                Collections
              </Link>
              {parentCategories.slice(0, 4).map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.id}?shop=${storeId}`}
                  className="desktop-link"
                >
                  {getCategoryName(cat)}
                </Link>
              ))}
            </nav>
          </div>

          {/* CENTER - Logo */}
          <Link href={`/?shop=${storeId}`} className="logo-link" aria-label="Inicio">
            {(() => {
              if (!logo || logoFailed) return <span className="logo-text">Tienda</span>;
              const src = normalizeStoreImageUrl(logo);
              if (!src) return <span className="logo-text">Tienda</span>;
              return (
                <Image
                  src={src}
                  alt=""
                  className="logo-img"
                  width={120}
                  height={32}
                  priority
                  sizes="120px"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                />
              );
            })()}
          </Link>

          {/* RIGHT SIDE - Actions */}
          <div className="header-right">
            <span className="country-label">País</span>
            <button type="button" onClick={() => setSearchOpen(true)} className="icon-btn" aria-label="Buscar">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M15 15l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button type="button" onClick={() => setAuthOpen(true)} className="icon-btn" aria-label="Cuenta">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16 17v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="10" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {isLoggedIn && <span className="user-indicator" />}
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="icon-btn"
              aria-label={`Carrito${cartCount > 0 ? `, ${cartCount} productos` : ''}`}
              aria-expanded={isCartOpen}
              aria-haspopup="dialog"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 1L4 5H19l-2 9H6L4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="15" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {subNavGroups.length > 0 && (
        <div className="subcategory-bar-wrap">
          <nav className="subcategory-bar" aria-label="Subcategorías">
          <div className="subcategory-bar-inner">
            <Link href={`/?shop=${storeId}`} className="subcategory-link subcategory-link-featured">
              Novedades
            </Link>
            {subNavGroups.map((group) => {
              const parentCat = categoryById.get(group.parentId);
              const parentForSale = parentCat ?? { name: group.parentLabel };
              return (
                <div
                  key={group.parentId}
                  className="subcategory-group"
                  role="group"
                  aria-label={group.parentLabel}
                >
                  <span className="subcategory-group-label">{group.parentLabel}</span>
                  <div className="subcategory-group-links">
                    {group.items.map((cat: any) => (
                      <Link
                        key={cat.id}
                        href={`/categoria/${cat.id}?shop=${storeId}`}
                        className={
                          isSaleSubLink(cat, parentForSale)
                            ? 'subcategory-link subcategory-link-sale'
                            : 'subcategory-link'
                        }
                      >
                        {getCategoryName(cat)}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
          <span className="subcategory-scroll-hint" aria-hidden="true">
            Más →
          </span>
        </div>
      )}
      </div>

      {/* DRAWER OVERLAY */}
      <div
        className={`drawer-overlay ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* DRAWER MENU - Estilo Scuffers */}
      <div
        id="site-nav-drawer"
        className={`drawer-menu ${menuOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        hidden={!menuOpen}
      >
        {/* Drawer Header - Solo botón cerrar */}
        <div className="drawer-header">
          <button type="button" className="close-btn" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
            ✕ CERRAR
          </button>
        </div>

        {/* Drawer Navigation */}
        <nav className="drawer-nav" aria-label="Categorías y enlaces">
          {/* Links destacados */}
          <Link href={`/?shop=${storeId}`} className="nav-link featured" onClick={() => setMenuOpen(false)}>
            NOVEDADES
          </Link>
          <Link
            href={`/collections?shop=${storeId}`}
            className="nav-link featured"
            onClick={() => setMenuOpen(false)}
          >
            COLLECTIONS
          </Link>
          <Link href={`/?shop=${storeId}`} className="nav-link featured" onClick={() => setMenuOpen(false)}>
            BEST SELLERS
          </Link>
          <Link href={`/?shop=${storeId}`} className="nav-link featured" onClick={() => setMenuOpen(false)}>
            BACK IN STOCK
          </Link>

          {/* Categorías con desplegables */}
          {parentCategories.map((cat: any) => {
            const subs = getSubcategories(cat.id);
            const isExpanded = expandedCategories.includes(cat.id);
            const hasSubs = subs.length > 0;

            return (
              <div key={cat.id} className="nav-category">
                <div className="nav-category-header">
                  <Link
                    href={`/categoria/${cat.id}?shop=${storeId}`}
                    className="nav-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    {getCategoryName(cat).toUpperCase()}
                  </Link>
                  {hasSubs && (
                    <button
                      className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => toggleCategory(cat.id)}
                    >
                      +
                    </button>
                  )}
                </div>

                {hasSubs && (
                  <div className={`nav-submenu ${isExpanded ? 'open' : ''}`}>
                    {subs.map((sub: any) => (
                      <Link
                        key={sub.id}
                        href={`/categoria/${sub.id}?shop=${storeId}`}
                        className="nav-sublink"
                        onClick={() => setMenuOpen(false)}
                      >
                        {getCategoryName(sub)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="drawer-footer">
          <a
            href={`https://${domain}`}
            className="footer-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            SOBRE NOSOTROS
          </a>
          <Link href="#" className="footer-link">LA CASA</Link>
          <div className="footer-expandable">
            <span className="footer-link-text">SOPORTE</span>
            <span className="expand-icon">+</span>
          </div>
          <Link href="#" className="footer-link">PAÍS</Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        /* ========== HEADER + SUBBAR (sticky conjunto) ========== */
        .header-sticky-wrap {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        .scuffers-header {
          position: relative;
          background: #ffffff;
          border-bottom: 1px solid rgba(0,0,0,0.08);
          height: 60px;
          display: flex;
          align-items: center;
        }

        .subcategory-bar-wrap {
          position: relative;
          border-bottom: 1px solid rgba(0,0,0,0.08);
          background: #fff;
        }
        .subcategory-bar {
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          mask-image: linear-gradient(90deg, #000 0%, #000 calc(100% - 40px), transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 calc(100% - 40px), transparent 100%);
        }
        .subcategory-bar::-webkit-scrollbar {
          height: 3px;
        }
        .subcategory-scroll-hint {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 11px;
          font-weight: 700;
          color: #999;
          letter-spacing: 0.06em;
          pointer-events: none;
          z-index: 1;
        }
        @media (min-width: 1024px) {
          .subcategory-scroll-hint {
            right: 24px;
          }
        }
        .subcategory-bar-inner {
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          gap: 0;
          min-height: 42px;
          padding: 0 15px;
          width: max-content;
          max-width: none;
        }
        @media (min-width: 1024px) {
          .subcategory-bar-inner {
            padding: 0 30px;
            min-height: 44px;
          }
        }
        .subcategory-link {
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 500;
          color: #000;
          text-decoration: none;
          letter-spacing: 0.02em;
          padding: 12px 14px 12px 0;
          margin-right: 4px;
          white-space: nowrap;
          transition: opacity 0.2s;
        }
        @media (min-width: 1024px) {
          .subcategory-link {
            padding: 12px 16px 12px 0;
          }
        }
        .subcategory-link:hover {
          opacity: 0.55;
        }
        .subcategory-link-featured {
          font-weight: 600;
        }

        .subcategory-group {
          display: flex;
          flex-direction: row;
          align-items: center;
          flex-shrink: 0;
          padding-right: 10px;
          margin-right: 6px;
          border-right: 1px solid #e8e8e8;
        }
        .subcategory-group:last-of-type {
          border-right: none;
          margin-right: 0;
        }
        .subcategory-group-label {
          font-size: 10px;
          font-weight: 700;
          color: #6d7175;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-right: 10px;
          flex-shrink: 0;
          max-width: 120px;
          line-height: 1.25;
        }
        .subcategory-group-links {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: center;
        }
        .subcategory-link-sale {
          color: #c40000 !important;
          font-weight: 700;
        }
        .subcategory-link-sale:hover {
          color: #8f0000 !important;
          opacity: 1;
        }

        .header-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        @media (min-width: 1024px) {
          .header-container {
            padding: 0 30px;
          }
        }

        /* LEFT - Burger + Desktop Nav */
        .header-left {
          display: flex;
          align-items: center;
          gap: 5px;
          flex: 1;
        }
        .burger-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: none;
          border: none;
          cursor: pointer;
          color: #000;
          transition: opacity 0.2s;
        }
        .burger-icon:hover { opacity: 0.6; }
        @media (min-width: 1024px) {
          .burger-icon { display: none; }
        }

        /* Desktop Navigation */
        .desktop-nav {
          display: none;
          align-items: center;
          gap: 25px;
        }
        @media (min-width: 1024px) {
          .desktop-nav { display: flex; }
        }
        .desktop-link {
          font-size: 13px;
          font-weight: 500;
          color: #000;
          text-decoration: none;
          letter-spacing: 0.3px;
          transition: opacity 0.2s;
          white-space: nowrap;
        }
        .desktop-link:hover { opacity: 0.5; }

        /* CENTER - Logo */
        .logo-link {
          text-decoration: none;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-img {
          height: 26px;
          width: auto;
          max-width: 140px;
        }
        @media (min-width: 768px) {
          .logo-img { height: 30px; }
        }
        .logo-text {
          font-weight: 700;
          font-size: 20px;
          letter-spacing: 1px;
          color: #000;
        }
        @media (min-width: 768px) {
          .logo-text { font-size: 24px; }
        }

        /* RIGHT - Actions */
        .header-right {
          display: flex;
          align-items: center;
          gap: 5px;
          flex: 1;
          justify-content: flex-end;
        }
        @media (min-width: 1024px) {
          .header-right { gap: 12px; }
        }
        .country-label {
          display: none;
          font-size: 12px;
          font-weight: 500;
          color: #000;
          margin-right: 10px;
        }
        @media (min-width: 1024px) {
          .country-label { display: block; }
        }
        .icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          color: #000;
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.2s;
          position: relative;
        }
        .icon-btn:hover { opacity: 0.6; }
        .cart-count {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #000;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          min-width: 15px;
          height: 15px;
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

        /* ========== DRAWER OVERLAY ========== */
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          z-index: 1999;
          opacity: 0;
          visibility: hidden;
          transition: all 0.35s ease;
        }
        .drawer-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        /* ========== DRAWER MENU ========== */
        .drawer-menu {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          max-width: 420px;
          height: 100vh;
          height: 100dvh;
          background: #fff;
          z-index: 2000;
          transform: translateX(-100%);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .drawer-menu.open {
          transform: translateX(0);
        }

        /* ========== DRAWER HEADER ========== */
        .drawer-header {
          padding: 20px 25px;
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        .close-btn {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          background: none;
          border: none;
          cursor: pointer;
          color: #000;
          padding: 0;
          transition: opacity 0.2s;
        }
        .close-btn:hover {
          opacity: 0.5;
        }

        /* ========== DRAWER NAVIGATION ========== */
        .drawer-nav {
          flex: 1;
          overflow-y: auto;
          padding: 25px 25px 40px;
        }

        /* Links generales */
        .nav-link {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #000;
          text-decoration: none;
          padding: 15px 0;
          letter-spacing: 0.8px;
          transition: opacity 0.2s;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .nav-link:hover {
          opacity: 0.5;
        }
        .nav-link.featured {
          font-weight: 700;
        }

        /* Category con dropdown */
        .nav-category {
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .nav-category:last-child {
          border-bottom: none;
        }
        .nav-category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-category-header .nav-link {
          flex: 1;
          border-bottom: none;
        }
        .expand-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 20px;
          font-weight: 300;
          color: #000;
          transition: transform 0.3s ease;
        }
        .expand-btn:hover {
          opacity: 0.5;
        }
        .expand-btn.expanded {
          transform: rotate(45deg);
        }

        /* Submenu */
        .nav-submenu {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s ease;
          padding-left: 0;
        }
        .nav-submenu.open {
          max-height: 600px;
        }
        .nav-sublink {
          display: block;
          font-size: 12px;
          font-weight: 400;
          color: #666;
          text-decoration: none;
          padding: 12px 0 12px 18px;
          transition: all 0.2s;
          border-left: 2px solid transparent;
        }
        .nav-sublink:hover {
          color: #000;
          border-left-color: #000;
        }

        /* ========== DRAWER FOOTER ========== */
        .drawer-footer {
          padding: 25px;
          border-top: 1px solid rgba(0,0,0,0.08);
          margin-top: auto;
          background: #fafafa;
        }
        .footer-link {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #000;
          text-decoration: none;
          padding: 12px 0;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          transition: opacity 0.2s;
        }
        .footer-link:last-child {
          border-bottom: none;
        }
        .footer-link:hover {
          opacity: 0.5;
        }
        .footer-expandable {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          cursor: pointer;
        }
        .footer-link-text {
          font-size: 12px;
          font-weight: 500;
          color: #000;
          letter-spacing: 0.5px;
        }
        .expand-icon {
          font-size: 16px;
          font-weight: 300;
          color: #666;
        }

        /* ========== SCROLLBAR STYLING ========== */
        .drawer-nav::-webkit-scrollbar {
          width: 4px;
        }
        .drawer-nav::-webkit-scrollbar-track {
          background: transparent;
        }
        .drawer-nav::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.15);
          border-radius: 2px;
        }
        .drawer-nav::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.25);
        }
      `}} />
    </>
  );
}
