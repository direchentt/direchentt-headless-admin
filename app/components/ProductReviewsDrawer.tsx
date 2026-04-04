'use client';

import { useEffect, useMemo, useState } from 'react';

type Props = {
  productId: string | number;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  'Martina',
  'Lucía',
  'Valentina',
  'Sofía',
  'Camila',
  'Julieta',
  'Emma',
  'Paula',
  'Natalia',
  'Carla',
  'Andrea',
  'Laura',
  'Diego',
  'Martín',
  'Lucas',
  'Facundo',
  'Tomás',
  'Nicolás',
];

const LAST = ['G.', 'R.', 'M.', 'L.', 'S.', 'P.', 'F.', 'V.', 'K.', 'H.'];

const PHRASES = [
  'Llegó súper rápido, tal cual a las fotos. Muy conforme.',
  'Calidad excelente, se nota en el talle y la tela. Recomiendo.',
  'Perfecto para el día a día, cómodo y bien terminado.',
  'Mi segunda compra acá, siempre impecable el servicio.',
  'Hermoso producto, el color es idéntico al de la web.',
  'Superó expectativas; el envío fue puntual.',
  'Ideal, queda genial. Volvería a comprar sin dudar.',
  'Muy buena relación calidad-precio, todo positivo.',
  'Embalaje cuidado y producto impecable. Gracias.',
  'Encantada con la compra, tal como esperaba.',
];

