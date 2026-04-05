'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatPrice } from '@/lib/product-utils';
import type { PublicCheckoutReceipt } from '@/lib/checkout-receipt';

const DEFAULT_SHOP = process.env.NEXT_PUBLIC_DEFAULT_SHOP || '5112334';

export default function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const paymentId =
    searchParams.get('payment_id')?.trim() ||
    searchParams.get('collection_id')?.trim() ||
    '';
  const mpStatus = searchParams.get('status')?.trim() || searchParams.get('collection_status')?.trim() || '';

  const [receipt, setReceipt] = useState<PublicCheckoutReceipt | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!paymentId);

  useEffect(() => {
    localStorage.removeItem('cart');
  }, []);

  useEffect(() => {
    if (!paymentId) {
      setLoading(false);
      return;
    }
    let cancel = false;
    void (async () => {
      try {
        const r = await fetch(`/api/checkout/order-receipt?payment_id=${encodeURIComponent(paymentId)}`);
        const data = (await r.json()) as { ok?: boolean; receipt?: PublicCheckoutReceipt; error?: string };
        if (cancel) return;
        if (r.ok && data.ok && data.receipt) {
          setReceipt(data.receipt);
        } else {
          setLoadErr(data.error || 'No se pudo cargar el detalle del pago.');
        }
      } catch {
        if (!cancel) setLoadErr('Error de red al cargar el comprobante.');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [paymentId]);

  const home = `/?shop=${encodeURIComponent(receipt?.storeId ? String(receipt.storeId) : DEFAULT_SHOP)}`;

  if (!paymentId) {
    return (
      <div className="cs-page">
        <div className="cs-card cs-card--narrow">
          <div className="cs-icon cs-icon--muted">✓</div>
          <h1 className="cs-title">Gracias por tu compra</h1>
          <p className="cs-lead">
            Si pagaste con Mercado Pago, el comprobante llega por mail. Si no ves el detalle acá, revisá tu correo
            o el listado de movimientos en Mercado Pago.
          </p>
          <Link href={home} className="cs-btn">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cs-page cs-page--center">
        <div className="cs-spinner" aria-hidden />
        <p className="cs-loading-text">Preparando tu comprobante…</p>
      </div>
    );
  }

  if (loadErr || !receipt) {
    return (
      <div className="cs-page">
        <div className="cs-card cs-card--narrow">
          <div className="cs-icon cs-icon--warn">!</div>
          <h1 className="cs-title">Casi listo</h1>
          <p className="cs-lead">{loadErr || 'Todavía estamos sincronizando tu pago.'}</p>
          <p className="cs-meta">Referencia de pago: {paymentId}</p>
          {mpStatus ? <p className="cs-meta">Estado MP: {mpStatus}</p> : null}
          <p className="cs-hint">Si el pago fue aprobado, recibirás un correo con el resumen cuando esté confirmado.</p>
          <Link href={home} className="cs-btn">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  const approved = receipt.status === 'approved';
  const buyer = receipt.buyer;

  return (
    <div className="cs-page">
      <div className="cs-card cs-card--wide">
        <header className="cs-header">
          <div className={`cs-icon ${approved ? 'cs-icon--ok' : 'cs-icon--pending'}`}>{approved ? '✓' : '…'}</div>
          <div>
            <p className="cs-kicker">{receipt.storeLabel}</p>
            <h1 className="cs-title cs-title--inline">{approved ? 'Pago confirmado' : 'Estado del pago'}</h1>
            <p className="cs-sub">
              Gracias por tu compra. Guardá esta página o el mail de confirmación como comprobante.
            </p>
          </div>
        </header>

        <section className="cs-section cs-grid">
          <div>
            <h2 className="cs-h2">Pedido y pago</h2>
            <dl className="cs-dl">
              <div>
                <dt>ID de pago (Mercado Pago)</dt>
                <dd>{receipt.paymentId}</dd>
              </div>
              {receipt.tiendanubeOrderId != null ? (
                <div>
                  <dt>Nº de pedido en tienda</dt>
                  <dd className="cs-em">#{receipt.tiendanubeOrderId}</dd>
                </div>
              ) : null}
              <div>
                <dt>Medio de pago</dt>
                <dd>Mercado Pago · {receipt.paymentMethodId || '—'}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{receipt.status}{receipt.statusDetail ? ` · ${receipt.statusDetail}` : ''}</dd>
              </div>
              {receipt.dateApproved ? (
                <div>
                  <dt>Fecha de acreditación</dt>
                  <dd>{new Date(receipt.dateApproved).toLocaleString('es-AR')}</dd>
                </div>
              ) : null}
              <div>
                <dt>Total abonado</dt>
                <dd className="cs-total">{formatPrice(receipt.total)}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="cs-h2">Envío y contacto</h2>
            {buyer ? (
              <div className="cs-box">
                <p className="cs-strong">
                  {buyer.firstName} {buyer.lastName}
                </p>
                <p className="cs-muted">{buyer.email}</p>
                <p className="cs-muted">{buyer.phone}</p>
                <p className="cs-address">
                  {buyer.address} {buyer.streetNumber}
                  {buyer.floor ? `, ${buyer.floor}` : ''}
                  <br />
                  {[buyer.locality, buyer.city, buyer.province].filter(Boolean).join(' · ')}
                  <br />
                  CP {buyer.zipcode} · {buyer.country}
                </p>
                {buyer.note ? <p className="cs-note">Nota: {buyer.note}</p> : null}
              </div>
            ) : (
              <p className="cs-muted">Datos de contacto según tu cuenta de Mercado Pago.</p>
            )}
            {receipt.shipping ? (
              <p className="cs-ship">
                <strong>Envío elegido:</strong> {receipt.shipping.label}{' '}
                {receipt.shipping.price > 0 ? `(${formatPrice(receipt.shipping.price)})` : '(gratis)'}
              </p>
            ) : null}
          </div>
        </section>

        <section className="cs-section">
          <h2 className="cs-h2">Productos</h2>
          <ul className="cs-lines">
            {receipt.lines.map((line, i) => (
              <li key={`${line.name}-${i}`} className="cs-line">
                <div className="cs-line-body">
                  <span className="cs-line-name">{line.name}</span>
                  <span className="cs-line-meta">
                    {line.quantity} × {formatPrice(line.unitPrice)}
                  </span>
                </div>
                <span className="cs-line-price">{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="cs-totals">
            <div className="cs-total-row">
              <span>Subtotal</span>
              <span>{formatPrice(receipt.subtotalProducts)}</span>
            </div>
            <div className="cs-total-row">
              <span>Envío</span>
              <span>{receipt.shippingCost > 0 ? formatPrice(receipt.shippingCost) : 'Gratis'}</span>
            </div>
            <div className="cs-total-row cs-total-row--main">
              <span>Total</span>
              <span>{formatPrice(receipt.total)}</span>
            </div>
          </div>
        </section>

        <footer className="cs-footer">
          <Link href={receipt.shopHomeUrl} className="cs-btn cs-btn--ghost">
            Seguir comprando
          </Link>
          <Link href={home} className="cs-btn">
            Inicio headless
          </Link>
        </footer>
      </div>

      <style jsx>{`
        .cs-page {
          min-height: 72vh;
          padding: 32px 16px 48px;
          background: #f4f4f5;
        }
        .cs-page--center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        .cs-spinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid #e4e4e7;
          border-top-color: #18181b;
          animation: cs-spin 0.7s linear infinite;
        }
        @keyframes cs-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .cs-loading-text {
          font-size: 14px;
          color: #52525b;
        }
        .cs-card {
          max-width: 920px;
          margin: 0 auto;
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e4e4e7;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
          padding: 28px 24px 32px;
        }
        .cs-card--narrow {
          max-width: 480px;
          text-align: center;
        }
        .cs-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          font-weight: 700;
        }
        .cs-card--wide .cs-header .cs-icon {
          margin: 0 16px 0 0;
          flex-shrink: 0;
        }
        .cs-icon--ok {
          background: #dcfce7;
          color: #166534;
        }
        .cs-icon--pending {
          background: #fef9c3;
          color: #854d0e;
        }
        .cs-icon--muted {
          background: #f4f4f5;
          color: #3f3f46;
        }
        .cs-icon--warn {
          background: #ffedd5;
          color: #c2410c;
        }
        .cs-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #09090b;
          margin: 0 0 8px;
        }
        .cs-title--inline {
          margin-bottom: 4px;
        }
        .cs-kicker {
          margin: 0 0 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #71717a;
        }
        .cs-sub {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #52525b;
        }
        .cs-lead {
          margin: 0 0 12px;
          font-size: 14px;
          line-height: 1.55;
          color: #52525b;
        }
        .cs-meta {
          font-size: 13px;
          color: #3f3f46;
          margin: 4px 0;
        }
        .cs-hint {
          font-size: 12px;
          color: #71717a;
          margin: 16px 0 20px;
          line-height: 1.45;
        }
        .cs-header {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e4e4e7;
          margin-bottom: 24px;
        }
        .cs-section {
          margin-bottom: 28px;
        }
        .cs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 768px) {
          .cs-grid {
            grid-template-columns: 1fr;
          }
        }
        .cs-h2 {
          margin: 0 0 14px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #71717a;
        }
        .cs-dl {
          margin: 0;
        }
        .cs-dl > div {
          margin-bottom: 12px;
        }
        .cs-dl dt {
          font-size: 11px;
          font-weight: 600;
          color: #a1a1aa;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 2px;
        }
        .cs-dl dd {
          margin: 0;
          font-size: 14px;
          color: #18181b;
        }
        .cs-em {
          font-weight: 700;
          font-size: 18px !important;
        }
        .cs-total {
          font-weight: 700;
          font-size: 20px !important;
        }
        .cs-box {
          padding: 14px 16px;
          background: #fafafa;
          border: 1px solid #e4e4e7;
          border-radius: 8px;
          font-size: 14px;
        }
        .cs-strong {
          margin: 0 0 6px;
          font-weight: 700;
          color: #09090b;
        }
        .cs-muted {
          margin: 0 0 4px;
          color: #52525b;
          font-size: 13px;
        }
        .cs-address {
          margin: 10px 0 0;
          line-height: 1.5;
          color: #3f3f46;
        }
        .cs-note {
          margin: 10px 0 0;
          font-size: 12px;
          color: #52525b;
        }
        .cs-ship {
          margin-top: 14px;
          font-size: 13px;
          color: #27272a;
        }
        .cs-lines {
          list-style: none;
          margin: 0;
          padding: 0;
          border-top: 1px solid #e4e4e7;
        }
        .cs-line {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid #f4f4f5;
        }
        .cs-line-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cs-line-name {
          font-size: 14px;
          font-weight: 600;
          color: #09090b;
        }
        .cs-line-meta {
          font-size: 12px;
          color: #71717a;
        }
        .cs-line-price {
          font-size: 14px;
          font-weight: 600;
          color: #09090b;
        }
        .cs-totals {
          margin-top: 20px;
          max-width: 320px;
          margin-left: auto;
        }
        .cs-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #52525b;
          margin-bottom: 8px;
        }
        .cs-total-row--main {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 2px solid #e4e4e7;
          font-weight: 700;
          font-size: 16px;
          color: #09090b;
        }
        .cs-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 8px;
        }
        .cs-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0 22px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          background: #09090b;
          color: #fff;
          border: 1px solid #09090b;
        }
        .cs-btn--ghost {
          background: #fff;
          color: #09090b;
        }
        .cs-btn:hover {
          opacity: 0.92;
        }
      `}</style>
    </div>
  );
}
