/**
 * Tests del handler GET /api/copilot/chat-history.
 * Usamos forma real de API2 (getChatMessages).
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../chat-history';

const originalFetch = global.fetch;

function createMockRes(): NextApiResponse & { status: jest.Mock; json: jest.Mock; setHeader: jest.Mock } {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    setHeader: jest.fn(),
  } as any;
}

beforeEach(() => {
  (global as any).fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('GET /api/copilot/chat-history', () => {
  it('devuelve 400 cuando falta sessionId', async () => {
    const req = { method: 'GET', query: {}, headers: {} } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    // setHeader('Allow','GET') solo se llama en 405 (no en 400)
    expect(res.setHeader).not.toHaveBeenCalledWith('Allow', 'GET');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'sessionId required' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('devuelve 200 y messages: [] cuando API_IA_CHAT_HISTORY_URL no está configurada', async () => {
    // Sin la env var, el handler devuelve [] sin llamar a fetch
    const req = {
      method: 'GET',
      query: { sessionId: 'user_123' },
      headers: { authorization: 'Bearer token', 'x-development': 'bodasdehoy' },
    } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ messages: [] });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('devuelve 200 y messages: [] cuando API2 devuelve errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ errors: [{ message: 'Unauthorized' }] }),
    });

    const req = {
      method: 'GET',
      query: { sessionId: 'user_456' },
      headers: {},
    } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ messages: [] });
  });

  it('devuelve 200 y messages: [] cuando fetch lanza', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const req = {
      method: 'GET',
      query: { sessionId: 'user_789' },
      headers: {},
    } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ messages: [] });
  });
});

describe('GET /api/copilot/chat-history (cuando API_IA_CHAT_HISTORY_URL está definida)', () => {
  const originalEnv = process.env.API_IA_CHAT_HISTORY_URL;

  beforeAll(() => {
    process.env.API_IA_CHAT_HISTORY_URL = 'https://api-ia.test/webapi/chat/history';
    jest.resetModules();
  });

  afterAll(() => {
    process.env.API_IA_CHAT_HISTORY_URL = originalEnv;
    jest.resetModules();
  });

  it('llama a api-ia (GET) y devuelve messages', async () => {
    const handlerLocal = (await import('../chat-history')).default;
    const mockMessages = [{ id: '1', role: 'user', content: 'Hola', createdAt: '2025-01-01T00:00:00Z' }];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ messages: mockMessages }),
    });

    const req = {
      method: 'GET',
      query: { sessionId: 's1', limit: '20' },
      headers: { authorization: 'Bearer token', 'x-development': 'bodasdehoy' },
    } as unknown as NextApiRequest;
    const res = createMockRes();

    await handlerLocal(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ messages: mockMessages });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('api-ia.test'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'Authorization': 'Bearer token', 'X-Development': 'bodasdehoy' }),
      })
    );
  });
});

describe('POST /api/copilot/chat-history', () => {
  it('devuelve 405 Method not allowed', async () => {
    const req = { method: 'POST', query: { sessionId: 'x' }, headers: {} } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'GET');
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    expect(fetch).not.toHaveBeenCalled();
  });
});
