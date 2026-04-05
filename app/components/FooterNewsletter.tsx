'use client';

import { useState } from 'react';
import StoreImage from './StoreImage';
import { postNewsletterSubscribe } from '@/lib/post-newsletter-subscribe';

type FooterNewsletterProps = {
  storeId: string;
  /** URL de imagen editorial (storefront newsletter.footerImageUrl o popupImageUrl) */
  imageUrl?: string | null;
};

export default function FooterNewsletter({ storeId, imageUrl }: FooterNewsletterProps) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (sent) {
    return (
      <p className="newsletter-thanks" role="status">
        Gracias. Te tendremos al tanto de novedades y ofertas.
      </p>
    );
  }

  return (
    <div className="newsletter-modern">
      {imageUrl?.trim() ? (
        <div className="newsletter-modern-visual" aria-hidden={true}>
          <StoreImage
            src={imageUrl.trim()}
            alt=""
            fill
            className="newsletter-modern-img"
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 767px) 100vw, 38vw"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="newsletter-modern-visual newsletter-modern-visual--placeholder" aria-hidden={true} />
      )}
      <div className="newsletter-modern-copy">
        <h3 className="newsletter-title">Newsletter</h3>
        <p className="newsletter-subtitle">Suscríbete y consigue un 10%</p>
        <p className="newsletter-desc">
          Recibe novedades sobre las colecciones, reposiciones, eventos y ofertas.
        </p>
        <form
          className="newsletter-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            const fd = new FormData(e.currentTarget);
            const email = String(fd.get('email') ?? '').trim();
            if (!email) return;
            setLoading(true);
            const r = await postNewsletterSubscribe(storeId, email);
            setLoading(false);
            if (r.ok) setSent(true);
            else setError(r.error);
          }}
        >
          <label htmlFor="footer-newsletter-email" className="visually-hidden">
            Correo para newsletter
          </label>
          <input
            id="footer-newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Tu email"
            className="newsletter-input"
            required
            disabled={loading}
          />
          <button type="submit" className="newsletter-btn" disabled={loading}>
            {loading ? 'Enviando…' : 'Suscribirse'}
          </button>
        </form>
        {error ? (
          <p className="newsletter-inline-err" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .newsletter-modern {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
          max-width: 920px;
          margin: 0 auto;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #ececec;
          background: #fafafa;
          text-align: left;
        }
        @media (min-width: 768px) {
          .newsletter-modern {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
            align-items: stretch;
          }
        }
        .newsletter-modern-visual {
          position: relative;
          min-height: 200px;
          background: #e8e8e8;
        }
        @media (min-width: 768px) {
          .newsletter-modern-visual {
            min-height: 280px;
          }
        }
        .newsletter-modern-visual--placeholder {
          background: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 48%, #111 100%);
        }
        .newsletter-modern-img {
          display: block;
        }
        .newsletter-modern-copy {
          padding: 28px 22px 30px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #fff;
        }
        @media (min-width: 768px) {
          .newsletter-modern-copy {
            padding: 36px 40px 40px;
          }
        }
        .newsletter-modern-copy .newsletter-title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin: 0 0 10px 0;
          color: #888;
        }
        .newsletter-modern-copy .newsletter-subtitle {
          font-size: clamp(22px, 3.5vw, 28px);
          font-weight: 700;
          margin: 0 0 12px 0;
          line-height: 1.2;
          color: #000;
        }
        .newsletter-modern-copy .newsletter-desc {
          font-size: 14px;
          color: #555;
          margin: 0 0 22px 0;
          line-height: 1.55;
          max-width: 36em;
        }
        .newsletter-modern-copy .newsletter-form {
          margin-top: 0;
          justify-content: flex-start;
        }
        .newsletter-inline-err {
          margin: 12px 0 0 0;
          font-size: 13px;
          color: #b00020;
        }
      `,
      }}
      />
    </div>
  );
}
