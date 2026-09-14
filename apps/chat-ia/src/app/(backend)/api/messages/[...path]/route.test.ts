// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import { GET, POST, PUT } from './route';

/**
 * Auditoria QA 14-09 (N32): el proxy /api/messages/* reenviaba a api-ia/api-mcp
 * SIN credenciales. Estos tests fijan el comportamiento del gate: sin
 * Authorization ni ?token= debe responder 401 sin llamar al backend.
 */

const params = (path: string[]) => ({ params: Promise.resolve({ path }) });

describe('messages proxy - gate de autenticacion (N32)', () => {
  it('GET sin token responde 401 y no reenvia', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const req = new Request('https://chat-dev.bodasdehoy.com/api/messages/conversations/123/draft');
    const res = await GET(req as any, params(['conversations', '123', 'draft']));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.detail).toBe('No autenticado');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('POST sin token responde 401', async () => {
    const req = new Request('https://chat-dev.bodasdehoy.com/api/messages/conversations/123/draft', {
      method: 'POST',
    });
    const res = await POST(req as any, params(['conversations', '123', 'draft']));
    expect(res.status).toBe(401);
  });

  it('PUT sin token responde 401', async () => {
    const req = new Request('https://chat-dev.bodasdehoy.com/api/messages/conversations/123/draft', {
      method: 'PUT',
    });
    const res = await PUT(req as any, params(['conversations', '123', 'draft']));
    expect(res.status).toBe(401);
  });

  it('GET con header Authorization SI reenvia (no 401 del gate)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      }),
    );
    const req = new Request('https://chat-dev.bodasdehoy.com/api/messages/conversations', {
      headers: { authorization: 'Bearer test.jwt.here' },
    });
    const res = await GET(req as any, params(['conversations']));
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] as any[];
    expect(init.headers['Authorization']).toBe('Bearer test.jwt.here');
    fetchSpy.mockRestore();
  });

  it('GET con ?token= (EventSource/SSE) SI reenvia y sintetiza Bearer', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      }),
    );
    const req = new Request('https://chat-dev.bodasdehoy.com/api/messages/stream?token=tok123');
    const res = await GET(req as any, params(['stream']));
    expect(res.status).toBe(200);
    const [, init] = fetchSpy.mock.calls[0] as any[];
    expect(init.headers['Authorization']).toBe('Bearer tok123');
    fetchSpy.mockRestore();
  });
});
