import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../pages/api/copilot/chat-history';

const originalFetch = global.fetch;
const originalApiIaUrl = process.env.API_IA_URL;

function createMockRes(): NextApiResponse & {
  status: jest.Mock;
  json: jest.Mock;
  setHeader: jest.Mock;
} {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    setHeader: jest.fn(),
  } as any;
}

beforeEach(() => {
  (global as any).fetch = jest.fn();
  process.env.API_IA_URL = 'https://api-ia.test';
});

afterAll(() => {
  global.fetch = originalFetch;
  process.env.API_IA_URL = originalApiIaUrl;
});

it('rechaza una lectura sin sessionId antes de consultar API-IA', async () => {
  const req = { method: 'GET', query: {}, headers: {} } as unknown as NextApiRequest;
  const res = createMockRes();
  await handler(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(fetch).not.toHaveBeenCalled();
});

it('rechaza una lectura sin JWT antes de consultar API-IA', async () => {
  const req = {
    method: 'GET',
    query: { sessionId: 's1' },
    headers: { 'x-development': 'bodasdehoy' },
  } as unknown as NextApiRequest;
  const res = createMockRes();
  await handler(req, res);
  expect(res.status).toHaveBeenCalledWith(401);
  expect(fetch).not.toHaveBeenCalled();
});

it.each(['bodasdehoy', 'eventosorganizador'])(
  'envía JWT y tenant a API-IA sin X-Support-Key para %s',
  async (development) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ messages: [{ id: 'm1', role: 'user', content: 'Hola' }] }),
    });
    const req = {
      method: 'GET',
      query: { sessionId: 's1', limit: '20' },
      headers: { authorization: 'Bearer token', 'x-development': development },
    } as unknown as NextApiRequest;
    const res = createMockRes();
    await handler(req, res);
    expect(fetch).toHaveBeenCalledWith(
      'https://api-ia.test/webapi/chat/history?sessionId=s1&limit=20',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          'X-Development': development,
        }),
      }),
    );
    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(headers).not.toHaveProperty('X-Support-Key');
    expect(res.status).toHaveBeenCalledWith(200);
  },
);

it('propaga el estado de autorización para que el cliente no confunda error con historial vacío', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 403 });
  const req = {
    method: 'GET',
    query: { sessionId: 's1' },
    headers: { authorization: 'Bearer token', 'x-development': 'bodasdehoy' },
  } as unknown as NextApiRequest;
  const res = createMockRes();
  await handler(req, res);
  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalledWith({ error: 'API_IA_HISTORY_FAILED', messages: [] });
});

it('devuelve 503 cuando API-IA no está disponible', async () => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
  const req = {
    method: 'GET',
    query: { sessionId: 's1' },
    headers: { authorization: 'Bearer token', 'x-development': 'bodasdehoy' },
  } as unknown as NextApiRequest;
  const res = createMockRes();
  await handler(req, res);
  expect(res.status).toHaveBeenCalledWith(503);
});

it('rechaza métodos distintos de GET', async () => {
  const req = { method: 'POST', query: {}, headers: {} } as unknown as NextApiRequest;
  const res = createMockRes();
  await handler(req, res);
  expect(res.status).toHaveBeenCalledWith(405);
  expect(fetch).not.toHaveBeenCalled();
});
