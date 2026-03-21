/**
 * getCopilotBaseUrl — Detección unificada de la URL base del chat-ia (Copilot).
 *
 * Usado por CopilotIframe, CopilotPrewarmer y ChatSidebar para garantizar
 * que todos apunten a la misma instancia de LobeChat.
 *
 * Prioridad:
 *   1. NEXT_PUBLIC_CHAT (variable de entorno)
 *   2. localhost/127.0.0.1 → http://127.0.0.1:3210 (desarrollo local)
 *   3. hostname -dev → chat-dev.bodasdehoy.com
 *   4. hostname -test → chat-test.bodasdehoy.com
 *   5. Fallback → chat.bodasdehoy.com (producción)
 */
export function getCopilotBaseUrl(): string {
  if (typeof window === 'undefined') return '/copilot-chat';

  const envUrl = process.env.NEXT_PUBLIC_CHAT;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'http://127.0.0.1:3210';
  if (host.includes('-dev.')) return 'https://chat-dev.bodasdehoy.com';
  if (host.includes('-test.')) return 'https://chat-test.bodasdehoy.com';
  return 'https://chat.bodasdehoy.com';
}
