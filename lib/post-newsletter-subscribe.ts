/**
 * Suscripción desde componentes cliente → API interna (server usa Tiendanube).
 */

export type NewsletterSubscribeResult =
  | { ok: true }
  | { ok: false; error: string };

export async function postNewsletterSubscribe(
  shop: string,
  email: string
): Promise<NewsletterSubscribeResult> {
  const res = await fetch('/api/newsletter-subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shop, email }),
  });

  let data: { ok?: boolean; error?: string } = {};
  try {
    data = (await res.json()) as { ok?: boolean; error?: string };
  } catch {
    /* ignore */
  }

  if (res.ok && data.ok) return { ok: true };
  const err =
    typeof data.error === 'string' && data.error.trim()
      ? data.error.trim()
      : 'No se pudo completar la suscripción. Probá de nuevo más tarde.';
  return { ok: false, error: err };
}
