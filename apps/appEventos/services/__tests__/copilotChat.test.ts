/**
 * Tests del servicio CopilotChat (sendChatMessage, parsing SSE, errores).
 * Usamos fixtures con formas reales de api-ia y API2 (datos reales).
 * Jest + next/jest — mismo ecosistema que Next.
 */

// Polyfill ReadableStream y TextEncoder/TextDecoder para jsdom (Node 18+)
if (typeof ReadableStream === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const webStreams = require('stream/web');
  Object.assign(globalThis, {
    ReadableStream: webStreams.ReadableStream,
    TransformStream: webStreams.TransformStream,
    WritableStream: webStreams.WritableStream,
  });
}
if (typeof TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextEncoder: TE, TextDecoder: TD } = require('util');
  Object.assign(globalThis, { TextEncoder: TE, TextDecoder: TD });
}

import { sendChatMessage, generateMessageId, getChatHistory } from '../copilotChat';
import {
  API2_GET_CHAT_MESSAGES_RESPONSE,
  SSE_EVENT_CARD_REAL,
  SSE_USAGE_REAL,
  SSE_REASONING_REAL,
  CHAT_REQUEST_BODY_REAL,
} from '../../__fixtures__/copilot';

jest.mock('js-cookie', () => ({
  __esModule: true,
  default: { get: jest.fn(() => 'mock-id-token') },
}));

