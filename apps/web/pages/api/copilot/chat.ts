/**
 * API Route: /api/copilot/chat
 *
 * Proxies chat requests to the Python backend at api-ia.bodasdehoy.com
 * which handles auto-routing with OpenRouter for intelligent model selection
 * and automatic fallback between providers.
 *
 * If the Python backend fails, falls back to whitelabel API key system.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// Python backend URL with auto-routing
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'https://api-ia.bodasdehoy.com';

// Safety guard: never return "fallback" model output if the backend IA is down.
// Only enable fallbacks explicitly via env in environments where it's acceptable.
const ENABLE_COPILOT_FALLBACK = process.env.ENABLE_COPILOT_FALLBACK === 'true';

const createRequestId = (): string => {
  try {
    // Node 20+ exposes WebCrypto as globalThis.crypto
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

    // OpenAI-ish delta chunk so the client can render it safely
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: msg } }] })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  res.status(503).json({ error: 'IA_BACKEND_UNAVAILABLE', message: msg, requestId });
};

// Default provider: backend IA auto-routing (elige provider/model según disponibilidad/políticas)
const DEFAULT_PROVIDER = 'auto';

// Fallback API endpoints (used when Python backend fails)
const API2_GRAPHQL_URL = 'https://api2.eventosorganizador.com/graphql';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// OpenAI API Key from environment (used as primary fallback when backend fails)
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

// System prompt for the Copilot
const SYSTEM_PROMPT = `Eres el Copilot de Bodas de Hoy, un asistente inteligente para ayudar a organizar eventos y bodas.

Tu objetivo es ayudar a los usuarios con:
- Gestionar invitados y listas de invitados
- Organizar el presupuesto del evento
- Planificar el itinerario del día
- Configurar mesas y asientos
- Enviar invitaciones
- Cualquier otra tarea relacionada con la organización de eventos

Responde siempre en español, de forma amigable y profesional.
Sé conciso pero útil. Si necesitas más información, pregunta.

Si el usuario pregunta cómo hacer algo en la aplicación, guíalo paso a paso.
Si detectas que el usuario quiere navegar a una sección, sugiere el enlace apropiado como:
- /invitados - para gestionar invitados
- /presupuesto - para el presupuesto
- /itinerario - para el itinerario
- /mesas - para el plano de mesas
- /invitaciones - para enviar invitaciones
- /resumen-evento - para ver el resumen del evento`;

/**
 * Fetch API key from whitelabel collection (fallback method)
 */
async function getWhitelabelApiKey(development: string): Promise<{ apiKey: string; model: string; provider: string } | null> {
  // Check cache first
  const cached = apiKeyCache[development];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[Copilot API Fallback] Using cached API key for:', development);
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
    console.log('[Copilot API Fallback] Fetching API key from API2 for:', development);
    const response = await fetch(API2_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const config = data?.data?.getWhiteLabelConfig;

    if (!config?.success || !config?.aiApiKey) return null;

    apiKeyCache[development] = {
      key: config.aiApiKey,
      model: config.aiModel || 'claude-sonnet-4-20250514',
      provider: config.aiProvider || 'anthropic',
      timestamp: Date.now(),
    };

    console.log('[Copilot API Fallback] Got API key for:', development, 'provider:', config.aiProvider);
    return { apiKey: config.aiApiKey, model: config.aiModel, provider: config.aiProvider };
  } catch (error) {
    console.error('[Copilot API Fallback] Error fetching whitelabel config:', error);
    return null;
  }
}

/**
 * Call OpenAI API directly (fallback)
 */
