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

const CHAT_API_BASE = '';

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
  | 'event_card';

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

export interface SendMessageParams {
  message: string;
  sessionId?: string;
  userId?: string;
  development?: string;
  eventId?: string;
  eventName?: string;
  pageContext?: PageContext;
  model?: string;
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

/** Known enriched SSE event types */
const ENRICHED_EVENT_TYPES = new Set<string>([
  'tool_result',
  'ui_action',
  'confirm_required',
  'progress',
  'code_output',
  'tool_start',
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
  const { message, sessionId, userId, development, eventId, eventName, pageContext, model } = params;

  try {
    const requestId = createRequestId();
    const timeoutMs = 35_000;
    const controller = new AbortController();

    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const payload: any = {
      messages: [{ role: 'user', content: message }],
      stream: !!onChunk,
      metadata: { userId, development, eventId, eventName, sessionId, pageContext },
    };
    if (model) payload.model = model;

    const response = await fetch(`${CHAT_API_BASE}/api/copilot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Cookies.get('idTokenV0.1.0') || ''}`,
        'X-Development': development || 'bodasdehoy',
        'X-Request-Id': requestId,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    // Streaming mode
    if (onChunk && response.body) {
      const serverRequestId = response.headers.get('x-request-id') || requestId;
      const backendTraceId = response.headers.get('x-backend-trace-id') || '';
      const backendErrorCode = response.headers.get('x-backend-error-code') || '';
      const metaSuffix =
        `${serverRequestId ? ` RequestId: ${serverRequestId}` : ''}` +
        `${backendTraceId ? ` TraceId: ${backendTraceId}` : ''}` +
        `${backendErrorCode ? ` ErrorCode: ${backendErrorCode}` : ''}`;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let toolCalls: ToolCall[] = [];
      let navigationUrl: string | undefined;
      let enrichedEvents: EnrichedEvent[] = [];
      let pending = '';
      let currentEvent: string | null = null;

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

            // Error events
            if (currentEvent === 'error' && parsed?.error) {
              const base = String(parsed.error);
              const msg = base.includes('RequestId:') ? base : `${base}${metaSuffix}`;
              fullContent += msg;
              onChunk(msg);
              currentEvent = null;
              continue;
            }

            // Backend error without event type
            if (parsed?.error && !parsed?.choices) {
              const base = String(parsed.error);
              const msg = base.includes('RequestId:') ? base : `${base}${metaSuffix}`;
              fullContent += msg;
              onChunk(msg);
              continue;
            }

            // Regular text content
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              onChunk(content);
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

      return { content: fullContent, toolCalls, navigationUrl, enrichedEvents };
    }

    // Non-streaming mode
    if (!response.ok) {
      const serverRequestId = response.headers.get('x-request-id') || requestId;
      const backendTraceId = response.headers.get('x-backend-trace-id') || '';
      const backendErrorCode = response.headers.get('x-backend-error-code') || '';
      let errorMsg = response.status === 500
        ? 'El servicio de IA no está disponible en este momento. Por favor, intenta más tarde.'
        : `Error ${response.status}: ${response.statusText}`;
      try {
        const data = await response.json();
        if (data?.message) errorMsg = String(data.message);
        else if (data?.error) errorMsg = String(data.error);
        else if (data?.detail?.error) errorMsg = String(data.detail.error);
        else if (data?.detail?.message) errorMsg = String(data.detail.message);
      } catch { /* ignore */ }
      return {
        content: `${errorMsg}` +
          `${serverRequestId ? ` (RequestId: ${serverRequestId})` : ''}` +
          `${backendTraceId ? ` (TraceId: ${backendTraceId})` : ''}` +
          `${backendErrorCode ? ` (ErrorCode: ${backendErrorCode})` : ''}`,
        toolCalls: [],
        navigationUrl: undefined,
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
 * Obtiene el historial de mensajes de una sesión
 */
export const getChatHistory = async (
  sessionId: string,
  development?: string
): Promise<ChatMessage[]> => {
  try {
    const response = await fetch(`${CHAT_API_BASE}/api/chat/messages?sessionId=${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${Cookies.get('idTokenV0.1.0') || ''}`,
        'X-Development': development || 'bodasdehoy',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('[CopilotChat] Error fetching history:', error);
    return [];
  }
};

export default {
  sendChatMessage,
  getChatHistory,
  generateMessageId,
};
