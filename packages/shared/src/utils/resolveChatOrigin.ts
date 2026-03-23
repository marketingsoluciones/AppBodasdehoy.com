/**
 * resolveChatOrigin — Fuente única de verdad para la URL base del chat-ia.
 *
 * Criterio de entorno (mismo que login.js y getCopilotBaseUrl.ts):
 *   localhost / 127.0.0.1 → http://127.0.0.1:3210
 *   hostname contiene -dev. → https://chat-dev.bodasdehoy.com
 *   hostname contiene -test. → https://chat-test.bodasdehoy.com
 *   resto → https://chat.bodasdehoy.com
 */
export function resolveChatOrigin(hostname: string): string {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:3210';
  }
  if (hostname.includes('-dev.')) return 'https://chat-dev.bodasdehoy.com';
  if (hostname.includes('-test.')) return 'https://chat-test.bodasdehoy.com';
  return 'https://chat.bodasdehoy.com';
}
