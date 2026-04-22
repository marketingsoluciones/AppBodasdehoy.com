import { resolveChatOrigin } from '@bodasdehoy/shared/utils';

/**
 * getCopilotBaseUrl — URL base del Copilot (app de chat: chat-dev / chat-test / chat en prod).
 *
 * Prioridad:
 *   1. NEXT_PUBLIC_CHAT (variable de entorno)
 *   2. resolveChatOrigin(hostname) — fuente única de verdad en @bodasdehoy/shared
 */
export function getCopilotBaseUrl(): string {
  if (typeof window === 'undefined') return '/copilot-chat';
  // Resolver siempre por tenant (hostname) — no usar NEXT_PUBLIC_CHAT
  // porque cada whitelabel tiene su propio chat (chat.champagne-events.com.mx, etc.)
  return resolveChatOrigin(window.location.hostname);
}
