import type { MarketingInsightsSnapshot } from '@/lib/shopper-intelligence-db';
import type { PresenceRow } from '@/lib/storefront-presence-db';

/**
 * Resumen en español vía OpenAI (opcional). Requiere OPENAI_API_KEY en el servidor.
 */
export async function generateMarketingBriefWithOpenAI(input: {
  snapshot: MarketingInsightsSnapshot | null;
  presence: PresenceRow[];
  activeCount: number;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return { ok: false, error: 'Configurá OPENAI_API_KEY en Vercel / .env para usar el resumen con IA.' };
  }

  const model = process.env.OPENAI_MARKETING_MODEL?.trim() || 'gpt-4o-mini';

  const payload = {
    ventanaDias: input.snapshot?.windowDays ?? 7,
    embudo: input.snapshot?.funnel ?? null,
    eventosPorTipo: input.snapshot?.eventsByType ?? {},
    topBusquedas: input.snapshot?.topSearches?.slice(0, 8) ?? [],
    topCarrito: input.snapshot?.topCartProductIds?.slice(0, 8) ?? [],
    pulso: input.snapshot?.activityPulse ?? 0,
    visitantesActivosAhora: input.activeCount,
    muestraEnVivo: input.presence.slice(0, 12).map((p) => ({
      haceSeg: p.secondsAgo,
      tipo: p.pageType,
      path: p.path,
      producto: p.productId,
      categoria: p.categoryId,
    })),
  };

  const system =
    'Sos un analista de e-commerce para Tiendanube/headless. Respondé en español rioplatense, claro y accionable. ' +
    'Sin inventar datos que no estén en el JSON. Máximo 12 viñetas cortas + 3 recomendaciones priorizadas. ' +
    'Si faltan datos, decilo. No uses markdown pesado.';

  const user = `Datos para analizar:\n${JSON.stringify(payload, null, 2)}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 900,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return { ok: false, error: `OpenAI (${res.status}): ${t.slice(0, 200)}` };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return { ok: false, error: 'Respuesta vacía del modelo.' };
    }
    return { ok: true, text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de red';
    return { ok: false, error: msg };
  }
}
