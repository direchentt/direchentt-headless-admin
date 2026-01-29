import Link from 'next/link';

interface FeaturedSectionProps {
  storeId: string;
  categories?: any[];
}

export default function FeaturedSection({ storeId, categories = [] }: FeaturedSectionProps) {
  // Usar las imágenes locales para las categorías
  const featuredCategories = [
    {
      name: 'MUJER',
      image: '/banners/bannermujervertical.png',
      link: `/categoria/32586185?shop=${storeId}`
    },
    {
      name: 'HOMBRE', 
      image: '/banners/bannervertical.jpg',
      link: `/categoria/32586186?shop=${storeId}`
    },
    {
      name: 'ACCESORIOS',
      image: '/banners/biginjapancoll.jpg',
      link: `/categoria/32586187?shop=${storeId}`
    }
  ];

  return (
    <>
      <section className="featured-section">
        <div className="featured-grid">
          {featuredCategories.map((cat, idx) => (
            <Link key={idx} href={cat.link} className="featured-card">
              <div className="featured-image" style={{ backgroundImage: `url(${cat.image})` }} />
              <div className="featured-overlay">
                <span className="card-label">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .featured-section {
          padding: 0;
          background: #fff;
        }
        .featured-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
        }
        @media (max-width: 768px) {
          .featured-grid {
            grid-template-columns: 1fr;
          }
        }
        .featured-card {
          position: relative;
          height: 600px;
          overflow: hidden;
          cursor: pointer;
          background: #f4f4f4;
          display: block;
          text-decoration: none;
        }
        @media (max-width: 768px) {
          .featured-card {
            height: 450px;
          }
        }
        .featured-image {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: transform 1.2s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .featured-card:hover .featured-image {
          transform: scale(1.08);
        }
        .featured-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 50%);
        }
        .card-label {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 3px;
          text-transform: uppercase;
          background: #fff;
          color: #000;
          padding: 16px 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        }
        .featured-card:hover .card-label {
          background: #000;
          color: #fff;
        }
      `}} />
    </>
  );
}
