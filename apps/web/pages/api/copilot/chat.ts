/**
 * API Route: /api/copilot/chat
 *
 * Proxies chat requests to the Python backend at api-ia.bodasdehoy.com
 * which handles auto-routing with OpenRouter for intelligent model selection,
 * function calling with 30+ tools (guests, budget, tables, itinerary, etc.),
 * and automatic fallback between providers.
 *
 * FASE 1+2: Transparent proxy that forwards enriched SSE events
 * (tool_result, ui_action, confirm_required, progress, code_output)
 * so the frontend can render rich UI components.
 *
 * If the Python backend fails, falls back to whitelabel API key system.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// Python backend URL with auto-routing
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'https://api-ia.bodasdehoy.com';

// Safety guard: never return "fallback" model output if the backend IA is down.
const ENABLE_COPILOT_FALLBACK = process.env.ENABLE_COPILOT_FALLBACK === 'true';
// Si true, no llamamos a API2 getWhiteLabelConfig (diseño: front no usa API2). Ver docs/INFORME-BACKEND-API-IA-IMPLEMENTAR.md
const SKIP_WHITELABEL_VIA_API2 = process.env.SKIP_WHITELABEL_VIA_API2 === 'true';
// Opción B (recomendada): si api-ia expone whitelabel, definir API_IA_WHITELABEL_URL y el front solo llamará a api-ia (no a API2)
const API_IA_WHITELABEL_URL = process.env.API_IA_WHITELABEL_URL || '';

const createRequestId = (): string => {
  try {
    const maybeCrypto = (globalThis as any).crypto;
    if (maybeCrypto?.randomUUID) return maybeCrypto.randomUUID();
  } catch {
    // ignore
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const respondBackendUnavailable = (
  res: NextApiResponse,
  stream: boolean,
  requestId: string,
  message = 'Servicio IA no disponible (backend IA). Intenta más tarde.',
  meta?: { backendTraceId?: string; backendErrorCode?: string }
) => {
  const tracePart = meta?.backendTraceId ? ` TraceId: ${meta.backendTraceId}` : '';
  const codePart = meta?.backendErrorCode ? ` ErrorCode: ${meta.backendErrorCode}` : '';
  const msg = `${message} RequestId: ${requestId}${tracePart}${codePart}`;

  if (stream) {
    if (!res.headersSent) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('X-Request-Id', requestId);
    }
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: msg } }] })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  res.status(503).json({ error: 'IA_BACKEND_UNAVAILABLE', message: msg, requestId });
};

// Default provider: backend IA auto-routing
const DEFAULT_PROVIDER = 'auto';

// API2_GRAPHQL_URL: solo se usa como fallback de whitelabel si SKIP_WHITELABEL_VIA_API2 no está activo.
// apps/web no debe apuntar a api2; preferir API_IA_WHITELABEL_URL o SKIP_WHITELABEL_VIA_API2=true.
const API2_GRAPHQL_URL = process.env.API2_GRAPHQL_URL || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Support keys for API2 authentication
const SUPPORT_KEYS: Record<string, string> = {
  'annloevents': 'SK-annloevents-bc71e2d9',
  'bodasdehoy': 'SK-bodasdehoy-a71f5b3c',
  'champagne-events': 'SK-champagne-events-d4c92a10',
  'corporativozr': 'SK-corporativozr-0f1e8c72',
  'eventosintegrados': 'SK-eventosintegrados-9184f2c0',
  'eventosorganizador': 'SK-eventosorganizador-6e38d7f4',
  'eventosplanificador': 'SK-eventosplanificador-ae273c81',
  'miamorcitocorazon': 'SK-miamorcitocorazon-4a7e1c9d',
  'ohmaratilano': 'SK-ohmaratilano-df63a0b5',
  'theweddingplanner': 'SK-theweddingplanner-5c9e41ad',
  'vivetuboda': 'SK-vivetuboda-5f92c1ab',
};

// Cache for API keys
interface ApiKeyCache {
  key: string;
  model: string;
  provider: string;
  timestamp: number;
}
const apiKeyCache: Record<string, ApiKeyCache> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── System Prompt ──

const BASE_SYSTEM_PROMPT = `Eres Copilot, el asistente personal de Bodas de Hoy. Tu rol es ayudar a los usuarios a organizar sus eventos de forma sencilla y amigable.

## Tu personalidad
- Responde SIEMPRE en español, de forma cálida y cercana
- Sé conciso pero útil (respuestas de 2-4 oraciones máximo)
- Usa un tono conversacional, no técnico
- Nunca menciones herramientas, APIs, MCPs, parámetros o detalles técnicos al usuario
- Si no puedes hacer algo, sugiere amablemente ir a la sección correspondiente

## Navegación - MUY IMPORTANTE
Cuando menciones cualquier sección de la aplicación, SIEMPRE incluye un link clickeable en formato markdown.

**Links básicos:**
- Invitados: [Ver invitados](/invitados)
- Presupuesto: [Ver presupuesto](/presupuesto)
- Itinerario: [Ver itinerario](/itinerario)
- Mesas: [Ver mesas](/mesas)
- Invitaciones: [Ver invitaciones](/invitaciones)
- Resumen: [Ver resumen](/resumen-evento)

## Ejemplos de respuestas correctas:
- "¡Claro! Puedes gestionar tus gastos en [presupuesto](/presupuesto). ¿Te ayudo con algo más?"
- "Tienes X invitados confirmados. Puedes ver la lista completa en [Ver invitados](/invitados)."
- "¡Hola! Soy Copilot. ¿En qué puedo ayudarte hoy con tu evento?"

## Acciones que PUEDES realizar
- **Agregar invitados**: Usa la función add_guests cuando el usuario quiera agregar invitados.
- **Modificar invitados**: Editar datos, confirmar asistencia, asignar mesa.
- **Presupuesto**: Agregar gastos, registrar pagos, consultar resumen.
- **Mesas**: Crear mesas, asignar invitados a mesas.
- **Itinerario**: Crear tareas, modificar estado, asignar responsables.
- **Invitaciones**: Enviar invitaciones por email o WhatsApp.
- **Reportes**: Generar reportes de invitados, presupuesto, mesas.
- **QR**: Generar códigos QR para invitados.
- **Exportar**: Generar Excel o PDF con datos del evento.
- Siempre confirma al usuario qué acción vas a realizar antes de ejecutarla.

## PROHIBIDO - Nunca hagas esto:
- NO menciones "herramientas", "funciones", "parámetros" ni términos técnicos
- NO digas cosas como "Puedo usar la herramienta X" o "Los parámetros disponibles son..."
- NO muestres código, JSON, estructuras de datos ni detalles de API
- NO expliques cómo funcionan los sistemas internos`;

function buildSystemPrompt(metadata?: { eventName?: string; eventId?: string; pageContext?: any }): string {
  let prompt = BASE_SYSTEM_PROMPT;

  if (metadata?.eventName || metadata?.eventId) {
    prompt += `\n\n## Contexto del Evento Actual`;
    if (metadata.eventName) prompt += `\nEl usuario está trabajando en el evento: "${metadata.eventName}"`;
    if (metadata.eventId) {
      prompt += `\nID del evento: ${metadata.eventId}`;

      // Agregar links con filtros cuando el eventId esté disponible
      prompt += `\n\n**Links con filtros disponibles para este evento:**
- Ver todos los invitados: [Ver invitados](/invitados?eventId=${metadata.eventId})
- Ver solo confirmados: [Ver confirmados](/invitados?eventId=${metadata.eventId}&status=confirmed)
- Ver solo pendientes: [Ver pendientes](/invitados?eventId=${metadata.eventId}&status=pending)
- Ver presupuesto: [Ver presupuesto](/presupuesto?eventId=${metadata.eventId})
- Ver mesas: [Ver mesas](/mesas?eventId=${metadata.eventId})
- Ver itinerario: [Ver itinerario](/itinerario?eventId=${metadata.eventId})

**Usa estos links cuando respondas sobre invitados, presupuesto, mesas, etc.**`;
    }
  }

  if (metadata?.pageContext) {
    const ctx = metadata.pageContext;
    if (ctx.pageName) prompt += `\n\n## Pantalla Actual\nEl usuario está en: ${ctx.pageName}`;
    if (ctx.screenData && Object.keys(ctx.screenData).length > 0) {
      prompt += `\n\n## Datos Disponibles en Pantalla`;
      if (ctx.screenData.totalInvitados !== undefined) {
        prompt += `\n- Total invitados: ${ctx.screenData.totalInvitados}`;
        if (ctx.screenData.confirmados !== undefined) {
          prompt += ` (${ctx.screenData.confirmados} confirmados, ${ctx.screenData.pendientes} pendientes)`;
        }
      }
      if (ctx.screenData.presupuestoTotal !== undefined) {
        const currency = ctx.screenData.currency || 'EUR';
        prompt += `\n- Presupuesto total: ${ctx.screenData.presupuestoTotal} ${currency}`;
        if (ctx.screenData.pagado !== undefined) prompt += ` (Pagado: ${ctx.screenData.pagado} ${currency})`;
      }
      if (ctx.screenData.totalMesas !== undefined) prompt += `\n- Total mesas: ${ctx.screenData.totalMesas}`;
      if (ctx.screenData.totalItinerarios !== undefined) {
        prompt += `\n- Itinerarios: ${ctx.screenData.totalItinerarios} (${ctx.screenData.tareasCompletadas || 0} tareas completadas)`;
      }
    }
  }

  if (metadata?.pageContext?.eventsList?.length) {
    prompt += `\n\n## Eventos del Usuario`;
    prompt += `\nEl usuario tiene ${metadata.pageContext.eventsList.length} evento(s):`;
    for (const ev of metadata.pageContext.eventsList.slice(0, 10)) {
      const parts = [ev.name || 'Sin nombre'];
      if (ev.type) parts.push(`(${ev.type})`);
      if (ev.date) parts.push(`- ${ev.date}`);
      prompt += `\n- ${parts.join(' ')}`;
    }
  }

  prompt += `\n\n## Instrucciones finales OBLIGATORIAS
- SIEMPRE incluye links de navegación [texto](/ruta) cuando menciones secciones de la aplicación.
- SIEMPRE usa los datos EXACTOS de las secciones "Datos Disponibles en Pantalla" y "Eventos del Usuario" para responder. NUNCA inventes datos ni cifras.
- NUNCA digas que necesitas "ejecutar herramientas", "consultar bases de datos" o "ejecutar funciones". Ya tienes los datos arriba.
- NUNCA simules ejecución de código, funciones o herramientas. Responde directamente con los datos que tienes.
- Si no tienes un dato específico, sugiere al usuario ir a la sección correspondiente con un link.

## IMPORTANTE: Respuestas sobre eventos específicos
- Si el usuario pregunta por UN evento específico (ej: "Boda de Ana"), responde SOLO sobre ese evento.
- NO listes todos los eventos del usuario a menos que te lo pidan explícitamente.
- Si encuentras el evento en la lista, di: "El evento [nombre] está registrado. ¿Quieres [Ver invitados](/invitados?event=ID) o ver más detalles?"
- Si no lo encuentras, di: "No encuentro ese evento. Tienes X eventos registrados. ¿Quieres que te los muestre?"
- Cuando sea posible, incluye el link directo al evento con filtro aplicado: [Ver invitados de X](/invitados?eventId=ID)`;

  return prompt;
}

function buildUserContextPrefix(metadata?: { eventName?: string; eventId?: string; pageContext?: any }): string {
  const parts: string[] = [];

  if (metadata?.eventName) parts.push(`Evento actual: "${metadata.eventName}"`);

  const ctx = metadata?.pageContext;
  if (ctx?.screenData) {
    const d = ctx.screenData;
    const dataParts: string[] = [];
    if (d.totalInvitados !== undefined) {
      dataParts.push(`Total invitados: ${d.totalInvitados} (${d.confirmados ?? '?'} confirmados, ${d.pendientes ?? '?'} pendientes)`);
    }
    if (d.presupuestoTotal !== undefined) {
      dataParts.push(`Presupuesto total: ${d.presupuestoTotal} ${d.currency || 'EUR'}, pagado: ${d.pagado ?? 0} ${d.currency || 'EUR'}`);
    }
    if (d.totalMesas !== undefined) dataParts.push(`Mesas: ${d.totalMesas}`);
    if (d.totalItinerarios !== undefined) dataParts.push(`Itinerarios: ${d.totalItinerarios}`);
    if (d.tipoEvento) dataParts.push(`Tipo: ${d.tipoEvento}`);
    if (d.fechaEvento) dataParts.push(`Fecha: ${d.fechaEvento}`);
    if (dataParts.length > 0) parts.push(dataParts.join('. '));
  }

  if (ctx?.eventsList?.length) {
    const eventLines = ctx.eventsList.map((e: any) => {
      const p = [e.name || 'Sin nombre'];
      if (e.type) p.push(`(${e.type})`);
      if (e.date) p.push(`- ${e.date}`);
      return p.join(' ');
    });
    parts.push(`Mis eventos: ${eventLines.join('; ')}`);
  }

  if (parts.length === 0) return '';

  return `[INSTRUCCIÓN: Ya tienes TODOS los datos que necesitas a continuación. Responde DIRECTAMENTE con estos datos. NUNCA digas "necesito ejecutar", "debo usar la herramienta", "voy a consultar" ni menciones funciones, herramientas o APIs. Si el usuario pide agregar invitados, usa la función add_guests con los datos proporcionados. Solo el nombre es obligatorio.]\n[DATOS: ${parts.join('. ')}]\n\n`;
}

// ── Enriched SSE Event Types ──
// These event types are forwarded from api-ia to the frontend for rich rendering.
// The frontend parses them and renders specialized UI components.

/** Known enriched SSE event types (api-ia: event_card, usage, reasoning) */
const ENRICHED_EVENT_TYPES = new Set([
  'tool_result',
  'ui_action',
  'confirm_required',
  'progress',
  'code_output',
  'tool_start',
  'event_card',   // Tarjeta de evento con actions (api-ia)
  'usage',        // Tokens/costo (api-ia)
  'reasoning',    // Razonamiento interno (api-ia)
]);

