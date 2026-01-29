import Link from 'next/link';

interface FooterProps {
  logo?: string;
  storeName?: string;
}

export default function Footer({ logo, storeName = 'DIRECHENTT' }: FooterProps) {
  return (
    <>
      <footer className="scuffers-footer">
        <div className="footer-wrapper">
          {/* NEWSLETTER */}
          <section className="newsletter-section">
            <div className="newsletter-content">
              <h3 className="newsletter-title">Newsletter</h3>
              <p className="newsletter-subtitle">Suscríbete y consigue un 10%</p>
              <p className="newsletter-desc">Recibe novedades sobre las colecciones, reposiciones, eventos y ofertas.</p>
              
              <form className="newsletter-form">
                <input 
                  type="email" 
                  placeholder="Tu email" 
                  className="newsletter-input" 
                  required 
                />
                <button type="submit" className="newsletter-btn">Suscribirse</button>
              </form>
            </div>
          </section>

          {/* DIVIDER */}
          <hr className="footer-divider" />

          {/* FOOTER CONTENT */}
          <div className="footer-content">
            <div className="footer-column">
              <h4 className="footer-heading">Contáctanos</h4>
              <ul className="footer-links">
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
            {logo && <img src={logo} alt={storeName} className="footer-logo" />}
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
          text-align: center;
        }
        .newsletter-content {
          max-width: 600px;
          margin: 0 auto;
        }
        .newsletter-title {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 5px 0;
          letter-spacing: 0.5px;
        }
        .newsletter-subtitle {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 10px 0;
          color: #000;
        }
        .newsletter-desc {
          font-size: 12px;
          color: #666;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }
        .newsletter-form {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .newsletter-input {
          flex: 1;
          padding: 10px 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
          font-family: inherit;
        }
        .newsletter-input::placeholder {
          color: #999;
        }
        .newsletter-btn {
          padding: 10px 20px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.5px;
        }
        .newsletter-btn:hover {
          background: #333;
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
      `}} />
    </>
  );
}
