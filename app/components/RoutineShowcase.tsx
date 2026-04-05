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

  return (
    <section className="routine-root" aria-label={title}>
      <div className="routine-card">
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

        <div className="routine-panel">
          <header className="routine-head">
            <h2 className="routine-title">{title}</h2>
            <p className="routine-sub">{subtitle}</p>
          </header>

          <div className="routine-stage" aria-live="polite">
            <div className="routine-swatch-block" key={active}>
              <div className="routine-callout" key={`tip-${active}`}>
                <span className="routine-line" aria-hidden />
                <div className="routine-callout-text">
                  <Link
                    href={`/product/${safe.productId}?${shopQ}`}
                    className="routine-prod-name"
                  >
                    {safe.productName}
                  </Link>
                  <p className="routine-tip">{safe.tip}</p>
                </div>
              </div>
              <div className="routine-swatch" key={`sw-${active}`}>
                {safe.swatchImage ? (
                  <StoreImage
                    src={safe.swatchImage}
                    alt=""
                    width={280}
                    height={200}
                    className="routine-swatch-img"
                    style={{ objectFit: 'cover', width: '100%', height: 'auto', maxHeight: 200 }}
                    sizes="(max-width: 600px) 70vw, 280px"
                    loading="lazy"
                  />
                ) : (
                  <div className="routine-swatch-ph" />
                )}
              </div>
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
          padding: 56px 20px 72px;
          background: #f4f2ef;
        }
        .routine-card {
          max-width: 1120px;
          margin: 0 auto;
          background: #eeece8;
          border-radius: 20px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr;
          box-shadow: 0 12px 40px rgba(0,0,0,0.06);
        }
        @media (min-width: 900px) {
          .routine-card {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
            min-height: 420px;
          }
        }
        .routine-visual-col {
          position: relative;
          min-height: 320px;
          background: #e0ddd8;
        }
        @media (min-width: 900px) {
          .routine-visual-col {
            min-height: 100%;
          }
        }
        .routine-hero-wrap {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .routine-hero-wrap--on {
          opacity: 1;
          pointer-events: auto;
          z-index: 1;
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
          padding: 28px 22px 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 20px;
        }
        @media (min-width: 900px) {
          .routine-panel {
            padding: 36px 40px 40px;
          }
        }
        .routine-title {
          font-size: clamp(22px, 3.2vw, 30px);
          font-weight: 600;
          letter-spacing: -0.02em;
          margin: 0 0 8px 0;
          line-height: 1.15;
          color: #1a1a1a;
        }
        .routine-sub {
          margin: 0;
          font-size: 14px;
          color: #5c5c5c;
          line-height: 1.45;
          max-width: 32em;
        }
        .routine-stage {
          flex: 1;
          display: flex;
          align-items: center;
          min-height: 200px;
        }
        .routine-swatch-block {
          width: 100%;
          animation: routineFadeSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1);
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
          gap: 12px;
          margin-bottom: 18px;
        }
        .routine-line {
          flex: 0 0 48px;
          height: 1px;
          background: #1a1a1a;
          margin-top: 10px;
          position: relative;
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
          background: #1a1a1a;
        }
        .routine-prod-name {
          font-size: 15px;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
          color: #1a1a1a;
        }
        .routine-prod-name:hover {
          color: #000;
        }
        .routine-tip {
          margin: 8px 0 0 0;
          font-size: 13px;
          line-height: 1.55;
          color: #4a4a4a;
        }
        .routine-swatch {
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          max-width: 320px;
        }
        .routine-swatch-ph {
          height: 180px;
          background: #ddd9d4;
        }
        .routine-steps {
          display: flex;
          flex-wrap: wrap;
          gap: 12px 16px;
          justify-content: flex-start;
          padding-top: 8px;
          border-top: 1px solid rgba(0,0,0,0.08);
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
          background: #c4a4a0;
          border-color: #c4a4a0;
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
