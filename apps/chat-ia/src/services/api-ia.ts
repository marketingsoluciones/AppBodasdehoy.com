/**
 * 🚧 ESQUELETO (Opción A / migración a endpoints api-ia) — INACTIVO hasta que api-ia los despliegue.
 *
 * BACKEND (2026-06-03) decidió centralizar TODA escritura facturable en api-ia (chat, storage,
 * whatsapp, sms, email, imagen, audio). Lectura sigue directo a api-mcp GraphQL.
 *
 * ⚠️ NO ACTIVAR hasta que se cumpla la secuencia obligatoria (BACKEND, riesgo "app rota"):
 *   1. api-ia IMPLEMENTA y DESPLIEGA estos 8 endpoints (HOY NO EXISTEN, ETA backend 8h).
 *   2. Se confirma el DOMINIO real. ⚠️ BACKEND documentó api3-ia.eventosorganizador.com pero ESE
 *      dominio es NXDOMAIN. El real es api-ia.bodasdehoy.com (NEXT_PUBLIC_API_IA_URL).
 *   3. Activar con feature flag USE_API_IA_ENDPOINTS y rollout gradual.
 *
 * Mientras USE_API_IA_ENDPOINTS=false (default), estas funciones LANZAN error si se invocan,
 * para no usarlas por accidente. El flujo actual (createAssistantMessageStream, /api/storage/upload)
 * sigue funcionando intacto. Ver docs/PLAN-OPCION-A-FASE1-DETALLE.md §14-15.
 */

// URL base correcta de api-ia (NUNCA api3-ia.eventosorganizador.com = NXDOMAIN).
// En navegador: same-origin ('') para evitar CORS (proxy local reenvía a api-ia).
// En server: NEXT_PUBLIC_API_IA_URL (api-ia.bodasdehoy.com).
const API_IA_BASE =
  typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_IA_URL || 'http://127.0.0.1:8030';

// Feature flag: NO activar hasta que api-ia tenga los endpoints desplegados y probados.
export const USE_API_IA_ENDPOINTS = process.env.NEXT_PUBLIC_USE_API_IA_ENDPOINTS === 'true';

const getJWT = (): string =>
  (typeof window !== 'undefined' &&
    (localStorage.getItem('jwt_token') || localStorage.getItem('mcp_jwt_token'))) ||
  '';

const getTenant = (): string =>
  (typeof window !== 'undefined' && localStorage.getItem('current_development')) || 'bodasdehoy';

function ensureEnabled(fn: string): void {
  if (!USE_API_IA_ENDPOINTS) {
    throw new Error(
      `[api-ia] ${fn}: endpoints api-ia NO activados (USE_API_IA_ENDPOINTS=false). ` +
        `Pendiente: api-ia desplegar los 8 endpoints + confirmar dominio (NO api3-ia=NXDOMAIN). ` +
        `Ver docs/PLAN-OPCION-A-FASE1-DETALLE.md.`,
    );
  }
}

// El front solo manda JWT + X-Development. El X-Api-Ia-Secret es server-to-server
// (api-ia ↔ api-mcp), NO lo pone el cliente.
const jsonHeaders = () => ({
  Authorization: `Bearer ${getJWT()}`,
  'Content-Type': 'application/json',
  'X-Development': getTenant(),
});

// ─────────── ENDPOINT 0: preparar turno (topic+thread+par user/assistant) ───────────
// Contrato informe integración api-ia (3-ago): POST /chat/messages/turn crea de forma ATÓMICA
// el topic + thread + par user/assistant y devuelve los IDs. api-ia resuelve/crea la sesión.
// ⚠️ VERIFICADO EN VIVO 3-ago: este endpoint devuelve 502 con token+sessionId válidos
//    (bug del endpoint, escalado a backend). NO activar el flujo turn→stream hasta que
//    devuelva 200. /chat/stream (abajo) sí funciona.
export interface PrepareTurnResult {
  assistantMessageId: string;
  topicId: string;
  userMessageId: string;
}
export async function prepareTurn(params: {
  newTopic?: { title: string };
  newUserMessage: { content: string };
  sessionId: string;
  topicId?: string;
}): Promise<PrepareTurnResult> {
  ensureEnabled('prepareTurn');
  const r = await fetch(`${API_IA_BASE}/chat/messages/turn`, {
    body: JSON.stringify({ development: getTenant(), ...params }),
    headers: jsonHeaders(),
    method: 'POST',
  });
  const res = await r.json();
  if (!r.ok || res?.success === false) {
    const msg = res?.errors?.[0]?.message || res?.error || `HTTP ${r.status}`;
    throw new Error(`[api-ia] prepareTurn falló: ${msg}`);
  }
  const d = res?.data ?? res;
  return {
    assistantMessageId: d.assistantMessageId,
    topicId: d.topicId,
    userMessageId: d.userMessageId,
  };
}

