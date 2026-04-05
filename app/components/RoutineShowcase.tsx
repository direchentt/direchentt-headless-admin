'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { RoutineShowcaseStep } from '@/lib/routine-showcase';
import StoreImage from './StoreImage';

type Props = {
  storeId: string;
  title?: string;
  subtitle?: string;
  steps: RoutineShowcaseStep[];
};

/**
 * Módulo tipo Rhode “GET READY”: pasos con imagen editorial, swatch, línea guía y transiciones suaves.
 */
export default function RoutineShowcase({
  storeId,
  title = 'ARMÁ TU LOOK',
  subtitle = 'Productos clave para una rutina completa.',
  steps,
}: Props) {
  const [active, setActive] = useState(0);
  const safe = steps[active] ?? steps[0];
  const n = steps.length;

  const go = useCallback(
    (i: number) => {
      if (i >= 0 && i < n) setActive(i);
    },
    [n]
  );

  if (!safe || n < 2) return null;

  const shopQ = `shop=${encodeURIComponent(storeId)}`;
  const productHref = `/product/${safe.productId}?${shopQ}`;

  return (
    <section className="routine-root" aria-label={title}>
      <div className="routine-card">
        <Link
          href={productHref}
          className="routine-visual-link"
          aria-label={`Ver ${safe.productName} — look en escena`}
        >
          <div className="routine-visual-col">
            {steps.map((s, i) => (
              <div
                key={s.productId + String(i)}
                className={`routine-hero-wrap${i === active ? ' routine-hero-wrap--on' : ''}`}
                aria-hidden={i !== active}
              >
                {s.heroImage ? (
                  <StoreImage
                    src={s.heroImage}
                    alt=""
                    fill
                    className="routine-hero-img"
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 900px) 100vw, 44vw"
                    loading="lazy"
                  />
                ) : (
                  <div className="routine-hero-ph" />
                )}
              </div>
            ))}
          </div>
        </Link>

        <div className="routine-panel">
          <header className="routine-head">
            <h2 className="routine-title">{title}</h2>
            <p className="routine-sub">{subtitle}</p>
          </header>

          <div className="routine-stage" aria-live="polite">
            <div className="routine-swatch-block" key={active}>
              <Link
                href={productHref}
                className="routine-spotlight-link routine-spotlight-grid"
                aria-label={`Ver ${safe.productName} — ficha del producto`}
              >
                <div className="routine-swatch-large">
                  {safe.swatchImage ? (
                    <StoreImage
                      src={safe.swatchImage}
                      alt={safe.productName}
                      fill
                      className="routine-swatch-fill"
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                      sizes="(max-width: 899px) 100vw, 50vw"
                      loading="lazy"
                    />
                  ) : (
                    <div className="routine-swatch-ph" />
                  )}
                </div>
                <div className="routine-callout">
                  <span className="routine-line" aria-hidden />
                  <div className="routine-callout-text">
                    <span className="routine-prod-kicker">Producto</span>
                    <span className="routine-prod-name">{safe.productName}</span>
                    <p className="routine-tip">{safe.tip}</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <nav className="routine-steps" aria-label="Pasos de la rutina">
            {steps.map((s, i) => {
              const on = i === active;
              return (
                <button
                  key={s.productId + '-nav-' + i}
                  type="button"
                  className={`routine-step-btn${on ? ' routine-step-btn--active' : ''}`}
                  onClick={() => go(i)}
                  aria-current={on ? 'step' : undefined}
                >
                  <span className="routine-step-num">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="routine-step-label">{s.stepLabel}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .routine-root {
          padding: clamp(40px, 6vw, 72px) clamp(16px, 4vw, 28px) clamp(48px, 8vw, 88px);
          background: #fafafa;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .routine-card {
          max-width: 1180px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 16px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr;
          box-shadow: 0 8px 32px rgba(0,0,0,0.06);
          position: relative;
          animation: routineCardAmbient 9s ease-in-out infinite;
        }
        @keyframes routineCardAmbient {
          0%, 100% {
            box-shadow: 0 8px 32px rgba(0,0,0,0.06);
          }
          40% {
            box-shadow: 0 10px 40px rgba(0,0,0,0.07), 0 0 0 1px rgba(176,0,0,0.14);
          }
          55% {
            box-shadow: 0 8px 32px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06);
          }
        }
        .routine-visual-link {
          display: block;
          min-width: 0;
          text-decoration: none;
          color: inherit;
          touch-action: manipulation;
        }
        .routine-visual-link:focus-visible {
          outline: 2px solid #000;
          outline-offset: 2px;
          border-radius: 2px;
        }
        .routine-spotlight-link {
          touch-action: manipulation;
        }
        .routine-spotlight-link:focus-visible {
          outline: 2px solid #000;
          outline-offset: 4px;
          border-radius: 8px;
        }
        @media (min-width: 900px) {
          .routine-card {
            grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
            min-height: 480px;
          }
        }
        .routine-visual-col {
          position: relative;
          min-height: min(88vw, 420px);
          background: #f0f0f0;
        }
        @media (min-width: 900px) {
          .routine-visual-col {
            min-height: 480px;
            height: 100%;
          }
        }
        .routine-hero-wrap {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          transform: scale(1.045);
          filter: saturate(0.92);
          transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
            transform 0.65s cubic-bezier(0.22, 1, 0.36, 1),
            filter 0.5s ease;
        }
        .routine-hero-wrap--on {
          opacity: 1;
          pointer-events: auto;
          z-index: 1;
          transform: scale(1);
          filter: saturate(1);
        }
        .routine-hero-img {
          display: block;
        }
        .routine-hero-ph {
          width: 100%;
          height: 100%;
          background: linear-gradient(160deg, #d8d4cf, #c5c0b8);
        }
        .routine-panel {
          padding: clamp(22px, 4vw, 36px) clamp(18px, 3vw, 40px) clamp(24px, 4vw, 36px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: clamp(18px, 3vw, 26px);
        }
        .routine-head {
          position: relative;
          padding-bottom: 14px;
          margin-bottom: 2px;
        }
        .routine-head::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #000 0%, #b00000 50%, #e0e0e0 100%);
          background-size: 200% 100%;
          animation: routineAccentLine 6s ease-in-out infinite;
        }
        @keyframes routineAccentLine {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .routine-title {
          font-size: clamp(20px, 2.8vw, 26px);
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin: 0 0 10px 0;
          line-height: 1.2;
          color: #000;
        }
        .routine-sub {
          margin: 0;
          font-size: clamp(13px, 1.8vw, 14px);
          color: #555;
          line-height: 1.55;
          max-width: 36em;
        }
        .routine-stage {
          flex: 1;
          display: flex;
          align-items: stretch;
          min-height: 0;
        }
        .routine-swatch-block {
          width: 100%;
          animation: routineFadeSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .routine-spotlight-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(20px, 4vw, 28px);
          align-items: start;
          width: 100%;
        }
        @media (min-width: 900px) {
          .routine-spotlight-grid {
            grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr);
            align-items: center;
            gap: 32px;
          }
        }
        .routine-swatch-large {
          position: relative;
          width: 100%;
          min-height: min(78vw, 380px);
          max-height: 480px;
          aspect-ratio: 4 / 5;
          border-radius: 12px;
          overflow: hidden;
          background: #f5f5f5;
          border: 1px solid #ebebeb;
        }
        @media (min-width: 900px) {
          .routine-swatch-large {
            min-height: 420px;
            max-height: none;
            height: 100%;
            aspect-ratio: auto;
          }
        }
        .routine-swatch-fill {
          display: block;
        }
        @keyframes routineFadeSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .routine-callout {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 0;
        }
        .routine-line {
          flex: 0 0 40px;
          height: 1px;
          background: #000;
          margin-top: 12px;
          position: relative;
        }
        @media (min-width: 900px) {
          .routine-line {
            flex-basis: 48px;
          }
        }
        .routine-line::after {
          content: '';
          position: absolute;
          right: 0;
          top: 50%;
          transform: translate(50%, -50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #000;
        }
        .routine-prod-kicker {
          display: block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 6px;
        }
        .routine-prod-name {
          font-size: clamp(15px, 2vw, 17px);
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          text-decoration: none;
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
          color: #000;
          display: inline-block;
          line-height: 1.3;
        }
        .routine-spotlight-link:hover .routine-prod-name {
          opacity: 0.75;
        }
        .routine-tip {
          margin: 12px 0 0 0;
          font-size: clamp(13px, 1.6vw, 14px);
          line-height: 1.6;
          color: #444;
        }
        .routine-swatch-ph {
          position: absolute;
          inset: 0;
          background: linear-gradient(145deg, #ececec, #ddd);
        }
        .routine-steps {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 12px;
          justify-content: flex-start;
          padding-top: clamp(12px, 2vw, 18px);
          border-top: 1px solid #e8e8e8;
        }
        .routine-step-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          min-width: 52px;
          color: #1a1a1a;
        }
        .routine-step-btn:focus-visible {
          outline: 2px solid #1a1a1a;
          outline-offset: 3px;
          border-radius: 8px;
        }
        .routine-step-num {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          border: 1.5px solid #1a1a1a;
          transition: background 0.35s ease, color 0.35s ease, border-color 0.35s ease;
        }
        .routine-step-btn--active .routine-step-num {
          background: #000;
          border-color: #000;
          color: #fff;
        }
        .routine-step-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #666;
          max-width: 72px;
          text-align: center;
          line-height: 1.2;
        }
        .routine-step-btn--active .routine-step-label {
          color: #1a1a1a;
        }
      `,
      }}
    />
    </section>
  );
}
