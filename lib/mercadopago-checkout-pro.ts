import type { NextRequest } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { parseMoney } from '@/lib/product-utils';
import type { ExpressCheckoutBuyerInput } from '@/lib/express-checkout-buyer';
import { digitsOnly, splitPhoneForMercadoPago } from '@/lib/express-checkout-buyer';
import type { ExpressCheckoutShippingSelection } from '@/lib/express-checkout-shipping';

export function mercadoPagoErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null) {
    const o = err as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    const cause = o.cause;
    if (Array.isArray(cause) && cause[0] && typeof cause[0] === 'object' && cause[0] !== null) {
      const c0 = cause[0] as Record<string, unknown>;
      if (typeof c0.description === 'string') return c0.description;
    }
  }
  try {
    return JSON.stringify(err);
  } catch {
    return 'Error al crear la preferencia en Mercado Pago';
  }
}

/** Origen público: petición → env → Vercel. */
export function resolvePublicBaseUrl(req: NextRequest): string | null {
  const fromRequest = req.nextUrl?.origin?.replace(/\/$/, '').trim();
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '').trim();
  const vercel = process.env.VERCEL_URL?.replace(/\/$/, '').trim();
  const fromVercel = vercel ? `https://${vercel}` : '';
  if (fromRequest) return fromRequest;
  if (fromEnv) return fromEnv;
  if (fromVercel) return fromVercel;
  return null;
}

export type MpPreferenceInputItem = {
  variantId?: string | number;
  id?: string | number;
  name: string;
  price: string | number;
  quantity: number;
};

export async function createMercadoPagoCheckoutProPreference(
  req: NextRequest,
  accessToken: string,
  storeId: string,
  items: MpPreferenceInputItem[],
  buyer?: ExpressCheckoutBuyerInput | null,
  shipping?: ExpressCheckoutShippingSelection | null
): Promise<
  | { ok: true; init_point: string; preference_id?: string; sandbox_init_point?: string }
  | { ok: false; error: string; statusCode: number }
> {
  const token = accessToken.trim();
  if (!token) {
    return {
      ok: false,
      error:
        'Falta MP_ACCESS_TOKEN en el servidor. La Public Key va aparte (frontend); para preferencias solo el token de acceso.',
      statusCode: 503,
    };
  }

  const baseUrl = resolvePublicBaseUrl(req);
  if (!baseUrl) {
    return {
      ok: false,
      error:
        'No se pudo determinar la URL pública (back_urls). Definí NEXT_PUBLIC_APP_URL o desplegá en Vercel.',
      statusCode: 500,
    };
  }

  const currencyId = (process.env.MP_PREFERENCE_CURRENCY || 'ARS').toUpperCase();

  try {
    const mapped = items.map((item) => {
      const title = String(item.name || 'Producto').slice(0, 250);
      const unit = Math.round(parseMoney(item.price) * 100) / 100;
      const qty = Math.min(99, Math.max(1, parseInt(String(item.quantity), 10) || 1));
      if (!Number.isFinite(unit) || unit <= 0) {
        throw new Error(`Precio inválido para ítem: ${title} (recibido: ${JSON.stringify(item.price)})`);
      }
      return {
        id: String(item.variantId ?? item.id ?? ''),
        title,
        unit_price: unit,
        quantity: qty,
        currency_id: currencyId,
      };
    });

    const shipPrice =
      shipping && typeof shipping.price === 'number' && Number.isFinite(shipping.price)
        ? Math.round(Math.max(0, shipping.price) * 100) / 100
        : 0;
    if (shipPrice > 0) {
      const shipTitle = `Envío: ${String(shipping!.label || 'Envío').slice(0, 220)}`;
      mapped.push({
        id: 'express-shipping',
        title: shipTitle,
        unit_price: shipPrice,
        quantity: 1,
        currency_id: currencyId,
      });
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);

    const backUrls = {
      success: `${baseUrl}/checkout/success`,
      failure: `${baseUrl}/checkout/failure`,
      pending: `${baseUrl}/checkout/pending`,
    };

    const metadata: Record<string, string> = {
      store_id: String(storeId || '5112334'),
      cart_items: JSON.stringify(
        items.map((i) => ({ id: i.variantId ?? i.id, q: i.quantity }))
      ),
    };

    if (buyer) {
      metadata.buyer_snapshot = JSON.stringify({
        email: buyer.email.trim(),
        firstName: buyer.firstName.trim(),
        lastName: buyer.lastName.trim(),
        phone: buyer.phone.trim(),
        document: buyer.document.trim(),
        address: buyer.address.trim(),
        streetNumber: buyer.streetNumber.trim(),
        floor: (buyer.floor || '').trim(),
        locality: (buyer.locality || '').trim(),
        city: buyer.city.trim(),
        province: buyer.province.trim(),
        zipcode: buyer.zipcode.trim(),
        country: (buyer.country || 'AR').trim().toUpperCase(),
        note: (buyer.note || '').trim(),
      });
    }

    if (shipping) {
      metadata.shipping_snapshot = JSON.stringify({
        id: shipping.id,
        label: shipping.label,
        price: shipPrice,
      });
    }

    const body: Parameters<Preference['create']>[0]['body'] = {
      items: mapped,
      back_urls: backUrls,
      notification_url: `${baseUrl}/api/checkout/mercadopago/webhook`,
      metadata,
      external_reference: `headless-${storeId}-${Date.now()}`,
    };

    if (buyer) {
      const { area_code, number } = splitPhoneForMercadoPago(buyer.phone);
      const idNum = digitsOnly(buyer.document);
      body.payer = {
        email: buyer.email.trim(),
        name: buyer.firstName.trim().slice(0, 100),
        surname: buyer.lastName.trim().slice(0, 100),
        ...(area_code && number
          ? {
              phone: {
                area_code: area_code.slice(0, 6),
                number: number.slice(0, 20),
              },
            }
          : {}),
        ...(idNum
          ? {
              identification: {
                type: 'DNI',
                number: idNum.slice(0, 20),
              },
            }
          : {}),
      };
    }

    if (baseUrl.startsWith('https://')) {
      body.auto_return = 'approved';
    }

    const result = await preference.create({ body });
    const payUrl = result.init_point || result.sandbox_init_point;
    if (!payUrl) {
      return { ok: false, error: 'MP no devolvió URL de pago', statusCode: 500 };
    }

    return {
      ok: true,
      init_point: payUrl,
      preference_id: result.id,
      sandbox_init_point: result.sandbox_init_point,
    };
  } catch (error) {
    console.error('❌ Error creando preferencia de Mercado Pago:', error);
    return {
      ok: false,
      error: mercadoPagoErrorMessage(error),
      statusCode: 500,
    };
  }
}
