import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMessageStream } from '@/app/[variants]/(main)/bandeja/hooks/useMessageStream';

import { useBandejaStore } from './index';
import type { Conversation } from './types';

const transport = vi.hoisted(() => ({ options: null as any }));
vi.mock('./sseClient', () => ({ getSSEManager: (options: any) => { transport.options = options; return { start() {} }; }, destroySSEManager() {} }));
vi.mock('./broadcastSync', () => ({ initBroadcast: () => ({ isLeader: () => true, destroy() {}, broadcastFromLeader() {} }) }));

const conversation: Conversation = { id: 'qa-c1', conversationId: 'qa-c1', channel: 'whatsapp', channelParam: 'whatsapp',
  name: 'QA', unreadCount: 0, lastMessage: '', lastMessageAt: '', linkedEventId: null, linkedContactId: null };

function mockSnapshot() {
  const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify(
    url.includes('conversations') ? { conversations: [conversation] } : { notifications: [] },
  )));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  act(() => useBandejaStore.getState().destroyBandeja());
  vi.unstubAllGlobals();
});

describe('Bandeja reliability', () => {
  it('keeps conversations when the notifications endpoint fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes('notifications')
      ? new Response('{}', { status: 503 })
      : new Response(JSON.stringify({ conversations: [conversation] }))));
    await useBandejaStore.getState().initBandeja('qa', () => ({}));
    expect(useBandejaStore.getState().conversations['qa-c1']).toEqual(conversation);
    expect(useBandejaStore.getState().error).toContain('503');
  });

  it('does not overwrite a new message with a REST response that started earlier', async () => {
    mockSnapshot();
    await useBandejaStore.getState().initBandeja('qa', () => ({}));
    let complete!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn((url: string) => url.includes('conversations')
      ? new Promise<Response>(resolve => { complete = resolve; })
      : Promise.resolve(new Response(JSON.stringify({ notifications: [] })))));
    const refresh = useBandejaStore.getState().refresh();
    useBandejaStore.getState().applyEvent({ type: 'new_message', convId: 'qa-c1', message: { id: 'new', content: 'newer' } });
    complete(new Response(JSON.stringify({ conversations: [conversation] })));
    await refresh;
    expect(useBandejaStore.getState().conversations['qa-c1'].lastMessage).toBe('newer');
    expect(useBandejaStore.getState().conversations['qa-c1'].unreadCount).toBe(1);
  });

  it('refreshes REST without reinitializing the transport', async () => {
    const fetchMock = mockSnapshot();
    await useBandejaStore.getState().initBandeja('qa', () => ({}));
    await useBandejaStore.getState().refresh();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(useBandejaStore.getState()._sseInitialized).toBe(true);
  });

  it('delivers the actual payload exactly once to the matching conversation', async () => {
    mockSnapshot();
    await useBandejaStore.getState().initBandeja('qa', () => ({}));
    const onMessage = vi.fn(), unrelated = vi.fn();
    const hook = renderHook(() => useMessageStream({ conversationId: 'qa-c1', onMessage }));
    const other = renderHook(() => useMessageStream({ conversationId: 'qa-other', onMessage: unrelated }));
    const message = { id: 'qa-m1', content: 'hello', fromUser: true, attachments: [{ type: 'file', url: '/qa.pdf' }], timestamp: '2026-09-12T00:00:00Z' };
    act(() => {
      useBandejaStore.getState().applyEvent({ type: 'new_message', convId: 'qa-c1', message });
      useBandejaStore.getState().applyEvent({ type: 'new_message', convId: 'qa-c1', message });
    });
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ id: message.id, text: 'hello', fromUser: true, attachments: message.attachments }));
    expect(unrelated).not.toHaveBeenCalled();
    expect(useBandejaStore.getState().conversations['qa-c1'].unreadCount).toBe(0);
    hook.unmount(); other.unmount();
  });

  it('reconciles an unknown conversation instead of ignoring its first message', async () => {
    const fetchMock = mockSnapshot();
    await useBandejaStore.getState().initBandeja('qa', () => ({}));
    useBandejaStore.getState().applyEvent({ type: 'new_message', convId: 'qa-new', message: { id: 'qa-m2' } });
    await useBandejaStore.getState().refresh();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('does not retain another scope when the next scope is offline', async () => {
    mockSnapshot();
    await useBandejaStore.getState().initBandeja('qa-a', () => ({}));
    useBandejaStore.getState().destroyBandeja();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await useBandejaStore.getState().initBandeja('qa-b', () => ({}));
    expect(useBandejaStore.getState().conversations).toEqual({});
    expect(useBandejaStore.getState().error).toBe('offline');
  });
});

