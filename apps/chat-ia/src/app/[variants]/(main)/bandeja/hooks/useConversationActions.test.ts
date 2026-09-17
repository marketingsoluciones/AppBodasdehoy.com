import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationActions } from './useConversationActions';

/**
 * Archivar tiene que llegar al servidor: mientras vivió solo en localStorage, cada agente
 * archivaba para sí mismo y el equipo seguía viendo la conversación. Y si el servidor lo
 * rechaza, la lista no puede quedarse diciendo que está archivada.
 */
const persistArchived = vi.hoisted(() => vi.fn());
vi.mock('../data/conversationMeta', () => ({ persistArchived }));

describe('useConversationActions', () => {
  beforeEach(() => {
    localStorage.clear();
    persistArchived.mockReset();
  });

  it('archiva en el servidor, no solo en este navegador', async () => {
    persistArchived.mockResolvedValue(true);
    const { result } = renderHook(() => useConversationActions());

    await act(async () => {
      result.current.toggleArchive('conv_1');
    });

    expect(persistArchived).toHaveBeenCalledWith('conv_1', true);
    expect(result.current.isArchived('conv_1')).toBe(true);
  });

  it('se deshace si el servidor lo rechaza', async () => {
    persistArchived.mockResolvedValue(false);
    const { result } = renderHook(() => useConversationActions());

    await act(async () => {
      result.current.toggleArchive('conv_2');
      await Promise.resolve();
    });

    expect(result.current.isArchived('conv_2')).toBe(false);
  });

  it('silenciar no toca el servidor: es preferencia de quien mira', async () => {
    persistArchived.mockResolvedValue(true);
    const { result } = renderHook(() => useConversationActions());

    await act(async () => {
      result.current.toggleMute('conv_3');
    });

    expect(persistArchived).not.toHaveBeenCalled();
    expect(result.current.isMuted('conv_3')).toBe(true);
  });
});
