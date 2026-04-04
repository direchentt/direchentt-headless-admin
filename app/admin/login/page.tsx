'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Error al iniciar sesión');
        return;
      }
      router.push('/admin');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-mark" />
          <h1>Administración</h1>
          <p>Ingresá la clave de administrador (CMS_ADMIN_SECRET).</p>
        </div>
        <form onSubmit={onSubmit}>
          <label className="login-label">Clave</label>
          <input
            type="password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
      <style jsx>{`
        .login-root {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(165deg, #eef2f5 0%, #f8f9fa 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: max(24px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right))
            max(24px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          background: #fff;
          border-radius: 12px;
          padding: 40px 36px;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05), 0 4px 24px rgba(0, 0, 0, 0.08);
          border: 1px solid #e1e3e5;
        }
        .login-brand {
          margin-bottom: 28px;
          text-align: center;
        }
        .login-mark {
          display: inline-block;
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: linear-gradient(135deg, #008060 0%, #004c3f 100%);
          margin-bottom: 16px;
        }
        .login-brand h1 {
          margin: 0 0 8px;
          font-size: 20px;
          font-weight: 700;
          color: #202223;
        }
        .login-brand p {
          margin: 0;
          font-size: 14px;
          color: #45494d;
          line-height: 1.55;
        }
        .login-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #202223;
        }
        .login-input {
          width: 100%;
          box-sizing: border-box;
          min-height: 48px;
          padding: 14px 14px;
          border: 1px solid #c9cccf;
          border-radius: 10px;
          font-size: 16px;
          margin-bottom: 16px;
        }
        .login-input:focus {
          outline: none;
          border-color: #008060;
          box-shadow: 0 0 0 1px #008060;
        }
        .login-error {
          color: #d72c0d;
          font-size: 13px;
          margin: 0 0 12px;
        }
        .login-btn {
          width: 100%;
          min-height: 48px;
          padding: 14px;
          background: #008060;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }
        .login-btn:hover:not(:disabled) {
          background: #006e52;
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
