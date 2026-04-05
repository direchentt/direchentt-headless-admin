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

/**
 * Resumen en español vía Anthropic Claude. Requiere CLAUDE_API_KEY o ANTHROPIC_API_KEY.
 * @see https://docs.anthropic.com/en/api/messages
 */
export async function generateMarketingBriefWithClaude(input: MarketingBriefInput): Promise<
  { ok: true; text: string } | { ok: false; error: string }
> {
  const key =
    process.env.CLAUDE_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    return {
      ok: false,
      error:
        'Configurá CLAUDE_API_KEY (o ANTHROPIC_API_KEY) en Vercel / .env para usar Claude.',
    };
  }

  const model =
    process.env.CLAUDE_MARKETING_MODEL?.trim() || 'claude-3-5-haiku-20241022';
  const payload = buildPayload(input);
  const user = userPromptFromPayload(payload);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 900,
        temperature: 0.35,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return { ok: false, error: `Claude (${res.status}): ${t.slice(0, 200)}` };
    }

    const data = (await res.json()) as {
      content?: { type?: string; text?: string }[];
      error?: { message?: string };
    };
    if (data.error?.message) {
      return { ok: false, error: data.error.message };
    }
    const blocks = data.content ?? [];
    const text = blocks
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text)
      .join('')
      .trim();
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

function hasClaudeKey(): boolean {
  return Boolean(
    process.env.CLAUDE_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim(),
  );
}

/**
 * Genera el resumen de marketing: por defecto Gemini → Claude → OpenAI según claves disponibles.
 * Forzá el proveedor con MARKETING_AI_PROVIDER=gemini|claude|openai.
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

  if (forced === 'claude') {
    if (!hasClaudeKey()) {
      return {
        ok: false,
        error:
          'MARKETING_AI_PROVIDER=claude pero falta CLAUDE_API_KEY (o ANTHROPIC_API_KEY).',
      };
    }
    return generateMarketingBriefWithClaude(input);
  }

  if (hasGeminiKey()) {
    return generateMarketingBriefWithGemini(input);
  }
  if (hasClaudeKey()) {
    return generateMarketingBriefWithClaude(input);
  }
  if (hasOpenAiKey()) {
    return generateMarketingBriefWithOpenAI(input);
  }

  return {
    ok: false,
    error:
      'Configurá al menos una clave en el servidor: GEMINI_API_KEY, CLAUDE_API_KEY (o ANTHROPIC_API_KEY), u OPENAI_API_KEY. ' +
      'Opcional: MARKETING_AI_PROVIDER=gemini|claude|openai si tenés más de una.',
  };
}