// ── Normalize backend error codes ──

const normalizeBackendErrorCode = (input: {
  errorCode?: string;
  message?: string;
  providerUsed?: string;
  requestedProvider?: string;
  upstreamStatus?: number | null;
  rawMeta?: string;
}): { errorCode?: string; upstreamStatus?: number | null; reason?: string } => {
  const msg = `${input.message || ''} ${input.rawMeta || ''}`;
  const msgLower = msg.toLowerCase();
  const requested = input.requestedProvider || '';
  const used = input.providerUsed || '';

  if (requested && requested !== 'auto' && used && used !== requested) {
    return { errorCode: 'PROVIDER_MISMATCH', upstreamStatus: input.upstreamStatus ?? null, reason: `provider_used=${used} requested=${requested}` };
  }

  if (input.upstreamStatus === 429 || msgLower.includes('error de openai: 429') || msgLower.includes('rate limit') || msgLower.includes('429')) {
    return { errorCode: 'UPSTREAM_RATE_LIMIT', upstreamStatus: 429, reason: 'upstream_429_detected' };
  }

  if (msgLower.includes('ollama no disponible') || (used === 'ollama' && msgLower.includes('no disponible'))) {
    return { errorCode: 'PROVIDER_UNAVAILABLE', upstreamStatus: input.upstreamStatus ?? null, reason: 'ollama_unavailable' };
  }

  return { errorCode: input.errorCode, upstreamStatus: input.upstreamStatus ?? null };
};

