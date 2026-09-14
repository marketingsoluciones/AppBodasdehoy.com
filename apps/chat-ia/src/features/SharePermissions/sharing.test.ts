import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/utils/authToken', () => ({ buildAuthHeaders: vi.fn(() => ({ Authorization: 'Bearer test-only' })) }));
import { buildAuthHeaders } from '@/utils/authToken';
import { canManageChat, shareChat, searchChatRecipients } from './sharing';

const fetchMock = vi.fn();
const json = (body: unknown): Response => new Response(JSON.stringify(body), { status: 200 });
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset();
  vi.stubGlobal('localStorage', { getItem: () => 'test-tenant' });
  vi.mocked(buildAuthHeaders).mockReturnValue({ Authorization: 'Bearer test-only' });
});
describe('chat sharing integration boundary', () => {
  it('owner comes from server and ACL is queried first', async () => {
    fetchMock.mockResolvedValueOnce(json({ data: { getSession: { id: 's1' } } }))
      .mockResolvedValueOnce(json({ data: { getResourcePermissions: { success: true, permissions: { owner: { userId: 'owner' }, sharedWith: [] } } } }));
    expect(await canManageChat('s1', 'owner')).toBe(true);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).query).toContain('getSession(');
  });
  it('reader is not assumed owner', async () => {
    fetchMock.mockResolvedValueOnce(json({ data: { getSession: { id: 's1' } } }))
      .mockResolvedValueOnce(json({ data: { getResourcePermissions: { success: true, permissions: { owner: { userId: 'owner' }, sharedWith: [{ userId: 'reader', permissions: { can_share: false } }] } } } }));
    expect(await canManageChat('s1', 'reader')).toBe(false);
  });
  it('denied read never queries participant metadata', async () => {
    fetchMock.mockResolvedValueOnce(json({ data: { getSession: null } }));
    expect(await canManageChat('s1', 'outsider')).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('does not report GraphQL permission errors as success', async () => {
    fetchMock.mockResolvedValueOnce(json({ errors: [{ message: 'Denied' }] }));
    await expect(canManageChat('s1', 'owner')).rejects.toThrow('Denied');
  });
  it('sends JWT, tenant and canonical recipient without actor header', async () => {
    fetchMock.mockResolvedValueOnce(json({ success: true }));
    await shareChat('s1', 'recipient', { can_read: true, can_write: false, can_delete: false });
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers.Authorization).toBe('Bearer test-only');
    expect(init.headers['X-Development']).toBe('test-tenant');
    expect(init.headers['X-User-ID']).toBeUndefined();
    expect(JSON.parse(init.body).target_user_id).toBe('recipient');
  });
  it('HTTP 200 with success=false is a failure', async () => {
    fetchMock.mockResolvedValueOnce(json({ success: false, errors: [{ message: 'Not owner' }] }));
    await expect(shareChat('s1', 'recipient', { can_read: true, can_write: false, can_delete: false })).rejects.toThrow('Not owner');
  });
  it('missing JWT never sends request', async () => {
    vi.mocked(buildAuthHeaders).mockReturnValue({});
    await expect(shareChat('s1', 'recipient', { can_read: true, can_write: false, can_delete: false })).rejects.toThrow('Inicia sesión');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('recipient directory', () => {
  it('does not search with fewer than three characters', async () => {
    expect(await searchChatRecipients(' ab ')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('uses current tenant and retains canonical ID for phone searches', async () => {
    fetchMock.mockResolvedValueOnce(json({ data: { searchUsers: [{ id: 'firebase-uid', name: 'Test', email: '', phone: '+34000000000' }] } }));
    const users = await searchChatRecipients('+34000000000');
    expect(users[0].id).toBe('firebase-uid');
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.variables).toEqual({ query: '+34000000000', development: 'test-tenant' });
    expect(request.query).toContain('limit: 10');
  });
  it('rejects directory errors instead of treating them as selectable results', async () => {
    fetchMock.mockResolvedValueOnce(json({ errors: [{ message: 'Unauthorized directory' }] }));
    await expect(searchChatRecipients('test')).rejects.toThrow('Unauthorized directory');
  });
  it('does not expose entries without canonical IDs', async () => {
    fetchMock.mockResolvedValueOnce(json({ data: { searchUsers: [{ id: '', name: 'Invalid', email: '' }] } }));
    expect(await searchChatRecipients('test')).toEqual([]);
  });
});
