/**
 * Servicio de Feedback de mensajes (thumb up / thumb down).
 *
 * api-ia tiene el endpoint listo; pendiente confirmar ruta exacta.
 * Cuando api-ia comparta la ruta definitiva, solo hay que actualizar
 * FEEDBACK_ENDPOINT o la variable de entorno NEXT_PUBLIC_FEEDBACK_ENDPOINT.
 *
 * Referencia: docs/AVANCES-API-IA-RESPUESTAS-SLACK.md — "Feedback thumb up/down"
 */

export type FeedbackRating = 'positive' | 'negative';

export interface FeedbackPayload {
  messageId: string;
  rating: FeedbackRating;
  sessionId?: string;
  traceId?: string;
}

export interface FeedbackResult {
  error?: string;
  ok: boolean;
}

const FEEDBACK_ENDPOINT =
  process.env.NEXT_PUBLIC_FEEDBACK_ENDPOINT ??
  `${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://api-ia.bodasdehoy.com'}/api/feedback`;

const readToken = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const direct = localStorage.getItem('jwt_token');
    if (direct && direct !== 'null') return direct;
    const firebase = localStorage.getItem('api2_jwt_token');
    if (firebase && firebase !== 'null') return firebase;
    const config = localStorage.getItem('dev-user-config');
    if (config) return JSON.parse(config)?.token;
  } catch {
    // ignore
  }
  return undefined;
};

/**
 * Envía una calificación (👍 / 👎) de un mensaje al backend de api-ia.
 * Si el endpoint no está definido o falla, resuelve con ok=false sin tirar.
 */
export const sendFeedback = async (payload: FeedbackPayload): Promise<FeedbackResult> => {
  try {
    const token = readToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(FEEDBACK_ENDPOINT, {
      body: JSON.stringify(payload),
      headers,
      method: 'POST',
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.warn(`[Feedback] HTTP ${response.status}:`, text.slice(0, 200));
      return { error: `HTTP ${response.status}`, ok: false };
    }

    return { ok: true };
  } catch (err: any) {
    console.warn('[Feedback] Error al enviar feedback:', err?.message ?? err);
    return { error: err?.message ?? 'Error desconocido', ok: false };
  }
};
