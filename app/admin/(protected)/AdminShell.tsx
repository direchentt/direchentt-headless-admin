'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const nav = [
  { href: '/admin', label: 'Inicio', icon: '⌂' },
  { href: '/admin/storefront', label: 'Tienda en línea', icon: '◉' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="adm-root">
      <aside className="adm-side">
        <div className="adm-brand">
          <span className="adm-brand-mark" />
          <div>
            <div className="adm-brand-title">Headless</div>
            <div className="adm-brand-sub">Administración</div>
          </div>
        </div>
        <nav className="adm-nav">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`adm-nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="adm-nav-ico">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="adm-side-foot">
          <button type="button" className="adm-logout" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="adm-main">
        <header className="adm-topbar">
          <span className="adm-topbar-muted">Panel de control</span>
        </header>
        <div className="adm-content">{children}</div>
      </div>
      <style jsx global>{`
        .adm-root {
          min-height: 100vh;
          display: flex;
          background: #f1f1f1;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
            sans-serif;
          font-size: 14px;
          color: #202223;
        }
        .adm-side {
          width: 240px;
          flex-shrink: 0;
          background: #ebebeb;
          border-right: 1px solid #d0d0d0;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .adm-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 18px;
          border-bottom: 1px solid #d8d8d8;
        }
        .adm-brand-mark {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, #008060 0%, #004c3f 100%);
        }
        .adm-brand-title {
          font-weight: 700;
          font-size: 15px;
          letter-spacing: -0.02em;
        }
        .adm-brand-sub {
          font-size: 11px;
          color: #6d7175;
          margin-top: 2px;
        }
        .adm-nav {
          padding: 12px 10px;
          flex: 1;
        }
        .adm-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          color: #202223;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .adm-nav-item:hover {
          background: rgba(0, 0, 0, 0.06);
        }
        .adm-nav-item.active {
          background: #fff;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
          font-weight: 600;
        }
        .adm-nav-ico {
          opacity: 0.7;
          width: 20px;
          text-align: center;
        }
        .adm-side-foot {
          padding: 16px;
          border-top: 1px solid #d8d8d8;
        }
        .adm-logout {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #c9cccf;
          border-radius: 8px;
          background: #fff;
          font-size: 13px;
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
          height: 56px;
          background: #fff;
          border-bottom: 1px solid #e1e3e5;
          display: flex;
          align-items: center;
          padding: 0 24px;
        }
        .adm-topbar-muted {
          font-size: 13px;
          color: #6d7175;
        }
        .adm-content {
          flex: 1;
          padding: 24px;
          overflow: auto;
        }
      `}</style>
    </div>
  );
}
