import { afterEach, describe, expect, it, vi } from 'vitest';

import { destroySSEManager, getSSEManager } from './sseClient';

afterEach(() => {
  destroySSEManager();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('SSE recovery', () => {
  it.each(['\n', '\r\n'])('delivers a split frame and reconnects after EOF (%j)', async (newline) => {
    vi.useFakeTimers();
    const frame = `event: new_message${newline}data: {"convId":"qa","message":{"id":"m1"}}${newline}${newline}`;
    const fetchMock = vi.fn().mockImplementation(async () => new Response(new ReadableStream({
      start(controller) {
        // Include a boundary inside CRLF, not only between complete events.
        for (const char of frame) controller.enqueue(new TextEncoder().encode(char));
        controller.close();
      },
    }), { headers: { 'Content-Type': 'text/event-stream' } }));
    vi.stubGlobal('fetch', fetchMock);
    const onEvent = vi.fn(), onConnectionChange = vi.fn();
    const manager = getSSEManager({ url: '/qa', authHeaders: () => ({}), onEvent, onConnectionChange });
    manager.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'new_message', convId: 'qa' }));
    expect(onConnectionChange.mock.calls).toEqual([[true], [false]]);
    manager.start(); // Must not bypass an already scheduled retry.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    manager.stop();
    await vi.advanceTimersByTimeAsync(10000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('recovers from an auth-header exception and cancels retries on stop', async () => {
    vi.useFakeTimers();
    const authHeaders = vi.fn(() => { throw new Error('QA unavailable'); });
    const manager = getSSEManager({ url: '/qa', authHeaders, onEvent: vi.fn() });
    manager.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(authHeaders).toHaveBeenCalledTimes(2);
    manager.stop();
    await vi.advanceTimersByTimeAsync(10000);
    expect(authHeaders).toHaveBeenCalledTimes(2);
  });
});

describe('API IA wire contract', () => {
  it('rejects HTML 200 without reporting a connected stream', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => new Response('<html>wrong route</html>', { headers: { 'Content-Type': 'text/html' } }));
    vi.stubGlobal('fetch', fetchMock);
    const connected = vi.fn();
    getSSEManager({ url: '/qa', authHeaders: () => ({}), onEvent: vi.fn(), onConnectionChange: connected }).start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(connected).not.toHaveBeenCalledWith(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('normalizes flat text messages and ignores heartbeat events', async () => {
    vi.useFakeTimers();
    const payload = 'event: connected\ndata: {"ok":true}\n\nevent: ping\ndata: {}\n\nevent: message\ndata: {"id":"qa-msg","conversationId":"qa-conv","type":"text","text":"hello","channel":"web","direction":"outbound","attachments":[{"url":"/qa.pdf"}]}\n\n';
    vi.stubGlobal('fetch', vi.fn(async () => new Response(payload, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } })));
    const onEvent = vi.fn();
    getSSEManager({ url: '/qa', authHeaders: () => ({}), onEvent }).start();
    await vi.advanceTimersByTimeAsync(0);
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({ type: 'new_message', convId: 'qa-conv', message: expect.objectContaining({ id: 'qa-msg', content: 'hello', type: 'text', direction: 'outbound', attachments: [{ url: '/qa.pdf' }] }) });
  });
});

describe('heartbeat timeout', () => {
  it('reconnects when an open stream stops producing heartbeats', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async (_url, init) => new Response(new ReadableStream({
      start(controller) { init.signal.addEventListener('abort', () => controller.error(new Error('aborted'))); },
    }), { headers: { 'Content-Type': 'text/event-stream' } }));
    vi.stubGlobal('fetch', fetchMock);
    const connected = vi.fn();
    getSSEManager({ url: '/qa', authHeaders: () => ({}), onEvent: vi.fn(), onConnectionChange: connected }).start();
    await vi.advanceTimersByTimeAsync(31000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(connected.mock.calls).toEqual([[true], [false], [true]]);
  });
});
