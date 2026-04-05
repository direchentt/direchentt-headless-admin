'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const nav = [
  { href: '/admin', label: 'Inicio', desc: 'Resumen y accesos', icon: '⌂' },
  { href: '/admin/storefront', label: 'Tienda en línea', desc: 'Home, banners y tema', icon: '◉' },
  { href: '/admin/marketing', label: 'Marketing', desc: 'Métricas y embudo', icon: '◎' },
  { href: '/admin/pedidos', label: 'Pedidos', desc: 'Lectura vía API Tiendanube', icon: '▤' },
  { href: '/admin/catalogo', label: 'Catálogo', desc: 'Productos y buscador', icon: '▣' },
  { href: '/admin/reglas', label: 'Reglas y módulos', desc: 'Flags, marketing y textos', icon: '⚙' },
];

const dockNav = [
  { href: '/admin', label: 'Inicio', icon: '⌂' },
  { href: '/admin/storefront', label: 'Vitrina', icon: '◉' },
  { href: '/admin/marketing', label: 'Mkt', icon: '◎' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '▤' },
];

const PAGE_TITLE: Record<string, string> = {
  '/admin': 'Inicio',
  '/admin/storefront': 'Tienda en línea',
  '/admin/marketing': 'Marketing',
  '/admin/pedidos': 'Pedidos',
  '/admin/catalogo': 'Catálogo',
  '/admin/reglas': 'Reglas y módulos',
};

