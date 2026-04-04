import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/backend';

export const dynamic = 'force-dynamic';

/**
 * Comprueba MONGODB_URI + conexión (útil en Vercel). No expone la URI.
 */
export async function GET() {
  const hasUri = Boolean(
    (process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI || '').trim()
  );
  if (!hasUri) {
    return NextResponse.json({ ok: false, step: 'env' }, { status: 503 });
  }
  try {
    const client = await getMongoClient();
    await client.db('admin').command({ ping: 1 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ ok: false, step: 'connect', message }, { status: 503 });
  }
}
