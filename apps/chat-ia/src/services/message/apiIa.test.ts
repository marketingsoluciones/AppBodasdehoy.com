import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiIaMessageService } from './apiIa';

/**
 * Tests del CONTRATO del service de persistencia vía api-ia. Verifican que create/update/
 * remove/get hacen el fetch correcto a /api/backend/chat/messages (proxy → api-ia), y que
 * los métodos no confirmados lanzan pending(). NO dependen de que api-ia exista.
 */
vi.mock('@/utils/authToken', () => ({
  buildAuthHeaders: () => ({ Authorization: 'Bearer test.jwt' }),
}));
vi.mock('@/const/session', () => ({ INBOX_SESSION_ID: 'inbox' }));
vi.mock('../api-ia.mappers', () => ({
  mapApiIaMessages: (x: any) => x ?? [],
}));

describe('ApiIaMessageService (persistencia vía api-ia)', () => {
  afterEach(() => vi.restoreAllMocks());

  const svc = () => new ApiIaMessageService();

  it('createMessage → POST /api/backend/chat/messages, devuelve el id', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: { id: 'msg-1' } })));
    vi.stubGlobal('fetch', fetchMock);

    const id = await svc().createMessage({ content: 'hola', role: 'user', sessionId: 's1' } as any);

    const [url, opts] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/backend/chat/messages');
    expect(opts.method).toBe('POST');
    expect(opts.credentials).toBe('include');
    expect(opts.headers.Authorization).toBe('Bearer test.jwt');
    expect(JSON.parse(opts.body)).toMatchObject({ content: 'hola', role: 'user', sessionId: 's1' });
    expect(id).toBe('msg-1');
  });

  it('createMessage: INBOX_SESSION_ID → sessionId null', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'm' })));
    vi.stubGlobal('fetch', fetchMock);
    await svc().createMessage({ content: 'x', role: 'user', sessionId: 'inbox' } as any);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).sessionId).toBeNull();
  });

  it('updateMessage → PATCH /chat/messages/{id}', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    await svc().updateMessage('msg-9', { content: 'edit' } as any);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/chat/messages/msg-9');
    expect(opts.method).toBe('PATCH');
  });

  it('removeMessage → DELETE /chat/messages/{id}', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    await svc().removeMessage('msg-3');
    const [url, opts] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/chat/messages/msg-3');
    expect(opts.method).toBe('DELETE');
  });

  it('getMessages → GET /chat/messages?sessionId', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 'm1' }] })));
    vi.stubGlobal('fetch', fetchMock);
    const res = await svc().getMessages('s1', undefined);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/chat/messages?');
    expect(String(url)).toContain('sessionId=s1');
    expect(opts.method).toBe('GET');
    expect(res).toEqual([{ id: 'm1' }]);
  });

  it('métodos no confirmados lanzan pending()', async () => {
    await expect(svc().updateMessageTTS('m', {} as any)).rejects.toThrow(/no confirmado/);
    await expect(svc().batchCreateMessages([] as any)).rejects.toThrow(/no confirmado/);
  });
});
