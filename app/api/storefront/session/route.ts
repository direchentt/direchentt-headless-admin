import { NextResponse } from 'next/server';
import {
  signStorefrontSession,
  stableUserSubFromEmail,
} from '@/lib/storefront-session';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name =
      typeof body.name === 'string' && body.name.trim()
        ? body.name.trim()
        : email.split('@')[0] || 'Usuario';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }

    const sub = stableUserSubFromEmail(email);
    const token = signStorefrontSession({ sub, email, name });

    return NextResponse.json({
      user: { id: sub, email, name },
      token,
    });
  } catch (e) {
    console.error('storefront/session', e);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
