import { getDevelopmentByHostname } from '../types/developments';

/**
 * resolveChatOrigin — Fuente única de verdad para la URL base del chat-ia.
 *
 * Resuelve por dominio del tenant:
 *   localhost / 127.0.0.1 → http://127.0.0.1:3210
 *   app-dev.champagne-events.com.mx → https://chat-dev.champagne-events.com.mx
 *   app-test.champagne-events.com.mx → https://chat-test.champagne-events.com.mx
 *   champagne-events.com.mx → https://chat.champagne-events.com.mx
 *   (igual para todos los tenants)
 */
export function resolveChatOrigin(hostname: string): string {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:3210';
  }

  // Obtener dominio del tenant desde hostname
  const dev = getDevelopmentByHostname(hostname);
  const tenantDomain = dev.domain.replace(/^\./, ''); // ".champagne-events.com.mx" → "champagne-events.com.mx"

  if (hostname.includes('-dev.') || hostname.includes('dev.')) {
    return `https://chat-dev.${tenantDomain}`;
  }
  if (hostname.includes('-test.') || hostname.includes('test.')) {
    return `https://chat-test.${tenantDomain}`;
  }
  return `https://chat.${tenantDomain}`;
}
