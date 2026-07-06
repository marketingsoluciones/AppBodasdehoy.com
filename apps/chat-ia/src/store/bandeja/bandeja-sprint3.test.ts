/**
 * bandeja-sprint3.test.ts — SPRINT 3 iMessage edit/delete cross-device
 *
 * Verifica que el reducer del store bandeja despacha CustomEvents para
 * message_updated y message_deleted, sin acoplar el hook useMessages.
 * useMessages los escucha y actualiza el mensaje individual (esto se
 * verificaría con test de integración con jsdom + hook testing library
 * si algún día se pone; el reducer del store se testea aquí en aislamiento).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { useBandejaStore } from './index';
import type { SSEEvent } from './types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function withMockWindow<T>(fn: () => T): T {
  const events: Array<{ type: string; detail: any }> = [];
  const listener = (e: any) => events.push({ type: e.type, detail: e.detail });

  (globalThis as any).window = globalThis;
  (globalThis as any).document = { addEventListener: () => {}, removeEventListener: () => {} };

  const dispatchSpy = vi.spyOn(globalThis as any, 'dispatchEvent').mockImplementation(((ev: any) => {
    listener(ev);
    return true;
  }) as any);

  try {
    return fn();
  } finally {
    dispatchSpy.mockRestore();
    delete (globalThis as any).window;
    delete (globalThis as any).document;
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('bandeja store — message_updated / message_deleted (SPRINT 3)', () => {
  beforeEach(() => {
    // Reset a estado inicial en cada test.
    useBandejaStore.setState({
      conversations: {},
      notifications: [],
      unreadCounts: { byChannel: {}, total: 0, notifications: 0 },
      typingByConv: {},
      loading: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applyEvent(message_updated) dispatch CustomEvent bandeja:message_updated con detail correcto', () => {
    const captured: Array<{ type: string; detail: any }> = [];
    (globalThis as any).window = globalThis;
    const dispatchSpy = vi
      .spyOn(globalThis as any, 'dispatchEvent')
      .mockImplementation(((ev: any) => {
        captured.push({ type: ev.type, detail: ev.detail });
        return true;
      }) as any);

    const event: SSEEvent = {
      type: 'message_updated',
      convId: 'conv-abc',
      msgId: 'msg-123',
      text: 'texto editado',
      editedAt: '2026-07-06T12:00:00Z',
      editedBy: 'user-x',
    };

    useBandejaStore.getState().applyEvent(event);

    expect(captured.length).toBe(1);
    expect(captured[0].type).toBe('bandeja:message_updated');
    expect(captured[0].detail).toEqual({
      convId: 'conv-abc',
      msgId: 'msg-123',
      text: 'texto editado',
      editedAt: '2026-07-06T12:00:00Z',
      editedBy: 'user-x',
    });

    dispatchSpy.mockRestore();
    delete (globalThis as any).window;
  });

  it('applyEvent(message_deleted) con mode="soft" (default) dispatch con mode=soft', () => {
    const captured: Array<{ type: string; detail: any }> = [];
    (globalThis as any).window = globalThis;
    const dispatchSpy = vi
      .spyOn(globalThis as any, 'dispatchEvent')
      .mockImplementation(((ev: any) => {
        captured.push({ type: ev.type, detail: ev.detail });
        return true;
      }) as any);

    const event: SSEEvent = {
      type: 'message_deleted',
      convId: 'conv-abc',
      msgId: 'msg-999',
      deletedAt: '2026-07-06T13:00:00Z',
      deletedBy: 'user-y',
      // mode omitido → default 'soft' en el detail dispatched
    };

    useBandejaStore.getState().applyEvent(event);

    expect(captured.length).toBe(1);
    expect(captured[0].type).toBe('bandeja:message_deleted');
    expect(captured[0].detail).toEqual({
      convId: 'conv-abc',
      msgId: 'msg-999',
      deletedAt: '2026-07-06T13:00:00Z',
      deletedBy: 'user-y',
      mode: 'soft',
    });

    dispatchSpy.mockRestore();
    delete (globalThis as any).window;
  });

  it('applyEvent(message_deleted) respeta mode="hard" explícito', () => {
    const captured: Array<{ type: string; detail: any }> = [];
    (globalThis as any).window = globalThis;
    const dispatchSpy = vi
      .spyOn(globalThis as any, 'dispatchEvent')
      .mockImplementation(((ev: any) => {
        captured.push({ type: ev.type, detail: ev.detail });
        return true;
      }) as any);

    const event: SSEEvent = {
      type: 'message_deleted',
      convId: 'conv-abc',
      msgId: 'msg-hard',
      deletedAt: '2026-07-06T14:00:00Z',
      mode: 'hard',
    };

    useBandejaStore.getState().applyEvent(event);

    expect(captured[0].detail.mode).toBe('hard');

    dispatchSpy.mockRestore();
    delete (globalThis as any).window;
  });

  it('applyEvent ignora eventos sin type', () => {
    // No debería lanzar ni dispatch.
    const stateBefore = useBandejaStore.getState();
    expect(() =>
      useBandejaStore.getState().applyEvent({} as any),
    ).not.toThrow();
    const stateAfter = useBandejaStore.getState();
    expect(stateAfter.conversations).toBe(stateBefore.conversations);
  });
});
