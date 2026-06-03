import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests del esqueleto api-ia.ts. Verifican el CONTRATO del cliente (URL, headers, body, flag)
 * SIN depender de que api-ia exista. Cuando api-ia despliegue, confirma que el front está OK.
 */

// Mock localStorage (jwt + development) antes de importar el módulo
const store: Record<string, string> = {
  current_development: 'bodasdehoy',
  jwt_token: 'test.jwt.token',
};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
});

describe('api-ia service (esqueleto)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('con USE_API_IA_ENDPOINTS=false (default) → las funciones lanzan error (no se activan por accidente)', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_API_IA_ENDPOINTS', 'false');
    vi.resetModules();
    const api = await import('./api-ia');
    expect(api.USE_API_IA_ENDPOINTS).toBe(false);
    await expect(api.sendChatMessage('s1', 'hola')).rejects.toThrow(/NO activados/);
    await expect(api.getChatMessages('s1')).rejects.toThrow(/NO activados/);
  });

  it('con flag=true → sendChatMessage hace POST a /chat/stream con JWT + X-Development + body correcto', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_API_IA_ENDPOINTS', 'true');
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    const api = await import('./api-ia');

    await api.sendChatMessage('sess-123', 'hola mundo', { model: 'claude-sonnet-4' });

    const [url, opts] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/chat/stream');
    expect(opts.method).toBe('POST');
    expect(opts.headers.Authorization).toBe('Bearer test.jwt.token');
    expect(opts.headers['X-Development']).toBe('bodasdehoy');
    const body = JSON.parse(opts.body);
    expect(body).toMatchObject({ development: 'bodasdehoy', message: 'hola mundo', model: 'claude-sonnet-4', sessionId: 'sess-123' });
  });

  it('con flag=true → getChatMessages hace GET a /chat/messages con sessionId en querystring', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_API_IA_ENDPOINTS', 'true');
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messages: [{ id: 'm1' }] })));
    vi.stubGlobal('fetch', fetchMock);
    const api = await import('./api-ia');

    const res = await api.getChatMessages('sess-123', { limit: 50 });

    const [url, opts] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/chat/messages?');
    expect(String(url)).toContain('sessionId=sess-123');
    expect(String(url)).toContain('limit=50');
    expect(opts.method).toBe('GET');
    expect(res).toEqual([{ id: 'm1' }]);
  });
});
