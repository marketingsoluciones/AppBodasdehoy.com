/**
 * CopilotChat Service - Servicio para comunicación con el Copilot
 *
 * Llama al API route local /api/copilot/chat que:
 * - Proxies al backend Python (api-ia) con 30+ tools via orchestrator
 * - Recibe respuestas con streaming SSE incluyendo eventos enriquecidos
 * - Soporta metadata de contexto (userId, eventId, etc.)
 *
 * FASE 2: Parsea eventos SSE enriquecidos (tool_result, ui_action,
 * confirm_required, progress, code_output, tool_start) para que el
 * frontend pueda renderizar componentes ricos.
 */

import Cookies from 'js-cookie';
import { reportCopilotMessageSent } from '../utils/copilotMetrics';

const CHAT_API_BASE = '';

/**
 * Obtiene el token JWT del usuario para autenticar requests a api-ia.
 * Prioridad: cookie idTokenV0.1.0 (SSO chat-ia) → cookie api2_jwt → localStorage dev-user-config (AuthBridge)
 * Necesario porque AuthBridge guarda el Firebase token en localStorage, no en cookies.
 */
function getAuthToken(): string {
  const ssoToken = Cookies.get('idTokenV0.1.0') || '';
  if (ssoToken.startsWith('eyJ')) return ssoToken;
  const api2Token = Cookies.get('api2_jwt') || '';
  if (api2Token.startsWith('eyJ')) return api2Token;
  if (typeof window !== 'undefined') {
    try {
      const devConfig = JSON.parse(localStorage.getItem('dev-user-config') || '{}');
      if (typeof devConfig?.token === 'string' && devConfig.token.startsWith('eyJ')) return devConfig.token;
    } catch { /* ignore */ }
  }
  return '';
}

const createRequestId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    // ignore
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  toolCalls?: ToolCall[];
  loading?: boolean;
  error?: string;
  /** Enriched events received during streaming (tool results, actions, etc.) */
  enrichedEvents?: EnrichedEvent[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: string;
  resultUrl?: string;
}

// ── Enriched Event Types ──

export type EnrichedEventType =
  | 'tool_result'
  | 'ui_action'
  | 'confirm_required'
  | 'progress'
  | 'code_output'
  | 'tool_start'
  | 'event_card'
  | 'usage'
  | 'reasoning';

export interface EnrichedEvent {
  type: EnrichedEventType;
  data: any;
}

/** Tool execution result - file download, image preview, data table */
export interface ToolResultEvent {
  tool: string;
  result: {
    type: 'download' | 'image_preview' | 'data_table' | 'qr_code' | 'success' | 'error';
    url?: string;
    filename?: string;
    size?: string;
    label?: string;
    imageUrl?: string;
    actions?: string[];
    data?: any;
    message?: string;
    error?: string;
  };
}

/** Frontend UI action - refresh data, navigate, highlight, open modal */
export interface UIActionEvent {
  type: 'refresh_data' | 'navigate' | 'highlight' | 'open_modal' | 'scroll_to';
  target?: string;
  path?: string;
  selector?: string;
  modal?: string;
  prefill?: Record<string, any>;
}

/** Confirmation required before executing a destructive/bulk action */
export interface ConfirmRequiredEvent {
  id: string;
  message: string;
  tool: string;
  params: Record<string, any>;
  danger?: boolean;
  count?: number;
}

/** Progress update for multi-step workflows */
export interface ProgressEvent {
  step: number;
  total: number;
  label: string;
  status?: 'running' | 'completed' | 'error';
}

/** Code Interpreter execution output */
export interface CodeOutputEvent {
  language: string;
  code: string;
  output: string;
  files?: Array<{ name: string; url: string; size?: string }>;
  error?: string;
}

/** Tool execution started */
export interface ToolStartEvent {
  tool: string;
}

export interface PageContext {
  pageName?: string;
  eventName?: string;
  eventId?: string;
  screenData?: Record<string, any>;
  eventsList?: Array<{ name?: string; type?: string; date?: string; id?: string }>;
}

