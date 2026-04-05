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

type ShipOption = { id: string; label: string; price: number };

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
        const opts = Array.isArray(data.options) ? data.options : [];
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
          <h2 id="ecm-title" className="ecm-title">
            Un paso antes de pagar
          </h2>
          <p className="ecm-sub">
            Así dejamos listo tu pedido, el envío y cualquier novedad por mail. Cuando termines acá, seguís en
            el paso de pago seguro para cerrar la compra.
          </p>
          {summary ? <p className="ecm-summary">{summary}</p> : null}
          <button type="button" className="ecm-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <form className="ecm-form" onSubmit={handleSubmit}>
          <fieldset className="ecm-fieldset">
            <legend>Contacto</legend>
            <label className="ecm-label">
              Email <span className="ecm-req">*</span>
              <input
                className="ecm-input"
                type="email"
                autoComplete="email"
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
            <label className="ecm-label">
              Teléfono <span className="ecm-req">*</span>
              <input
                className="ecm-input"
                type="tel"
                autoComplete="tel"
                placeholder="Ej. 11 1234-5678"
                value={form.phone}
                onChange={(e) => update({ phone: e.target.value })}
                required
              />
            </label>
            <label className="ecm-label">
              DNI / documento <span className="ecm-req">*</span>
              <input
                className="ecm-input"
                autoComplete="off"
                value={form.document}
                onChange={(e) => update({ document: e.target.value })}
                required
              />
            </label>
          </fieldset>

          <fieldset className="ecm-fieldset">
            <legend>Envío</legend>
            <div className="ecm-geo">
              <button
                type="button"
                className="ecm-geo-btn"
                onClick={fillFromGeolocation}
                disabled={geoLoading || busy}
              >
                {geoLoading ? 'Obteniendo ubicación…' : 'Usar mi ubicación'}
              </button>
              <span className="ecm-geo-hint">Completá calle y altura con tu GPS (podés editar después).</span>
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
              Piso / Depto
              <input
                className="ecm-input"
                autoComplete="off"
                value={form.floor}
                onChange={(e) => update({ floor: e.target.value })}
              />
            </label>
            <label className="ecm-label">
              Barrio / localidad
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
                País (ISO) <span className="ecm-req">*</span>
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
          </fieldset>

          <fieldset className="ecm-fieldset">
            <legend>Medio de envío</legend>
            {shipLoading ? (
              <p className="ecm-hint">Cargando opciones de envío…</p>
            ) : shipFetchErr ? (
              <p className="ecm-error ecm-error--inline">{shipFetchErr}</p>
            ) : shipOpts.length === 0 ? (
              <p className="ecm-hint">No hay envíos configurados para esta tienda.</p>
            ) : (
              <ul className="ecm-ship-list">
                {shipOpts.map((opt) => (
                  <li key={opt.id} className="ecm-ship-item">
                    <label className="ecm-ship-label">
                      <input
                        type="radio"
                        name="ecm-shipping"
                        className="ecm-ship-radio"
                        checked={selectedShipId === opt.id}
                        onChange={() => setSelectedShipId(opt.id)}
                      />
                      <span className="ecm-ship-text">
                        <span className="ecm-ship-name">{opt.label}</span>
                        <span className="ecm-ship-price">
                          {opt.price > 0 ? formatPrice(opt.price) : 'Gratis'}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <div className="ecm-totals" aria-live="polite">
            {(() => {
              const subtotal = items.reduce(
                (acc, i) => acc + parseMoney(i.price) * Math.min(99, Math.max(1, i.quantity || 1)),
                0
              );
              const sel = shipOpts.find((s) => s.id === selectedShipId);
              const sc = sel?.price ?? 0;
              const total = subtotal + sc;
              return (
                <>
                  <div className="ecm-total-row">
                    <span>Subtotal productos</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="ecm-total-row">
                    <span>Envío{sel ? ` (${sel.label})` : ''}</span>
                    <span>{sc > 0 ? formatPrice(sc) : 'Gratis'}</span>
                  </div>
                  <div className="ecm-total-row ecm-total-row--strong">
                    <span>Total a pagar</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </>
              );
            })()}
          </div>

          <fieldset className="ecm-fieldset">
            <legend>Notas</legend>
            <label className="ecm-label">
              Comentarios del pedido (opcional)
              <textarea
                className="ecm-textarea"
                rows={2}
                maxLength={2000}
                value={form.note}
                onChange={(e) => update({ note: e.target.value })}
              />
            </label>
          </fieldset>

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
          max-width: 520px;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
          position: relative;
          margin-top: 8px;
        }
        .ecm-head {
          padding: 22px 22px 12px;
          border-bottom: 1px solid #eee;
          position: relative;
        }
        .ecm-title {
          margin: 0 32px 8px 0;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #000;
        }
        .ecm-sub {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #555;
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
          padding: 18px 22px 22px;
        }
        .ecm-fieldset {
          border: none;
          margin: 0 0 18px;
          padding: 0;
        }
        .ecm-fieldset legend {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 12px;
        }
        .ecm-geo {
          margin-bottom: 14px;
          padding: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }
        .ecm-geo-btn {
          display: inline-block;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid #0f172a;
          background: #fff;
          color: #0f172a;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
        }
        .ecm-geo-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .ecm-geo-hint {
          display: block;
          margin-top: 8px;
          font-size: 11px;
          color: #64748b;
          line-height: 1.4;
        }
        .ecm-geo-err {
          margin: 8px 0 0;
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
          outline: 2px solid #000;
          outline-offset: 1px;
          border-color: #000;
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
        .ecm-ship-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ecm-ship-item {
          margin: 0;
        }
        .ecm-ship-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          font-size: 13px;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          transition: border-color 0.15s, background 0.15s;
        }
        .ecm-ship-label:hover {
          border-color: #999;
          background: #fafafa;
        }
        .ecm-ship-radio {
          margin-top: 3px;
          flex-shrink: 0;
        }
        .ecm-ship-text {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 8px;
          align-items: baseline;
        }
        .ecm-ship-name {
          font-weight: 600;
          color: #111;
        }
        .ecm-ship-price {
          font-size: 12px;
          color: #555;
          font-weight: 600;
        }
        .ecm-totals {
          margin: 0 0 18px;
          padding: 14px 14px;
          background: #f8f8f8;
          border: 1px solid #eaeaea;
          border-radius: 6px;
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
          padding: 12px 20px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 4px;
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
