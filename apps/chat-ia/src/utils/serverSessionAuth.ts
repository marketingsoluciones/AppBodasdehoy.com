/**
 * serverSessionAuth — identidad de la petición en las rutas de servidor.
 *
 * Auditoría QA 15-09 (IMG-01, IMG-02, MARCA-01): las rutas de `/api/storage/*`
 * resolvían al usuario leyendo `X-User-ID` de la petición, y la marca leyendo
 * `X-Development`. Las dos las escribe el cliente, así que la identidad y el
 * inquilino los elegía quien llamara:
 *
 *   GET /api/storage/upload?event_id=…   X-User-ID: <inventado>  → 200
 *   DELETE /api/storage/files/{id}       (sin cabeceras)         → llegaba al backend
 *   GET  …                               X-Development: <otra>   → 200
 *
 * El gate de N32 en `/api/messages/[...path]` ya resolvía la mitad del problema,
 * pero vivía dentro de esa ruta. Aquí se extrae para que ambas familias compartan
 * una sola definición de «esta petición viene de una sesión».
 *
 * 🔒 ALCANCE: esto NO verifica la firma del JWT — la clave vive en api-ia/api-mcp
 * y la autorización real es suya. Lo que corta es el acceso anónimo y la
 * suplantación por cabecera, que hoy no corta nadie.
 */

import { developments } from '@bodasdehoy/shared/types';

const KNOWN_DEVELOPMENTS = developments.map((d) => d.development);
const DEFAULT_DEVELOPMENT = 'bodasdehoy';

export interface SessionIdentity {
  /** El token tal cual, listo para reenviar al backend en `Authorization`. */
  credential: string;
  /** Marca resuelta desde el hostname — nunca desde una cabecera del cliente. */
  development: string;
  /** Email del claim, si el token lo trae. */
  email: string;
  /** uid del claim. Es el que manda, no la cabecera. */
  userId: string;
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const seg = token.replace(/^Bearer\s+/i, '').split('.')[1];
    if (!seg) return null;
    const padded = seg.padEnd(seg.length + ((4 - (seg.length % 4)) % 4), '=');
    const json = Buffer.from(
      padded.replaceAll('-', '+').replaceAll('_', '/'),
      'base64',
    ).toString('utf8');
    const payload = JSON.parse(json);
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Validación ESTRUCTURAL del token (misma regla que el gate de N32).
 *
 * Exige 3 segmentos, payload decodificable y `exp` vigente. Un token sin `exp`
 * se deja pasar y decide el backend; uno caducado no se reenvía.
 */
export function looksLikeSessionJwt(token: string): boolean {
  const parts = token.replace(/^Bearer\s+/i, '').split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) return false;
  return true;
}

/**
 * Marca del inquilino a partir del hostname de la petición.
 *
 * Es la versión de servidor de `getDevelopmentNameFromHostname`: misma detección
 * por hostname, sin la rama de `localStorage` (que no existe aquí) ni la de
 * variable de entorno (que en servidor afectaría a todas las marcas a la vez).
 */
export function resolveDevelopmentFromHost(hostname: string): string {
  if (!hostname) return DEFAULT_DEVELOPMENT;
  const host = hostname.split(':')[0].toLowerCase();

  const parts = host.split('.');
  const tldIdx = parts.findIndex((p) => p === 'com' || p === 'mx');
  if (tldIdx > 0 && KNOWN_DEVELOPMENTS.includes(parts[tldIdx - 1])) {
    return parts[tldIdx - 1];
  }

  for (const dev of KNOWN_DEVELOPMENTS) {
    if (host.includes(dev)) return dev;
  }

  return DEFAULT_DEVELOPMENT;
}

/**
 * Identidad de la petición, o `null` si no viene de una sesión.
 *
 * El token se busca en `Authorization` y, como concesión a EventSource —que no
 * puede mandar cabeceras—, en `?token=`. La cabecera `X-User-ID` ya no se lee:
 * el uid sale del claim del token.
 *
 * En local (`localhost`, IP de LAN) la marca del host no es deducible, así que
 * ahí —y solo ahí— se admite `X-Development` como pista para poder probar otras
 * marcas sin levantar dominios.
 */
export function resolveSessionIdentity(request: Request): SessionIdentity | null {
  const url = new URL(request.url);
  const credential =
    request.headers.get('authorization') || url.searchParams.get('token') || '';

  if (!credential || !looksLikeSessionJwt(credential)) return null;

  const payload = decodeJwtPayload(credential) ?? {};
  // Los tokens de Firebase usan `user_id`/`sub`; los de API2, `uid`.
  const userId: string = payload.uid || payload.user_id || payload.sub || '';
  if (!userId) return null;

  const host = request.headers.get('host') || url.host;
  const isLocalHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\d+\.\d+\.\d+\.\d+)/.test(host);
  const headerDev = request.headers.get('x-development') || '';
  const development =
    isLocalHost && KNOWN_DEVELOPMENTS.includes(headerDev)
      ? headerDev
      : resolveDevelopmentFromHost(host);

  return {
    credential: credential.startsWith('Bearer ') ? credential : `Bearer ${credential}`,
    development,
    email: payload.email || '',
    userId,
  };
}