/** Un mensaje para el historial (role + content) enviado al backend para mantener contexto. */
export interface ChatMessageForHistory {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SendMessageParams {
  message: string;
  sessionId?: string;
  userId?: string;
  development?: string;
  eventId?: string;
  eventName?: string;
  pageContext?: PageContext;
  model?: string;
  /** Usuario invitado/anónimo; el proxy lo reenvía al backend como X-Is-Anonymous */
  isAnonymous?: boolean;
  /**
   * Historial de la conversación (mensajes anteriores) para que el modelo mantenga contexto.
   * Si se envía, el backend recibe [..., ...messageHistory, { role: 'user', content: message }].
   */
  messageHistory?: ChatMessageForHistory[];
}

export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  navigationUrl?: string;
  /** Enriched events parsed from SSE stream */
  enrichedEvents?: EnrichedEvent[];
}

export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/** Known enriched SSE event types (alineados con api-ia: event_card, usage, reasoning) */
const ENRICHED_EVENT_TYPES = new Set<string>([
  'tool_result',
  'ui_action',
  'confirm_required',
  'progress',
  'code_output',
  'tool_start',
  'event_card',
  'usage',
  'reasoning',
]);

/**
 * Envía un mensaje al backend de Copilot.
 * Parsea SSE enriquecidos y los devuelve como enrichedEvents.
 */