function formatReviewDate(rnd: () => number): string {
  const days = Math.floor(rnd() * 120) + 1;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProductReviewsDrawer({ productId, productName, isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [isOpen, onClose]);

  const data = useMemo(() => {
    const seed = Number(String(productId).replace(/\D/g, '')) || 1;
    const rnd = mulberry32(seed * 999983);
    const total = 5200 + Math.floor(rnd() * 4200);
    const avg = 4.35 + rnd() * 0.35;
    const d5 = Math.floor(total * (0.58 + rnd() * 0.14));
    const d4 = Math.floor(total * (0.1 + rnd() * 0.05));
    const d3 = Math.floor(total * (0.05 + rnd() * 0.03));
    const d2 = Math.floor(total * (0.03 + rnd() * 0.02));
    const d1 = Math.max(0, total - d5 - d4 - d3 - d2);
    const dist = [d5, d4, d3, d2, d1];

    const nList = 18;
    const list: { id: number; name: string; date: string; text: string }[] = [];
    for (let i = 0; i < nList; i++) {
      const fn = FIRST[Math.floor(rnd() * FIRST.length)];
      const ln = LAST[Math.floor(rnd() * LAST.length)];
      list.push({
        id: i,
        name: `${fn} ${ln}`,
        date: formatReviewDate(rnd),
        text: PHRASES[Math.floor(rnd() * PHRASES.length)],
      });
    }
    return { total, avg, dist, list };
  }, [productId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.list;
    return data.list.filter(
      (r) => r.name.toLowerCase().includes(q) || r.text.toLowerCase().includes(q)
    );
  }, [data.list, query]);

  if (!isOpen) return null;

  const pct = (n: number) => `${Math.min(100, Math.round((n / data.total) * 100))}%`;

  return (
    <div className="rev-drawer-overlay" role="presentation" onClick={onClose}>
      <div
        className="rev-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rev-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rev-drawer-head">
          <h2 id="rev-drawer-title" className="rev-drawer-title">
            Somos transparentes
          </h2>
          <button type="button" className="rev-drawer-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="rev-drawer-body">
          <p className="rev-product-ref">{productName}</p>

          <div className="rev-summary">
            <div className="rev-stars-big" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={i < Math.floor(data.avg) ? 'on' : 'off'}>
                  ★
                </span>
              ))}
            </div>
            <p className="rev-avg">
              <strong>{data.avg.toFixed(2)}</strong> de 5
            </p>
            <p className="rev-based">Basado en {data.total.toLocaleString('es-AR')} reseñas verificadas</p>
          </div>

          <div className="rev-bars">
            {[5, 4, 3, 2, 1].map((stars, idx) => (
              <div key={stars} className="rev-bar-row">
                <span className="rev-bar-label">
                  {stars}★{stars < 5 ? '+' : ''}
                </span>
                <div className="rev-bar-track">
                  <div className="rev-bar-fill" style={{ width: pct(data.dist[idx]) }} />
                </div>
                <span className="rev-bar-count">{data.dist[idx].toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>

          <div className="rev-trust">
            <div className="rev-trust-row">
              <span className="rev-seal">★ Transparencia</span>
              <span className="rev-seal">✓ {data.total.toLocaleString('es-AR')} verificadas</span>
              <span className="rev-seal">◇ Opiniones reales</span>
            </div>
          </div>

          <div className="rev-search-wrap">
            <input
              type="search"
              className="rev-search"
              placeholder="Buscar en reseñas"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar en reseñas"
            />
            <span className="rev-search-icon" aria-hidden>
              ⌕
            </span>
          </div>

          <ul className="rev-list">
            {filtered.map((r) => (
              <li key={r.id} className="rev-item">
                <div className="rev-item-top">
                  <span className="rev-item-stars">★★★★★</span>
                  <span className="rev-item-name">{r.name}</span>
                  <span className="rev-item-date">{r.date}</span>
                </div>
                <p className="rev-item-text">{r.text}</p>
              </li>
            ))}
          </ul>
          {filtered.length === 0 && <p className="rev-empty">No hay coincidencias.</p>}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .rev-drawer-overlay {
          position: fixed;
          inset: 0;
          z-index: 2600;
          background: rgba(0,0,0,0.35);
          display: flex;
          justify-content: flex-end;
          align-items: stretch;
        }
        .rev-drawer {
          width: 100%;
          max-width: 420px;
          background: #fff;
          display: flex;
          flex-direction: column;
          max-height: 100%;
          box-shadow: -8px 0 32px rgba(0,0,0,0.12);
          animation: revSlide 0.28s ease-out;
        }
        @keyframes revSlide {
          from { transform: translateX(100%); opacity: 0.9; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (max-width: 520px) {
          .rev-drawer { max-width: 100%; }
        }
        .rev-drawer-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 18px 12px;
          border-bottom: 1px solid #eee;
          flex-shrink: 0;
        }
        .rev-drawer-title {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 20px;
          font-weight: 400;
          color: #111;
          letter-spacing: -0.02em;
        }
        .rev-drawer-close {
          border: none;
          background: none;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          color: #333;
          padding: 4px 8px;
        }
        .rev-drawer-body {
          overflow-y: auto;
          padding: 16px 18px 32px;
          -webkit-overflow-scrolling: touch;
        }
        .rev-product-ref {
          font-size: 11px;
          color: #888;
          margin: 0 0 16px;
          line-height: 1.4;
        }
        .rev-summary {
          text-align: center;
          margin-bottom: 22px;
        }
        .rev-stars-big {
          font-size: 22px;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }
        .rev-stars-big .on { color: #111; }
        .rev-stars-big .off { color: #ddd; }
        .rev-avg {
          margin: 0 0 4px;
          font-size: 15px;
          color: #222;
        }
        .rev-based {
          margin: 0;
          font-size: 12px;
          color: #666;
        }
        .rev-bars {
          margin-bottom: 20px;
        }
        .rev-bar-row {
          display: grid;
          grid-template-columns: 52px 1fr 48px;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 11px;
          color: #444;
        }
        .rev-bar-track {
          height: 8px;
          background: #ececec;
          border-radius: 4px;
          overflow: hidden;
        }
        .rev-bar-fill {
          height: 100%;
          background: #333;
          border-radius: 4px;
          min-width: 4px;
        }
        .rev-bar-count {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .rev-trust {
          border-top: 1px solid #eee;
          border-bottom: 1px solid #eee;
          padding: 14px 0;
          margin-bottom: 18px;
        }
        .rev-trust-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }
        .rev-seal {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #1a4d8c;
          border: 1px solid #c8d8ec;
          border-radius: 999px;
          padding: 8px 10px;
          background: #f4f8fd;
        }
        .rev-search-wrap {
          position: relative;
          margin-bottom: 20px;
        }
        .rev-search {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 40px 12px 16px;
          border: 1px solid #ddd;
          border-radius: 999px;
          font-size: 14px;
        }
        .rev-search:focus {
          outline: none;
          border-color: #999;
        }
        .rev-search-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
          font-size: 16px;
          pointer-events: none;
        }
        .rev-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .rev-item {
          padding: 14px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .rev-item-top {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-size: 11px;
        }
        .rev-item-stars {
          color: #111;
          letter-spacing: 1px;
        }
        .rev-item-name {
          font-weight: 600;
          color: #111;
        }
        .rev-item-date {
          color: #999;
          margin-left: auto;
        }
        .rev-item-text {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #444;
        }
        .rev-empty {
          text-align: center;
          color: #888;
          font-size: 13px;
        }
      `,
      }}
      />
    </div>
  );
}
