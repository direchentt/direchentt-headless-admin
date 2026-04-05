import { NextRequest, NextResponse } from 'next/server';
import { getStoreData } from '@/lib/backend';
import { tiendanubeAdminGet, tiendanubeAdminPost } from '@/lib/tiendanube-admin-fetch';

/**
 * La API pública de Nuvemshop no documenta un recurso “newsletter subscribers”.
 * Registramos el correo como Customer (POST /customers), documentado en:
 * https://tiendanube.github.io/api-documentation/resources/customer
 *
 * Nota: el campo accepts_marketing del Customer es de solo lectura en la API;
 * el contacto queda en Clientes en el admin de la tienda.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function tnErrorMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const o = body as Record<string, unknown>;
  const d = o.description;
  const m = o.message;
  if (typeof d === 'string' && d.trim()) return d.trim();
  if (typeof m === 'string' && m.trim()) return m.trim();
  return '';
}

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo inválido' }, { status: 400 });
  }

  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
  }

  const shop = String((json as Record<string, unknown>).shop ?? '').trim();
  const emailRaw = String((json as Record<string, unknown>).email ?? '').trim().toLowerCase();

  if (!shop || !/^\d+$/.test(shop)) {
    return NextResponse.json({ ok: false, error: 'Tienda no válida' }, { status: 400 });
  }
  if (!emailRaw || !EMAIL_RE.test(emailRaw) || emailRaw.length > 254) {
    return NextResponse.json({ ok: false, error: 'Correo no válido' }, { status: 400 });
  }

  const store = await getStoreData(shop);
  const token = store?.accessToken;
  if (!store || typeof token !== 'string' || !token) {
    return NextResponse.json({ ok: false, error: 'Tienda no disponible' }, { status: 503 });
  }

  const sid = String(store.storeId);

  const existing = await tiendanubeAdminGet(sid, token, 'customers', {
    email: emailRaw,
    per_page: 1,
  });

  if (existing.ok && Array.isArray(existing.body) && existing.body.length > 0) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const created = await tiendanubeAdminPost(sid, token, 'customers', {
    name: 'Newsletter',
    email: emailRaw,
    send_email_invite: false,
  });

  if (created.ok) {
    return NextResponse.json({ ok: true });
  }

  const msg = tnErrorMessage(created.body).toLowerCase();
  if (
    created.status === 422 &&
    (msg.includes('email') ||
      msg.includes('correo') ||
      msg.includes('taken') ||
      msg.includes('ya está') ||
      msg.includes('already'))
  ) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const userMsg = tnErrorMessage(created.body) || 'No se pudo guardar el correo en la tienda.';
  return NextResponse.json({ ok: false, error: userMsg }, { status: 502 });
}