export const sendChatMessage = async (
  params: SendMessageParams,
  onChunk?: (chunk: string) => void,
  signal?: AbortSignal,
  onEnrichedEvent?: (event: EnrichedEvent) => void
): Promise<ChatResponse> => {
  const { message, sessionId, userId, development, eventId, eventName, pageContext, model, isAnonymous, messageHistory } = params;
  const startMs = Date.now();

  try {
    const requestId = createRequestId();
    const timeoutMs = 35_000;
    const controller = new AbortController();

    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const maxHistoryMessages = 20;
    const trimmedHistory =
      messageHistory && messageHistory.length > 0
        ? messageHistory.slice(-maxHistoryMessages)
        : [];
    const messagesPayload =
      trimmedHistory.length > 0
        ? [...trimmedHistory, { role: 'user' as const, content: message }]
        : [{ role: 'user' as const, content: message }];

    const payload: any = {
      messages: messagesPayload,
      stream: !!onChunk,
      metadata: { userId, development, eventId, eventName, sessionId, pageContext, isAnonymous: isAnonymous ?? false },
    };
    if (model) payload.model = model;

    const response = await fetch(`${CHAT_API_BASE}/api/copilot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
        'X-Development': development || 'bodasdehoy',
        'X-Request-Id': requestId,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    // 401: no autorizado — mensaje específico (no confundir con 503)
    if (response.status === 401) {
      let errorData: any = {};
      try { errorData = await response.json(); } catch {}
      const msg = errorData?.message || 'No autorizado. Inicia sesión de nuevo para usar el asistente.';
      if (onChunk) onChunk(msg);
      return { content: msg, toolCalls: [], navigationUrl: undefined, enrichedEvents: [] };
    }

    // 402: saldo agotado — mensaje + enlace a Recargar (payment_url o billing_url de api/proxy)
    if (response.status === 402) {
      let errorData: any = {};
      try { errorData = await response.json(); } catch {}
      const msg = errorData?.message || 'Saldo de IA agotado. Recarga tu cuenta para continuar usando el asistente.';
      const recargaUrl = errorData?.payment_url || errorData?.billing_url;
      const contentWithLink = recargaUrl
        ? `${msg}\n\n[Recargar saldo](${recargaUrl})`
        : msg;
      if (onChunk) onChunk(contentWithLink);
      return { content: contentWithLink, toolCalls: [], navigationUrl: recargaUrl || undefined, enrichedEvents: [] };
    }

    // 429: hay dos casos muy distintos — cuota diaria agotada vs saturación técnica temporal
    if (response.status === 429) {
      let errorData: any = {};
      try { errorData = await response.json(); } catch {}

      const retryAfterRaw = response.headers.get('retry-after') || errorData?.retry_after;
      const retryAfterSecs = retryAfterRaw ? parseInt(String(retryAfterRaw), 10) : undefined;
      const errorType: string = errorData?.error_type || errorData?.error || '';
      const used: number | undefined = typeof errorData?.used === 'number' ? errorData.used : undefined;
      const limit: number | undefined = typeof errorData?.limit === 'number' ? errorData.limit : undefined;
      const resetAt: string | undefined = typeof errorData?.reset_at === 'string' ? errorData.reset_at : undefined;

      // Helper: formatea cuándo se puede volver a usar
      const formatWhen = (): string => {
        if (retryAfterSecs !== undefined && !isNaN(retryAfterSecs)) {
          if (retryAfterSecs < 60) return `en ${retryAfterSecs} segundo${retryAfterSecs !== 1 ? 's' : ''}`;
          if (retryAfterSecs < 3600) {
            const mins = Math.ceil(retryAfterSecs / 60);
            return `en ${mins} minuto${mins !== 1 ? 's' : ''}`;
          }
          const hours = Math.ceil(retryAfterSecs / 3600);
          return `en ${hours} hora${hours !== 1 ? 's' : ''}`;
        }
        if (resetAt) {
          try {
            const resetDate = new Date(resetAt);
            const now = new Date();
            const isToday = resetDate.toDateString() === now.toDateString();
            const timeStr = resetDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            return isToday ? `hoy a las ${timeStr}` : `mañana a las ${timeStr}`;
          } catch { /* ignore */ }
        }
        return '';
      };

      const when = formatWhen();
      const isQuotaLimit = /DAILY_LIMIT|QUOTA|LIMIT_REACHED/i.test(errorType);
      let msg = '';

      if (isQuotaLimit) {
        // Caso A: cuota diaria agotada — el usuario ha llegado a su límite de plan
        if (used !== undefined && limit !== undefined) {
          msg = `Has usado todas tus consultas de hoy (${used}/${limit}).`;
        } else {
          msg = 'Has agotado tu cuota de consultas de hoy.';
        }
        msg += when ? ` Se renuevan ${when}.` : ' Se renuevan mañana.';
        msg += ' Actualiza tu plan para tener más consultas diarias.';
      } else {
        // Caso B: saturación técnica temporal (Groq, OpenRouter, etc.) — no es culpa del usuario
        msg = 'El asistente está recibiendo demasiadas peticiones en este momento.';
        msg += when ? ` Inténtalo de nuevo ${when}.` : ' Inténtalo de nuevo en unos minutos.';
      }

      onChunk?.(msg);
      return { content: msg, toolCalls: [] };
    }

    // Streaming mode
    if (onChunk && response.body) {
      const serverRequestId = response.headers.get('x-request-id') || requestId;
      const backendTraceId = response.headers.get('x-backend-trace-id') || '';
      const backendErrorCode = response.headers.get('x-backend-error-code') || '';
      const metaSuffix =
        `${serverRequestId ? ` RequestId: ${serverRequestId}` : ''}` +
        `${backendTraceId ? ` TraceId: ${backendTraceId}` : ''}` +
        `${backendErrorCode ? ` ErrorCode: ${backendErrorCode}` : ''}`;

      // Si el status es 5xx (ej. 503), el proxy envía el error como SSE pero la respuesta
      // ya está marcada como error — lo capturamos y lanzamos para que catch lo maneje.
      const isErrorResponse = !response.ok;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let toolCalls: ToolCall[] = [];
      let navigationUrl: string | undefined;
      let enrichedEvents: EnrichedEvent[] = [];
      let pending = '';
      let currentEvent: string | null = null;
      let streamingError: string | null = null; // Error capturado del SSE en respuesta de error

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        pending += chunk;

        const lines = pending.split('\n');
        pending = lines.pop() ?? '';

        for (const rawLine of lines) {
          const line = rawLine.replace(/\r$/, '');
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Parse event type
          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice('event:'.length).trim();
            continue;
          }

          if (!trimmed.startsWith('data:')) continue;

          const data = trimmed.slice('data:'.length).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            // ── Enriched events from backend ──
            if (currentEvent && ENRICHED_EVENT_TYPES.has(currentEvent)) {
              const event: EnrichedEvent = { type: currentEvent as EnrichedEventType, data: parsed };
              enrichedEvents.push(event);
              onEnrichedEvent?.(event);
              currentEvent = null;
              continue;
            }

            // Error events — si la respuesta es error HTTP (5xx), capturar para lanzar
            // después del loop (activa el catch de CopilotEmbed → botón Reintentar).
            // Si la respuesta es 200 con error embebido (raro), mostrar como contenido.
            if (currentEvent === 'error' && parsed?.error) {
              const userMsg = parsed?.user_message ? String(parsed.user_message) : null;
              const base = userMsg || String(parsed.error);
              const msg = base.includes('RequestId:') ? base : `${base}${metaSuffix}`;
              if (isErrorResponse) {
                streamingError = msg;
              } else {
                fullContent += msg;
                onChunk(msg);
              }
              currentEvent = null;
              continue;
            }

            // Backend error without event type
            if (parsed?.error && !parsed?.choices) {
              const base = String(parsed.user_message || parsed.error);
              const msg = base.includes('RequestId:') ? base : `${base}${metaSuffix}`;
              if (isErrorResponse) {
                streamingError = msg;
              } else {
                fullContent += msg;
                onChunk(msg);
              }
              continue;
            }

            // Regular text content
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              // Detectar errores del orchestrator en el stream y no pasarlos al chat.
              // Ejemplo: "⚠️ Orchestrator falló: GROQ_TOOL_USE_FAILED: ..."
              // Se acumulan en fullContent para ser detectados post-stream.
              if (!fullContent.includes('Orchestrator falló')) {
                onChunk(content);
              }
            }

            // Tool calls from delta
            if (parsed.choices?.[0]?.delta?.tool_calls) {
              toolCalls = parsed.choices[0].delta.tool_calls;
            }

            // Detect navigation URL in content
            const urlMatch = fullContent.match(/https?:\/\/[^\s]+|\/[a-z-]+(\?[^\s]*)?/gi);
            if (urlMatch) {
              navigationUrl = urlMatch[urlMatch.length - 1];
            }
          } catch {
            // Ignore parsing errors for partial chunks
          }

          // Reset event after processing data line
          currentEvent = null;
        }
      }

      // Si el stream fue de error (5xx), lanzar excepción para que CopilotEmbed
      // active el botón Reintentar. El mensaje viene del SSE o del proxy.
      // Marcamos el error con __isStreamingHttpError para que el catch externo
      // lo re-lance en lugar de convertirlo a respuesta (que dejaría sin retry).
      if (isErrorResponse) {
        const errMsg = streamingError || fullContent || `Error ${response.status} del servidor de IA.`;
        const err = new Error(errMsg);
        (err as any).__isStreamingHttpError = true;
        // Incluir error_code para que CopilotEmbed decida si mostrar Reintentar
        // AUTH_ERROR no se debe reintentar (error de configuración/admin)
        if (backendErrorCode) (err as any).__errorCode = backendErrorCode;
        throw err;
      }

      // Detectar errores del orchestrator embebidos como contenido (200 OK + error en texto)
      // y convertirlos a error para activar el botón Reintentar en CopilotEmbed.
      const orchestratorErrorMatch = fullContent.match(/Orchestrator falló:\s*(\w+)/);
      if (orchestratorErrorMatch) {
        const err = new Error('El asistente tuvo un problema procesando tu solicitud. Por favor, inténtalo de nuevo.');
        (err as any).__isStreamingHttpError = true;
        throw err;
      }

      const elapsed = Date.now() - startMs;
      reportCopilotMessageSent({ elapsedMs: elapsed, stream: true });
      return { content: fullContent, toolCalls, navigationUrl, enrichedEvents };
    }

    // Non-streaming mode (error)
    if (!response.ok) {
      const serverRequestId = response.headers.get('x-request-id') || requestId;
      const backendTraceId = response.headers.get('x-backend-trace-id') || '';
      const backendErrorCode = response.headers.get('x-backend-error-code') || '';
      let errorMsg = response.status === 401
        ? 'No autorizado. Inicia sesión de nuevo para usar el asistente.'
        : response.status === 402
        ? 'Saldo de IA agotado. Recarga tu cuenta para continuar usando el asistente.'
        : response.status === 500
        ? 'El servicio de IA no está disponible en este momento. Por favor, intenta más tarde.'
        : `Error ${response.status}: ${response.statusText}`;
      let navUrl: string | undefined;
      try {
        const data = await response.json();
        // user_message: mensaje amigable de api-ia para mostrar al usuario (prioritario)
        if (data?.user_message) errorMsg = String(data.user_message);
        else if (data?.message) errorMsg = String(data.message);
        else if (data?.error) errorMsg = String(data.error);
        else if (data?.detail?.error) errorMsg = String(data.detail.error);
        else if (data?.detail?.message) errorMsg = String(data.detail.message);
        if (response.status === 402) navUrl = data?.payment_url || data?.billing_url;
      } catch { /* ignore */ }
      const baseContent = `${errorMsg}` +
        `${serverRequestId ? ` (RequestId: ${serverRequestId})` : ''}` +
        `${backendTraceId ? ` (TraceId: ${backendTraceId})` : ''}` +
        `${backendErrorCode ? ` (ErrorCode: ${backendErrorCode})` : ''}`;
      const contentWithRecarga = navUrl ? `${baseContent}\n\n[Recargar saldo](${navUrl})` : baseContent;
      return {
        content: contentWithRecarga,
        toolCalls: [],
        navigationUrl: navUrl,
        enrichedEvents: [],
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const toolCalls = data.choices?.[0]?.message?.tool_calls || [];

    // Detect navigation URL
    const urlMatch = content.match(/https?:\/\/[^\s]+|\/[a-z-]+(\?[^\s]*)?/gi);
    const navigationUrl = urlMatch ? urlMatch[urlMatch.length - 1] : undefined;

    // Non-streaming enriched events (from proxy)
    const enrichedEvents: EnrichedEvent[] = data.enrichedEvents || [];
    const elapsed = Date.now() - startMs;
    reportCopilotMessageSent({ elapsedMs: elapsed, stream: false });
    return { content, toolCalls, navigationUrl, enrichedEvents };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        content: 'La solicitud tardó demasiado y se canceló. Por favor, intenta de nuevo.',
        toolCalls: [],
        navigationUrl: undefined,
        enrichedEvents: [],
      };
    }
    // Re-lanzar errores de streaming HTTP (5xx) para que CopilotEmbed.handleSend
    // los capture en su propio catch y active el botón Reintentar.
    if (error instanceof Error && (error as any).__isStreamingHttpError) {
      throw error;
    }
    console.error('[CopilotChat] Error sending message:', error);
    return {
      content: 'Ocurrió un error al conectar con el asistente. Por favor, intenta de nuevo.',
      toolCalls: [],
      navigationUrl: undefined,
      enrichedEvents: [],
    };
  }
};

/**
 * Obtiene el historial de mensajes de una sesión desde API2 (getChatMessages).
 * El backend api-ia guarda los mensajes en API2 al finalizar cada stream.
 * Ver docs/ANALISIS-RESPUESTA-BACKEND-COPILOT.md.
 */
const normalizeHistoryMessage = (m: any): ChatMessage => ({
  ...m,
  createdAt: typeof m.createdAt === 'string' ? new Date(m.createdAt) : m.createdAt ?? new Date(),
});

/**
 * Obtiene el historial de chat. Primero intenta API2 (GET /api/copilot/chat-history).
 * Si falla, usa el store en memoria (GET /api/chat/messages) para no dejar el panel vacío.
 */
export const getChatHistory = async (
  sessionId: string,
  development?: string,
  limit = 50
): Promise<ChatMessage[]> => {
  try {
    const response = await fetch(
      `${CHAT_API_BASE}/api/copilot/chat-history?sessionId=${encodeURIComponent(sessionId)}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'X-Development': development || 'bodasdehoy',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const list = data.messages || [];
      return list.map(normalizeHistoryMessage);
    }

    // API2 o proxy falló: fallback al store en memoria
    const fallback = await fetch(
      `${CHAT_API_BASE}/api/chat/messages?sessionId=${encodeURIComponent(sessionId)}`
    );
    if (!fallback.ok) return [];
    const fallbackData = await fallback.json();
    const fallbackList = fallbackData.messages || [];
    return fallbackList.map(normalizeHistoryMessage);
  } catch (error) {
    console.warn('[CopilotChat] Error fetching history (API2), trying fallback:', error);
    try {
      const fallback = await fetch(
        `${CHAT_API_BASE}/api/chat/messages?sessionId=${encodeURIComponent(sessionId)}`
      );
      if (!fallback.ok) return [];
      const fallbackData = await fallback.json();
      const fallbackList = fallbackData.messages || [];
      return fallbackList.map(normalizeHistoryMessage);
    } catch (fallbackError) {
      console.error('[CopilotChat] Fallback history failed:', fallbackError);
      return [];
    }
  }
};

/**
 * Persiste un mensaje en la sesión (POST /api/chat/messages).
 * Usar después de cada intercambio user/assistant para tener historial.
 */
export const persistChatMessage = async (
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  id?: string
): Promise<void> => {
  try {
    const response = await fetch(`${CHAT_API_BASE}/api/chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, role, content, id: id || generateMessageId() }),
    });
    if (!response.ok) {
      console.warn('[CopilotChat] persist message failed:', response.status);
    }
  } catch (error) {
    console.warn('[CopilotChat] persist message error:', error);
  }
};

export default {
  sendChatMessage,
  getChatHistory,
  persistChatMessage,
  generateMessageId,
};