async function callOpenAIFallback(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  stream: boolean,
  res: NextApiResponse,
  options?: { requestId?: string; throwOnError?: boolean }
): Promise<void> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream, temperature: 0.7, max_tokens: 2000 }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Copilot API Fallback] OpenAI error:', response.status, error, {
      requestId: options?.requestId,
    });

    if (options?.throwOnError) {
      throw new Error(`OpenAI API error (${response.status})`);
    }

    const msg = `Error en el servicio de IA (OpenAI ${response.status}).${
      options?.requestId ? ` RequestId: ${options.requestId}` : ''
    }`;
    if (stream) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: msg } }] })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(response.status).json({ error: 'OpenAI API error', requestId: options?.requestId });
    }
    return;
  }

  if (stream) {
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
    res.status(200).json(await response.json());
  }
}

/**
 * Call Anthropic API directly (fallback)
 */
async function callAnthropicFallback(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  stream: boolean,
  res: NextApiResponse,
  options?: { requestId?: string; throwOnError?: boolean }
): Promise<void> {
  const anthropicMessages = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }));

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
    const errorText = await response.text();
    console.error('[Copilot API Fallback] Anthropic error:', response.status, errorText);
    console.error('[Copilot API Fallback] Request details:', {
      model,
      messagesCount: anthropicMessages.length,
      apiKeyPrefix: apiKey?.substring(0, 10) + '...',
      requestId: options?.requestId,
    });

    if (options?.throwOnError) {
      throw new Error(`Anthropic API error (${response.status})`);
    }

    const msg = `Error en el servicio de IA (Anthropic ${response.status}).${
      options?.requestId ? ` RequestId: ${options.requestId}` : ''
    }`;
    if (stream) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: msg } }] })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res
        .status(response.status)
        .json({ error: 'Anthropic API error', status: response.status, details: errorText, requestId: options?.requestId });
    }
    return;
  }

  if (stream) {
    const reader = response.body?.getReader();
    if (!reader) { res.end(); return; }
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // Convert Anthropic format to OpenAI format
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
}

/**
 * Proxy request to Python backend
 * @param provider - Provider to use (openrouter, anthropic, openai)
 * @param apiKey - Optional API key to pass to backend
 * @param model - Optional model override
 * Returns true if successful, false if fallback is needed
 */
// ✅ FUNCIÓN HELPER: Eliminar original_provider de forma definitiva
function removeOriginalProvider(jsonString: string): string {
  let cleaned = jsonString;
  // Eliminar con regex múltiples variantes del campo
  cleaned = cleaned.replace(/"original_provider"\s*:\s*"[^"]*"\s*,?\s*/g, '');
  cleaned = cleaned.replace(/"originalProvider"\s*:\s*"[^"]*"\s*,?\s*/g, '');
  cleaned = cleaned.replace(/"original_provider"\s*:\s*[^,}\]]+\s*,?\s*/g, '');
  cleaned = cleaned.replace(/"originalProvider"\s*:\s*[^,}\]]+\s*,?\s*/g, '');
  // Limpiar comas dobles o comas al inicio de objetos
  cleaned = cleaned.replace(/,{2,}/g, ',');
  cleaned = cleaned.replace(/,\s*}/g, '}');
  cleaned = cleaned.replace(/,\s*]/g, ']');
  return cleaned;
}