describe('independent REST failures', () => {
  it.each(['html', 'network', 'shape'])('keeps the valid conversations snapshot when notifications fail: %s', async kind => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('conversations')) return new Response(JSON.stringify({ conversations: [conversation] }));
      if (kind === 'network') throw new Error('notification offline');
      return new Response(kind === 'html' ? '<html>not JSON</html>' : '{"success":false}');
    }));
    await useBandejaStore.getState().initBandeja('qa', () => ({}));
    expect(useBandejaStore.getState().conversations['qa-c1']).toEqual(conversation);
    expect(useBandejaStore.getState().error).toBeTruthy();
    expect(useBandejaStore.getState()._sseInitialized).toBe(true);
  });
  it('keeps valid notifications when conversations contain malformed JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(url.includes('conversations')
      ? '{broken' : JSON.stringify({ notifications: [{ id: 'n1', read: false }] }))));
    await useBandejaStore.getState().initBandeja('qa', () => ({}));
    expect(useBandejaStore.getState().notifications[0].id).toBe('n1');
  });
});

describe('live API snapshot and direction', () => {
  it('normalizes the contact and nested lastMessage returned by API IA', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(url.includes('conversations')
      ? { conversations: [{ id: 'qa-live', channel: 'web', contact: { name: 'QA' }, lastMessage: { text: 'hello', timestamp: '2026-09-13' } }] }
      : { notifications: [] }))));
    await useBandejaStore.getState().initBandeja('qa', () => ({}));
    expect(useBandejaStore.getState().conversations['qa-live']).toMatchObject({ name: 'QA', lastMessage: 'hello', lastMessageAt: '2026-09-13', unreadCount: 0 });
  });
  it('uses explicit inbound direction even when fromUser is true', async () => {
    mockSnapshot();
    await useBandejaStore.getState().initBandeja('qa', () => ({}));
    useBandejaStore.getState().applyEvent({ type: 'new_message', convId: 'qa-c1', message: { id: 'inbound', fromUser: true, direction: 'inbound', content: 'incoming' } });
    expect(useBandejaStore.getState().conversations['qa-c1'].unreadCount).toBe(1);
  });
  it('starts the transport before a slow REST request completes', async () => {
    let complete!: (r: Response) => void;
    vi.stubGlobal('fetch', vi.fn((url: string) => url.includes('notifications') ? new Promise<Response>(resolve => { complete = resolve; }) : Promise.resolve(new Response('[]'))));
    const init = useBandejaStore.getState().initBandeja('qa', () => ({}));
    expect(useBandejaStore.getState()._sseInitialized).toBe(true);
    complete(new Response('[]'));
    await init;
  });
});

it('reconciles messages missed while disconnected when the stream reconnects', async () => {
  mockSnapshot();
  await useBandejaStore.getState().initBandeja('qa', () => ({}));
  transport.options.onConnectionChange(false);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(url.includes('conversations')
    ? { conversations: [{ ...conversation, lastMessage: 'received while offline', unreadCount: 3 }] }
    : { notifications: [] }))));
  transport.options.onConnectionChange(true);
  await useBandejaStore.getState().refresh();
  expect(useBandejaStore.getState().conversations['qa-c1']).toMatchObject({ lastMessage: 'received while offline', unreadCount: 3 });
  expect(useBandejaStore.getState()._sseConnected).toBe(true);
});
