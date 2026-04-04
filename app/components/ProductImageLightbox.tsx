'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type LightboxImage = { id: string | number; src: string };

type Props = {
  images: LightboxImage[];
  productName: string;
  isOpen: boolean;
  initialIndex: number;
  onClose: () => void;
};

/**
 * Vista ampliada tipo EME: fondo neutro, scroll vertical de imágenes,
 * miniaturas fijas a la izquierda, sin precios ni cucardas.
 */
export default function ProductImageLightbox({
  images,
  productName,
  isOpen,
  initialIndex,
  onClose,
}: Props) {
  const [active, setActive] = useState(initialIndex);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setActive(initialIndex);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, initialIndex]);

  const updateActiveFromScroll = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    const rootRect = root.getBoundingClientRect();
    const midY = rootRect.top + rootRect.height * 0.38;
    let best = 0;
    let bestDist = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const c = r.top + r.height / 2;
      const d = Math.abs(c - midY);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => {
      itemRefs.current[initialIndex]?.scrollIntoView({ block: 'start', behavior: 'auto' });
      updateActiveFromScroll();
    }, 0);
    return () => window.clearTimeout(t);
  }, [isOpen, initialIndex, updateActiveFromScroll]);

  useEffect(() => {
    if (!isOpen) return;
    let root: HTMLDivElement | null = null;
    const id = requestAnimationFrame(() => {
      root = scrollRef.current;
      root?.addEventListener('scroll', updateActiveFromScroll, { passive: true });
      updateActiveFromScroll();
    });
    return () => {
      cancelAnimationFrame(id);
      root?.removeEventListener('scroll', updateActiveFromScroll);
      scrollRef.current?.removeEventListener('scroll', updateActiveFromScroll);
    };
  }, [isOpen, updateActiveFromScroll, images.length]);

  const scrollToIndex = (i: number) => {
    itemRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="pdp-lb" role="dialog" aria-modal="true" aria-label="Galería de imágenes">
      <button type="button" className="pdp-lb-close" onClick={onClose} aria-label="Cerrar">
        ×
      </button>

      <div className="pdp-lb-body">
        <div className="pdp-lb-thumbs" aria-hidden={false}>
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              className={`pdp-lb-thumb ${i === active ? 'active' : ''}`}
              onClick={() => scrollToIndex(i)}
              aria-label={`Imagen ${i + 1}`}
              aria-current={i === active ? 'true' : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" />
            </button>
          ))}
        </div>

        <div className="pdp-lb-scroll" ref={scrollRef}>
          {images.map((img, i) => (
            <div
              key={img.id}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="pdp-lb-slide"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={`${productName} — ${i + 1}`} />
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .pdp-lb {
          position: fixed;
          inset: 0;
          z-index: 2500;
          background: #fff;
          display: flex;
          flex-direction: column;
        }
        .pdp-lb-close {
          position: absolute;
          top: max(12px, env(safe-area-inset-top));
          right: max(12px, env(safe-area-inset-right));
          z-index: 2510;
          width: 44px;
          height: 44px;
          border: none;
          background: rgba(255,255,255,0.92);
          border-radius: 50%;
          font-size: 28px;
          line-height: 1;
          font-weight: 300;
          color: #111;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .pdp-lb-body {
          flex: 1;
          display: flex;
          min-height: 0;
          padding-top: env(safe-area-inset-top);
        }
        .pdp-lb-thumbs {
          width: 52px;
          flex-shrink: 0;
          padding: 52px 4px 16px 6px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          background: #fafafa;
          border-right: 1px solid #eee;
        }
        .pdp-lb-thumb {
          width: 44px;
          height: 44px;
          padding: 0;
          border: 2px solid transparent;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          background: #fff;
          flex-shrink: 0;
        }
        .pdp-lb-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .pdp-lb-thumb.active {
          border-color: #222;
        }
        .pdp-lb-scroll {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: y proximity;
          background: #fff;
          padding-top: 48px;
          padding-bottom: max(16px, env(safe-area-inset-bottom));
        }
        .pdp-lb-slide {
          scroll-snap-align: start;
          width: 100%;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          background: #fff;
        }
        .pdp-lb-slide + .pdp-lb-slide {
          margin-top: 2px;
        }
        .pdp-lb-slide img {
          width: 100%;
          height: auto;
          display: block;
        }
      `,
      }}
      />
    </div>
  );
}