function navHref(path: string, shop: string): string {
  if (path === '/admin') return '/admin';
  return `${path}?shop=${encodeURIComponent(shop)}`;
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [navOpen, setNavOpen] = useState(false);

  const adminShop = useMemo(() => {
    const q = searchParams.get('shop')?.trim();
    return q || process.env.NEXT_PUBLIC_DEFAULT_SHOP?.trim() || '5112334';
  }, [searchParams]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  const pageTitle =
    PAGE_TITLE[pathname] ??
    (pathname.startsWith('/admin/marketing') ? 'Marketing' : 'Administración');

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="adm-root">
      {navOpen ? (
        <button
          type="button"
          className="adm-overlay"
          aria-label="Cerrar menú de navegación"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <aside
        id="admin-nav-aside"
        className={`adm-side ${navOpen ? 'open' : ''}`}
        aria-label="Navegación del panel"
      >
        <div className="adm-brand-row">
          <div className="adm-brand">
            <span className="adm-brand-mark" aria-hidden />
            <div>
              <div className="adm-brand-title">Headless</div>
              <div className="adm-brand-sub">Panel de administración</div>
            </div>
          </div>
          <button
            type="button"
            className="adm-drawer-close"
            aria-label="Cerrar menú"
            onClick={() => setNavOpen(false)}
          >
            ×
          </button>
        </div>
        <nav className="adm-nav" aria-label="Secciones">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={navHref(item.href, adminShop)}
                className={`adm-nav-item ${active ? 'active' : ''}`}
                onClick={() => setNavOpen(false)}
              >
                <span className="adm-nav-ico" aria-hidden>
                  {item.icon}
                </span>
                <span className="adm-nav-text">
                  <span className="adm-nav-label">{item.label}</span>
                  <span className="adm-nav-desc">{item.desc}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="adm-side-foot">
          <button type="button" className="adm-logout" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-topbar">
          <button
            type="button"
            className="adm-burger"
            aria-expanded={navOpen}
            aria-controls="admin-nav-aside"
            onClick={() => setNavOpen((v) => !v)}
          >
            <span className="adm-burger-lines" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            <span className="adm-sr-only">Menú</span>
          </button>
          <div className="adm-topbar-titles">
            <h1 className="adm-page-title">{pageTitle}</h1>
            <p className="adm-topbar-tagline">Catálogo y pedidos siguen en Tiendanube</p>
          </div>
        </header>
        <div className="adm-content">{children}</div>
      </div>

      <nav className="adm-dock" aria-label="Acceso rápido móvil">
        {dockNav.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={navHref(item.href, adminShop)}
              className={`adm-dock-item ${active ? 'active' : ''}`}
            >
              <span className="adm-dock-ico" aria-hidden>
                {item.icon}
              </span>
              <span className="adm-dock-label">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className="adm-dock-item adm-dock-more"
          aria-label="Abrir menú completo"
          onClick={() => setNavOpen(true)}
        >
          <span className="adm-dock-ico" aria-hidden>
            ≡
          </span>
          <span className="adm-dock-label">Menú</span>
        </button>
      </nav>

      <style jsx global>{`
        .adm-root {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          background: #f4f6f8;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
            sans-serif;
          font-size: 15px;
          color: #202223;
          -webkit-font-smoothing: antialiased;
        }
        .adm-overlay {
          display: none;
        }
        .adm-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .adm-side {
          width: 260px;
          flex-shrink: 0;
          background: #fff;
          border-right: 1px solid #e1e3e5;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          min-height: 100dvh;
        }
        .adm-brand-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          padding: 20px 16px 16px;
          border-bottom: 1px solid #e1e3e5;
        }
        .adm-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .adm-brand-mark {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 10px;
          background: linear-gradient(145deg, #008060 0%, #004c3f 100%);
          box-shadow: 0 2px 8px rgba(0, 77, 64, 0.25);
        }
        .adm-brand-title {
          font-weight: 700;
          font-size: 16px;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .adm-brand-sub {
          font-size: 12px;
          color: #6d7175;
          margin-top: 4px;
          line-height: 1.35;
        }
        .adm-drawer-close {
          display: none;
          width: 44px;
          height: 44px;
          align-items: center;
          justify-content: center;
          border: none;
          background: #f1f2f4;
          border-radius: 10px;
          font-size: 24px;
          line-height: 1;
          color: #202223;
          cursor: pointer;
          flex-shrink: 0;
        }
        .adm-drawer-close:hover {
          background: #e4e5e7;
        }
        .adm-nav {
          padding: 12px 10px;
          flex: 1;
        }
        .adm-nav-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 12px;
          border-radius: 10px;
          color: #202223;
          text-decoration: none;
          margin-bottom: 6px;
          min-height: 48px;
          box-sizing: border-box;
          transition: background 0.15s ease;
        }
        .adm-nav-item:hover {
          background: #f4f6f8;
        }
        .adm-nav-item.active {
          background: #e3f1ed;
          box-shadow: inset 0 0 0 1px rgba(0, 128, 96, 0.2);
        }
        .adm-nav-item.active .adm-nav-label {
          font-weight: 700;
          color: #004c3f;
        }
        .adm-nav-ico {
          opacity: 0.85;
          width: 24px;
          text-align: center;
          font-size: 18px;
          line-height: 1.2;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .adm-nav-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .adm-nav-label {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.3;
        }
        .adm-nav-desc {
          font-size: 12px;
          color: #6d7175;
          line-height: 1.35;
        }
        .adm-side-foot {
          padding: 16px 12px;
          padding-bottom: max(16px, env(safe-area-inset-bottom));
          border-top: 1px solid #e1e3e5;
        }
        .adm-logout {
          width: 100%;
          min-height: 48px;
          padding: 12px 14px;
          border: 1px solid #c9cccf;
          border-radius: 10px;
          background: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          color: #202223;
        }
        .adm-logout:hover {
          background: #f6f6f7;
        }
        .adm-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .adm-topbar {
          min-height: 56px;
          background: #fff;
          border-bottom: 1px solid #e1e3e5;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          padding-left: max(16px, env(safe-area-inset-left));
          padding-right: max(16px, env(safe-area-inset-right));
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .adm-burger {
          display: none;
          width: 48px;
          height: 48px;
          align-items: center;
          justify-content: center;
          border: 1px solid #e1e3e5;
          border-radius: 10px;
          background: #fff;
          cursor: pointer;
          flex-shrink: 0;
        }
        .adm-burger:hover {
          background: #f4f6f8;
        }
        .adm-burger-lines {
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 20px;
        }
        .adm-burger-lines span {
          display: block;
          height: 2px;
          background: #202223;
          border-radius: 1px;
        }
        .adm-topbar-titles {
          min-width: 0;
          flex: 1;
        }
        .adm-page-title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #202223;
          letter-spacing: -0.02em;
          line-height: 1.25;
        }
        .adm-topbar-tagline {
          margin: 2px 0 0;
          font-size: 12px;
          color: #6d7175;
          line-height: 1.35;
        }
        .adm-content {
          flex: 1;
          padding: 16px;
          padding-bottom: max(24px, env(safe-area-inset-bottom));
          overflow: auto;
        }
        .adm-dock {
          display: none;
        }
        @media (max-width: 767px) {
          .adm-content {
            padding-bottom: calc(72px + env(safe-area-inset-bottom));
          }
          .adm-dock {
            display: flex;
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 140;
            background: #fff;
            border-top: 1px solid #e1e3e5;
            padding: 6px 8px calc(8px + env(safe-area-inset-bottom));
            gap: 4px;
            justify-content: space-around;
            align-items: stretch;
            box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.06);
          }
          .adm-dock-item {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            padding: 6px 4px;
            border: none;
            border-radius: 10px;
            background: transparent;
            color: #6d7175;
            text-decoration: none;
            font-size: 10px;
            font-weight: 600;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
          }
          .adm-dock-item.active {
            color: #004c3f;
            background: #e3f1ed;
          }
          .adm-dock-ico {
            font-size: 18px;
            line-height: 1;
            opacity: 0.9;
          }
          .adm-dock-label {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          .adm-dock-more {
            color: #202223;
          }
        }
        @media (min-width: 768px) {
          .adm-content {
            padding: 24px 28px;
          }
          .adm-page-title {
            font-size: 18px;
          }
        }
        @media (max-width: 767px) {
          .adm-overlay {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 150;
            background: rgba(32, 34, 35, 0.45);
            border: none;
            cursor: pointer;
            padding: 0;
          }
          .adm-burger {
            display: flex;
          }
          .adm-drawer-close {
            display: flex;
          }
          .adm-side {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 160;
            width: min(300px, 88vw);
            max-width: 100%;
            transform: translateX(-102%);
            transition: transform 0.22s ease;
            box-shadow: none;
          }
          .adm-side.open {
            transform: translateX(0);
            box-shadow: 12px 0 40px rgba(0, 0, 0, 0.12);
          }
        }
        @media (min-width: 768px) {
          .adm-side {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
