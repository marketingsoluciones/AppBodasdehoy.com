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
  const envUrl = process.env.NEXT_PUBLIC_CHAT;
  if (envUrl) return envUrl.replace(/\/$/, '');
  return resolveChatOrigin(window.location.hostname);
}
