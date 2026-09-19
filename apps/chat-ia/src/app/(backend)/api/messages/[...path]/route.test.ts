// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import { GET, POST, PUT } from './route';

/**
 * Auditoria QA 14-09 (N32): el proxy /api/messages/* reenviaba a api-ia/api-mcp
 * SIN credenciales. Estos tests fijan el comportamiento del gate: sin
 * Authorization ni ?token= debe responder 401 sin llamar al backend.
 */

const jwt = (payload: Record<string, unknown>) => {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.firma-no-verificada`;
};
const VALID_JWT = jwt({ exp: Math.floor(Date.now() / 1000) + 3600, sub: 'uid-1' });
const EXPIRED_JWT = jwt({ exp: Math.floor(Date.now() / 1000) - 60, sub: 'uid-1' });

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
      headers: { authorization: `Bearer ${VALID_JWT}` },
    });
    const res = await GET(req as any, params(['conversations']));
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] as any[];
    expect(init.headers['Authorization']).toBe(`Bearer ${VALID_JWT}`);
    fetchSpy.mockRestore();
  });

  it('GET con ?token= (EventSource/SSE) SI reenvia y sintetiza Bearer', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      }),
    );
    const req = new Request(`https://chat-dev.bodasdehoy.com/api/messages/stream?token=${VALID_JWT}`);
    const res = await GET(req as any, params(['stream']));
    expect(res.status).toBe(200);
    const [, init] = fetchSpy.mock.calls[0] as any[];
    expect(init.headers['Authorization']).toBe(`Bearer ${VALID_JWT}`);
    fetchSpy.mockRestore();
  });
  it('GET con ?token= basura responde 401 y no reenvia (bypass de la auditoria 15-09)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const req = new Request(
      'https://chat-dev.bodasdehoy.com/api/messages/conversations/123/draft?token=x',
    );
    const res = await GET(req as any, params(['conversations', '123', 'draft']));
    expect(res.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('GET con JWT caducado responde 401 y no reenvia', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const req = new Request('https://chat-dev.bodasdehoy.com/api/messages/conversations', {
      headers: { authorization: `Bearer ${EXPIRED_JWT}` },
    });
    const res = await GET(req as any, params(['conversations']));
    expect(res.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
