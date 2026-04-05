import { createHash, createHmac, timingSafeEqual } from 'crypto';

const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getStorefrontSessionSecret(): string {
  const s =
    process.env.STOREFRONT_SESSION_SECRET?.trim() ||
    process.env.CMS_ADMIN_SECRET?.trim();
  if (!s) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('STOREFRONT_SESSION_SECRET o CMS_ADMIN_SECRET requerido');
    }
    return 'dev-storefront-session-insecure';
  }
  return s;
}

/** Identificador estable por email (wishlist y sesión). */
export function stableUserSubFromEmail(email: string): string {
  const e = email.trim().toLowerCase();
  const pepper = process.env.STOREFRONT_USER_PEPPER?.trim() || '';
  return createHash('sha256')
    .update(`${e}|${pepper}`)
    .digest('hex')
    .slice(0, 32);
}

function b64urlEncode(str: string): string {
  return Buffer.from(str, 'utf8').toString('base64url');
}

function b64urlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf8');
}

export type StorefrontSessionPayload = {
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
};

export function signStorefrontSession(
  payload: Omit<StorefrontSessionPayload, 'iat' | 'exp'>
): string {
  const secret = getStorefrontSessionSecret();
  const now = Date.now();
  const full: StorefrontSessionPayload = {
    ...payload,
    iat: now,
    exp: now + TTL_MS,
  };
  const body = b64urlEncode(JSON.stringify(full));
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyStorefrontSession(
  token: string
): StorefrontSessionPayload | null {
  try {
    const dot = token.indexOf('.');
    if (dot <= 0) return null;
    const body = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (!body || !sig) return null;

    const secret = getStorefrontSessionSecret();
    const expected = createHmac('sha256', secret).update(body).digest();
    const sigBuf = Buffer.from(sig, 'base64url');
    if (sigBuf.length !== expected.length || !timingSafeEqual(sigBuf, expected)) {
      return null;
    }

    const payload = JSON.parse(b64urlDecode(body)) as StorefrontSessionPayload;
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
    if (!payload.sub || typeof payload.email !== 'string') return null;
    return payload;
  } catch {
    return null;
  }
}
