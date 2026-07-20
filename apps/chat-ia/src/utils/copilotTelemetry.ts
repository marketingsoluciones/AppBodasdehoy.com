import posthog from 'posthog-js';

/**
 * X3 · plan consolidado 2026-07-20.
 * Log estructurado de ambigüedades de contexto en el Copilot.
 * Motivo: cuando la IA no puede resolver un evento (sin `activeEventId`,
 * nombre repetido en `availableEvents`, o el usuario nombra un evento que
 * no existe), queremos capturar el patrón para priorizar UX/backend.
 *
 * Se emite a PostHog si está inicializado y a console.warn siempre para
 * que quede en logs de servidor/navegador.
 */
export type ContextAmbiguityReason =
  | 'no_active_event'
  | 'name_conflict'
  | 'name_not_found'
  | 'no_context_at_all';

export interface ContextAmbiguityPayload {
  reason: ContextAmbiguityReason;
  route?: string;
  userMessagePreview?: string;
  candidateEventIds?: string[];
  attemptedName?: string;
}

export const trackContextAmbiguity = (payload: ContextAmbiguityPayload) => {
  const label = `[copilot:context_ambiguity] ${payload.reason}`;
  try {
    if (typeof console !== 'undefined') console.warn(label, payload);
    if (typeof window !== 'undefined' && posthog && typeof posthog.capture === 'function') {
      posthog.capture('copilot_context_ambiguity', payload as Record<string, unknown>);
    }
  } catch {
    /* nunca romper la UI por telemetría */
  }
};
