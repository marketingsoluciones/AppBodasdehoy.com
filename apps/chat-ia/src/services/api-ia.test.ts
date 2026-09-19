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

  it('consumeChatStream: parsea event:text (acumula), usage, done (contrato api-ia)', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_API_IA_ENDPOINTS', 'true');
    vi.resetModules();
    const api = await import('./api-ia');

    // SSE: 2 chunks de texto, usage, done — formato real api-ia (event:text → string JSON-encoded).
    const sse =
      'event: text\ndata: "Hola "\n\n' +
      'event: text\ndata: "mundo"\n\n' +
      'event: usage\ndata: {"tokens":42}\n\n' +
      'event: done\ndata: {}\n\n';
    const response = new Response(sse, { headers: { 'Content-Type': 'text/event-stream' }, status: 200 });

    let text = '';
    let usage: any = null;
    let done = false;
    await api.consumeChatStream(response, {
      onDone: () => { done = true; },
      onText: (c) => { text += c; },
      onUsage: (u) => { usage = u; },
    });

    expect(text).toBe('Hola mundo');
    expect(usage).toEqual({ tokens: 42 });
    expect(done).toBe(true);
  });

  it('consumeChatStream: event:error invoca onError con mensaje + traceId de headers', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_API_IA_ENDPOINTS', 'true');
    vi.resetModules();
    const api = await import('./api-ia');

    const sse = 'event: error\ndata: {"error":"rate limited"}\n\n';
    const response = new Response(sse, {
      headers: { 'X-Error-Code': 'RATE_LIMIT', 'X-Trace-ID': 'trace-xyz' },
      status: 200,
    });

    let errMsg = '';
    let meta: any = null;
    await api.consumeChatStream(response, {
      onError: (e, m) => { errMsg = e; meta = m; },
    });

    expect(errMsg).toBe('rate limited');
    expect(meta?.traceId).toBe('trace-xyz');
    expect(meta?.code).toBe('RATE_LIMIT');
  });

  it('consumeChatStream: HTTP no-ok → onError sin body', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_API_IA_ENDPOINTS', 'true');
    vi.resetModules();
    const api = await import('./api-ia');

    const response = new Response('', { headers: { 'X-Error-Code': 'AUTH' }, status: 401 });
    let errMsg = '';
    await api.consumeChatStream(response, { onError: (e) => { errMsg = e; } });
    expect(errMsg).toContain('401');
  });

  it('con flag=true → getChatMessages hace GET a /chat/messages con sessionId', async () => {
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
