import { Resend } from 'resend';
import type { PublicCheckoutReceipt } from '@/lib/checkout-receipt';
import { formatPrice } from '@/lib/product-utils';

function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function receiptHtml(r: PublicCheckoutReceipt): string {
  const buyer = r.buyer;
  const addr = buyer
    ? [
        `${buyer.address} ${buyer.streetNumber}`.trim(),
        [buyer.floor, buyer.locality].filter(Boolean).join(' · '),
        `${buyer.city}, ${buyer.province} ${buyer.zipcode}`.trim(),
        buyer.country,
      ]
        .filter((x) => x && String(x).trim())
        .map((line) => escHtml(String(line)))
        .join('<br/>')
    : '';

  const linesRows = r.lines
    .map(
      (l) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;">${escHtml(l.name)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;">${l.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">${formatPrice(l.unitPrice)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">${formatPrice(l.lineTotal)}</td>
    </tr>`
    )
    .join('');

  const shopHref = /^https:\/\/.+/i.test(r.shopHomeUrl) ? r.shopHomeUrl : '#';

  const shipBlock = r.shipping
    ? `<p style="margin:12px 0 0;font-size:14px;color:#333;"><strong>Envío:</strong> ${escHtml(r.shipping.label)} — ${
        r.shipping.price > 0 ? formatPrice(r.shipping.price) : 'Gratis'
      }</p>`
    : '';

  const payBlock = `<p style="margin:8px 0;font-size:14px;color:#333;"><strong>Pago:</strong> Mercado Pago · ${escHtml(
    r.paymentMethodId || '—'
  )} · Estado: ${escHtml(r.status)}</p>`;

  const orderBlock =
    r.tiendanubeOrderId != null
      ? `<p style="margin:16px 0;font-size:15px;color:#111;"><strong>Nº de pedido (tienda):</strong> #${r.tiendanubeOrderId}</p>`
      : `<p style="margin:16px 0;font-size:14px;color:#555;">Tu pedido fue registrado. Si no ves el número aún, en minutos quedará sincronizado con la tienda.</p>`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;background:#f4f4f4;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5;">
        <tr><td style="padding:28px 24px;background:#111;color:#fff;">
          <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.04em;">${escHtml(r.storeLabel)}</h1>
          <p style="margin:8px 0 0;font-size:13px;opacity:0.9;">Confirmación de compra</p>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 8px;font-size:15px;color:#111;">Gracias por tu compra.</p>
          <p style="margin:0 0 16px;font-size:13px;color:#666;">ID de pago Mercado Pago: <strong>${escHtml(
            r.paymentId
          )}</strong></p>
          ${orderBlock}
          ${payBlock}
          ${shipBlock}
          ${
            buyer
              ? `<div style="margin:20px 0;padding:14px;background:#fafafa;border-radius:6px;border:1px solid #eee;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.08em;">Datos de envío</p>
            <p style="margin:0;font-size:14px;color:#333;">${escHtml(`${buyer.firstName} ${buyer.lastName}`.trim())}<br/>${addr}</p>
          </div>`
              : ''
          }
          <p style="margin:20px 0 8px;font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.08em;">Productos</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#f8f8f8;">
                <th align="left" style="padding:8px;border-bottom:2px solid #ddd;">Producto</th>
                <th style="padding:8px;border-bottom:2px solid #ddd;">Cant.</th>
                <th align="right" style="padding:8px;border-bottom:2px solid #ddd;">P. unit.</th>
                <th align="right" style="padding:8px;border-bottom:2px solid #ddd;">Subtotal</th>
              </tr>
            </thead>
            <tbody>${linesRows}</tbody>
          </table>
          <table role="presentation" width="100%" style="margin-top:16px;font-size:14px;">
            <tr><td align="right" style="padding:4px 0;">Subtotal productos</td><td align="right" width="120" style="padding:4px 0;">${formatPrice(
              r.subtotalProducts
            )}</td></tr>
            <tr><td align="right" style="padding:4px 0;">Envío</td><td align="right" style="padding:4px 0;">${
              r.shippingCost > 0 ? formatPrice(r.shippingCost) : 'Gratis'
            }</td></tr>
            <tr><td align="right" style="padding:12px 0 4px;font-weight:700;font-size:16px;">Total</td><td align="right" style="padding:12px 0 4px;font-weight:700;font-size:16px;">${formatPrice(
              r.total
            )}</td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:#888;text-align:center;">
            <a href="${shopHref}" style="color:#111;">Volver a la tienda</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Envía el resumen del pedido al comprador. Requiere `RESEND_API_KEY`.
 * `ORDER_EMAIL_FROM` ej. `Mi tienda <ventas@tudominio.com>` (dominio verificado en Resend).
 */
export async function sendOrderConfirmationEmail(
  to: string,
  r: PublicCheckoutReceipt
): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn('[order-email] Falta RESEND_API_KEY; no se envía mail.');
    return { ok: false, error: 'no_resend_key' };
  }

  const from =
    process.env.ORDER_EMAIL_FROM?.trim() ||
    'Pedidos <onboarding@resend.dev>';

  const subject = `${r.storeLabel} — Pedido confirmado · Pago ${r.paymentId}`;

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: [to.trim()],
      subject,
      html: receiptHtml(r),
    });
    if (error) {
      console.error('[order-email] Resend:', error);
      return { ok: false, error: typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : String(error) };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[order-email]', msg);
    return { ok: false, error: msg };
  }
}
