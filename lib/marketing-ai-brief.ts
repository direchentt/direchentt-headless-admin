import type { MarketingInsightsSnapshot } from '@/lib/shopper-intelligence-db';
import type { PresenceRow } from '@/lib/storefront-presence-db';

export type MarketingBriefInput = {
  snapshot: MarketingInsightsSnapshot | null;
  presence: PresenceRow[];
  activeCount: number;
};

function buildPayload(input: MarketingBriefInput) {
  return {
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
}

const SYSTEM_PROMPT =
  'Sos un analista de e-commerce para Tiendanube/headless. Respondé en español rioplatense, claro y accionable. ' +
  'Sin inventar datos que no estén en el JSON. Máximo 12 viñetas cortas + 3 recomendaciones priorizadas. ' +
  'Si faltan datos, decilo. No uses markdown pesado.';

function userPromptFromPayload(payload: ReturnType<typeof buildPayload>) {
  return `Datos para analizar:\n${JSON.stringify(payload, null, 2)}`;
}

/**
 * Resumen en español vía Google Gemini (opcional). Requiere GEMINI_API_KEY (o GOOGLE_GENERATIVE_AI_API_KEY).
 */
export async function generateMarketingBriefWithGemini(input: MarketingBriefInput): Promise<
  { ok: true; text: string } | { ok: false; error: string }
> {
  const key =
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!key) {
    return {
      ok: false,
      error:
        'Configurá GEMINI_API_KEY (o GOOGLE_GENERATIVE_AI_API_KEY) en Vercel / .env para usar Gemini.',
    };
  }

  const model =
    process.env.GEMINI_MARKETING_MODEL?.trim() || 'gemini-2.0-flash';
  const payload = buildPayload(input);
  const user = userPromptFromPayload(payload);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: user }],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 900,
        },
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return { ok: false, error: `Gemini (${res.status}): ${t.slice(0, 200)}` };
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      error?: { message?: string };
    };
    if (data.error?.message) {
      return { ok: false, error: data.error.message };
    }
    const parts = data.candidates?.[0]?.content?.parts;
    const text = parts?.map((p) => p.text ?? '').join('').trim();
    if (!text) {
      const reason = data.candidates?.[0]?.finishReason;
      return {
        ok: false,
        error: reason
          ? `Respuesta vacía o bloqueada (${reason}).`
          : 'Respuesta vacía del modelo.',
      };
    }
    return { ok: true, text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de red';
    return { ok: false, error: msg };
  }
}

/**
 * Resumen en español vía OpenAI (opcional). Requiere OPENAI_API_KEY en el servidor.
 */
export async function generateMarketingBriefWithOpenAI(input: MarketingBriefInput): Promise<
  { ok: true; text: string } | { ok: false; error: string }
> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return { ok: false, error: 'Configurá OPENAI_API_KEY en Vercel / .env para usar OpenAI.' };
  }

  const model = process.env.OPENAI_MARKETING_MODEL?.trim() || 'gpt-4o-mini';
  const payload = buildPayload(input);
  const user = userPromptFromPayload(payload);

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
          { role: 'system', content: SYSTEM_PROMPT },
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

function hasGeminiKey(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim(),
  );
}

function hasOpenAiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

/**
 * Genera el resumen de marketing: por defecto usa Gemini si hay clave, si no OpenAI.
 * Forzá el proveedor con MARKETING_AI_PROVIDER=gemini u openai.
 */
export async function generateMarketingAiBrief(
  input: MarketingBriefInput,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const forced = process.env.MARKETING_AI_PROVIDER?.trim().toLowerCase();

  if (forced === 'openai') {
    if (!hasOpenAiKey()) {
      return {
        ok: false,
        error:
          'MARKETING_AI_PROVIDER=openai pero falta OPENAI_API_KEY. Quitá la variable o agregá la clave.',
      };
    }
    return generateMarketingBriefWithOpenAI(input);
  }

  if (forced === 'gemini') {
    if (!hasGeminiKey()) {
      return {
        ok: false,
        error:
          'MARKETING_AI_PROVIDER=gemini pero falta GEMINI_API_KEY (o GOOGLE_GENERATIVE_AI_API_KEY).',
      };
    }
    return generateMarketingBriefWithGemini(input);
  }

  if (hasGeminiKey()) {
    return generateMarketingBriefWithGemini(input);
  }
  if (hasOpenAiKey()) {
    return generateMarketingBriefWithOpenAI(input);
  }

  return {
    ok: false,
    error:
      'Configurá GEMINI_API_KEY (recomendado) u OPENAI_API_KEY en el servidor (Vercel / .env). ' +
      'Opcional: MARKETING_AI_PROVIDER=gemini|openai si tenés ambas claves.',
  };
}