describe('copilotChat service', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('generateMessageId', () => {
    it('genera un id único con prefijo msg_', () => {
      const id = generateMessageId();
      expect(id).toMatch(/^msg_\d+_[a-z0-9]+$/);
    });
    it('genera ids distintos en llamadas sucesivas', () => {
      const a = generateMessageId();
      const b = generateMessageId();
      expect(a).not.toBe(b);
    });
  });

  describe('sendChatMessage', () => {
    it('sin onChunk: hace POST a /api/copilot/chat y devuelve content del JSON', async () => {
      const mockJson = {
        choices: [{ message: { content: 'Respuesta del asistente', tool_calls: [] } }],
      };
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: () => Promise.resolve(mockJson),
      });

      globalThis.fetch = mockFetch as typeof fetch;

      const result = await sendChatMessage({ message: 'Hola', development: 'bodasdehoy' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/copilot/chat'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Development': 'bodasdehoy',
          }),
        })
      );
      expect(result.content).toBe('Respuesta del asistente');
      expect(result.toolCalls).toEqual([]);
      expect(result.enrichedEvents).toEqual([]);
    });

    it('envía body con contrato real (messages, stream, metadata)', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: () => Promise.resolve({ choices: [{ message: { content: 'OK', tool_calls: [] } }] }),
      });
      globalThis.fetch = mockFetch as typeof fetch;

      await sendChatMessage({
        message: CHAT_REQUEST_BODY_REAL.messages[0].content,
        sessionId: CHAT_REQUEST_BODY_REAL.metadata.sessionId,
        userId: CHAT_REQUEST_BODY_REAL.metadata.userId,
        development: CHAT_REQUEST_BODY_REAL.metadata.development,
        eventId: CHAT_REQUEST_BODY_REAL.metadata.eventId,
        eventName: CHAT_REQUEST_BODY_REAL.metadata.eventName,
        pageContext: CHAT_REQUEST_BODY_REAL.metadata.pageContext,
      });

      const body = JSON.parse((mockFetch.mock.calls[0] as any)[1].body);
      expect(body.messages).toEqual(CHAT_REQUEST_BODY_REAL.messages);
      expect(body.metadata.sessionId).toBe(CHAT_REQUEST_BODY_REAL.metadata.sessionId);
      expect(body.metadata.pageContext?.screenData?.totalInvitados).toBe(42);
    });

    it('con onChunk: hace streaming y llama onChunk con cada fragmento', async () => {
      const chunks = [
        'data: {"choices":[{"delta":{"content":"Hola "}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"mundo"}}]}\n\n',
        'data: [DONE]\n\n',
      ];
      const stream = new ReadableStream({
        start(controller) {
          for (const c of chunks) {
            controller.enqueue(new TextEncoder().encode(c));
          }
          controller.close();
        },
      });

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        body: stream,
      });

      globalThis.fetch = mockFetch as typeof fetch;

      const onChunk = jest.fn();
      const result = await sendChatMessage(
        { message: 'Test', development: 'bodasdehoy' },
        onChunk
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );
      const body = JSON.parse((mockFetch.mock.calls[0] as any)[1].body);
      expect(body.stream).toBe(true);

      expect(result.content).toBe('Hola mundo');
      expect(onChunk).toHaveBeenCalledWith('Hola ');
      expect(onChunk).toHaveBeenCalledWith('mundo');
    });

    it('respuesta no ok: devuelve mensaje de error en content', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'x-request-id': 'req-123' }),
        json: () => Promise.resolve({ message: 'Backend IA no disponible' }),
      });

      globalThis.fetch = mockFetch as typeof fetch;

      const result = await sendChatMessage({ message: 'Hola' });

      expect(result.content).toContain('Backend IA no disponible');
      expect(result.content).toContain('RequestId');
      expect(result.toolCalls).toEqual([]);
    });

    it('503 no-ok + user_message: prioriza user_message sobre message en content', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers(),
        json: () => Promise.resolve({
          error: 'upstream_error',
          message: 'Error técnico interno',
          user_message: 'El asistente no está disponible ahora. Inténtalo más tarde.',
        }),
      });

      globalThis.fetch = mockFetch as typeof fetch;

      const result = await sendChatMessage({ message: 'Hola' });

      expect(result.content).toContain('El asistente no está disponible ahora');
      expect(result.content).not.toContain('Error técnico interno');
    });

    it('streaming 503: lanza Error con el mensaje SSE para activar botón Reintentar', async () => {
      const sseChunks = [
        'event: error\n',
        'data: {"error":"upstream_error","user_message":"El proveedor de IA no está disponible."}\n\n',
      ];
      const stream = new ReadableStream({
        start(controller) {
          for (const c of sseChunks) {
            controller.enqueue(new TextEncoder().encode(c));
          }
          controller.close();
        },
      });

      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Headers({ 'x-request-id': 'req-503' }),
        body: stream,
      });

      globalThis.fetch = mockFetch as typeof fetch;

      const onChunk = jest.fn();

      await expect(
        sendChatMessage({ message: 'Test', development: 'bodasdehoy' }, onChunk)
      ).rejects.toThrow('El proveedor de IA no está disponible.');

      // onChunk NO debe haberse llamado con el error (solo lanza excepción)
      expect(onChunk).not.toHaveBeenCalled();
    });

    it('streaming 503 AUTH_ERROR: lanza error con __errorCode para suprimir Reintentar', async () => {
      const sseChunks = [
        'event: error\n',
        'data: {"error":"AUTH_ERROR","user_message":"Error de autenticación con el proveedor. Contacta al administrador."}\n\n',
      ];
      const stream = new ReadableStream({
        start(controller) {
          for (const c of sseChunks) {
            controller.enqueue(new TextEncoder().encode(c));
          }
          controller.close();
        },
      });

      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Headers({ 'x-backend-error-code': 'AUTH_ERROR' }),
        body: stream,
      });

      globalThis.fetch = mockFetch as typeof fetch;

      const onChunkAuth = jest.fn();
      let caughtError: any = null;
      try {
        await sendChatMessage({ message: 'Test', development: 'bodasdehoy' }, onChunkAuth);
      } catch (e) {
        caughtError = e;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError.__isStreamingHttpError).toBe(true);
      // __errorCode debe estar presente para que CopilotEmbed suprima el botón Reintentar
      expect(caughtError.__errorCode).toBe('AUTH_ERROR');
    });

    it('streaming 503: lanza Error aunque no haya SSE event:error (usa fullContent)', async () => {
      const sseChunks = [
        'data: {"error":"service_error"}\n\n',
      ];
      const stream = new ReadableStream({
        start(controller) {
          for (const c of sseChunks) {
            controller.enqueue(new TextEncoder().encode(c));
          }
          controller.close();
        },
      });

      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Headers(),
        body: stream,
      });

      globalThis.fetch = mockFetch as typeof fetch;

      await expect(
        sendChatMessage({ message: 'Test', development: 'bodasdehoy' }, jest.fn())
      ).rejects.toThrow();
    });

    it('429 rate limit: devuelve mensaje amigable sin lanzar excepción', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'retry-after': '30' }),
        json: () => Promise.resolve({
          error: 'UPSTREAM_RATE_LIMIT',
          message: 'Demasiadas peticiones al asistente. Por favor, espera unos segundos.',
        }),
      });

      globalThis.fetch = mockFetch as typeof fetch;

      const onChunk = jest.fn();
      const result = await sendChatMessage(
        { message: 'Hola', development: 'bodasdehoy' },
        onChunk
      );

      expect(result.content).toContain('Demasiadas peticiones');
      expect(result.content).toContain('Retry-After: 30s');
      expect(onChunk).toHaveBeenCalledWith(expect.stringContaining('Retry-After'));
      expect(result.toolCalls).toEqual([]);
    });

    it('429 sin Retry-After: devuelve mensaje sin tiempo de espera', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers(),
        json: () => Promise.resolve({ message: 'Rate limit excedido.' }),
      });

      globalThis.fetch = mockFetch as typeof fetch;

      const result = await sendChatMessage({ message: 'Hola', development: 'bodasdehoy' }, jest.fn());

      expect(result.content).toContain('Rate limit excedido.');
      expect(result.content).not.toContain('Retry-After');
    });

    it('SSE event:error con user_message: muestra user_message no el campo error', async () => {
      const sseChunks = [
        'data: {"choices":[{"delta":{"content":"Inicio "}}]}\n\n',
        'event: error\n',
        'data: {"error":"provider_error","user_message":"El proveedor superó su límite."}\n\n',
      ];
      const stream = new ReadableStream({
        start(controller) {
          for (const c of sseChunks) {
            controller.enqueue(new TextEncoder().encode(c));
          }
          controller.close();
        },
      });

      // Respuesta 200 con error embebido en SSE (caso raro pero posible)
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        body: stream,
      });

      globalThis.fetch = mockFetch as typeof fetch;

      const chunks: string[] = [];
      const onChunk = (c: string) => chunks.push(c);

      const result = await sendChatMessage(
        { message: 'Test', development: 'bodasdehoy' },
        onChunk
      );

      const full = chunks.join('');
      expect(full).toContain('El proveedor superó su límite.');
      expect(full).not.toContain('provider_error');
      expect(result.content).toContain('Inicio');
    });

    it('cuando fetch lanza AbortError devuelve mensaje de cancelación', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new DOMException('abort', 'AbortError'));

      globalThis.fetch = mockFetch as typeof fetch;

      const result = await sendChatMessage({ message: 'Hola' });

      expect(result.content).toContain('canceló');
      expect(result.toolCalls).toEqual([]);
    });

    it('parsea eventos SSE reales (event_card, usage, reasoning) y llama onEnrichedEvent', async () => {
      const sseChunks = [
        `event: event_card\ndata: ${JSON.stringify(SSE_EVENT_CARD_REAL)}\n\n`,
        'data: {"choices":[{"delta":{"content":"Respuesta "}}]}\n\n',
        `event: usage\ndata: ${JSON.stringify(SSE_USAGE_REAL)}\n\n`,
        `event: reasoning\ndata: ${JSON.stringify(SSE_REASONING_REAL)}\n\n`,
        'data: {"choices":[{"delta":{"content":"final."}}]}\n\n',
        'data: [DONE]\n\n',
      ];
      const stream = new ReadableStream({
        start(controller) {
          for (const c of sseChunks) {
            controller.enqueue(new TextEncoder().encode(c));
          }
          controller.close();
        },
      });
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        body: stream,
      });
      globalThis.fetch = mockFetch as typeof fetch;

      const onChunk2 = jest.fn();
      const onEnriched = jest.fn();
      const result = await sendChatMessage({ message: 'Test', development: 'bodasdehoy' }, onChunk2, undefined, onEnriched);

      expect(result.content).toBe('Respuesta final.');
      expect(onEnriched).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'event_card', data: SSE_EVENT_CARD_REAL })
      );
      expect(onEnriched).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'usage', data: SSE_USAGE_REAL })
      );
      expect(onEnriched).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'reasoning', data: SSE_REASONING_REAL })
      );
      expect(result.enrichedEvents?.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getChatHistory', () => {
    it('devuelve historial con forma real de API2 (getChatMessages) y normaliza createdAt', async () => {
      const realResponse = { messages: API2_GET_CHAT_MESSAGES_RESPONSE.data.getChatMessages };
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(realResponse),
      });
      globalThis.fetch = mockFetch as typeof fetch;

      const result = await getChatHistory('session-123', 'bodasdehoy');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/copilot/chat-history'),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-Development': 'bodasdehoy' }),
        })
      );
      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('user');
      expect(result[0].content).toBe('¿Cuántos invitados tengo?');
      expect(result[0].id).toBe('msg_abc123');
      expect(result[1].content).toContain('42 invitados');
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[1].createdAt).toBeInstanceOf(Date);
    });

    it('si chat-history no responde ok usa fallback /api/chat/messages', async () => {
      const fallbackMessages = [
        { id: 'f1', role: 'user', content: 'Fallback', createdAt: new Date().toISOString() },
      ];
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messages: fallbackMessages }),
        });

      globalThis.fetch = mockFetch as typeof fetch;

      const result = await getChatHistory('session-456');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, expect.stringContaining('/api/copilot/chat-history'), expect.any(Object));
      expect(mockFetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/api/chat/messages'));
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Fallback');
    });

    it('si chat-history falla y fallback también, devuelve array vacío', async () => {
      const mockFetch = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: false });

      globalThis.fetch = mockFetch as typeof fetch;

      const result = await getChatHistory('session-789');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual([]);
    });
  });
});
