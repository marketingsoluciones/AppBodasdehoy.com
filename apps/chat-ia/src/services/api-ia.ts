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

// ─────────── ENDPOINT 1: enviar mensaje ───────────
// Ruta REAL verificada en api-ia openapi (2026-06-03): POST /api/messages/send
// (BACKEND documentó /chat/stream pero NO existe; el real es /api/messages/send).
// Contrato: { conversationId, channel, text, attachments? }
export async function sendChatMessage(
  conversationId: string,
  text: string,
  opts?: { attachments?: any[]; channel?: string },
): Promise<Response> {
  ensureEnabled('sendChatMessage');
  return fetch(`${API_IA_BASE}/api/messages/send`, {
    body: JSON.stringify({
      attachments: opts?.attachments,
      channel: opts?.channel ?? 'LOBE_CHAT',
      conversationId,
      text,
    }),
    headers: jsonHeaders(),
    method: 'POST',
  });
}

// ─────────── ENDPOINT 2: crear sesión ───────────
// Ruta REAL: POST /api/sessions  (contrato: { title, model, development, user_email })
// Respuesta api-ia envuelta en { success, data }. Devolvemos el id de la sesión creada.
export async function createChatSession(opts?: {
  model?: string;
  title?: string;
  userEmail?: string;
}): Promise<string> {
  ensureEnabled('createChatSession');
  const r = await fetch(`${API_IA_BASE}/api/sessions`, {
    body: JSON.stringify({
      development: getTenant(),
      model: opts?.model,
      title: opts?.title,
      user_email: opts?.userEmail,
    }),
    headers: jsonHeaders(),
    method: 'POST',
  });
  const res = await r.json();
  if (res?.success === false) {
    throw new Error(res?.error || res?.message || '[api-ia] createChatSession falló');
  }
  // api-ia envuelve en { success, data }. El id puede venir en varias formas — robusto:
  const d = res?.data ?? res;
  const id = d?.sessionId ?? d?.id ?? d?._id;
  if (!id) throw new Error('[api-ia] createChatSession: respuesta sin id de sesión');
  return id as string;
}

// ─────────── LECTURA vía api-ia gateway (DECISIÓN D2 = Opción A, 2026-06-03) ───────────
// Todo (lectura + escritura) pasa por api-ia. api-ia hace proxy GraphQL read-only a api-mcp.
// Ruta REAL: GET /api/messages/conversations/{conversationId}/messages
export async function getChatMessages(
  conversationId: string,
  opts?: { limit?: number; offset?: number },
): Promise<any[]> {
  ensureEnabled('getChatMessages');
  const qs = new URLSearchParams();
  if (opts?.limit !== undefined) qs.set('limit', String(opts.limit));
  if (opts?.offset !== undefined) qs.set('offset', String(opts.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const r = await fetch(
    `${API_IA_BASE}/api/messages/conversations/${encodeURIComponent(conversationId)}/messages${suffix}`,
    { headers: jsonHeaders(), method: 'GET' },
  );
  const data = await r.json();
  return data?.messages ?? data ?? [];
}

// Ruta REAL: GET /api/sessions
export async function getChatSessions(): Promise<any[]> {
  ensureEnabled('getChatSessions');
  const r = await fetch(`${API_IA_BASE}/api/sessions`, {
    headers: jsonHeaders(),
    method: 'GET',
  });
  const data = await r.json();
  return data?.sessions ?? data ?? [];
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
