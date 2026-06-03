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

const jsonHeaders = () => ({
  Authorization: `Bearer ${getJWT()}`,
  'Content-Type': 'application/json',
});

// ─────────── ENDPOINT 1: chat streaming + persistencia (SSE) ───────────
export async function sendChatMessage(
  sessionId: string,
  message: string,
  opts?: { maxTokens?: number, model?: string; temperature?: number; },
): Promise<Response> {
  ensureEnabled('sendChatMessage');
  return fetch(`${API_IA_BASE}/chat/stream`, {
    body: JSON.stringify({ development: getTenant(), message, sessionId, ...opts }),
    headers: jsonHeaders(),
    method: 'POST',
  });
}

// ─────────── ENDPOINT 2: crear sesión ───────────
export async function createChatSession(opts?: {
  config?: object;
  title?: string;
  type?: string;
}): Promise<{ createdAt: string; sessionId: string }> {
  ensureEnabled('createChatSession');
  const r = await fetch(`${API_IA_BASE}/chat/session`, {
    body: JSON.stringify({ development: getTenant(), ...opts }),
    headers: jsonHeaders(),
    method: 'POST',
  });
  return r.json();
}

// ─────────── ENDPOINT 3: storage upload (multipart) ───────────
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
