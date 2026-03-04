/**
 * Punto de enganche para métricas/analítica del Copilot en el front.
 * Por defecto solo hace console.debug; cuando el producto lo requiera se puede
 * sustituir por envío a analítica o backend (el backend api-ia ya registra métricas;
 * esto es opcional para UX/producto).
 */

export interface CopilotMessageSentPayload {
  elapsedMs: number;
  stream: boolean;
}

let reporter: (payload: CopilotMessageSentPayload) => void = (payload) => {
  if (typeof console !== 'undefined' && console.debug) {
    console.debug('[Copilot] Message sent', payload.stream ? '(stream)' : '', payload.elapsedMs, 'ms');
  }
};

/**
 * Registra que se envió un mensaje al Copilot y se recibió respuesta.
 * Llamar desde el servicio copilotChat tras cada respuesta (stream o no).
 */
export function reportCopilotMessageSent(payload: CopilotMessageSentPayload): void {
  reporter(payload);
}

/**
 * Sustituye el reporter por defecto (p. ej. para enviar a Google Analytics, Mixpanel o un endpoint).
 * Llamar una vez al arranque de la app si se quiere analítica real.
 */
export function setCopilotMetricsReporter(fn: (payload: CopilotMessageSentPayload) => void): void {
  reporter = fn;
}
