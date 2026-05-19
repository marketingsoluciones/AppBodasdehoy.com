/**
 * Tests del filterAppView Store Slice
 * ====================================
 * Simula cuando el AI decide filtrar una vista en la app principal:
 * - AI filtra lista de invitados por IDs
 * - AI filtra proveedores por query de búsqueda
 * - No envía postMessage si no hay entity
 * - No envía postMessage en server-side (window undefined)
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatStore } from '@/store/chat/store';

describe('filterAppView Store', () => {
  const mockPostMessage = vi.fn();

  beforeEach(() => {
    // Mock window.parent.postMessage
    vi.stubGlobal('window', {
      ...globalThis.window,
      parent: { postMessage: mockPostMessage },
    });
    mockPostMessage.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('AI filtra lista de invitados por IDs', () => {
    it('envía postMessage con entity, ids y source=copilot-chat', async () => {
      const { result } = renderHook(() => useChatStore());

      await act(async () => {
        await result.current.filter_view('msg-1', {
          entity: 'guests',
          ids: ['guest-1', 'guest-2'],
        });
      });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            entity: 'guests',
            ids: ['guest-1', 'guest-2'],
            query: undefined,
          },
          source: 'copilot-chat',
          type: 'FILTER_VIEW',
        }),
        '*',
      );
    });
  });

  describe('AI filtra proveedores por query', () => {
    it('envía postMessage con entity y query de búsqueda', async () => {
      const { result } = renderHook(() => useChatStore());

      await act(async () => {
        await result.current.filter_view('msg-2', {
          entity: 'vendors',
          query: 'fotógrafo Madrid',
        });
      });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            entity: 'vendors',
            ids: [],
            query: 'fotógrafo Madrid',
          },
          source: 'copilot-chat',
          type: 'FILTER_VIEW',
        }),
        '*',
      );
    });
  });

  describe('No envía si entity está vacío', () => {
    it('no llama postMessage sin entity', async () => {
      const { result } = renderHook(() => useChatStore());

      await act(async () => {
        await result.current.filter_view('msg-3', {
          entity: '',
          ids: ['x'],
        });
      });

      expect(mockPostMessage).not.toHaveBeenCalled();
    });
  });

  describe('IDs por defecto es array vacío', () => {
    it('envía ids=[] cuando no se proporcionan IDs', async () => {
      const { result } = renderHook(() => useChatStore());

      await act(async () => {
        await result.current.filter_view('msg-4', {
          entity: 'tasks',
        });
      });

      const payload = mockPostMessage.mock.calls[0][0].payload;
      expect(payload.ids).toEqual([]);
    });
  });

  describe('Incluye timestamp', () => {
    it('el mensaje incluye timestamp numérico', async () => {
      const { result } = renderHook(() => useChatStore());

      await act(async () => {
        await result.current.filter_view('msg-5', {
          entity: 'guests',
        });
      });

      const message = mockPostMessage.mock.calls[0][0];
      expect(typeof message.timestamp).toBe('number');
      expect(message.timestamp).toBeGreaterThan(0);
    });
  });
});
