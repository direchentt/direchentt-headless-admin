import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Reverse geocoding vía Nominatim (OSM). Uso moderado; requiere User-Agent identificable. */
export async function GET(req: NextRequest) {
  const latRaw = req.nextUrl.searchParams.get('lat');
  const lonRaw = req.nextUrl.searchParams.get('lon');
  const lat = parseFloat(String(latRaw));
  const lon = parseFloat(String(lonRaw));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ ok: false, error: 'lat/lon inválidos' }, { status: 400 });
  }
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ ok: false, error: 'Coordenadas fuera de rango' }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=json&addressdetails=1`;

  try {
    const r = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DirechenttHeadless-Checkout/1.0 (contact: dev@direchentt.com)',
      },
      next: { revalidate: 0 },
    });
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: 'Servicio de mapas no disponible' }, { status: 502 });
    }
    const data = (await r.json()) as { address?: Record<string, string> };
    const a = data.address || {};
    const road = a.road || a.pedestrian || a.path || '';
    const house_number = a.house_number || '';
    const suburb = a.suburb || a.neighbourhood || a.quarter || '';
    const city = a.city || a.town || a.village || a.municipality || '';
    const state = a.state || '';
    const postcode = a.postcode || '';
    const country = (a.country_code || 'ar').toUpperCase();

    return NextResponse.json({
      ok: true,
      address: {
        address: road,
        streetNumber: house_number,
        locality: suburb,
        city,
        province: state,
        zipcode: postcode,
        country: country.length === 2 ? country : 'AR',
        displayName: typeof (data as { display_name?: string }).display_name === 'string'
          ? (data as { display_name: string }).display_name
          : '',
      },
    });
  } catch (e) {
    console.error('[geocode/reverse]', e);
    return NextResponse.json({ ok: false, error: 'Error al geocodificar' }, { status: 500 });
  }
}
