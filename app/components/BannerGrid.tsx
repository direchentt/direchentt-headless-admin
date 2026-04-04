import Link from 'next/link';
import type { HomeBannerSplitStored } from '@/lib/storefront-config';

interface BannerGridProps {
  storeId: string;
  variant?: 'split' | 'full';
  split?: HomeBannerSplitStored;
}

function withShopInHref(href: string, storeId: string): string {
  const h = href.trim();
  if (h.startsWith('http://') || h.startsWith('https://')) return h;
  if (h.includes('shop=')) return h;
  return h.includes('?') ? `${h}&shop=${storeId}` : `${h}?shop=${storeId}`;
}

export default function BannerGrid({ storeId, variant = 'split', split }: BannerGridProps) {
  if (variant === 'full') {
    return (
      <>
        <section className="banner-full">
          <Link href={`/categoria/32586185?shop=${storeId}`} className="banner-link">
            <img src="/banners/HOME_HORIZONTAL_DEF_2.png" alt="Collection" />
            <div className="banner-content">
              <span className="banner-subtitle">NEW COLLECTION</span>
              <h2 className="banner-title">WINTER 2026</h2>
              <span className="banner-cta">SHOP NOW</span>
            </div>
          </Link>
        </section>

        <style dangerouslySetInnerHTML={{__html: `
          .banner-full {
            position: relative;
            width: 100%;
            height: 70vh;
            min-height: 500px;
            overflow: hidden;
          }
          .banner-full .banner-link {
            display: block;
            width: 100%;
            height: 100%;
            position: relative;
          }
          .banner-full img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 1.5s ease;
          }
          .banner-full:hover img {
            transform: scale(1.05);
          }
          .banner-content {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: #fff;
            gap: 15px;
          }
          .banner-subtitle {
            font-size: 11px;
            letter-spacing: 3px;
            font-weight: 500;
          }
          .banner-title {
            font-size: 48px;
            font-weight: 800;
            letter-spacing: 5px;
            margin: 0;
          }
          .banner-cta {
            font-size: 11px;
            letter-spacing: 2px;
            font-weight: 700;
            background: #fff;
            color: #000;
            padding: 14px 35px;
            margin-top: 15px;
            transition: all 0.3s ease;
          }
          .banner-full:hover .banner-cta {
            background: #000;
            color: #fff;
          }
          @media (max-width: 768px) {
            .banner-full {
              height: 50vh;
              min-height: 350px;
            }
            .banner-title {
              font-size: 28px;
              letter-spacing: 3px;
            }
          }
        `}} />
      </>
    );
  }

  const leftUrl = split?.leftUrl?.trim() || '/banners/bannermujerhorizontal.png';
  const rightUrl = split?.rightUrl?.trim() || '/banners/banner4%20vertical.png';
  const leftHref = withShopInHref(
    split?.leftHref?.trim() || `/categoria/32586185`,
    storeId
  );
  const rightHref = withShopInHref(
    split?.rightHref?.trim() || `/categoria/32586186`,
    storeId
  );
  const leftLabel = split?.leftLabel?.trim() || 'MUJER';
  const rightLabel = split?.rightLabel?.trim() || 'HOMBRE';

  // Split variant - 2 banners lado a lado
  return (
    <>
      <section className="banner-split">
        <Link href={leftHref} className="split-item">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={leftUrl} alt="" />
          <div className="split-overlay">
            <span className="split-label">{leftLabel}</span>
            <span className="split-cta">VER COLECCIÓN →</span>
          </div>
        </Link>
        <Link href={rightHref} className="split-item">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={rightUrl} alt="" />
          <div className="split-overlay">
            <span className="split-label">{rightLabel}</span>
            <span className="split-cta">VER COLECCIÓN →</span>
          </div>
        </Link>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .banner-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
          background: #f0f0f0;
        }
        @media (max-width: 768px) {
          .banner-split {
            grid-template-columns: 1fr;
          }
        }
        .split-item {
          position: relative;
          height: 80vh;
          min-height: 500px;
          max-height: 800px;
          overflow: hidden;
          display: block;
        }
        @media (max-width: 768px) {
          .split-item {
            height: 60vh;
            min-height: 400px;
          }
        }
        .split-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          transition: transform 1.2s ease;
        }
        .split-item:hover img {
          transform: scale(1.05);
        }
        .split-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-bottom: 60px;
          background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%);
        }
        .split-label {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: 5px;
          color: #fff;
          margin-bottom: 15px;
        }
        .split-cta {
          font-size: 11px;
          letter-spacing: 2px;
          font-weight: 600;
          color: #fff;
          padding: 12px 25px;
          border: 1px solid #fff;
          transition: all 0.3s ease;
        }
        .split-item:hover .split-cta {
          background: #fff;
          color: #000;
        }
        @media (max-width: 768px) {
          .split-label {
            font-size: 24px;
          }
        }
      `}} />
    </>
  );
}
