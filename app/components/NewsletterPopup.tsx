'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { StorefrontNewsletter } from '@/lib/storefront-config';
import StoreImage from './StoreImage';

const DEFAULT_SHOP = process.env.NEXT_PUBLIC_DEFAULT_SHOP || '5112334';

const LEGACY_CLOSED = 'newsletter_popup_closed';

const DELAY_FALLBACK_MS = 300_000;
const COOLDOWN_DAYS_FALLBACK = 7;
const DISMISS_THRESHOLD_FALLBACK = 3;

function keyShop(shop: string): string {
  const s = String(shop).replace(/[^a-zA-Z0-9_-]/g, '');
  return s || 'default';
}

function kSession(shop: string) {
  return `nl_email_shown_session_${keyShop(shop)}`;
}
function kDismiss(shop: string) {
  return `nl_email_dismiss_count_${keyShop(shop)}`;
}
function kCooldown(shop: string) {
  return `nl_email_cooldown_until_${keyShop(shop)}`;
}

function safeLocalGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function safeLocalRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function safeSessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function refreshCooldownState(shop: string): boolean {
  const untilRaw = safeLocalGet(kCooldown(shop));
  const until = untilRaw ? parseInt(untilRaw, 10) : 0;
  if (!until) return false;
  if (Date.now() < until) return true;
  safeLocalRemove(kCooldown(shop));
  safeLocalSet(kDismiss(shop), '0');
  return false;
}

function isInCooldown(shop: string): boolean {
  return refreshCooldownState(shop);
}

function migrateLegacyClosed(shop: string) {
  if (safeLocalGet(LEGACY_CLOSED) === 'true') {
    safeLocalRemove(LEGACY_CLOSED);
    const n = parseInt(safeLocalGet(kDismiss(shop)) || '0', 10);
    if (n < 1) safeLocalSet(kDismiss(shop), '1');
  }
}

function NewsletterPopupContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || DEFAULT_SHOP;

  const [cfg, setCfg] = useState<StorefrontNewsletter | null>(null);
  const [cfgLoaded, setCfgLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/storefront-config?shop=${encodeURIComponent(shop)}`);
        const j = await r.json();
        if (!cancelled && j?.exito && j?.config) {
          setCfg(j.config.newsletter ?? {});
        } else if (!cancelled) {
          setCfg({});
        }
      } catch {
        if (!cancelled) setCfg({});
      } finally {
        if (!cancelled) setCfgLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shop]);

  const popupEnabled = cfg?.popupEnabled !== false;

  const recordDismiss = useCallback(() => {
    const threshold = cfg?.dismissBeforeCooldown ?? DISMISS_THRESHOLD_FALLBACK;
    const days = cfg?.cooldownDays ?? COOLDOWN_DAYS_FALLBACK;
    const prev = parseInt(safeLocalGet(kDismiss(shop)) || '0', 10);
    const next = prev + 1;
    safeLocalSet(kDismiss(shop), String(next));
    if (next >= threshold) {
      safeLocalSet(kCooldown(shop), String(Date.now() + days * 24 * 60 * 60 * 1000));
    }
  }, [cfg?.dismissBeforeCooldown, cfg?.cooldownDays, shop]);

  const handleCloseDismiss = useCallback(() => {
    setIsVisible(false);
    recordDismiss();
  }, [recordDismiss]);

  const closeAfterSubscribe = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    if (!cfgLoaded || !popupEnabled) return;
    migrateLegacyClosed(shop);
    if (safeSessionGet(kSession(shop))) return;
    if (isInCooldown(shop)) return;

    const delayMs = cfg?.popupDelayMs ?? DELAY_FALLBACK_MS;
    const timer = setTimeout(() => {
      if (safeSessionGet(kSession(shop))) return;
      if (isInCooldown(shop)) return;
      safeSessionSet(kSession(shop), '1');
      setIsVisible(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [cfgLoaded, popupEnabled, shop, cfg?.popupDelayMs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    setTimeout(() => {
      setMessage('¡Gracias por suscribirte!');
      setIsSubmitting(false);
      setTimeout(() => {
        closeAfterSubscribe();
      }, 2000);
    }, 1000);
  };

  if (!isVisible) return null;

  const title =
    cfg?.popupTitle?.trim() || 'SUSCRIBITE A NUESTRO NEWSLETTER';
  const subtitle =
    cfg?.popupSubtitle?.trim() ||
    'Recibí las últimas novedades, ofertas exclusivas y descuentos especiales';
  const disclaimer =
    cfg?.popupDisclaimer?.trim() ||
    'Al suscribirte, aceptás recibir emails promocionales. Podés darte de baja en cualquier momento.';
  const imageUrl = cfg?.popupImageUrl?.trim();

  return (
    <>
      <div className="newsletter-overlay" onClick={handleCloseDismiss} />
      <div className={`newsletter-popup${imageUrl ? ' newsletter-popup--wide' : ''}`}>
        <button type="button" className="newsletter-close" onClick={handleCloseDismiss}>
          ✕
        </button>

        <div className="newsletter-body">
          {imageUrl ? (
            <div className="newsletter-visual">
              <StoreImage
                src={imageUrl}
                alt=""
                fill
                className="newsletter-side-img"
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 640px) 100vw, 42vw"
              />
            </div>
          ) : null}
          <div className="newsletter-content">
            <h2>{title}</h2>
            <p className="newsletter-lead">{subtitle}</p>

            <form onSubmit={handleSubmit} className="newsletter-form">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={isSubmitting}
              />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'ENVIANDO...' : 'SUSCRIBIRME'}
              </button>
            </form>

            {message && <p className="newsletter-message">{message}</p>}

            <p className="newsletter-disclaimer">{disclaimer}</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .newsletter-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 10000;
          animation: nlFadeIn 0.3s ease;
        }
        .newsletter-popup {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          z-index: 10001;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow: auto;
          padding: 0;
          animation: nlSlideUp 0.4s ease;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .newsletter-popup--wide {
          max-width: 720px;
        }
        @keyframes nlFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes nlSlideUp {
          from {
            transform: translate(-50%, -40%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%);
            opacity: 1;
          }
        }
        .newsletter-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 22px;
          cursor: pointer;
          color: #999;
          transition: color 0.2s;
          z-index: 2;
        }
        .newsletter-close:hover {
          color: #000;
        }
        .newsletter-body {
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 640px) {
          .newsletter-popup--wide .newsletter-body {
            flex-direction: row;
            align-items: stretch;
            min-height: 280px;
          }
        }
        .newsletter-visual {
          position: relative;
          flex: 0 0 42%;
          min-height: 200px;
          background: #f4f4f4;
          overflow: hidden;
        }
        @media (min-width: 640px) {
          .newsletter-popup:not(.newsletter-popup--wide) .newsletter-visual {
            display: none;
          }
        }
        .newsletter-side-img {
          width: 100%;
          height: 100%;
          min-height: 200px;
          object-fit: cover;
          display: block;
        }
        @media (min-width: 640px) {
          .newsletter-popup--wide .newsletter-side-img {
            min-height: 100%;
          }
        }
        .newsletter-content {
          text-align: center;
          padding: 48px 32px 40px;
          flex: 1;
        }
        .newsletter-popup--wide .newsletter-content {
          padding: 40px 28px 36px;
        }
        .newsletter-content h2 {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 2px;
          margin: 0 0 12px 0;
          line-height: 1.35;
        }
        .newsletter-content .newsletter-lead {
          font-size: 14px;
          color: #666;
          margin: 0 0 24px 0;
          line-height: 1.6;
        }
        .newsletter-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }
        .newsletter-form input {
          padding: 16px 18px;
          border: 1px solid #e0e0e0;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          text-align: center;
        }
        .newsletter-form input:focus {
          border-color: #000;
        }
        .newsletter-form button {
          background: #000;
          color: #fff;
          border: none;
          padding: 16px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .newsletter-form button:hover:not(:disabled) {
          background: #333;
        }
        .newsletter-form button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .newsletter-message {
          color: #2e7d32;
          font-size: 13px;
          font-weight: 600;
          margin: 12px 0;
        }
        .newsletter-disclaimer {
          font-size: 11px;
          color: #999;
          margin: 0;
          line-height: 1.5;
        }
        @media (max-width: 600px) {
          .newsletter-content {
            padding: 44px 22px 32px;
          }
          .newsletter-content h2 {
            font-size: 13px;
          }
          .newsletter-content .newsletter-lead {
            font-size: 13px;
          }
        }
      `}} />
    </>
  );
}

export default function NewsletterPopup() {
  return (
    <Suspense fallback={null}>
      <NewsletterPopupContent />
    </Suspense>
  );
}
