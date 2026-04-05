import Image from 'next/image';
import { normalizeStoreImageUrl } from '@/lib/store-image-url';

interface HeroSectionProps {
  banners: string[];
}

function bannerSrc(url: string): string {
  const t = url.trim();
  return normalizeStoreImageUrl(t) || t;
}

export default function HeroSection({ banners }: HeroSectionProps) {
  return (
    <>
      <section className="hero-section">
        <div className="hero-carousel">
          <div className="carousel-track">
            {banners.map((banner, idx) => (
              <div key={idx} className="carousel-slide-wrap">
                <Image
                  src={bannerSrc(banner)}
                  alt={`Banner ${idx + 1}`}
                  fill
                  className="carousel-slide"
                  sizes="100vw"
                  priority={idx === 0}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .hero-section {
          position: relative;
          width: 100%;
          aspect-ratio: 16/9;
          overflow: hidden;
          background: #f5f5f5;
        }
        .hero-carousel {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .carousel-track {
          display: flex;
          width: 100%;
          height: 100%;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
        }
        .carousel-track::-webkit-scrollbar {
          display: none;
        }
        .carousel-slide-wrap {
          min-width: 100%;
          height: 100%;
          flex-shrink: 0;
          position: relative;
          scroll-snap-align: start;
        }
        .carousel-slide {
          object-fit: cover;
          object-position: center;
        }
      `}} />
    </>
  );
}