// ─────────── ENDPOINT 1: chat streaming + persistencia (SSE) ───────────
// Ruta DEFINITIVA (api-ia 2026-06-03, Opción A): POST /chat/stream REEMPLAZA a /webapi/chat.
// Con persist:true streamea Y persiste user+assistant en api-mcp (billing+JWT). Sin persist:true
// se comporta como /webapi/chat hoy (migración opt-in sin riesgo). Devuelve SSE.
// CONTRATO VERIFICADO EN VIVO 3-ago (eventosorganizador.com): body = {provider:'auto', stream:true,
//   sessionId, persist, messages:[{role,content}]} → SSE reasoning→text→done. OK.
export async function sendChatMessage(
  sessionId: string,
  messages: Array<{ content: string; role: string }>,
  opts?: { maxTokens?: number; model?: string; persist?: boolean; provider?: string; temperature?: number },
): Promise<Response> {
  ensureEnabled('sendChatMessage');
  const { persist = true, provider = 'auto', ...rest } = opts || {};
  return fetch(`${API_IA_BASE}/chat/stream`, {
    body: JSON.stringify({
      development: getTenant(),
      messages,
      persist,
      provider,
      sessionId,
      stream: true,
      ...rest,
    }),
    headers: jsonHeaders(),
    method: 'POST',
  });
}

/**
 * Callbacks del streaming SSE de /chat/stream. Contrato CONFIRMADO por api-ia (2026-06-03):
 *   event: text     data: "<string>"        → delta de texto (STRING JSON-encoded, NO {delta}).
 *                                              Acumular concatenando.
 *   event: usage    data: {tokens,...}        → consumo, llega ANTES de done.
 *   event: done     data: {}                  → fin (data VACÍO, sin messageId).
 *   event: error    data: {"error":"..."}     → + headers X-Error-Code, X-Trace-ID.
 *   (extras opcionales: tool_calls, reasoning, tool_start, tool_result, confirm_required)
 * El messageId NO viene del SSE: sale de la persistencia (getChatMessages tras el done).
 */
export interface ApiIaStreamHandlers {
  onDone?: () => void;
  onError?: (error: string, meta?: { code?: string; traceId?: string }) => void;
  onEvent?: (event: string, data: any) => void; // extras: tool_calls, tool_result, etc.
  onReasoning?: (chunk: string) => void; // "pensando…" (verificado en vivo 3-ago)
  onText?: (chunk: string) => void; // delta acumulable
  onUsage?: (usage: any) => void;
}

/**
 * Consume el ReadableStream SSE de sendChatMessage y despacha por tipo de evento.
 * Parser SSE estándar (líneas "event:" + "data:", bloques separados por \n\n).
 * NO acumula por su cuenta: invoca onText con cada chunk para que el store lo concatene.
 */
export async function consumeChatStream(
  response: Response,
  handlers: ApiIaStreamHandlers,
): Promise<void> {
  if (!response.ok || !response.body) {
    const code = response.headers.get('X-Error-Code') || undefined;
    const traceId = response.headers.get('X-Trace-ID') || undefined;
    handlers.onError?.(`[api-ia] /chat/stream HTTP ${response.status}`, { code, traceId });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const dispatch = (rawEvent: string) => {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of rawEvent.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    if (dataLines.length === 0) return;
    const rawData = dataLines.join('\n');

    let parsed: any = rawData;
    try {
      parsed = JSON.parse(rawData);
    } catch {
      // event:text llega como string JSON-encoded; si falla el parse, usar crudo.
    }

    switch (event) {
      case 'reasoning': {
        handlers.onReasoning?.(typeof parsed === 'string' ? parsed : rawData);
        break;
      }
      case 'text': {
        handlers.onText?.(typeof parsed === 'string' ? parsed : rawData);
        break;
      }
      case 'usage': {
        handlers.onUsage?.(parsed);
        break;
      }
      case 'done': {
        handlers.onDone?.();
        break;
      }
      case 'error': {
        handlers.onError?.(parsed?.error || rawData, {
          code: response.headers.get('X-Error-Code') || undefined,
          traceId: response.headers.get('X-Trace-ID') || undefined,
        });
        break;
      }
      default: {
        handlers.onEvent?.(event, parsed);
      }
    }
  };

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // Bloques SSE separados por línea en blanco.
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      if (rawEvent.trim()) dispatch(rawEvent);
    }
  }
  if (buffer.trim()) dispatch(buffer);
}

// ─────────── ENDPOINT 2: crear sesión ───────────
// Ruta DEFINITIVA: POST /chat/session. Respuesta envuelta {success,data}; devolvemos el id.
export async function createChatSession(opts?: {
  config?: object;
  model?: string;
  title?: string;
  type?: string;
  userEmail?: string;
}): Promise<string> {
  ensureEnabled('createChatSession');
  const r = await fetch(`${API_IA_BASE}/chat/session`, {
    body: JSON.stringify({ development: getTenant(), ...opts }),
    headers: jsonHeaders(),
    method: 'POST',
  });
  const res = await r.json();
  if (res?.success === false) {
    throw new Error(res?.error || res?.message || '[api-ia] createChatSession falló');
  }
  const d = res?.data ?? res;
  const id = d?.sessionId ?? d?.id ?? d?._id;
  if (!id) throw new Error('[api-ia] createChatSession: respuesta sin id de sesión');
  return id as string;
}

