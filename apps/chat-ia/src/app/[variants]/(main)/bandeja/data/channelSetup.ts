/**
 * data/channelSetup — conectar y desconectar canales (Facebook, Instagram, Email, Telegram).
 *
 * M1, último tramo (16-09). Estos cuatro conectores repetían el mismo `fetch` ocho veces,
 * cada uno con su copia de headers y su manera de leer el error. Es el patrón que dejó sin
 * credenciales a `ia-config` y a la sesión de WhatsApp cuando el proxy empezó a exigir token:
 * ocho sitios donde equivocarse en vez de uno.
 */

import { buildHeaders } from '../utils/auth';

export type SocialChannel = 'facebook' | 'instagram';

/** Error con el mensaje que devuelve api-ia, no un "Error 500" pelado. */
async function post(path: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(path, {
    body: JSON.stringify(body),
    headers: buildHeaders(),
    method: 'POST',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.detail || `Error ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

/**
 * URL de OAuth para abrir el popup del proveedor.
 * api-ia devuelve `oauth_url`; algunos canales responden `oauthUrl`. Se toleran las dos.
 */
export async function getSocialOauthUrl(
  channel: SocialChannel,
  development: string,
): Promise<string | null> {
  const data = await post(
    `/api/messages/${channel}/oauth-url?development=${encodeURIComponent(development)}`,
    { development },
  );
  return data.oauth_url || data.oauthUrl || null;
}

export async function disconnectSocial(
  channel: SocialChannel,
  development: string,
): Promise<void> {
  await post(`/api/messages/${channel}/disconnect`, { development });
}

export async function getEmailOauthUrl(
  development: string,
  provider: string,
): Promise<string | null> {
  const data = await post('/api/messages/email/oauth-url', { development, provider });
  return data.oauthUrl || data.oauth_url || null;
}

export async function connectEmail(body: Record<string, unknown>): Promise<any> {
  return post('/api/messages/email/connect', body);
}

export async function disconnectEmail(development: string): Promise<void> {
  await post('/api/messages/email/disconnect', { development });
}

export async function connectTelegram(body: Record<string, unknown>): Promise<any> {
  return post('/api/messages/telegram/connect', body);
}

export async function disconnectTelegram(development: string): Promise<void> {
  await post('/api/messages/telegram/disconnect', { development });
}
