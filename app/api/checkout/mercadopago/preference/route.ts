import { NextRequest, NextResponse } from 'next/server';
import { createMercadoPagoCheckoutProPreference } from '@/lib/mercadopago-checkout-pro';
import type { ExpressCheckoutBuyerInput } from '@/lib/express-checkout-buyer';
import { validateExpressCheckoutBuyer } from '@/lib/express-checkout-buyer';
import {
  matchShippingSelectionToOptions,
  parseExpressShippingSelection,
} from '@/lib/express-checkout-shipping';
import { getMergedExpressShippingOptions } from '@/lib/checkout-shipping-resolve';

/**
 * Checkout Pro: crea preferencia con el Access Token (servidor).
 * La Public Key no hace falta para este flujo (redirección a init_point).
 */
export async function POST(req: NextRequest) {
  const accessToken = process.env.MP_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          'Falta MP_ACCESS_TOKEN en el servidor. La Public Key va aparte (frontend); para preferencias solo el token de acceso.',
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { items, storeId, buyer, shipping } = body as {
      items?: unknown;
      storeId?: string;
      buyer?: ExpressCheckoutBuyerInput;
      shipping?: unknown;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    let buyerNorm: ExpressCheckoutBuyerInput | null = null;
    if (buyer && typeof buyer === 'object') {
      const b = buyer as ExpressCheckoutBuyerInput;
      const err = validateExpressCheckoutBuyer(b);
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 });
      }
      buyerNorm = {
        email: b.email.trim(),
        firstName: b.firstName.trim(),
        lastName: b.lastName.trim(),
        phone: b.phone.trim(),
        document: b.document.trim(),
        address: b.address.trim(),
        streetNumber: b.streetNumber.trim(),
        floor: (b.floor || '').trim(),
        locality: (b.locality || '').trim(),
        city: b.city.trim(),
        province: b.province.trim(),
        zipcode: b.zipcode.trim(),
        country: (b.country || 'AR').trim().toUpperCase(),
        note: (b.note || '').trim(),
      };
    } else {
      return NextResponse.json(
        { error: 'Faltan los datos del comprador. Completá el formulario de checkout.' },
        { status: 400 }
      );
    }

    const mpItems = items.map((item: any) => ({
      variantId: item.variantId ?? item.id,
      id: item.id,
      name: String(item.name || 'Producto'),
      price: item.price,
      quantity: item.quantity ?? 1,
    }));

    const storeIdStr = String(storeId || '5112334');
    const storeIdNum = parseInt(storeIdStr, 10);
    const sel = parseExpressShippingSelection(shipping);
    if (!sel) {
      return NextResponse.json(
        { error: 'Elegí un medio de envío válido.' },
        { status: 400 }
      );
    }

    let shippingNorm: typeof sel | null = null;
    if (Number.isFinite(storeIdNum)) {
      const shippingOptions = await getMergedExpressShippingOptions(storeIdStr);
      const matched = matchShippingSelectionToOptions(sel, shippingOptions);
      if (!matched) {
        return NextResponse.json(
          { error: 'La opción de envío no es válida. Actualizá la página y probá de nuevo.' },
          { status: 400 }
        );
      }
      shippingNorm = {
        id: matched.id,
        label: matched.label,
        price: matched.price,
      };
    } else {
      return NextResponse.json({ error: 'storeId inválido' }, { status: 400 });
    }

    const result = await createMercadoPagoCheckoutProPreference(
      req,
      accessToken,
      storeIdStr,
      mpItems,
      buyerNorm,
      shippingNorm
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode });
    }

    return NextResponse.json({
      id: result.preference_id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error) {
    console.error('❌ preference route:', error);
    return NextResponse.json({ error: 'JSON inválido o error interno' }, { status: 400 });
  }
}
