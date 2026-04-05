import { NextRequest, NextResponse } from 'next/server';
import { getStorefrontConfigStored } from '@/lib/storefront-db';
import { resolveStorefrontConfig } from '@/lib/storefront-config';

export const dynamic = 'force-dynamic';

function parseShopId(request: NextRequest): number | null {
  const id = request.nextUrl.searchParams.get('shop');
  if (!id) return null;
  const n = parseInt(id, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Opciones de envío para checkout exprés (desde storefront_config).
 * GET /api/checkout/shipping-options?shop=STORE_ID
 */
export async function GET(request: NextRequest) {
  const storeId = parseShopId(request);
  if (storeId == null) {
    return NextResponse.json({ error: 'Query shop requerido' }, { status: 400 });
  }

  try {
    const stored = await getStorefrontConfigStored(storeId);
    const resolved = resolveStorefrontConfig(stored);
    const options = resolved.expressCheckoutShippingResolved.map((o) => ({
      id: o.id,
      label: o.label,
      price: o.price,
    }));
    return NextResponse.json(
      { options },
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
