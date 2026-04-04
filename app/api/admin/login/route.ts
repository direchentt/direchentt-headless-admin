import { NextRequest, NextResponse } from 'next/server';
import { signAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const secret = process.env.CMS_ADMIN_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: 'CMS_ADMIN_SECRET no configurado en el servidor' },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (typeof body.password !== 'string' || body.password !== secret) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }

  const token = signAdminSession();
  if (!token) {
    return NextResponse.json({ error: 'No se pudo crear sesión' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
