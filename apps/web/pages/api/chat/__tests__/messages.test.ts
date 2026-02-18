/**
 * Tests del handler GET/POST /api/chat/messages
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../messages';

function createMockRes(): NextApiResponse & { status: jest.Mock; json: jest.Mock; setHeader: jest.Mock } {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    setHeader: jest.fn(),
  } as any;
}

describe('GET /api/chat/messages', () => {
  it('devuelve 200 y messages: [] cuando sessionId está presente y no hay mensajes', () => {
    const req = { method: 'GET', query: { sessionId: 'guest_empty_123' } } as unknown as NextApiRequest;
    const res = createMockRes();

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ messages: [] });
  });

  it('devuelve 400 cuando falta sessionId', () => {
    const req = { method: 'GET', query: {} } as unknown as NextApiRequest;
    const res = createMockRes();

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'sessionId required' });
  });
});

describe('POST /api/chat/messages', () => {
  it('acepta POST con sessionId, role y content y devuelve 200', () => {
    const req = {
      method: 'POST',
      body: { sessionId: 'test_post_1', role: 'user', content: 'Hola' },
    } as unknown as NextApiRequest;
    const res = createMockRes();

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('devuelve 400 cuando faltan campos', () => {
    const req = { method: 'POST', body: { sessionId: 'x' } } as unknown as NextApiRequest;
    const res = createMockRes();

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('GET después de POST', () => {
  it('devuelve mensajes persistidos para la sesión', () => {
    const sid = `test_get_${Date.now()}`;
    handler(
      { method: 'POST', body: { sessionId: sid, role: 'user', content: 'Hola' } } as unknown as NextApiRequest,
      createMockRes()
    );
    handler(
      { method: 'POST', body: { sessionId: sid, role: 'assistant', content: 'Respuesta' } } as unknown as NextApiRequest,
      createMockRes()
    );

    const res = createMockRes();
    handler({ method: 'GET', query: { sessionId: sid } } as unknown as NextApiRequest, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.messages).toHaveLength(2);
    expect(payload.messages[0].role).toBe('user');
    expect(payload.messages[1].content).toBe('Respuesta');
  });
});

describe('Método no permitido', () => {
  it('devuelve 405 para PUT', () => {
    const req = { method: 'PUT', query: {} } as unknown as NextApiRequest;
    const res = createMockRes();

    handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'GET, POST');
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
