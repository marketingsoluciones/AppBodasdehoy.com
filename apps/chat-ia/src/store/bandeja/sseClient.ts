/**
 * SSE singleton client para Bandeja.
 *
 * Una única conexión EventSource por device. Cuando llegan eventos, se
 * publican vía un callback que el store usa para actualizar su state.
 *
 * Auto-reconnect con backoff exponencial. Auth via fetch+ReadableStream
 * (no EventSource directo) para mandar el JWT en header Authorization en
 * lugar de query string.
 */
import type { SSEEvent } from './types';

const MIN_RETRY_MS = 1000;
const MAX_RETRY_MS = 60_000;
const IDLE_TIMEOUT_MS = 30_000; // API IA emits a heartbeat every 10 seconds.

export type SSEEventHandler = (event: SSEEvent) => void;

interface SSEManagerOptions {
  url: string;
  authHeaders: () => Record<string, string>;
  onEvent: SSEEventHandler;
  onConnectionChange?: (connected: boolean) => void;
}

class SSEManager {
  private abortController: AbortController | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryDelay = MIN_RETRY_MS;
  private cancelled = false;
  private options: SSEManagerOptions;

  constructor(options: SSEManagerOptions) {
    this.options = options;
  }

  start(): void {
    if (this.abortController || this.retryTimer) return;
    this.cancelled = false;
    void this.connect();
  }

  stop(): void {
    this.cancelled = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.abortController?.abort();
    this.abortController = null;
    this.options.onConnectionChange?.(false);
  }

  private async connect(): Promise<void> {
    if (this.cancelled) return;
    const controller = new AbortController();
    this.abortController = controller;
    let idleTimer: ReturnType<typeof setTimeout>;
    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => controller.abort(), IDLE_TIMEOUT_MS);
    };
    resetIdle();

    try {
      const headers = {
        Accept: 'text/event-stream',
        ...this.options.authHeaders(),
      };
      const response = await fetch(this.options.url, {
        headers,
        signal: controller.signal,
      });

      if (this.cancelled || this.abortController !== controller) return;

      if (!response.ok || !response.body || !response.headers.get('content-type')?.toLowerCase().startsWith('text/event-stream')) {
        throw new Error(`SSE ${response.status}`);
      }

      this.retryDelay = MIN_RETRY_MS; // reset backoff
      this.options.onConnectionChange?.(true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done || this.cancelled) break;

        resetIdle();
        buf += decoder.decode(value, { stream: true });
        // Preserve an incomplete CRLF across reads; accept either framing.
        const blocks = buf.split(/\r?\n\r?\n/);
        buf = blocks.pop() ?? '';

        for (const block of blocks) {
          this.parseBlock(block);
        }
      }
    } catch {
      // Network failure and clean EOF both require reconnecting. stop() is
      // distinguished by the controller identity, including stop/start races.
    } finally {
      clearTimeout(idleTimer!);
      if (this.abortController === controller) {
        this.abortController = null;
        controller.abort();
        if (!this.cancelled) {
          this.options.onConnectionChange?.(false);
          this.scheduleRetry();
        }
      }
    }
  }

  private parseBlock(block: string): void {
    // Formato SSE: "event: type\ndata: {json}"
    const lines = block.split('\n');
    let eventType = 'message';
    let data = '';
    for (const line of lines) {
      if (line.startsWith('event:')) eventType = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    if (!data) return;
    try {
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object') return;
      // API IA emits a flat message; its type is the media type (e.g. text),
      // not the store event discriminator.
      if (eventType === 'message' && (parsed.conversationId || parsed.convId) && (parsed.id || parsed.messageId)) {
        this.options.onEvent({
          type: 'new_message',
          convId: parsed.conversationId || parsed.convId,
          message: { ...parsed, id: parsed.id || parsed.messageId, direction: parsed.direction || (parsed.fromUser === false ? 'outbound' : 'inbound'), content: parsed.content ?? parsed.text ?? '' },
        });
        return;
      }
      if (eventType === 'connected' || eventType === 'ping') return;
      // Si el server manda {type, ...} usar el campo type del payload;
      // si no, usar el eventType del SSE.
      const event: SSEEvent = parsed.type ? parsed : { type: eventType as any, ...parsed };
      this.options.onEvent(event);
    } catch {
      /* ignore malformed */
    }
  }

  private scheduleRetry(): void {
    if (this.cancelled) return;
    const delay = this.retryDelay;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.retryDelay = Math.min(this.retryDelay * 2, MAX_RETRY_MS);
      this.connect();
    }, delay);
  }
}

let _instance: SSEManager | null = null;

export function getSSEManager(options: SSEManagerOptions): SSEManager {
  if (!_instance) {
    _instance = new SSEManager(options);
  }
  return _instance;
}

export function destroySSEManager(): void {
  _instance?.stop();
  _instance = null;
}
