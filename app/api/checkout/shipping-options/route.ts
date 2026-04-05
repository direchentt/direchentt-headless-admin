import { NextRequest, NextResponse } from 'next/server';
import { getMergedExpressShippingOptions } from '@/lib/checkout-shipping-resolve';

export const dynamic = 'force-dynamic';

function parseShopId(request: NextRequest): string | null {
  const id = request.nextUrl.searchParams.get('shop')?.trim();
  if (!id) return null;
  return id;
}

function splitCarrierTitle(label: string): { title: string; carrier: string | null } {
  const sep = ' — ';
  const i = label.indexOf(sep);
  if (i === -1) return { title: label, carrier: null };
  return {
    carrier: label.slice(0, i).trim() || null,
    title: label.slice(i + sep.length).trim() || label,
  };
}

/**
 * Opciones de envío: API Tiendanube (shipping_carriers + options) + extras en storefront_config.
 * GET /api/checkout/shipping-options?shop=STORE_ID
 */
export async function GET(request: NextRequest) {
  const shop = parseShopId(request);
  if (shop == null) {
    return NextResponse.json({ error: 'Query shop requerido' }, { status: 400 });
  }

  try {
    const merged = await getMergedExpressShippingOptions(shop);
    const options = merged.map((o) => {
      const { title, carrier } = splitCarrierTitle(o.label);
      return {
        id: o.id,
        label: o.label,
        price: o.price,
        title,
        carrier,
      };
    });
    return NextResponse.json(
      { options, source: 'merged' as const },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