async function proxyToPythonBackend(
  req: NextApiRequest,
  res: NextApiResponse,
  provider: string = DEFAULT_PROVIDER,
  apiKey?: string,
  modelOverride?: string,
  requestId?: string
): Promise<boolean> {
  // ✅ FILTRO INICIAL: Limpiar req.body completamente antes de cualquier procesamiento
  if (req.body && typeof req.body === 'object') {
    delete (req.body as any).original_provider;
    delete (req.body as any).originalProvider;
  }
  
  const backendUrl = `${PYTHON_BACKEND_URL}/webapi/chat/${provider}`;
  console.log('[Copilot API] Proxying to Python backend:', backendUrl, 'provider:', provider, 'requestId:', requestId);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    // ✅ CORRECCIÓN: Filtrar campos no soportados del req.body antes de procesar
    const bodyCopy = { ...req.body };
    delete bodyCopy.original_provider;
    delete bodyCopy.originalProvider;
    
    const { messages, model, stream = true, metadata } = bodyCopy;
    const development = (req.headers['x-development'] as string) || metadata?.development || 'bodasdehoy';

    const fullMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

    // Use model override if provided, otherwise use request model or default based on provider.
    // Para `provider=auto`, NO forzamos model: lo decide el backend (auto-routing real).
    let finalModel: string | undefined = modelOverride || model;
    if (!finalModel) {
      finalModel = provider === 'auto' ? undefined :
                   provider === 'openrouter' ? 'openrouter/auto' :
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
    
    // ✅ CORRECCIÓN: Eliminar campos no soportados por el backend Python
    delete payload.original_provider;
    delete payload.originalProvider;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Development': development,
    };

    if (requestId) headers['X-Request-Id'] = requestId;

    // Pass API key to backend if provided
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const authHeader = req.headers['authorization'];
    if (authHeader) headers['Authorization'] = authHeader as string;
    if (metadata?.userId) headers['X-User-Id'] = metadata.userId;
    if (metadata?.eventId) headers['X-Event-Id'] = metadata.eventId;

    // ✅ VERIFICACIÓN FINAL: Asegurar que payload no contiene original_provider
    delete (payload as any).original_provider;
    delete (payload as any).originalProvider;
    
    // Log del payload para debugging
    const payloadKeys = Object.keys(payload);
    if (payloadKeys.includes('original_provider') || payloadKeys.includes('originalProvider')) {
      console.error('[ERROR] Copilot API: ❌ payload AÚN contiene original_provider después de filtrar!', payloadKeys);
    }
    
    console.log('[Copilot API] Request payload:', {
      model: payload.model,
      messagesCount: payload.messages.length,
      stream: payload.stream,
      development,
      hasApiKey: !!apiKey,
      payloadKeys: payloadKeys.filter(k => !['messages', 'model', 'stream', 'temperature', 'max_tokens'].includes(k))
    });

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

      // If provider was explicitly requested but backend used a different one
      if (requested && requested !== 'auto' && used && used !== requested) {
        return { errorCode: 'PROVIDER_MISMATCH', upstreamStatus: input.upstreamStatus ?? null, reason: `provider_used=${used} requested=${requested}` };
      }

      // Detect OpenAI rate limit in message/meta even if backend uses EMPTY_RESPONSE
      if (input.upstreamStatus === 429 || msgLower.includes('error de openai: 429') || msgLower.includes('rate limit') || msgLower.includes('429')) {
        return { errorCode: 'UPSTREAM_RATE_LIMIT', upstreamStatus: 429, reason: 'upstream_429_detected' };
      }

      // Detect Ollama unavailable
      if (msgLower.includes('ollama no disponible') || (used === 'ollama' && msgLower.includes('no disponible'))) {
        return { errorCode: 'PROVIDER_UNAVAILABLE', upstreamStatus: input.upstreamStatus ?? null, reason: 'ollama_unavailable' };
      }

      return { errorCode: input.errorCode, upstreamStatus: input.upstreamStatus ?? null };
    };

    // ✅ SOLUCIÓN FINAL: Reconstruir el objeto COMPLETO sin original_provider
    // Esto asegura que el campo no esté presente de ninguna manera
    let finalPayloadString = JSON.stringify(payload);
    try {
      const parsed = JSON.parse(finalPayloadString);
      // Crear objeto completamente nuevo sin original_provider
      const cleanObject: any = {};
      for (const key in parsed) {
        if (key !== 'original_provider' && key !== 'originalProvider') {
          // Si el valor es un objeto, limpiarlo recursivamente
          if (parsed[key] && typeof parsed[key] === 'object' && !Array.isArray(parsed[key])) {
            const cleanNested: any = {};
            for (const nestedKey in parsed[key]) {
              if (nestedKey !== 'original_provider' && nestedKey !== 'originalProvider') {
                cleanNested[nestedKey] = parsed[key][nestedKey];
              }
            }
            cleanObject[key] = cleanNested;
          } else if (Array.isArray(parsed[key])) {
            // Limpiar arrays recursivamente
            cleanObject[key] = parsed[key].map((item: any) => {
              if (item && typeof item === 'object') {
                const cleanItem: any = {};
                for (const itemKey in item) {
                  if (itemKey !== 'original_provider' && itemKey !== 'originalProvider') {
                    cleanItem[itemKey] = item[itemKey];
                  }
                }
                return cleanItem;
              }
              return item;
            });
          } else {
            cleanObject[key] = parsed[key];
          }
        }
      }
      finalPayloadString = JSON.stringify(cleanObject);
      console.log('[Copilot API] ✅✅✅ payload reconstruido completamente sin original_provider');
    } catch (e) {
      console.error('[ERROR] Copilot API: No se pudo parsear payload para reconstrucción final:', e);
      // Si falla, aplicar removeOriginalProvider 20 veces más
      for (let i = 0; i < 20; i++) {
        finalPayloadString = removeOriginalProvider(finalPayloadString);
      }
    }
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: finalPayloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('[Copilot API] Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      // Try to extract structured error info from backend (trace_id / error_code) and forward it in strict mode.
      let extractedMessage: string | undefined;
      let extractedTraceId: string | undefined;
      let extractedErrorCode: string | undefined;
      let extractedProvider: string | undefined;
      let extractedModel: string | undefined;
      let extractedUpstreamStatus: number | null | undefined;
      let extractedRawMeta: string | undefined;
      try {
        const bodyText = await backendResponse.text();
        try {
          const parsed = JSON.parse(bodyText);
          const traceId = parsed?.trace_id ?? parsed?.detail?.trace_id;
          const errorCode = parsed?.error_code ?? parsed?.detail?.error_code;
          const msg =
            parsed?.message ??
            parsed?.error ??
            parsed?.detail?.message ??
            parsed?.detail?.error;
          if (typeof parsed?.provider === 'string') extractedProvider = parsed.provider;
          if (typeof parsed?.model === 'string') extractedModel = parsed.model;
          if (typeof parsed?.upstream_status === 'number') extractedUpstreamStatus = parsed.upstream_status;
          // Capture any useful nested metadata (best-effort) to reclassify errors
          try {
            if (typeof parsed?.metadata?.original_result === 'string') extractedRawMeta = parsed.metadata.original_result;
            else if (parsed?.metadata?.original_result) extractedRawMeta = JSON.stringify(parsed.metadata.original_result);
            else if (parsed?.detail) extractedRawMeta = JSON.stringify(parsed.detail);
          } catch {
            // ignore
          }

          const normalized = normalizeBackendErrorCode({
            errorCode: typeof errorCode === 'string' ? errorCode : undefined,
            message: typeof msg === 'string' ? msg : undefined,
            providerUsed: extractedProvider,
            requestedProvider: provider,
            upstreamStatus: typeof extractedUpstreamStatus === 'number' ? extractedUpstreamStatus : null,
            rawMeta: extractedRawMeta,
          });

          if (traceId) res.setHeader('X-Backend-Trace-Id', String(traceId));
          if (normalized.errorCode) res.setHeader('X-Backend-Error-Code', String(normalized.errorCode));
          extractedTraceId = traceId ? String(traceId) : undefined;
          extractedErrorCode = normalized.errorCode ? String(normalized.errorCode) : undefined;
          if (typeof msg === 'string' && msg.trim()) extractedMessage = msg;
        } catch {
          // Best-effort regex fallback
          const traceMatch = bodyText.match(/"trace_id"\s*:\s*"([^"]+)"/);
          if (traceMatch?.[1]) res.setHeader('X-Backend-Trace-Id', traceMatch[1]);
          const codeMatch = bodyText.match(/"error_code"\s*:\s*"([^"]+)"/);
          if (codeMatch?.[1]) res.setHeader('X-Backend-Error-Code', codeMatch[1]);
        }
      } catch {
        // ignore
      }

      console.error('[Copilot API] Backend error, status:', backendResponse.status, { requestId });
      // In strict mode, do NOT mask backend errors with a generic "unavailable"
      if (!ENABLE_COPILOT_FALLBACK) {
        respondBackendUnavailable(res, !!req.body?.stream, requestId || createRequestId(), extractedMessage, {
          backendTraceId: extractedTraceId,
          backendErrorCode: extractedErrorCode,
        });
        return true;
      }

      return false; // Allow fallback when explicitly enabled
    }

    // Check if response contains an error in SSE format
    const contentType = backendResponse.headers.get('content-type') || '';
    const isEventStream = contentType.includes('text/event-stream');

    // Backend contract: may return SSE with `event: text|done|error` + `data: {...}`
    // Normalize SSE into OpenAI-ish `data: { choices: [...] }` so the frontend can render safely.
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

      const writeDelta = (content: string) => {
        ensureStreamHeaders(200);
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
      };

      const writeErrorAndEnd = (message: string, meta?: { trace_id?: string; error_code?: string }) => {
        if (meta?.trace_id) res.setHeader('X-Backend-Trace-Id', meta.trace_id);
        if (meta?.error_code) res.setHeader('X-Backend-Error-Code', meta.error_code);
        ensureStreamHeaders(503);
        const tracePart = meta?.trace_id ? ` TraceId: ${meta.trace_id}` : '';
        const codePart = meta?.error_code ? ` ErrorCode: ${meta.error_code}` : '';
        res.write(
          `data: ${JSON.stringify({
            choices: [
              {
                delta: {
                  content: `${message}${requestId ? ` RequestId: ${requestId}` : ''}${tracePart}${codePart}`,
                },
              },
            ],
          })}\n\n`,
        );
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

          // Backend might send OpenAI-style sentinel too
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
            // If it isn't JSON, treat it as plain text content only for `event:text`
            if (currentEvent === 'text') writeDelta(dataStr);
            continue;
          }

          // event:error -> respond with error (no fallback content)
          if (currentEvent === 'error' || (parsed?.error && !parsed?.choices)) {
            const msg = parsed?.error || 'Error del backend IA';
            const normalized = normalizeBackendErrorCode({
              errorCode: typeof parsed?.error_code === 'string' ? parsed.error_code : undefined,
              message: String(msg),
              providerUsed: typeof parsed?.provider === 'string' ? parsed.provider : undefined,
              requestedProvider: provider,
              upstreamStatus: typeof parsed?.upstream_status === 'number' ? parsed.upstream_status : null,
            });
            if (normalized.errorCode) res.setHeader('X-Backend-Error-Code', normalized.errorCode);
            writeErrorAndEnd(String(msg), { trace_id: parsed?.trace_id, error_code: normalized.errorCode });
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

          // New backend contract: event:text with `{ content: "..." }` OR direct string
          if (currentEvent === 'text') {
            // Backend may send either `{ content: "..." }` or just `"text"` as data
            if (typeof parsed === 'string') {
              // Direct string: data: "Hola, " -> parsed = "Hola, "
              writeDelta(parsed);
            } else if (typeof parsed?.content === 'string') {
              // Object with content: data: { content: "Hola" }
              writeDelta(parsed.content);
            }
          }
        }
      }

      // If stream ended unexpectedly without producing output, treat as failure
      if (!started) return false;

      // If started, ensure we close cleanly
      res.write('data: [DONE]\n\n');
      res.end();
      return true;
    }

    // Some backends ignore `stream:false` and still return `text/event-stream`.
    // In that case, we must NOT call `backendResponse.json()` (it will throw).
    // Instead, we consume the SSE and normalize it to a non-streaming JSON response.
    if (!stream && isEventStream) {
      const reader = backendResponse.body?.getReader();
      if (!reader) return false;

      const decoder = new TextDecoder();
      let pending = '';
      let currentEvent: string | null = null;

      let content = '';
      let providerMeta: string | undefined;
      let modelMeta: string | undefined;
      let errorObj: { error?: string; error_code?: string; trace_id?: string } | null = null;

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
          if (!dataStr || dataStr === '[DONE]') continue;

          let parsed: any = null;
          try {
            parsed = JSON.parse(dataStr);
          } catch {
            // If it isn't JSON, treat it as plain text only for `event:text`
            if (currentEvent === 'text') content += dataStr;
            continue;
          }

          // Capture best-effort meta
          if (!providerMeta && typeof parsed?.provider === 'string') providerMeta = parsed.provider;
          if (!modelMeta && typeof parsed?.model === 'string') modelMeta = parsed.model;

          // event:error
          if (currentEvent === 'error' || (parsed?.error && !parsed?.choices)) {
            const msg = typeof parsed?.error === 'string' ? parsed.error : 'Error del backend IA';
            const normalized = normalizeBackendErrorCode({
              errorCode: typeof parsed?.error_code === 'string' ? parsed.error_code : undefined,
              message: msg,
              providerUsed: typeof parsed?.provider === 'string' ? parsed.provider : providerMeta,
              requestedProvider: provider,
              upstreamStatus: typeof parsed?.upstream_status === 'number' ? parsed.upstream_status : null,
            });
            errorObj = {
              error: msg,
              error_code: normalized.errorCode,
              trace_id: typeof parsed?.trace_id === 'string' ? parsed.trace_id : undefined,
            };
            break;
          }

          // event:text { content: "..." } OR direct string
          if (currentEvent === 'text') {
            if (typeof parsed === 'string') {
              content += parsed;
            } else if (typeof parsed?.content === 'string') {
              content += parsed.content;
            }
          }
        }

        if (errorObj) break;
      }

      if (errorObj?.trace_id) res.setHeader('X-Backend-Trace-Id', errorObj.trace_id);
      if (errorObj?.error_code) res.setHeader('X-Backend-Error-Code', errorObj.error_code);

      if (errorObj) {
        res.status(503).json({
          error: errorObj.error_code ? String(errorObj.error_code) : 'IA_BACKEND_ERROR',
          message: String(errorObj.error || 'Error del backend IA'),
          requestId,
          provider: providerMeta,
          model: modelMeta,
        });
        return true;
      }

      // If we got text chunks, return as a single non-stream response
      if (content.trim()) {
        res.status(200).json({
          choices: [{ message: { role: 'assistant', content } }],
          provider: providerMeta,
          model: modelMeta,
        });
        return true;
      }

      // No error and no content -> treat as backend empty response
      res.status(503).json({
        error: 'IA_BACKEND_EMPTY_RESPONSE',
        message: `Backend IA devolvió respuesta vacía. RequestId: ${requestId}`,
        requestId,
        provider: providerMeta,
        model: modelMeta,
      });
      return true;
    }

    // Non-streaming response
    const data = await backendResponse.json();

    // Normalize backend JSON response into OpenAI-ish shape if needed
    if (data?.choices) {
      res.status(200).json(data);
      return true;
    }

    // Backend structured error: { success:false, error:"...", error_code, trace_id, ... }
    if (data?.success === false && typeof data?.error === 'string') {
      const traceId = data?.trace_id ?? data?.detail?.trace_id;
      const rawErrorCode = data?.error_code ?? data?.detail?.error_code;
      const rawMetaStr = (() => {
        try {
          if (typeof data?.metadata?.original_result === 'string') return data.metadata.original_result;
          if (data?.metadata?.original_result) return JSON.stringify(data.metadata.original_result);
          if (data?.detail) return JSON.stringify(data.detail);
        } catch {
          // ignore
        }
        return '';
      })();

      const normalized = normalizeBackendErrorCode({
        errorCode: typeof rawErrorCode === 'string' ? rawErrorCode : undefined,
        message: String(data.error),
        providerUsed: typeof data?.provider === 'string' ? data.provider : undefined,
        requestedProvider: provider,
        upstreamStatus: typeof data?.upstream_status === 'number' ? data.upstream_status : null,
        rawMeta: rawMetaStr,
      });
      const errorCode = normalized.errorCode;
      if (traceId) res.setHeader('X-Backend-Trace-Id', String(traceId));
      if (errorCode) res.setHeader('X-Backend-Error-Code', String(errorCode));
      res.status(503).json({
        error: errorCode ? String(errorCode) : 'IA_BACKEND_ERROR',
        message: String(data.error),
        requestId,
        suggestion: typeof data?.suggestion === 'string' ? data.suggestion : undefined,
        provider: data?.provider,
        model: data?.model,
        upstream_status: typeof normalized.upstreamStatus === 'number' ? normalized.upstreamStatus : undefined,
      });
      return true;
    }

    // Expected backend success format:
    // - { success:true, message:"..." } OR { success:true, response:"..." }
    const successText =
      typeof data?.message === 'string' ? data.message :
      typeof data?.response === 'string' ? data.response :
      null;
    if (typeof successText === 'string') {
      const normalizedMsg = successText.trim();

      // If backend reports success but returns empty message, treat it as backend failure.
      // We must never show empty or misleading assistant output.
      if (data?.success === true && normalizedMsg === '') {
        res.status(503).json({
          error: 'IA_BACKEND_EMPTY_RESPONSE',
          message: `Backend IA devolvió respuesta vacía. RequestId: ${requestId}`,
          requestId,
          provider: data?.provider,
          model: data?.model,
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

    // Unknown shape: treat as failure (strict mode will show error)
    return true;

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[Copilot API] Proxy error:', error);
    return false; // Need fallback
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Development, X-Request-Id');
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const requestId = (req.headers['x-request-id'] as string) || createRequestId();
    res.setHeader('X-Request-Id', requestId);

    // ✅ CORRECCIÓN CRÍTICA: Filtrar original_provider del req.body ANTES de desestructurar
    // Log para debugging
    console.log('[Copilot API] ========== INICIO HANDLER ==========');
    console.log('[Copilot API] req.body keys:', Object.keys(req.body || {}));
    const hadOriginalProvider = req.body && ('original_provider' in req.body || 'originalProvider' in req.body);
    console.log('[Copilot API] ❓ req.body contiene original_provider:', hadOriginalProvider);
    if (hadOriginalProvider) {
      console.error('[ERROR] Copilot API handler: ❌ req.body contiene original_provider ANTES de filtrar!', {
        keys: Object.keys(req.body || {}),
        original_provider: (req.body as any)?.original_provider,
        originalProvider: (req.body as any)?.originalProvider,
      });
    }
    
    // ✅ FILTRO AGRESIVO: Crear objeto limpio sin original_provider
    const cleanBody: any = {};
    for (const key in req.body) {
      if (key !== 'original_provider' && key !== 'originalProvider') {
        cleanBody[key] = req.body[key];
      }
    }
    
    // Verificar que se eliminó
    const stillHasOriginalProvider = 'original_provider' in cleanBody || 'originalProvider' in cleanBody;
    if (stillHasOriginalProvider) {
      console.error('[ERROR] Copilot API handler: ❌ cleanBody AÚN contiene original_provider después de filtrar!');
    } else if (hadOriginalProvider) {
      console.log('[Copilot API handler] ✅ original_provider eliminado correctamente de cleanBody');
    }
    console.log('[Copilot API] cleanBody keys después de filtrar:', Object.keys(cleanBody));
    
    const { messages, provider, stream = true, metadata } = cleanBody;
    const development = (req.headers['x-development'] as string) || metadata?.development || 'bodasdehoy';

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // 1. First try: Proxy to Python backend with auto-routing (provider=auto)
    console.log('[Copilot API] Step 1: Attempting Python backend with auto-routing...', { requestId });
    const proxySuccess = await proxyToPythonBackend(req, res, provider || DEFAULT_PROVIDER, undefined, undefined, requestId);

    if (proxySuccess) {
      console.log('[Copilot API] Python backend proxy successful');
      return; // Response already sent
    }

    // Strict mode: never return fallback output (avoid showing "fake" answers)
    if (!ENABLE_COPILOT_FALLBACK) {
      const backendTraceIdHeader = res.getHeader('X-Backend-Trace-Id');
      const backendErrorCodeHeader = res.getHeader('X-Backend-Error-Code');
      const backendTraceId = typeof backendTraceIdHeader === 'string' ? backendTraceIdHeader : undefined;
      const backendErrorCode = typeof backendErrorCodeHeader === 'string' ? backendErrorCodeHeader : undefined;
      
      // ✅ MEJORADO: Logging más detallado para diagnóstico
      console.warn('[Copilot API] Backend IA failed; fallbacks disabled. Returning error only.', {
        requestId,
        backendErrorCode,
        backendTraceId,
        provider: provider || DEFAULT_PROVIDER,
        development,
        message: 'El backend IA no está disponible. Verifica que api-ia.bodasdehoy.com esté funcionando.',
      });
      
      return respondBackendUnavailable(res, !!stream, requestId, undefined, {
        backendErrorCode,
        backendTraceId,
      });
    }

    // 2. Primary Fallback: Use OpenAI directly if API key is configured
    // This is the preferred fallback because the backend often fails with Ollama issues
    if (OPENAI_API_KEY) {
      console.log('[Copilot API] Step 2: Backend failed, using OpenAI directly as primary fallback...');

      // Set streaming headers if not already set
      if (stream && !res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
      }

      const fullMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

      try {
        await callOpenAIFallback(OPENAI_API_KEY, 'gpt-4o-mini', fullMessages, stream, res, {
          requestId,
          throwOnError: true,
        });
        return; // Response sent successfully
      } catch (openaiError) {
        console.error('[Copilot API] OpenAI fallback failed:', openaiError);
        // Continue to whitelabel fallback
      }
    }

    // 3. Secondary Fallback: Get whitelabel credentials and try api-ia with specific provider
    console.log('[Copilot API] Step 3: Getting whitelabel credentials for fallback...');

    const whitelabelConfig = await getWhitelabelApiKey(development);

    if (!whitelabelConfig) {
      console.error('[Copilot API] Could not get API key from whitelabel');
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
      }
      const errorMsg = 'El servicio de IA no está disponible. Por favor contacta al administrador.';
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: errorMsg } }] })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const { apiKey, model: whitelabelModel, provider: whitelabelProvider } = whitelabelConfig;
    console.log('[Copilot API] Step 3: Trying api-ia with provider:', whitelabelProvider, 'model:', whitelabelModel);

    // Try api-ia with the specific provider and API key from whitelabel
    const fallbackSuccess = await proxyToPythonBackend(
      req,
      res,
      whitelabelProvider, // Use provider from whitelabel (anthropic, openai)
      apiKey,              // Pass the API key to backend
      whitelabelModel,     // Use model from whitelabel
      requestId
    );

    if (fallbackSuccess) {
      console.log('[Copilot API] Step 3: api-ia fallback successful');
      return; // Response already sent
    }

    // 4. Last resort: Call provider API directly with whitelabel credentials
    console.log('[Copilot API] Step 4: api-ia fallback failed, calling provider directly...');

    // Set streaming headers if not already set
    if (stream && !res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    const model = whitelabelModel || (whitelabelProvider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o-mini');

    console.log('[Copilot API] Step 4: Direct call to:', whitelabelProvider, 'model:', model);

    // Build messages with system prompt
    const fullMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

    // Call the appropriate provider directly
    if (whitelabelProvider === 'anthropic') {
      await callAnthropicFallback(apiKey, model, fullMessages, SYSTEM_PROMPT, stream, res, { requestId });
    } else {
      await callOpenAIFallback(apiKey, model, fullMessages, stream, res, { requestId });
    }

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

// Disable body parsing for streaming
export const config = {
  api: {
    bodyParser: true,
  },
};
