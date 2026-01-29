interface HeroSectionProps {
  banners: string[];
}

export default function HeroSection({ banners }: HeroSectionProps) {
  return (
    <>
      <section className="hero-section">
        <div className="hero-carousel">
          <div className="carousel-track">
            {banners.map((banner, idx) => (
              <img key={idx} src={banner} alt={`Banner ${idx + 1}`} className="carousel-slide" loading="eager" />
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
        .carousel-slide {
          min-width: 100%;
          height: 100%;
          object-fit: cover;
          scroll-snap-align: start;
          display: block;
        }
      `}} />
    </>
  );
}
