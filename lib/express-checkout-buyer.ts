/**
 * Datos de comprador / checkout alineados a POST /orders de Tiendanube
 * (@see https://tiendanube.github.io/api-documentation/resources/order#post-orders)
 * y payer de Preferencias Checkout Pro (Mercado Pago).
 */

export type ExpressCheckoutBuyerInput = {
  email: string;
  firstName: string;
  lastName: string;
  /** Teléfono completo (se normaliza en servidor) */
  phone: string;
  /** DNI / documento */
  document: string;
  address: string;
  streetNumber: string;
  floor: string;
  locality: string;
  city: string;
  province: string;
  zipcode: string;
  /** ISO 3166-1 alpha-2, ej. AR */
  country: string;
  note?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateExpressCheckoutBuyer(b: ExpressCheckoutBuyerInput): string | null {
  const email = b.email?.trim() || '';
  if (!email || !EMAIL_RE.test(email)) return 'Ingresá un email válido.';
  if (!(b.firstName?.trim())) return 'El nombre es obligatorio.';
  if (!(b.lastName?.trim())) return 'El apellido es obligatorio.';
  if (!(b.phone?.trim())) return 'El teléfono es obligatorio.';
  if (!(b.document?.trim())) return 'El documento es obligatorio.';
  if (!(b.address?.trim())) return 'La calle es obligatoria.';
  if (!(b.streetNumber?.trim())) return 'La altura es obligatoria.';
  if (!(b.city?.trim())) return 'La ciudad es obligatoria.';
  if (!(b.province?.trim())) return 'La provincia es obligatoria.';
  if (!(b.zipcode?.trim())) return 'El código postal es obligatorio.';
  const c = (b.country || 'AR').trim().toUpperCase();
  if (c.length !== 2) return 'País inválido (usá código ISO de 2 letras, ej. AR).';
  return null;
}

export function digitsOnly(s: string): string {
  return String(s || '').replace(/\D/g, '');
}

/** Para MP payer.phone (area_code + number), heurística AR/LATAM */
export function splitPhoneForMercadoPago(phone: string): { area_code: string; number: string } {
  let d = digitsOnly(phone);
  if (d.startsWith('54')) d = d.slice(2);
  if (d.startsWith('9') && d.length >= 10) d = d.slice(1);
  if (d.length <= 6) {
    return { area_code: '', number: d || '0' };
  }
  if (d.length <= 8) {
    return { area_code: d.slice(0, 2) || '11', number: d.slice(2) || d };
  }
  const area = d.slice(0, Math.min(4, d.length - 6));
  const num = d.slice(area.length);
  return { area_code: area || '11', number: num || d.slice(-8) };
}

export type TiendanubeOrderCreateBody = Record<string, unknown>;

export function buildTiendanubeOrderBodyFromBuyer(
  lines: { variant_id: number; quantity: number }[],
  b: ExpressCheckoutBuyerInput,
  opts?: {
    defaultShippingLabelEs?: string;
    /** Medio elegido en checkout exprés (etiqueta + monto cobrado al cliente) */
    shippingSelection?: { label: string; price: number };
  }
): TiendanubeOrderCreateBody {
  const first = b.firstName.trim();
  const last = b.lastName.trim();
  const fullName = `${first} ${last}`.trim();
  const phone = b.phone.trim();
  const doc = b.document.trim();
  const sel = opts?.shippingSelection;
  const shipCost =
    sel && typeof sel.price === 'number' && Number.isFinite(sel.price)
      ? Math.round(Math.max(0, sel.price) * 100) / 100
      : 0;
  const shipOpt =
    sel?.label?.trim() ||
    opts?.defaultShippingLabelEs?.trim() ||
    'No informado';

  const shipping_address = {
    first_name: first,
    last_name: last,
    address: b.address.trim(),
    number: String(b.streetNumber.trim()),
    floor: (b.floor || '').trim() || '',
    locality: (b.locality || '').trim() || '',
    city: b.city.trim(),
    province: b.province.trim(),
    zipcode: b.zipcode.trim(),
    country: (b.country || 'AR').trim().toUpperCase(),
    phone,
  };

  return {
    customer: {
      name: fullName,
      email: b.email.trim(),
      phone,
      document: doc,
    },
    billing_address: { ...shipping_address },
    shipping_address,
    shipping_pickup_type: 'ship',
    shipping: 'not-provided',
    shipping_option: shipOpt,
    shipping_cost_customer: shipCost,
    gateway: 'not-provided',
    payment_status: 'paid',
    shipping_status: 'unpacked',
    products: lines,
    send_confirmation_email: true,
    ...(b.note?.trim() ? { note: b.note.trim().slice(0, 2000) } : {}),
  };
}
