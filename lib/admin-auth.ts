import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE = 'admin_session';

function getSecret(): string {
  return process.env.CMS_ADMIN_SECRET?.trim() || '';
}

export function signAdminSession(): string | null {
  const SECRET = getSecret();
  if (!SECRET) return null;
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  const sig = createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  const SECRET = getSecret();
  if (!token || !SECRET) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = createHmac('sha256', SECRET).update(payload).digest('base64url');
  if (expected.length !== sig.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(sig, 'utf8'))) return false;
  } catch {
    return false;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number };
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export { COOKIE as ADMIN_SESSION_COOKIE };