// ── Clean payload (remove original_provider) ──

function cleanPayload(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanPayload);
  const clean: any = {};
  for (const key of Object.keys(obj)) {
    if (key === 'original_provider' || key === 'originalProvider') continue;
    clean[key] = typeof obj[key] === 'object' ? cleanPayload(obj[key]) : obj[key];
  }
  return clean;
}

// ── Whitelabel API key fetch ──
// Opción B (api-ia): GET API_IA_WHITELABEL_URL?development=... → { apiKey, model?, provider? }
async function getWhitelabelFromApiIa(
  development: string,
  auth: string
): Promise<{ apiKey: string; model: string; provider: string } | null> {
  if (!API_IA_WHITELABEL_URL) return null;
  const url = `${API_IA_WHITELABEL_URL.replace(/\/$/, '')}?development=${encodeURIComponent(development)}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': auth || '',
        'X-Development': development,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const key = data?.aiApiKey ?? data?.apiKey;
    if (!key) return null;
    return {
      apiKey: key,
      model: data?.aiModel ?? data?.model ?? 'gpt-4o-mini',
      provider: data?.aiProvider ?? data?.provider ?? 'openai',
    };
  } catch (e) {
    console.error('[Copilot API] getWhitelabelFromApiIa error:', e);
    return null;
  }
}

async function getWhitelabelApiKey(development: string): Promise<{ apiKey: string; model: string; provider: string } | null> {
  const cached = apiKeyCache[development];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { apiKey: cached.key, model: cached.model, provider: cached.provider };
  }

  const supportKey = SUPPORT_KEYS[development] || SUPPORT_KEYS['bodasdehoy'];
  const query = `
    query {
      getWhiteLabelConfig(development: "${development}", supportKey: "${supportKey}") {
        success
        aiProvider
        aiModel
        aiApiKey
        errors { field message }
      }
    }
  `;

  try {
    const response = await fetch(API2_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const config = data?.data?.getWhiteLabelConfig;

    if (!config?.success || !config?.aiApiKey) return null;

    const result = {
      apiKey: config.aiApiKey,
      model: config.aiModel || 'gpt-4o-mini',
      provider: config.aiProvider || 'openai',
    };

    apiKeyCache[development] = { key: result.apiKey, model: result.model, provider: result.provider, timestamp: Date.now() };
    return result;
  } catch (err) {
    console.error('[Copilot API Fallback] Error fetching whitelabel config:', err);
    return null;
  }
}

// ── Simple fallback: call provider directly (text-only, no tools) ──

async function callProviderDirectFallback(
  apiKey: string,
  provider: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  stream: boolean,
  res: NextApiResponse,
  requestId: string
): Promise<void> {
  if (provider === 'anthropic') {
    const anthropicMessages = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
    }));
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: 2000, system: systemPrompt, messages: anthropicMessages, stream }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error (${response.status})`);
    }

    if (stream) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      const reader = response.body?.getReader();
      if (!reader) { res.end(); return; }
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n').filter(l => l.startsWith('data: '))) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: parsed.delta.text } }] })}\n\n`);
            }
          } catch { res.write(line + '\n'); }
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const data = await response.json();
      res.status(200).json({
        choices: [{ message: { role: 'assistant', content: data.content?.[0]?.text || '' } }],
      });
    }
  } else {
    // OpenAI / default
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, stream, temperature: 0.7, max_tokens: 2000 }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error (${response.status})`);
    }

    if (stream) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      const reader = response.body?.getReader();
      if (!reader) { res.end(); return; }
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
    } else {
      const data = await response.json();
      res.status(200).json(data);
    }
  }
}

// ── Main proxy to Python backend ──
// This is now a TRANSPARENT proxy: api-ia handles all tool execution via its orchestrator.
// The proxy only adds context (system prompt, user data) and forwards SSE events.

async function proxyToPythonBackend(
  req: NextApiRequest,
  res: NextApiResponse,
  provider: string = DEFAULT_PROVIDER,
  apiKey?: string,
  modelOverride?: string,
  requestId?: string
): Promise<boolean> {
  const backendUrl = `${PYTHON_BACKEND_URL}/webapi/chat/${provider}`;
  console.log('[Copilot API] Proxying to Python backend:', backendUrl, 'provider:', provider, 'requestId:', requestId);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const bodyCopy = cleanPayload(req.body);
    const { messages, model, stream = true, metadata } = bodyCopy;
    const development = (req.headers['x-development'] as string) || metadata?.development || 'bodasdehoy';

    // Build dynamic system prompt with event context
    const dynamicSystemPrompt = buildSystemPrompt(metadata);
    const contextPrefix = buildUserContextPrefix(metadata);

    const augmentedMessages = messages.map((msg: any, idx: number) => {
      if (idx === 0 && msg.role === 'user' && contextPrefix) {
        return { ...msg, content: contextPrefix + msg.content };
      }
      return msg;
    });

    const fullMessages = [{ role: 'system', content: dynamicSystemPrompt }, ...augmentedMessages];

    // For auto provider, let backend decide the model
    let finalModel: string | undefined = modelOverride || model;
    if (!finalModel && provider !== 'auto') {
      finalModel = provider === 'openrouter' ? 'openrouter/auto' :
                   provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' :
                   'gpt-4o-mini';
    }

    const payload: any = {
      messages: fullMessages,
      stream,
      temperature: 0.7,
      max_tokens: 2000,
    };
    if (finalModel) payload.model = finalModel;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Development': development,
    };

    if (requestId) headers['X-Request-Id'] = requestId;
    if (apiKey) headers['X-API-Key'] = apiKey;

    const authHeader = req.headers['authorization'];
    if (authHeader) headers['Authorization'] = authHeader as string;
    if (metadata?.userId) headers['X-User-Id'] = metadata.userId;
    if (metadata?.eventId) headers['X-Event-Id'] = metadata.eventId;
    if (metadata?.pageContext?.pageName) headers['X-Page-Name'] = metadata.pageContext.pageName;

    console.log('[Copilot API] Request:', {
      model: payload.model || '(auto)',
      messagesCount: payload.messages.length,
      stream: payload.stream,
      development,
      hasApiKey: !!apiKey,
    });

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('[Copilot API] Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      // Extract structured error info from backend
      let extractedMessage: string | undefined;
      let extractedTraceId: string | undefined;
      let extractedErrorCode: string | undefined;
      let extractedPaymentUrl: string | undefined;
      let extractedPlans: any;

      try {
        const bodyText = await backendResponse.text();
        try {
          const parsed = JSON.parse(bodyText);
          const traceId = parsed?.trace_id ?? parsed?.detail?.trace_id;
          const errorCode = parsed?.error_code ?? parsed?.detail?.error_code;
          const msg = parsed?.message ?? parsed?.error ?? parsed?.detail?.message ?? parsed?.detail?.error;

          const normalized = normalizeBackendErrorCode({
            errorCode: typeof errorCode === 'string' ? errorCode : undefined,
            message: typeof msg === 'string' ? msg : undefined,
            providerUsed: typeof parsed?.provider === 'string' ? parsed.provider : undefined,
            requestedProvider: provider,
            upstreamStatus: typeof parsed?.upstream_status === 'number' ? parsed.upstream_status : null,
          });

          if (traceId) { res.setHeader('X-Backend-Trace-Id', String(traceId)); extractedTraceId = String(traceId); }
          if (normalized.errorCode) { res.setHeader('X-Backend-Error-Code', String(normalized.errorCode)); extractedErrorCode = String(normalized.errorCode); }
          if (typeof msg === 'string' && msg.trim()) extractedMessage = msg;

          // Capturar campos específicos de 402
          if (backendResponse.status === 402) {
            extractedPaymentUrl = parsed?.payment_url || parsed?.upgrade_url || undefined;
            extractedPlans = parsed?.plans || undefined;
          }
        } catch {
          const traceMatch = bodyText.match(/"trace_id"\s*:\s*"([^"]+)"/);
          if (traceMatch?.[1]) res.setHeader('X-Backend-Trace-Id', traceMatch[1]);
          const codeMatch = bodyText.match(/"error_code"\s*:\s*"([^"]+)"/);
          if (codeMatch?.[1]) res.setHeader('X-Backend-Error-Code', codeMatch[1]);
        }
      } catch { /* ignore */ }

      // 401: no autorizado — propagar al cliente para mostrar "Sesión expirada" / "No autorizado" distinto de 503
      if (backendResponse.status === 401) {
        const isStream = !!req.body?.stream;
        const msg = extractedMessage || 'No autorizado. Inicia sesión de nuevo para usar el asistente.';
        res.setHeader('X-Backend-Error-Code', 'UNAUTHORIZED');
        if (isStream) {
          if (!res.headersSent) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
          }
          res.write(`data: ${JSON.stringify({ error: msg, errorCode: 'UNAUTHORIZED' })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        } else {
          res.status(401).json({
            error: 'UNAUTHORIZED',
            message: msg,
            requestId,
            ...(extractedTraceId && { trace_id: extractedTraceId }),
          });
        }
        return true;
      }

      // 402: saldo agotado — no hacer fallback, devolver directamente al cliente (siempre JSON para que el cliente pueda parsear payment_url/billing_url)
      if (backendResponse.status === 402) {
        const msg = extractedMessage || 'Saldo de IA agotado. Recarga tu cuenta para continuar usando el asistente.';
        res.setHeader('X-Backend-Error-Code', 'SALDO_AGOTADO');
        // URL de Facturación: la que envía api-ia o fallback a Copilot /settings/billing
        const copilotOrigin = process.env.NEXT_PUBLIC_CHAT || 'https://chat.bodasdehoy.com';
        const billingUrl = extractedPaymentUrl || `${copilotOrigin.replace(/\/$/, '')}/settings/billing`;
        console.warn('[Copilot API] 402 saldo agotado recibido de api-ia', { requestId, paymentUrl: extractedPaymentUrl });
        res.status(402).json({
          error: 'SALDO_AGOTADO',
          message: msg,
          requestId,
          payment_url: billingUrl,
          ...(extractedPlans && { plans: extractedPlans }),
          ...(extractedTraceId && { trace_id: extractedTraceId }),
        });
        return true;
      }

      console.error('[Copilot API] Backend error, status:', backendResponse.status, { requestId });

      if (!ENABLE_COPILOT_FALLBACK) {
        respondBackendUnavailable(res, !!req.body?.stream, requestId || createRequestId(), extractedMessage, {
          backendTraceId: extractedTraceId,
          backendErrorCode: extractedErrorCode,
        });
        return true;
      }

      return false; // Allow fallback
    }

    // ── Stream handling with enriched event forwarding ──

    const contentType = backendResponse.headers.get('content-type') || '';
    const isEventStream = contentType.includes('text/event-stream');

    if (stream && isEventStream) {
      const reader = backendResponse.body?.getReader();
      if (!reader) return false;

      const decoder = new TextDecoder();
      let pending = '';
      let currentEvent: string | null = null;
      let started = false;

      const ensureStreamHeaders = (statusCode = 200) => {
        if (started) return;
        started = true;
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (requestId) res.setHeader('X-Request-Id', requestId);
      };

      // Buffer for function call XML tags from backend
      let functionCallBuffer = '';
      let isBufferingFunctionCall = false;

      const writeDelta = (content: string) => {
        ensureStreamHeaders(200);
        if (!content || content.length === 0) return;

        // Detect raw function call XML from backend and convert to friendly messages
        const combined = functionCallBuffer + content;

        if (isBufferingFunctionCall || combined.includes('<function') || combined.includes('<function ')) {
          isBufferingFunctionCall = true;
          functionCallBuffer += content;

          if (functionCallBuffer.includes('/>') || functionCallBuffer.includes('</function>')) {
            const fnMatch = functionCallBuffer.match(/<function\s+name="([^"]+)"/);
            const fnName = fnMatch?.[1] || '';
            const friendlyMessages: Record<string, string> = {
              'get_budget': '📊 Consultando tu presupuesto...\n',
              'get_guests': '👥 Revisando la lista de invitados...\n',
              'get_user_events': '📅 Consultando tus eventos...\n',
              'get_itinerary': '📋 Revisando el itinerario...\n',
              'get_tables': '🪑 Revisando la distribución de mesas...\n',
              'get_menus': '🍽️ Consultando los menús...\n',
              'create_menu': '🍽️ Creando menú...\n',
              'add_guests': '👥 Agregando invitados...\n',
              'update_guest': '✏️ Actualizando invitado...\n',
              'create_task': '📋 Creando tarea...\n',
              'export_report': '📄 Generando reporte...\n',
              'generate_qr': '📱 Generando código QR...\n',
              'recalculate_budget': '📊 Recalculando presupuesto...\n',
              'navigate': '',
            };
            const friendly = friendlyMessages[fnName] ?? (fnName ? `⚙️ Ejecutando ${fnName}...\n` : '');
            functionCallBuffer = '';
            isBufferingFunctionCall = false;

            if (friendly) {
              // Emit as both text AND tool_start event so frontend can show loading
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: friendly } }] })}\n\n`);
              res.write(`event: tool_start\ndata: ${JSON.stringify({ tool: fnName })}\n\n`);
            }
            return;
          }
          return; // Keep buffering
        }

        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
      };

      const writeErrorAndEnd = (message: string, meta?: { trace_id?: string; error_code?: string }) => {
        if (meta?.trace_id) res.setHeader('X-Backend-Trace-Id', meta.trace_id);
        if (meta?.error_code) res.setHeader('X-Backend-Error-Code', meta.error_code);
        ensureStreamHeaders(503);
        const tracePart = meta?.trace_id ? ` TraceId: ${meta.trace_id}` : '';
        const codePart = meta?.error_code ? ` ErrorCode: ${meta.error_code}` : '';
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: `${message}${requestId ? ` RequestId: ${requestId}` : ''}${tracePart}${codePart}` } }] })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        pending += chunkText;
        const lines = pending.split('\n');
        pending = lines.pop() ?? '';

        for (const rawLine of lines) {
          const line = rawLine.replace(/\r$/, '');
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice('event:'.length).trim();
            continue;
          }

          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice('data:'.length).trim();
          if (!dataStr) continue;

          if (dataStr === '[DONE]') {
            ensureStreamHeaders(200);
            res.write('data: [DONE]\n\n');
            res.end();
            return true;
          }

          let parsed: any = null;
          try {
            parsed = JSON.parse(dataStr);
          } catch {
            if (currentEvent === 'text') writeDelta(dataStr);
            continue;
          }

          // ── ENRICHED EVENTS: Forward transparently to frontend ──
          if (currentEvent && ENRICHED_EVENT_TYPES.has(currentEvent)) {
            ensureStreamHeaders(200);
            res.write(`event: ${currentEvent}\ndata: ${JSON.stringify(parsed)}\n\n`);
            currentEvent = null;
            continue;
          }

          // event:error -> respond with error
          if (currentEvent === 'error' || (parsed?.error && !parsed?.choices)) {
            const technicalMsg = parsed?.error || 'Error del backend IA';
            // user_message: mensaje amigable para el usuario final (api-ia lo incluye en errores 503)
            const userMsg = parsed?.user_message || technicalMsg;
            const normalized = normalizeBackendErrorCode({
              errorCode: typeof parsed?.error_code === 'string' ? parsed.error_code : undefined,
              message: String(technicalMsg),
              providerUsed: typeof parsed?.provider === 'string' ? parsed.provider : undefined,
              requestedProvider: provider,
              upstreamStatus: typeof parsed?.upstream_status === 'number' ? parsed.upstream_status : null,
            });
            if (normalized.errorCode) res.setHeader('X-Backend-Error-Code', normalized.errorCode);
            writeErrorAndEnd(String(userMsg), { trace_id: parsed?.trace_id, error_code: normalized.errorCode });
            return true;
          }

          // event:done -> finish
          if (currentEvent === 'done') {
            ensureStreamHeaders(200);
            res.write('data: [DONE]\n\n');
            res.end();
            return true;
          }

          // OpenAI-ish SSE chunk -> forward as-is
          if (parsed?.choices) {
            ensureStreamHeaders(200);
            res.write(`data: ${JSON.stringify(parsed)}\n\n`);
            continue;
          }

          // event:text with { content: "..." } or direct string
          if (currentEvent === 'text') {
            if (typeof parsed === 'string') {
              writeDelta(parsed);
            } else if (typeof parsed?.content === 'string') {
              writeDelta(parsed.content);
            }
          }
        }
      }

      if (!started) return false;
      res.write('data: [DONE]\n\n');
      res.end();
      return true;
    }

    // Non-streaming SSE (backend ignores stream:false)
    if (!stream && isEventStream) {
      const reader = backendResponse.body?.getReader();
      if (!reader) return false;

      const decoder = new TextDecoder();
      let pending = '';
      let currentEvent: string | null = null;
      let content = '';
      let enrichedEvents: Array<{ type: string; data: any }> = [];
      let providerMeta: string | undefined;
      let modelMeta: string | undefined;
      let errorObj: { error?: string; user_message?: string; error_code?: string; trace_id?: string } | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        pending += chunkText;
        const lines = pending.split('\n');
        pending = lines.pop() ?? '';

        for (const rawLine of lines) {
          const line = rawLine.replace(/\r$/, '');
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) { currentEvent = trimmed.slice('event:'.length).trim(); continue; }
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice('data:'.length).trim();
          if (!dataStr || dataStr === '[DONE]') continue;

          let parsed: any = null;
          try { parsed = JSON.parse(dataStr); } catch {
            if (currentEvent === 'text') content += dataStr;
            continue;
          }

          if (!providerMeta && typeof parsed?.provider === 'string') providerMeta = parsed.provider;
          if (!modelMeta && typeof parsed?.model === 'string') modelMeta = parsed.model;

          // Collect enriched events
          if (currentEvent && ENRICHED_EVENT_TYPES.has(currentEvent)) {
            enrichedEvents.push({ type: currentEvent, data: parsed });
            continue;
          }

          if (currentEvent === 'error' || (parsed?.error && !parsed?.choices)) {
            const msg = typeof parsed?.error === 'string' ? parsed.error : 'Error del backend IA';
            // user_message: mensaje amigable para el usuario final (api-ia lo incluye en errores 503)
            const userMsg = typeof parsed?.user_message === 'string' ? parsed.user_message : undefined;
            const normalized = normalizeBackendErrorCode({
              errorCode: typeof parsed?.error_code === 'string' ? parsed.error_code : undefined,
              message: msg,
              providerUsed: typeof parsed?.provider === 'string' ? parsed.provider : providerMeta,
              requestedProvider: provider,
              upstreamStatus: typeof parsed?.upstream_status === 'number' ? parsed.upstream_status : null,
            });
            errorObj = { error: msg, user_message: userMsg, error_code: normalized.errorCode, trace_id: typeof parsed?.trace_id === 'string' ? parsed.trace_id : undefined };
            break;
          }

          if (currentEvent === 'text') {
            if (typeof parsed === 'string') content += parsed;
            else if (typeof parsed?.content === 'string') content += parsed.content;
          }
        }

        if (errorObj) break;
      }

      if (errorObj?.trace_id) res.setHeader('X-Backend-Trace-Id', errorObj.trace_id);
      if (errorObj?.error_code) res.setHeader('X-Backend-Error-Code', errorObj.error_code);

      if (errorObj) {
        res.status(503).json({
          error: errorObj.error_code || 'IA_BACKEND_ERROR',
          message: String(errorObj.user_message || errorObj.error || 'Error del backend IA'),
          user_message: errorObj.user_message,
          requestId,
          provider: providerMeta,
          model: modelMeta,
        });
        return true;
      }

      if (content.trim() || enrichedEvents.length > 0) {
        res.status(200).json({
          choices: [{ message: { role: 'assistant', content } }],
          enrichedEvents, // Forward enriched events in non-streaming mode
          provider: providerMeta,
          model: modelMeta,
        });
        return true;
      }

      res.status(503).json({
        error: 'IA_BACKEND_EMPTY_RESPONSE',
        message: `Backend IA devolvió respuesta vacía. RequestId: ${requestId}`,
        requestId,
        provider: providerMeta,
        model: modelMeta,
      });
      return true;
    }

    // Non-streaming JSON response
    const data = await backendResponse.json();

    if (data?.choices) {
      res.status(200).json(data);
      return true;
    }

    if (data?.success === false && typeof data?.error === 'string') {
      const traceId = data?.trace_id ?? data?.detail?.trace_id;
      const rawErrorCode = data?.error_code ?? data?.detail?.error_code;
      const normalized = normalizeBackendErrorCode({
        errorCode: typeof rawErrorCode === 'string' ? rawErrorCode : undefined,
        message: String(data.error),
        providerUsed: typeof data?.provider === 'string' ? data.provider : undefined,
        requestedProvider: provider,
        upstreamStatus: typeof data?.upstream_status === 'number' ? data.upstream_status : null,
      });
      if (traceId) res.setHeader('X-Backend-Trace-Id', String(traceId));
      if (normalized.errorCode) res.setHeader('X-Backend-Error-Code', String(normalized.errorCode));
      res.status(503).json({
        error: normalized.errorCode || 'IA_BACKEND_ERROR',
        // user_message: mensaje amigable para el usuario; message: para logs/debug
        message: String(data.user_message || data.error),
        user_message: typeof data.user_message === 'string' ? data.user_message : undefined,
        requestId,
        provider: data?.provider,
        model: data?.model,
        upstream_status: typeof normalized.upstreamStatus === 'number' ? normalized.upstreamStatus : undefined,
      });
      return true;
    }

    const successText =
      typeof data?.message === 'string' ? data.message :
      typeof data?.response === 'string' ? data.response :
      null;
    if (typeof successText === 'string') {
      const normalizedMsg = successText.trim();
      if (data?.success === true && normalizedMsg === '') {
        res.status(503).json({
          error: 'IA_BACKEND_EMPTY_RESPONSE',
          message: `Backend IA devolvió respuesta vacía. RequestId: ${requestId}`,
          requestId,
        });
        return true;
      }
      res.status(200).json({
        choices: [{ message: { role: 'assistant', content: successText } }],
        metadata: data?.metadata,
        provider: data?.provider,
        model: data?.model,
      });
      return true;
    }

    return true;

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[Copilot API] Proxy error:', error);
    return false;
  }
}

// ── Main Handler ──

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Development, X-Request-Id');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const requestId = (req.headers['x-request-id'] as string) || createRequestId();
    res.setHeader('X-Request-Id', requestId);

    const cleanBody = cleanPayload(req.body);
    const { messages, provider, stream = true, metadata } = cleanBody;
    const development = (req.headers['x-development'] as string) || metadata?.development || 'bodasdehoy';

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // 1. Primary: Proxy to Python backend (handles ALL tools via orchestrator)
    console.log('[Copilot API] Step 1: Proxying to Python backend...', { requestId, provider: provider || DEFAULT_PROVIDER });
    let proxySuccess = await proxyToPythonBackend(req, res, provider || DEFAULT_PROVIDER, undefined, undefined, requestId);

    if (proxySuccess) {
      console.log('[Copilot API] Python backend proxy successful');
      return;
    }

    // Strict mode: never return fallback output
    if (!ENABLE_COPILOT_FALLBACK) {
      const backendTraceId = typeof res.getHeader('X-Backend-Trace-Id') === 'string' ? res.getHeader('X-Backend-Trace-Id') as string : undefined;
      const backendErrorCode = typeof res.getHeader('X-Backend-Error-Code') === 'string' ? res.getHeader('X-Backend-Error-Code') as string : undefined;
      console.warn('[Copilot API] Backend IA failed; fallbacks disabled.', { requestId, backendErrorCode, backendTraceId });
      return respondBackendUnavailable(res, !!stream, requestId, undefined, { backendErrorCode, backendTraceId });
    }

    // 2. Fallback: OpenAI directly (text-only, no tools)
    if (OPENAI_API_KEY) {
      console.log('[Copilot API] Step 2: Using OpenAI direct fallback (text-only)...');
      const dynamicPrompt = buildSystemPrompt(metadata);
      const contextPrefix = buildUserContextPrefix(metadata);
      const augmentedMessages = messages.map((msg: any, idx: number) => {
        if (idx === 0 && msg.role === 'user' && contextPrefix) return { ...msg, content: contextPrefix + msg.content };
        return msg;
      });
      const fullMessages = [{ role: 'system', content: dynamicPrompt }, ...augmentedMessages];

      try {
        await callProviderDirectFallback(OPENAI_API_KEY, 'openai', 'gpt-4o-mini', fullMessages, !!stream, res, requestId);
        return;
      } catch (openaiError) {
        console.error('[Copilot API] OpenAI fallback failed:', openaiError);
      }
    }

    // 3. Fallback: Whitelabel credentials (api-ia opción B o API2; omitido si SKIP_WHITELABEL_VIA_API2)
    if (API_IA_WHITELABEL_URL) {
      console.log('[Copilot API] Step 3: Getting whitelabel from api-ia (API_IA_WHITELABEL_URL)...');
      const fromApiIa = await getWhitelabelFromApiIa(development, (req.headers.authorization as string) || '');
      if (fromApiIa) {
        const whitelabelConfig = fromApiIa;
        const { apiKey, model: whitelabelModel, provider: whitelabelProvider } = whitelabelConfig;
        console.log('[Copilot API] Step 3: Trying api-ia with whitelabel:', whitelabelProvider, whitelabelModel);
        const fallbackSuccess = await proxyToPythonBackend(req, res, whitelabelProvider, apiKey, whitelabelModel, requestId);
        if (fallbackSuccess) return;
        const dynamicPrompt = buildSystemPrompt(metadata);
        const contextPrefix = buildUserContextPrefix(metadata);
        const augmentedMessages = messages.map((msg: any, idx: number) => {
          if (idx === 0 && msg.role === 'user' && contextPrefix) return { ...msg, content: contextPrefix + msg.content };
          return msg;
        });
        const fullMessages = [{ role: 'system', content: dynamicPrompt }, ...augmentedMessages];
        const model = whitelabelModel || (whitelabelProvider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o-mini');
        await callProviderDirectFallback(apiKey, whitelabelProvider, model, fullMessages, !!stream, res, requestId);
        return;
      }
    }
    if (SKIP_WHITELABEL_VIA_API2) {
      console.log('[Copilot API] Skipping whitelabel via API2 (SKIP_WHITELABEL_VIA_API2=true)');
      return respondBackendUnavailable(res, !!stream, requestId);
    }
    console.log('[Copilot API] Step 3: Getting whitelabel credentials from API2...');
    const whitelabelConfig = await getWhitelabelApiKey(development);

    if (!whitelabelConfig) {
      console.error('[Copilot API] Could not get API key from whitelabel');
      const errorMsg = 'El servicio de IA no está disponible. Por favor contacta al administrador.';
      if (stream) {
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
        }
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: errorMsg } }] })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }
      return res.status(503).json({ error: 'NO_API_KEY', message: errorMsg });
    }

    const { apiKey, model: whitelabelModel, provider: whitelabelProvider } = whitelabelConfig;
    console.log('[Copilot API] Step 3: Trying api-ia with whitelabel:', whitelabelProvider, whitelabelModel);

    // Try api-ia with whitelabel credentials
    let fallbackSuccess = await proxyToPythonBackend(req, res, whitelabelProvider, apiKey, whitelabelModel, requestId);
    if (fallbackSuccess) return;

    // 4. Last resort: Direct provider call (text-only, no tools)
    console.log('[Copilot API] Step 4: Direct provider call (text-only)...');
    const dynamicPrompt = buildSystemPrompt(metadata);
    const contextPrefix = buildUserContextPrefix(metadata);
    const augmentedMessages = messages.map((msg: any, idx: number) => {
      if (idx === 0 && msg.role === 'user' && contextPrefix) return { ...msg, content: contextPrefix + msg.content };
      return msg;
    });
    const fullMessages = [{ role: 'system', content: dynamicPrompt }, ...augmentedMessages];
    const model = whitelabelModel || (whitelabelProvider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o-mini');

    await callProviderDirectFallback(apiKey, whitelabelProvider, model, fullMessages, !!stream, res, requestId);

  } catch (error) {
    console.error('[Copilot API] Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
