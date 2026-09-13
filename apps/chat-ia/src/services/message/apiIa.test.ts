import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('current_development', 'bodasdehoy');
    localStorage.setItem('dev-user-config', JSON.stringify({ userId: 'qa-user-a' }));
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

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
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'm', sessionId: 'resolved-inbox' })));
    vi.stubGlobal('fetch', fetchMock);
    await svc().createMessage({ content: 'x', role: 'user', sessionId: 'inbox' } as any);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).sessionId).toBeNull();
  });

  it('reuses the resolved inbox for the assistant and subsequent reads, including reload', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, sessionId: 'resolved', data: { id: 'user-m' } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, sessionId: 'resolved', data: { id: 'assistant-m' } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: 'user-m' }] })));
    vi.stubGlobal('fetch', fetchMock);
    const service = svc();
    await service.createMessage({ content: 'QA', role: 'user', sessionId: 'inbox' } as any);
    await service.createMessage({ content: '', role: 'assistant', sessionId: undefined } as any);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).sessionId).toBe('resolved');
    expect(await svc().getMessages('inbox')).toEqual([{ id: 'user-m' }]);
    expect(fetchMock.mock.calls[2][0]).toContain('sessionId=resolved');
  });

  it('does not reuse an inbox across identities or brands', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ sessionId: 'scope-a', data: { id: 'm' } })));
    vi.stubGlobal('fetch', fetchMock);
    const service = svc();
    await service.createMessage({ content: 'QA', role: 'user', sessionId: 'inbox' } as any);
    localStorage.setItem('dev-user-config', JSON.stringify({ userId: 'qa-user-b' }));
    expect(await service.getMessages('inbox')).toEqual([]);
    localStorage.setItem('dev-user-config', JSON.stringify({ userId: 'qa-user-a' }));
    localStorage.setItem('current_development', 'eventosorganizador');
    expect(await service.getMessages('inbox')).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects an unresolved inbox response instead of reporting a local ID as persisted', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { id: 'm' } }))));
    await expect(svc().createMessage({ content: 'QA', role: 'user', sessionId: 'inbox' } as any)).rejects.toThrow('sessionId resuelto');
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

  it('getMessages: INBOX/vacío NO lanza fetch (evita 400 por ?sessionId= vacío)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    // INBOX_SESSION_ID ('inbox') → null → no se lee por /chat/messages (inbox tiene su capa)
    expect(await svc().getMessages('inbox', undefined)).toEqual([]);
    // sessionId vacío → no hay sesión → []
    expect(await svc().getMessages('', undefined)).toEqual([]);
    expect(await svc().getMessages(undefined as any, undefined)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('métodos no confirmados lanzan pending()', async () => {
    await expect(svc().updateMessageTTS('m', {} as any)).rejects.toThrow(/no confirmado/);
    await expect(svc().batchCreateMessages([] as any)).rejects.toThrow(/no confirmado/);
  });
});