// ─────────── LECTURA vía api-ia gateway (DECISIÓN D2 = Opción A, 2026-06-03) ───────────
// Todo (lectura + escritura) pasa por api-ia. api-ia hace proxy GraphQL read-only a api-mcp.
// Ruta DEFINITIVA: GET /chat/messages?sessionId=X&limit=N
export async function getChatMessages(
  sessionId: string,
  opts?: { limit?: number },
): Promise<any[]> {
  ensureEnabled('getChatMessages');
  // Guard: sin sessionId (p.ej. visitante sin sesión) no lanzar request con ?sessionId= vacío.
  if (!sessionId) return [];
  const qs = new URLSearchParams({ sessionId });
  if (opts?.limit !== undefined) qs.set('limit', String(opts.limit));
  const r = await fetch(`${API_IA_BASE}/chat/messages?${qs.toString()}`, {
    headers: jsonHeaders(),
    method: 'GET',
  });
  const res = await r.json();
  return res?.data ?? res?.messages ?? res ?? [];
}

// Ruta DEFINITIVA: GET /chat/sessions?userId=X&development=Y&limit=N
export async function getChatSessions(userId: string, opts?: { limit?: number }): Promise<any[]> {
  ensureEnabled('getChatSessions');
  // Guard: sin userId (p.ej. visitante sin login) no lanzar request con ?userId= vacío.
  if (!userId) return [];
  // BUG-MSG-01 (QA1 informe 23-jun): defensa duplicada — jsonHeaders ya añade
  // X-Development, pero algunos proxies lo dropean. Pasar también en query string
  // para que ?development= esté SIEMPRE presente.
  const qs = new URLSearchParams({ userId, development: getTenant() });
  if (opts?.limit !== undefined) qs.set('limit', String(opts.limit));
  const r = await fetch(`${API_IA_BASE}/chat/sessions?${qs.toString()}`, {
    headers: jsonHeaders(),
    method: 'GET',
  });
  const res = await r.json();
  return res?.data ?? res?.sessions ?? res ?? [];
}

// ─────────── ENDPOINT 3: storage upload (multipart) — FASE 2 (D3) ───────────
export async function uploadFile(
  file: File,
  opts?: { metadata?: object, sessionId?: string; },
): Promise<{ expiresAt: string; fileId: string; mimeType: string; size: number; url: string }> {
  ensureEnabled('uploadFile');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('development', getTenant());
  if (opts?.sessionId) fd.append('sessionId', opts.sessionId);
  if (opts?.metadata) fd.append('metadata', JSON.stringify(opts.metadata));
  const r = await fetch(`${API_IA_BASE}/storage/upload`, {
    body: fd,
    headers: { Authorization: `Bearer ${getJWT()}` },
    method: 'POST',
  });
  return r.json();
}

// ─────────── ENDPOINT 4: whatsapp ───────────
export async function sendWhatsApp(to: string, message: string, mediaUrl?: string) {
  ensureEnabled('sendWhatsApp');
  const r = await fetch(`${API_IA_BASE}/whatsapp/send`, {
    body: JSON.stringify({ development: getTenant(), mediaUrl, message, to }),
    headers: jsonHeaders(),
    method: 'POST',
  });
  return r.json();
}

// ─────────── ENDPOINT 5: sms ───────────
export async function sendSMS(to: string, message: string) {
  ensureEnabled('sendSMS');
  const r = await fetch(`${API_IA_BASE}/sms/send`, {
    body: JSON.stringify({ development: getTenant(), message, to }),
    headers: jsonHeaders(),
    method: 'POST',
  });
  return r.json();
}

// ─────────── ENDPOINT 6: email campaign ───────────
export async function sendEmailCampaign(params: {
  htmlBody: string;
  recipients: string[];
  subject: string;
  textBody?: string;
}) {
  ensureEnabled('sendEmailCampaign');
  const r = await fetch(`${API_IA_BASE}/email/campaign`, {
    body: JSON.stringify({ development: getTenant(), ...params }),
    headers: jsonHeaders(),
    method: 'POST',
  });
  return r.json();
}

// ─────────── ENDPOINT 7: generar imagen IA ───────────
export async function generateImage(prompt: string, opts?: { model?: string, size?: string; }) {
  ensureEnabled('generateImage');
  const r = await fetch(`${API_IA_BASE}/ai/generate-image`, {
    body: JSON.stringify({ development: getTenant(), prompt, ...opts }),
    headers: jsonHeaders(),
    method: 'POST',
  });
  return r.json();
}

// ─────────── ENDPOINT 8: transcribir audio (multipart) ───────────
export async function transcribeAudio(file: File, language?: string) {
  ensureEnabled('transcribeAudio');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('development', getTenant());
  if (language) fd.append('language', language);
  const r = await fetch(`${API_IA_BASE}/ai/transcribe`, {
    body: fd,
    headers: { Authorization: `Bearer ${getJWT()}` },
    method: 'POST',
  });
  return r.json();
}
