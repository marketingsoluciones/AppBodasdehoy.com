/**
 * Tests del handler POST /api/copilot/chat.
 * Verifican contrato con api-ia (body real) y respuesta cuando el backend no está disponible.
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

import type { NextApiRequest, NextApiResponse } from 'next';
import { CHAT_REQUEST_BODY_REAL } from '../../../../__fixtures__/copilot';

const PYTHON_BACKEND_DEFAULT = 'https://api-ia.bodasdehoy.com';

function createMockRes(): NextApiResponse & {
  status: jest.Mock;
  json: jest.Mock;
  setHeader: jest.Mock;
  getHeader: jest.Mock;
  write: jest.Mock;
  end: jest.Mock;
  headersSent: boolean;
  statusCode: number;
} {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    setHeader: jest.fn(),
    getHeader: jest.fn().mockReturnValue(undefined),
    write: jest.fn(),
    end: jest.fn(),
    headersSent: false,
    statusCode: 200,
  } as any;
}

describe('POST /api/copilot/chat', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeAll(() => {
    process.env.ENABLE_COPILOT_FALLBACK = '';
    process.env.OPENAI_API_KEY = '';
    process.env.PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || PYTHON_BACKEND_DEFAULT;
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.resetModules();
    (global as any).fetch = jest.fn();
  });

  it('devuelve 400 cuando falta el array messages', async () => {
    const handler = (await import('../chat')).default;
    const req = {
      method: 'POST',
      body: { stream: true, metadata: {} },
      headers: {},
    } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Messages array is required' });
  });

  it('envía a api-ia body con contrato real (messages, stream, metadata)', async () => {
    const mockFetch = (global as any).fetch as jest.Mock;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/event-stream' }),
      body: new ReadableStream({
        start(c: ReadableStreamDefaultController) {
          c.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hola"}}]}\n\n'));
          c.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          c.close();
        },
      }),
    });

    const handler = (await import('../chat')).default;
    const req = {
      method: 'POST',
      body: CHAT_REQUEST_BODY_REAL,
      headers: {
        'content-type': 'application/json',
        'x-development': CHAT_REQUEST_BODY_REAL.metadata.development,
      },
    } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(mockFetch).toHaveBeenCalled();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/webapi/chat/');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual(
      expect.objectContaining({
        'Content-Type': 'application/json',
        'X-Development': 'bodasdehoy',
      })
    );
    const body = JSON.parse(options.body);
    expect(Array.isArray(body.messages)).toBe(true);
    expect(body.stream).toBe(true);
    expect(body.messages.some((m: any) => m.role === 'system')).toBe(true);
    expect(body.messages.some((m: any) => m.role === 'user')).toBe(true);
  });

  it('devuelve 503 y mensaje cuando el backend api-ia no está disponible', async () => {
    const mockFetch = (global as any).fetch as jest.Mock;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: () =>
        Promise.resolve(
          JSON.stringify({ message: 'Servicio no disponible', trace_id: 'trace-123' })
        ),
    });

    const handler = (await import('../chat')).default;
    const req = {
      method: 'POST',
      body: { messages: [{ role: 'user', content: 'Hola' }], stream: true, metadata: {} },
      headers: {},
    } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    // En streaming el handler usa res.statusCode = 503 (asignación directa), no res.status()
    expect(res.statusCode).toBe(503);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    // El handler propaga extractedMessage (de la respuesta de api-ia) en el SSE
    expect(res.write).toHaveBeenCalledWith(
      expect.stringContaining('Servicio no disponible')
    );
    expect(res.write).toHaveBeenCalledWith(expect.stringContaining('data: [DONE]'));
    expect(res.end).toHaveBeenCalled();
  });

  it('devuelve 401 cuando el backend api-ia devuelve 401 (no autorizado)', async () => {
    const mockFetch = (global as any).fetch as jest.Mock;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: () =>
        Promise.resolve(JSON.stringify({ message: 'Token expirado', trace_id: 'trace-401' })),
    });

    const handler = (await import('../chat')).default;
    const req = {
      method: 'POST',
      // stream: false → usa el path JSON (res.status(401).json) no el SSE (res.statusCode=401)
      body: { messages: [{ role: 'user', content: 'Hola' }], stream: false, metadata: {} },
      headers: {},
    } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.setHeader).toHaveBeenCalledWith('X-Backend-Error-Code', 'UNAUTHORIZED');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'UNAUTHORIZED',
        message: expect.any(String),
        requestId: expect.any(String),
      })
    );
  });

  it('devuelve 402 con payment_url (fallback billing) cuando el backend devuelve 402 sin payment_url', async () => {
    const mockFetch = (global as any).fetch as jest.Mock;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 402,
      text: () =>
        Promise.resolve(
          JSON.stringify({ error: 'saldo_agotado', message: 'Sin saldo', trace_id: 'trace-402' })
        ),
    });
    const prevChat = process.env.NEXT_PUBLIC_CHAT;
    process.env.NEXT_PUBLIC_CHAT = 'https://chat.bodasdehoy.com';

    const handler = (await import('../chat')).default;
    const req = {
      method: 'POST',
      body: { messages: [{ role: 'user', content: 'Hola' }], stream: false, metadata: {} },
      headers: {},
    } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(402);
    expect(res.setHeader).toHaveBeenCalledWith('X-Backend-Error-Code', 'SALDO_AGOTADO');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'SALDO_AGOTADO',
        message: 'Sin saldo',
        requestId: expect.any(String),
        payment_url: 'https://chat.bodasdehoy.com/settings/billing',
      })
    );
    process.env.NEXT_PUBLIC_CHAT = prevChat;
  });
});

describe('OPTIONS /api/copilot/chat', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('devuelve 200 y headers CORS', async () => {
    const handler = (await import('../chat')).default;
    const req = { method: 'OPTIONS' } as unknown as NextApiRequest;
    const res = {
      setHeader: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
    } as any;

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      'POST, OPTIONS'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });
});
