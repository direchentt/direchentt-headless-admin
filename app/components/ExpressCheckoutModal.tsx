'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ExpressCheckoutBuyerInput } from '@/lib/express-checkout-buyer';
import { validateExpressCheckoutBuyer } from '@/lib/express-checkout-buyer';
import { formatPrice, parseMoney } from '@/lib/product-utils';

const FETCH_TIMEOUT_MS = 45_000;

export type ExpressCheckoutLineItem = {
  variantId?: string | number;
  id?: string | number;
  name: string;
  price: string | number;
  quantity: number;
};

type ShipOption = {
  id: string;
  label: string;
  price: number;
  title?: string;
  carrier?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  storeId: string;
  items: ExpressCheckoutLineItem[];
  /** Resumen opcional (ej. nombre del producto) */
  summary?: string;
};

const emptyForm = (): ExpressCheckoutBuyerInput => ({
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  document: '',
  address: '',
  streetNumber: '',
  floor: '',
  locality: '',
  city: '',
  province: '',
  zipcode: '',
  country: 'AR',
  note: '',
});

export default function ExpressCheckoutModal({
  open,
  onClose,
  storeId,
  items,
  summary,
}: Props) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shipOpts, setShipOpts] = useState<ShipOption[]>([]);
  const [shipLoading, setShipLoading] = useState(false);
  const [shipFetchErr, setShipFetchErr] = useState<string | null>(null);
  const [selectedShipId, setSelectedShipId] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoErr, setGeoErr] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open || !storeId) return;
    setShipLoading(true);
    setShipFetchErr(null);
    let cancel = false;
    void (async () => {
      try {
        const r = await fetch(
          `${window.location.origin}/api/checkout/shipping-options?shop=${encodeURIComponent(storeId)}`
        );
        const data = (await r.json().catch(() => ({}))) as { options?: ShipOption[] };
        if (cancel) return;
        const raw = Array.isArray(data.options) ? data.options : [];
        const opts: ShipOption[] = raw.map((o) => ({
          id: o.id,
          label: o.label,
          price: typeof o.price === 'number' ? o.price : 0,
          title: o.title,
          carrier: o.carrier ?? null,
        }));
        setShipOpts(opts);
        setSelectedShipId(opts[0]?.id ?? '');
        if (!r.ok) {
          setShipFetchErr(typeof (data as { error?: string }).error === 'string' ? (data as { error: string }).error : 'No se pudieron cargar los envíos');
        }
      } catch {
        if (!cancel) setShipFetchErr('No se pudieron cargar los envíos');
      } finally {
        if (!cancel) setShipLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [open, storeId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const update = useCallback((patch: Partial<ExpressCheckoutBuyerInput>) => {
    setForm((f) => ({ ...f, ...patch }));
  }, []);

  const fillFromGeolocation = useCallback(() => {
    setGeoErr(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoErr('Tu navegador no permite geolocalización.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(
            `${window.location.origin}/api/geocode/reverse?lat=${encodeURIComponent(String(pos.coords.latitude))}&lon=${encodeURIComponent(String(pos.coords.longitude))}`
          );
          const data = (await r.json()) as {
            ok?: boolean;
            address?: {
              address?: string;
              streetNumber?: string;
              locality?: string;
              city?: string;
              province?: string;
              zipcode?: string;
              country?: string;
            };
            error?: string;
          };
          if (!r.ok || !data.ok || !data.address) {
            setGeoErr(data.error || 'No se pudo obtener la dirección.');
            return;
          }
          const a = data.address;
          setForm((f) => ({
            ...f,
            address: (a.address || f.address).trim() || f.address,
            streetNumber: (a.streetNumber || f.streetNumber).trim() || f.streetNumber,
            locality: (a.locality ?? f.locality).trim(),
            city: (a.city || f.city).trim() || f.city,
            province: (a.province || f.province).trim() || f.province,
            zipcode: (a.zipcode || f.zipcode).trim() || f.zipcode,
            country: String(a.country || f.country || 'AR')
              .trim()
              .toUpperCase()
              .slice(0, 2) || 'AR',
          }));
        } catch {
          setGeoErr('Error al geocodificar.');
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        const code = (err as GeolocationPositionError)?.code;
        setGeoErr(
          code === 1
            ? 'Ubicación denegada. Activá el permiso en el navegador.'
            : 'No se pudo obtener tu ubicación.'
        );
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 14_000, maximumAge: 300_000 }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validateExpressCheckoutBuyer(form);
    if (v) {
      setError(v);
      return;
    }
    if (!items.length) {
      setError('No hay productos para pagar.');
      return;
    }
    const shipSel = shipOpts.find((s) => s.id === selectedShipId);
    if (!shipSel) {
      setError('Elegí un medio de envío.');
      return;
    }
    setBusy(true);
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`${window.location.origin}/api/checkout/mercadopago/preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          items,
          buyer: form,
          shipping: {
            id: shipSel.id,
            label: shipSel.label,
            price: shipSel.price,
          },
        }),
        signal: ctrl.signal,
      });
      const data = (await res.json().catch(() => ({}))) as {
        init_point?: string;
        sandbox_init_point?: string;
        error?: string;
      };
      const payUrl =
        (typeof data.init_point === 'string' && data.init_point) ||
        (typeof data.sandbox_init_point === 'string' && data.sandbox_init_point) ||
        '';
      if (res.ok && payUrl) {
        window.location.href = payUrl;
        return;
      }
      setError(
        typeof data.error === 'string' && data.error
          ? data.error
          : `No se pudo iniciar el pago (${res.status}).`
      );
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        setError('El servidor tardó demasiado en responder. Revisá tu conexión o probá de nuevo.');
      } else {
        setError('Error de red. Probá de nuevo.');
      }
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="ecm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ecm-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ecm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ecm-head">
          <div className="ecm-steps" aria-hidden="true">
            <span className="ecm-step ecm-step--on">1</span>
            <span className="ecm-step-line" />
            <span className="ecm-step ecm-step--on">2</span>
            <span className="ecm-step-line" />
            <span className="ecm-step">3</span>
          </div>
          <p className="ecm-steps-label">Datos → Envío → Pago seguro</p>
          <h2 id="ecm-title" className="ecm-title">
            Completá tu pedido
          </h2>
          <p className="ecm-sub">
            Son pocos datos. Después pasás a Mercado Pago para abonar con la tarjeta o medio que prefieras.
          </p>
          {summary ? <p className="ecm-summary">{summary}</p> : null}
          <button type="button" className="ecm-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <form className="ecm-form" onSubmit={handleSubmit}>
          <div className="ecm-section">
            <h3 className="ecm-sec-title">Tus datos</h3>
            <p className="ecm-sec-hint">Para la factura y el seguimiento del envío.</p>
            <label className="ecm-label">
              Email <span className="ecm-req">*</span>
              <input
                className="ecm-input"
                type="email"
                autoComplete="email"
                placeholder="nombre@ejemplo.com"
                value={form.email}
                onChange={(e) => update({ email: e.target.value })}
                required
              />
            </label>
            <div className="ecm-row2">
              <label className="ecm-label">
                Nombre <span className="ecm-req">*</span>
                <input
                  className="ecm-input"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(e) => update({ firstName: e.target.value })}
                  required
                />
              </label>
              <label className="ecm-label">
                Apellido <span className="ecm-req">*</span>
                <input
                  className="ecm-input"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(e) => update({ lastName: e.target.value })}
                  required
                />
              </label>
            </div>
            <div className="ecm-row2">
              <label className="ecm-label">
                Teléfono <span className="ecm-req">*</span>
                <input
                  className="ecm-input"
                  type="tel"
                  autoComplete="tel"
                  placeholder="11 1234-5678"
                  value={form.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  required
                />
              </label>
              <label className="ecm-label">
                DNI <span className="ecm-req">*</span>
                <input
                  className="ecm-input"
                  autoComplete="off"
                  inputMode="numeric"
                  value={form.document}
                  onChange={(e) => update({ document: e.target.value })}
                  required
                />
              </label>
            </div>
          </div>

          <div className="ecm-section">
            <h3 className="ecm-sec-title">¿Dónde lo enviamos?</h3>
            <div className="ecm-geo">
              <button
                type="button"
                className="ecm-geo-btn"
                onClick={fillFromGeolocation}
                disabled={geoLoading || busy}
              >
                {geoLoading ? 'Buscando ubicación…' : 'Rellenar con mi ubicación'}
              </button>
              <span className="ecm-geo-hint">Opcional: ahorra tiempo; siempre podés corregir la dirección.</span>
              {geoErr ? <p className="ecm-geo-err">{geoErr}</p> : null}
            </div>
            <div className="ecm-row2">
              <label className="ecm-label ecm-grow">
                Calle <span className="ecm-req">*</span>
                <input
                  className="ecm-input"
                  autoComplete="street-address"
                  value={form.address}
                  onChange={(e) => update({ address: e.target.value })}
                  required
                />
              </label>
              <label className="ecm-label ecm-narrow">
                Número <span className="ecm-req">*</span>
                <input
                  className="ecm-input"
                  value={form.streetNumber}
                  onChange={(e) => update({ streetNumber: e.target.value })}
                  required
                />
              </label>
            </div>
            <label className="ecm-label">
              Barrio / localidad <span className="ecm-optional">opcional</span>
              <input
                className="ecm-input"
                value={form.locality}
                onChange={(e) => update({ locality: e.target.value })}
              />
            </label>
            <div className="ecm-row2">
              <label className="ecm-label">
                Ciudad <span className="ecm-req">*</span>
                <input
                  className="ecm-input"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(e) => update({ city: e.target.value })}
                  required
                />
              </label>
              <label className="ecm-label">
                Provincia <span className="ecm-req">*</span>
                <input
                  className="ecm-input"
                  autoComplete="address-level1"
                  value={form.province}
                  onChange={(e) => update({ province: e.target.value })}
                  required
                />
              </label>
            </div>
            <div className="ecm-row2">
              <label className="ecm-label">
                Código postal <span className="ecm-req">*</span>
                <input
                  className="ecm-input"
                  autoComplete="postal-code"
                  value={form.zipcode}
                  onChange={(e) => update({ zipcode: e.target.value })}
                  required
                />
              </label>
              <label className="ecm-label">
                País <span className="ecm-req">*</span>
                <input
                  className="ecm-input"
                  autoComplete="country"
                  maxLength={2}
                  value={form.country}
                  onChange={(e) => update({ country: e.target.value.toUpperCase() })}
                  required
                />
              </label>
            </div>

            <details className="ecm-more">
              <summary className="ecm-more-sum">Opcional: piso, depto y notas</summary>
              <label className="ecm-label ecm-label--tight">
                Piso / Depto
                <input
                  className="ecm-input"
                  autoComplete="off"
                  value={form.floor}
                  onChange={(e) => update({ floor: e.target.value })}
                />
              </label>
              <label className="ecm-label ecm-label--tight">
                Nota para el envío
                <textarea
                  className="ecm-textarea ecm-textarea--sm"
                  rows={2}
                  maxLength={2000}
                  placeholder="Ej. timbre roto, dejar en portería…"
                  value={form.note}
                  onChange={(e) => update({ note: e.target.value })}
                />
              </label>
            </details>
          </div>

          <div className="ecm-section">
            <h3 className="ecm-sec-title">Elegí el envío</h3>
            <p className="ecm-sec-hint">Precios según tu tienda en Tiendanube (Andreani, OCA, retiro, etc.).</p>
            {shipLoading ? (
              <div className="ecm-ship-skel" aria-busy="true">
                <span className="ecm-skel-bar" />
                <span className="ecm-skel-bar ecm-skel-bar--short" />
              </div>
            ) : shipFetchErr ? (
              <p className="ecm-error ecm-error--inline">{shipFetchErr}</p>
            ) : shipOpts.length === 0 ? (
              <p className="ecm-hint">No hay métodos de envío disponibles.</p>
            ) : (
              <div className="ecm-ship-grid" role="radiogroup" aria-label="Medio de envío">
                {shipOpts.map((opt) => {
                  const selected = selectedShipId === opt.id;
                  const title = opt.title || opt.label;
                  const sub = opt.carrier || null;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`ecm-ship-card${selected ? ' ecm-ship-card--on' : ''}`}
                      onClick={() => setSelectedShipId(opt.id)}
                    >
                      <span className="ecm-ship-card-main">
                        {sub ? <span className="ecm-ship-carrier">{sub}</span> : null}
                        <span className="ecm-ship-title">{title}</span>
                      </span>
                      <span className={`ecm-ship-pill${opt.price <= 0 ? ' ecm-ship-pill--free' : ''}`}>
                        {opt.price > 0 ? formatPrice(opt.price) : 'Gratis'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="ecm-totals" aria-live="polite">
            {(() => {
              const subtotal = items.reduce(
                (acc, i) => acc + parseMoney(i.price) * Math.min(99, Math.max(1, i.quantity || 1)),
                0
              );
              const sel = shipOpts.find((s) => s.id === selectedShipId);
              const sc = sel?.price ?? 0;
              const total = subtotal + sc;
              const shipLabel = sel
                ? sel.carrier
                  ? `${sel.carrier} · ${sel.title || sel.label}`
                  : sel.title || sel.label
                : '';
              return (
                <>
                  <div className="ecm-total-row">
                    <span>Productos</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="ecm-total-row">
                    <span className="ecm-total-ship-label">{sel ? shipLabel : 'Envío'}</span>
                    <span>{sc > 0 ? formatPrice(sc) : 'Gratis'}</span>
                  </div>
                  <div className="ecm-total-row ecm-total-row--strong">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </>
              );
            })()}
          </div>

          {error ? <p className="ecm-error">{error}</p> : null}

          <div className="ecm-actions">
            <button type="button" className="ecm-btn ecm-btn--ghost" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button
              type="submit"
              className="ecm-btn ecm-btn--primary"
              disabled={busy || shipLoading || !shipOpts.length || !!shipFetchErr}
            >
              {busy ? 'Preparando tu pago…' : 'Continuar al pago seguro'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .ecm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 24px 16px 32px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          pointer-events: auto;
        }
        .ecm-panel {
          width: 100%;
          max-width: 580px;
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
          position: relative;
          margin-top: 8px;
        }
        .ecm-head {
          padding: 20px 22px 14px;
          border-bottom: 1px solid #f0f0f0;
          position: relative;
        }
        .ecm-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 6px;
        }
        .ecm-step {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid #ddd;
          color: #999;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
        }
        .ecm-step--on {
          border-color: #111;
          background: #111;
          color: #fff;
        }
        .ecm-step-line {
          width: 28px;
          height: 2px;
          background: #e5e5e5;
          margin: 0 4px;
        }
        .ecm-steps-label {
          margin: 0 0 10px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #999;
          text-align: center;
        }
        .ecm-title {
          margin: 0 32px 6px 0;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #0a0a0a;
        }
        .ecm-sub {
          margin: 0;
          font-size: 13px;
          line-height: 1.55;
          color: #666;
        }
        .ecm-summary {
          margin: 10px 0 0;
          font-size: 12px;
          font-weight: 600;
          color: #111;
        }
        .ecm-close {
          position: absolute;
          top: 16px;
          right: 14px;
          width: 36px;
          height: 36px;
          border: none;
          background: none;
          font-size: 26px;
          line-height: 1;
          color: #666;
          cursor: pointer;
          border-radius: 4px;
        }
        .ecm-close:hover {
          background: #f5f5f5;
          color: #000;
        }
        .ecm-form {
          padding: 20px 22px 24px;
        }
        .ecm-section {
          margin-bottom: 22px;
          padding-bottom: 22px;
          border-bottom: 1px solid #f2f2f2;
        }
        .ecm-section:last-of-type {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 16px;
        }
        .ecm-sec-title {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 700;
          color: #111;
          letter-spacing: -0.01em;
        }
        .ecm-sec-hint {
          margin: 0 0 14px;
          font-size: 12px;
          line-height: 1.45;
          color: #888;
        }
        .ecm-optional {
          font-weight: 500;
          color: #aaa;
          text-transform: none;
          letter-spacing: 0;
        }
        .ecm-more {
          margin-top: 12px;
          border: 1px dashed #ddd;
          border-radius: 8px;
          padding: 0 12px 10px;
          background: #fafafa;
        }
        .ecm-more-sum {
          padding: 10px 0;
          font-size: 12px;
          font-weight: 600;
          color: #555;
          cursor: pointer;
          list-style: none;
        }
        .ecm-more-sum::-webkit-details-marker {
          display: none;
        }
        .ecm-label--tight {
          margin-bottom: 8px;
        }
        .ecm-textarea--sm {
          min-height: 56px;
        }
        .ecm-geo {
          margin-bottom: 14px;
          padding: 10px 12px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }
        .ecm-geo-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid #0f172a;
          background: #fff;
          color: #0f172a;
          border-radius: 999px;
          cursor: pointer;
          font-family: inherit;
        }
        .ecm-geo-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .ecm-geo-hint {
          flex: 1;
          min-width: 140px;
          margin: 0;
          font-size: 11px;
          color: #64748b;
          line-height: 1.35;
        }
        .ecm-geo-err {
          flex-basis: 100%;
          margin: 0;
          font-size: 12px;
          color: #b00000;
        }
        .ecm-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }
        .ecm-req {
          color: #b00000;
        }
        .ecm-input,
        .ecm-textarea {
          display: block;
          width: 100%;
          margin-top: 6px;
          padding: 10px 12px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
          font-family: inherit;
        }
        .ecm-input:focus,
        .ecm-textarea:focus {
          outline: 2px solid #111;
          outline-offset: 0;
          border-color: #111;
        }
        .ecm-row2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 480px) {
          .ecm-row2 {
            grid-template-columns: 1fr;
          }
        }
        .ecm-grow {
          grid-column: 1;
        }
        .ecm-narrow {
          grid-column: 2;
        }
        @media (max-width: 480px) {
          .ecm-narrow {
            grid-column: 1;
          }
        }
        .ecm-error {
          margin: 0 0 12px;
          font-size: 13px;
          color: #b00000;
        }
        .ecm-error--inline {
          margin: 0;
        }
        .ecm-hint {
          margin: 0;
          font-size: 13px;
          color: #666;
        }
        .ecm-ship-skel {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 8px 0;
        }
        .ecm-skel-bar {
          height: 52px;
          border-radius: 10px;
          background: linear-gradient(90deg, #f0f0f0 0%, #e8e8e8 50%, #f0f0f0 100%);
          background-size: 200% 100%;
          animation: ecm-pulse 1.2s ease-in-out infinite;
        }
        .ecm-skel-bar--short {
          width: 70%;
        }
        @keyframes ecm-pulse {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }
        .ecm-ship-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 520px) {
          .ecm-ship-grid {
            grid-template-columns: 1fr;
          }
        }
        .ecm-ship-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          text-align: left;
          padding: 12px 12px 14px;
          border: 2px solid #eaeaea;
          border-radius: 12px;
          background: #fff;
          cursor: pointer;
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.12s;
        }
        .ecm-ship-card:hover {
          border-color: #ccc;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
        }
        .ecm-ship-card--on {
          border-color: #111;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }
        .ecm-ship-card-main {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 100%;
        }
        .ecm-ship-carrier {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #888;
        }
        .ecm-ship-title {
          font-size: 13px;
          font-weight: 600;
          color: #111;
          line-height: 1.35;
        }
        .ecm-ship-pill {
          align-self: flex-start;
          font-size: 13px;
          font-weight: 700;
          color: #111;
          padding: 4px 10px;
          border-radius: 999px;
          background: #f5f5f5;
        }
        .ecm-ship-pill--free {
          background: #ecfdf5;
          color: #047857;
        }
        .ecm-total-ship-label {
          max-width: 65%;
          font-size: 12px;
          line-height: 1.35;
        }
        .ecm-totals {
          margin: 0 0 18px;
          padding: 16px 16px;
          background: #fafafa;
          border: 1px solid #eee;
          border-radius: 12px;
        }
        .ecm-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #444;
          margin-bottom: 8px;
        }
        .ecm-total-row:last-child {
          margin-bottom: 0;
        }
        .ecm-total-row--strong {
          padding-top: 10px;
          margin-top: 8px;
          border-top: 1px solid #ddd;
          font-weight: 700;
          color: #000;
          font-size: 14px;
        }
        .ecm-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 8px;
        }
        .ecm-btn {
          padding: 13px 22px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 999px;
          cursor: pointer;
          border: 1px solid #000;
          font-family: inherit;
        }
        .ecm-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .ecm-btn--ghost {
          background: #fff;
          color: #111;
        }
        .ecm-btn--primary {
          background: #000;
          color: #fff;
        }
      `}</style>
    </div>,
    document.body
  );
}
