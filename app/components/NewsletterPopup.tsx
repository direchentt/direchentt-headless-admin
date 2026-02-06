'use client';

import { useState, useEffect } from 'react';

export default function NewsletterPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Verificar si el usuario ya cerró el popup antes
        const hasClosedPopup = localStorage.getItem('newsletter_popup_closed');
        if (hasClosedPopup) return;

        // Mostrar el popup después de 5 minutos (300000 ms)
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 300000); // 5 minutos = 300000 ms

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // Guardar en localStorage que el usuario cerró el popup
        localStorage.setItem('newsletter_popup_closed', 'true');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        // Aquí puedes agregar la lógica para enviar el email a tu backend
        // Por ahora solo simularemos el envío
        setTimeout(() => {
            setMessage('¡Gracias por suscribirte!');
            setIsSubmitting(false);
            setTimeout(() => {
                handleClose();
            }, 2000);
        }, 1000);
    };

    if (!isVisible) return null;

    return (
        <>
            <div className="newsletter-overlay" onClick={handleClose} />
            <div className="newsletter-popup">
                <button className="newsletter-close" onClick={handleClose}>✕</button>

                <div className="newsletter-content">
                    <h2>SUSCRIBITE A NUESTRO NEWSLETTER</h2>
                    <p>Recibí las últimas novedades, ofertas exclusivas y descuentos especiales</p>

                    <form onSubmit={handleSubmit} className="newsletter-form">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            required
                            disabled={isSubmitting}
                        />
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'ENVIANDO...' : 'SUSCRIBIRME'}
                        </button>
                    </form>

                    {message && <p className="newsletter-message">{message}</p>}

                    <p className="newsletter-disclaimer">
                        Al suscribirte, aceptás recibir emails de HACHE. Podés darte de baja en cualquier momento.
                    </p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .newsletter-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 10000;
          animation: fadeIn 0.3s ease;
        }
        .newsletter-popup {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          z-index: 10001;
          width: 90%;
          max-width: 500px;
          padding: 50px 40px;
          animation: slideUp 0.4s ease;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            transform: translate(-50%, -40%); 
            opacity: 0; 
          }
          to { 
            transform: translate(-50%, -50%); 
            opacity: 1; 
          }
        }
        .newsletter-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
          transition: color 0.2s;
        }
        .newsletter-close:hover {
          color: #000;
        }
        .newsletter-content {
          text-align: center;
        }
        .newsletter-content h2 {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 3px;
          margin: 0 0 15px 0;
        }
        .newsletter-content > p {
          font-size: 14px;
          color: #666;
          margin: 0 0 30px 0;
          line-height: 1.6;
        }
        .newsletter-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        .newsletter-form input {
          padding: 18px 20px;
          border: 1px solid #e0e0e0;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          text-align: center;
        }
        .newsletter-form input:focus {
          border-color: #000;
        }
        .newsletter-form button {
          background: #000;
          color: #fff;
          border: none;
          padding: 18px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .newsletter-form button:hover:not(:disabled) {
          background: #333;
        }
        .newsletter-form button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .newsletter-message {
          color: #2e7d32;
          font-size: 13px;
          font-weight: 600;
          margin: 15px 0;
        }
        .newsletter-disclaimer {
          font-size: 11px;
          color: #999;
          margin: 0;
          line-height: 1.5;
        }
        
        @media (max-width: 600px) {
          .newsletter-popup {
            padding: 40px 25px;
          }
          .newsletter-content h2 {
            font-size: 14px;
          }
          .newsletter-content > p {
            font-size: 13px;
          }
        }
      `}} />
        </>
    );
}
