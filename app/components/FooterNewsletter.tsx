'use client';

import { useState } from 'react';

export default function FooterNewsletter() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="newsletter-thanks" role="status">
        Gracias. Te tendremos al tanto de novedades y ofertas.
      </p>
    );
  }

  return (
    <form
      className="newsletter-form"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <label htmlFor="footer-newsletter-email" className="visually-hidden">
        Correo para newsletter
      </label>
      <input
        id="footer-newsletter-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="Tu email"
        className="newsletter-input"
        required
      />
      <button type="submit" className="newsletter-btn">
        Suscribirse
      </button>
    </form>
  );
}
