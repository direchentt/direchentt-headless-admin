"use client";
import { useEffect, useState } from 'react';

export default function EmailPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-modal popup-border">
        <div className="popup-content">
          <div className="popup-left">
            <h2 className="popup-title">WANT A <span style={{color:'#1a1a1a'}}>10% DISCOUNT?</span></h2>
            <p className="popup-desc">Sign up to get exclusive discounts, early access to collections, and much more.</p>
            <p className="popup-desc2"><em>Where would you like to receive your code?</em></p>
            {submitted ? (
              <div className="popup-success">Check your email for your code!</div>
            ) : (
              <form onSubmit={e => {e.preventDefault(); setSubmitted(true);}}>
                <input 
                  type="email" 
                  className="popup-input" 
                  placeholder="Enter your email address" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button className="popup-btn" type="submit">SEND 10% OFF</button>
              </form>
            )}
            <button className="popup-close" onClick={() => setShow(false)} aria-label="Cerrar">&times;</button>
            <div className="popup-no-thanks" onClick={() => setShow(false)}>No thanks, I hate discounts</div>
            <div className="popup-taxes">*ALL TAXES INCLUDED*</div>
          </div>
          <div className="popup-right">
            <img src="https://d3k81ch9hvuctc.cloudfront.net/company/VgMQZ7/images/852f73c8-4215-4531-8b43-de35e603cce9.jpeg" alt="Popup visual" className="popup-img" />
          </div>
        </div>
      </div>
      <style jsx>{`
        .popup-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.25);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .popup-modal {
          background: #fff;
          max-width: 600px;
          width: 95vw;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          box-shadow: 0 8px 40px rgba(0,0,0,0.18);
        }
        .popup-border {
          border: 2.5px solid #111;
        }
        .popup-content {
          display: flex;
          width: 100%;
        }
        .popup-left {
          flex: 1;
          padding: 32px 24px 24px 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
        }
        .popup-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: #111;
        }
        .popup-desc {
          font-size: 1rem;
          margin-bottom: 8px;
          color: #222;
        }
        .popup-desc2 {
          font-size: 0.95rem;
          margin-bottom: 12px;
          color: #444;
        }
        .popup-input {
          width: 100%;
          padding: 10px 12px;
          font-size: 1rem;
          border: 1.5px solid #111;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        .popup-btn {
          width: 100%;
          background: #1a1a1a;
          color: #fff;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          border-radius: 6px;
          padding: 10px 0;
          cursor: pointer;
          margin-bottom: 8px;
        }
        .popup-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #222;
          cursor: pointer;
        }
        .popup-no-thanks {
          font-size: 0.95rem;
          color: #888;
          text-align: center;
          margin-top: 4px;
          cursor: pointer;
          text-decoration: underline;
        }
        .popup-taxes {
          font-size: 0.8rem;
          color: #888;
          text-align: center;
          margin-top: 10px;
        }
        .popup-success {
          color: #1a1a1a;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .popup-right {
          flex: 1;
          background: #eee;
          display: flex;
          align-items: stretch;
        }
        .popup-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        @media (max-width: 600px) {
          .popup-content { flex-direction: column; }
          .popup-right { display: none; }
          .popup-left { padding: 24px 12px 18px 12px; }
        }
      `}</style>
    </div>
  );
}
