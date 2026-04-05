'use client';

import { useState } from 'react';
import { postNewsletterSubscribe } from '@/lib/post-newsletter-subscribe';

type Props = {
  storeId: string;
  heading: string;
};

/**
 * Franja newsletter en home (opcional en storefront). Misma API que pie y popup.
 */
export default function NewsletterHomeStrip({ storeId, heading }: Props) {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <section
      style={{
        padding: '72px 20px',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #1c1c1c 100%)',
        color: '#fff',
      }}
    >
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' as const }}>
        <h3
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.25em',
            marginBottom: 16,
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          {heading}
        </h3>
        <p style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 300, margin: '0 0 8px', lineHeight: 1.35 }}>
          Suscribite y obtené un 10% de descuento
        </p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: '0 0 28px', lineHeight: 1.5 }}>
          Novedades de colecciones, reposiciones y ofertas en tu correo.
        </p>
        {done ? (
          <p style={{ fontSize: 15, fontWeight: 600 }} role="status">
            ¡Listo! Revisá tu bandeja.
          </p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setErr('');
              const fd = new FormData(e.currentTarget);
              const email = String(fd.get('email') ?? '').trim();
              if (!email) return;
              setLoading(true);
              const r = await postNewsletterSubscribe(storeId, email);
              setLoading(false);
              if (r.ok) setDone(true);
              else setErr(r.error);
            }}
            style={{
              display: 'flex',
              flexWrap: 'wrap' as const,
              gap: 10,
              justifyContent: 'center',
              maxWidth: 480,
              margin: '0 auto',
            }}
          >
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Tu email"
              disabled={loading}
              style={{
                flex: '1 1 200px',
                padding: '14px 18px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 28px',
                background: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.12em',
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? 'ENVIANDO…' : 'SUSCRIBIRSE'}
            </button>
          </form>
        )}
        {err ? (
          <p style={{ marginTop: 14, fontSize: 13, color: '#ff8a8a' }} role="alert">
            {err}
          </p>
        ) : null}
      </div>
    </section>
  );
}
