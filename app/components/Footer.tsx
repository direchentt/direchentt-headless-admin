import Image from 'next/image';
import Link from 'next/link';
import { normalizeStoreImageUrl } from '@/lib/store-image-url';
import FooterNewsletter from './FooterNewsletter';

interface FooterProps {
  logo?: string;
  storeName?: string;
  /** Para enlaces “Inicio” / checkout con contexto de tienda */
  storeId?: string;
  /** Imagen opcional del bloque newsletter (storefront) */
  newsletterImageUrl?: string | null;
}

export default function Footer({
  logo,
  storeName = 'DIRECHENTT',
  storeId,
  newsletterImageUrl,
}: FooterProps) {
  const footerLogoSrc = logo ? normalizeStoreImageUrl(logo) : null;
  const homeHref = storeId ? `/?shop=${encodeURIComponent(storeId)}` : '/';

  return (
    <>
      <footer className="scuffers-footer">
        <div className="footer-wrapper">
          {/* NEWSLETTER (un solo bloque; la home no duplica por defecto) */}
          <section className="newsletter-section" aria-labelledby="footer-newsletter-heading">
            <h2 id="footer-newsletter-heading" className="visually-hidden">
              Newsletter
            </h2>
            {storeId ? (
              <FooterNewsletter storeId={storeId} imageUrl={newsletterImageUrl} />
            ) : null}
          </section>

          {/* DIVIDER */}
          <hr className="footer-divider" />

          {/* FOOTER CONTENT */}
          <div className="footer-content">
            <div className="footer-column">
              <h4 className="footer-heading">Contáctanos</h4>
              <ul className="footer-links">
                <li>
                  <Link href={homeHref}>Inicio</Link>
                </li>
                <li><Link href="#contact">Contacto</Link></li>
                <li><Link href="#faq">FAQs</Link></li>
                <li><Link href="#chat">Live chat</Link></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">Atención al cliente</h4>
              <ul className="footer-links">
                <li><Link href="#account">Mi cuenta</Link></li>
                <li><Link href="#orders">Sigue tu pedido</Link></li>
                <li><Link href="#returns">Realiza una devolución</Link></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">Empresa</h4>
              <ul className="footer-links">
                <li><Link href="#returns">Cambios y devoluciones</Link></li>
                <li><Link href="#privacy">Política de privacidad</Link></li>
                <li><Link href="#shipping">Política de envíos</Link></li>
                <li><Link href="#terms">Términos y condiciones</Link></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">Seguinos</h4>
              <ul className="footer-links">
                <li><a href="#instagram" target="_blank" rel="noopener">Instagram</a></li>
                <li><a href="#tiktok" target="_blank" rel="noopener">TikTok</a></li>
                <li><a href="#youtube" target="_blank" rel="noopener">YouTube</a></li>
              </ul>
            </div>
          </div>

          {/* FOOTER BOTTOM */}
          <div className="footer-bottom">
            <p className="footer-copyright">{storeName} ® EVERYDAY URBAN AESTHETICS</p>
            {footerLogoSrc ? (
              <Image
                src={footerLogoSrc}
                alt={storeName}
                className="footer-logo"
                width={200}
                height={40}
                sizes="200px"
                style={{ height: 30, width: 'auto', maxWidth: 200 }}
              />
            ) : null}
            <p className="footer-tn-credit">
              <a
                href="https://www.tiendanube.com/evolucion/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Con tecnología Tiendanube Evolución
              </a>
            </p>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .scuffers-footer {
          background: #fff;
          border-top: 1px solid #f0f0f0;
          padding: 60px 20px 30px;
        }
        .footer-wrapper {
          max-width: 1400px;
          margin: 0 auto;
        }
        .newsletter-section {
          margin-bottom: 50px;
        }
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .newsletter-form {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
          justify-content: center;
        }
        @media (min-width: 480px) {
          .newsletter-form {
            flex-wrap: nowrap;
          }
        }
        .newsletter-input {
          flex: 1;
          min-width: 200px;
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .newsletter-input:hover {
          border-color: #bbb;
        }
        .newsletter-input:focus {
          outline: none;
          border-color: #111;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.08);
        }
        .newsletter-input::placeholder {
          color: #999;
        }
        .newsletter-btn {
          padding: 12px 22px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: background 0.2s, transform 0.15s;
        }
        .newsletter-btn:hover {
          background: #333;
        }
        .newsletter-btn:active {
          transform: scale(0.98);
        }
        .newsletter-btn:focus-visible {
          outline: 2px solid #111;
          outline-offset: 3px;
        }
        .newsletter-thanks {
          margin-top: 20px;
          font-size: 13px;
          font-weight: 600;
          color: #111;
          line-height: 1.5;
        }
        .footer-divider {
          border: none;
          border-top: 1px solid #f0f0f0;
          margin: 50px 0;
        }
        .footer-content {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
          margin-bottom: 50px;
        }
        @media (min-width: 768px) {
          .footer-content {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .footer-column {
          display: flex;
          flex-direction: column;
        }
        .footer-heading {
          font-size: 11px;
          font-weight: 800;
          margin: 0 0 15px 0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .footer-links {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .footer-links a {
          font-size: 12px;
          color: #666;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: #000;
        }
        .footer-links a:focus-visible {
          outline: 2px solid #111;
          outline-offset: 3px;
          border-radius: 2px;
        }
        .footer-bottom {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #f0f0f0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
        }
        .footer-copyright {
          font-size: 11px;
          color: #999;
          margin: 0;
          letter-spacing: 0.5px;
        }
        .footer-logo {
          height: 30px;
          width: auto;
        }
        .footer-tn-credit {
          margin: 10px 0 0 0;
          font-size: 11px;
          letter-spacing: 0.02em;
        }
        .footer-tn-credit a {
          color: #aaa;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-tn-credit a:hover {
          color: #666;
          text-decoration: underline;
        }
      `}} />
    </>
  );
}
