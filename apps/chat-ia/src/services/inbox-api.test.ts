import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests del CONTRATO del cliente inbox-api (lecturas del inbox vía api-ia /api/backend).
 * Verifican: (1) con flag off lanzan error (no se activan por accidente); (2) con flag on
 * hacen GET a /api/backend/... con los params correctos. NO dependen de que api-ia exista.
 */
vi.mock('@/utils/authToken', () => ({
  buildAuthHeaders: () => ({ Authorization: 'Bearer test.jwt' }),
}));

describe('inbox-api service', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('flag off (default) → las lecturas lanzan error (no llaman api-mcp ni api-ia por accidente)', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_API_IA_INBOX', 'false');
    vi.resetModules();
    const api = await import('./inbox-api');
    expect(api.USE_API_IA_INBOX).toBe(false);
    await expect(api.getUserChats('u1', { development: 'bodasdehoy' })).rejects.toThrow(/NO activada/);
    await expect(api.getUserProfile('a@b.com', 'bodasdehoy')).rejects.toThrow(/NO activada/);
  });

  it('flag on → getUserChats hace GET a /api/backend/api/inbox/chats con userId+development', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_API_IA_INBOX', 'true');
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })));
    vi.stubGlobal('fetch', fetchMock);
    const api = await import('./inbox-api');

    await api.getUserChats('user-1', { development: 'bodasdehoy', limit: 20, page: 2 });

    const [url, opts] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/backend/api/inbox/chats');
    expect(String(url)).toContain('userId=user-1');
    expect(String(url)).toContain('development=bodasdehoy');
    expect(String(url)).toContain('limit=20');
    expect(String(url)).toContain('page=2');
    expect(opts.method).toBe('GET');
    expect(opts.credentials).toBe('include');
    expect(opts.headers.Authorization).toBe('Bearer test.jwt');
  });

  it('flag on → getUserRelatedEvents detecta email vs phone', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_API_IA_INBOX', 'true');
    vi.resetModules();
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', fetchMock);
    const api = await import('./inbox-api');

    await api.getUserRelatedEvents('a@b.com', { development: 'bodasdehoy' });
    expect(String(fetchMock.mock.calls[0][0])).toContain('email=a%40b.com');

    await api.getUserRelatedEvents('+34600', { development: 'bodasdehoy' });
    expect(String(fetchMock.mock.calls[1][0])).toContain('phone=');
  });
});
