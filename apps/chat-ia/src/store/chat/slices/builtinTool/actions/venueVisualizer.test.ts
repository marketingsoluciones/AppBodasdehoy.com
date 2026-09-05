/**
 * Tests del Venue Visualizer Store Slice
 * =======================================
 * Simulan las acciones reales del usuario en el Venue Visualizer:
 * - Usuario pide visualizar su salón con estilo "romántico"
 * - Se muestra loading mientras se genera la imagen
 * - La imagen generada se guarda en el mensaje del chat
 * - Si falla la generación, se muestra error en el item
 * - Usuario pide generar varias imágenes a la vez (batch)
 * - Usuario sube foto de referencia y elige estilo
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { chatSelectors } from '@/store/chat/selectors';
import { useChatStore } from '@/store/chat/store';
import type { VenueVisualizerItem } from '@/types/tool/venueVisualizer';

// ─── Mocks ──────────────────────────────────────────────

const mockGenerateVenueDesign = vi.fn();

vi.mock('@/services/venueImageService', () => ({
  generateVenueDesign: (...args: any[]) => mockGenerateVenueDesign(...args),
}));

beforeEach(() => {
  mockGenerateVenueDesign.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Helpers ─────────────────────────────────────────────

const makeItem = (overrides?: Partial<VenueVisualizerItem>): VenueVisualizerItem => ({
  roomType: 'salon-banquetes',
  style: 'romantico',
  ...overrides,
});

const MESSAGE_ID = 'msg-venue-1';

/**
 * Sets up the store with a mock message and spies on internal_updateMessageContent.
 * Uses the same pattern as search.test.ts — spy on chatSelectors.getMessageById.
 */
function setupStoreWithMessage(items: VenueVisualizerItem[]) {
  const mockMessage = { content: JSON.stringify(items), id: MESSAGE_ID, role: 'tool' };
  vi.spyOn(chatSelectors, 'getMessageById').mockImplementation(
    (id) => () => (id === MESSAGE_ID ? mockMessage : undefined) as any,
  );

  const { result } = renderHook(() => useChatStore());

  const updateContentSpy = vi.fn();
  act(() => {
    useChatStore.setState({ internal_updateMessageContent: updateContentSpy });
  });

  return { result, updateContentSpy };
}

/** Parse the content that was passed to internal_updateMessageContent */
function getUpdatedItems(spy: ReturnType<typeof vi.fn>): VenueVisualizerItem[] {
  expect(spy).toHaveBeenCalled();
  const lastCall = spy.mock.calls.at(-1)!;
  // internal_updateMessageContent(id, content) — content is at index 1
  return JSON.parse(lastCall[1]);
}

// ─── Tests ───────────────────────────────────────────────

describe('Venue Visualizer Store', () => {
  // ━━━ Escenario: Usuario pide visualizar estilo romántico ━━━

  describe('Usuario genera visualización de estilo romántico en salón', () => {
    it('llama a generateVenueDesign con los parámetros correctos', async () => {
      mockGenerateVenueDesign.mockResolvedValueOnce({
        provider: 'fal-ai',
        url: 'https://cdn.example.com/romantico.png',
      });

      const item = makeItem({
        originalUrl: 'https://storage.example.com/mi-salon.jpg',
        prompt: 'con velas doradas',
        roomType: 'salon-banquetes',
        style: 'romantico',
      });
      const { result } = setupStoreWithMessage([item]);

      await act(async () => {
        await result.current.generateVenueVisualization(item, MESSAGE_ID);
      });

      expect(mockGenerateVenueDesign).toHaveBeenCalledWith({
        imageUrl: 'https://storage.example.com/mi-salon.jpg',
        prompt: 'con velas doradas',
        roomType: 'salon-banquetes',
        style: 'romantico',
      });
    });

    it('guarda la URL generada en el item del mensaje', async () => {
      mockGenerateVenueDesign.mockResolvedValueOnce({
        provider: 'fal-ai',
        url: 'https://cdn.example.com/romantico.png',
      });

      const item = makeItem();
      const { result, updateContentSpy } = setupStoreWithMessage([item]);

      await act(async () => {
        await result.current.generateVenueVisualization(item, MESSAGE_ID);
      });

      const updatedItems = getUpdatedItems(updateContentSpy);
      expect(updatedItems[0].generatedUrl).toBe('https://cdn.example.com/romantico.png');
      expect(updatedItems[0].provider).toBe('fal-ai');
    });

    it('sin foto de referencia no envía imageUrl', async () => {
      mockGenerateVenueDesign.mockResolvedValueOnce({ url: 'https://x.png' });

      const item = makeItem(); // no originalUrl
      const { result } = setupStoreWithMessage([item]);

      await act(async () => {
        await result.current.generateVenueVisualization(item, MESSAGE_ID);
      });

      expect(mockGenerateVenueDesign).toHaveBeenCalledWith(
        expect.objectContaining({ imageUrl: undefined }),
      );
    });
  });

  // ━━━ Escenario: Loading state mientras se genera ━━━

  describe('Loading state durante generación', () => {
    it('activa loading al iniciar y lo desactiva al terminar', async () => {
      let resolveGeneration: (v: any) => void;
      mockGenerateVenueDesign.mockImplementationOnce(
        () => new Promise((resolve) => { resolveGeneration = resolve; }),
      );

      const item = makeItem();
      const { result } = setupStoreWithMessage([item]);
      const loadingKey = MESSAGE_ID + item.style + item.roomType;

      let generationPromise: Promise<void>;
      act(() => {
        generationPromise = result.current.generateVenueVisualization(item, MESSAGE_ID);
      });

      // Loading debe estar activo
      expect(result.current.venueImageLoading[loadingKey]).toBe(true);

      await act(async () => {
        resolveGeneration!({ url: 'https://x.png' });
        await generationPromise!;
      });

      // Loading debe estar desactivado
      expect(result.current.venueImageLoading[loadingKey]).toBe(false);
    });

    it('desactiva loading incluso si la generación falla', async () => {
      mockGenerateVenueDesign.mockRejectedValueOnce(new Error('Network error'));

      const item = makeItem();
      const { result } = setupStoreWithMessage([item]);
      const loadingKey = MESSAGE_ID + item.style + item.roomType;

      await act(async () => {
        await result.current.generateVenueVisualization(item, MESSAGE_ID);
      });

      expect(result.current.venueImageLoading[loadingKey]).toBe(false);
    });

    it('usa clave de loading compuesta por messageId + style + roomType', async () => {
      mockGenerateVenueDesign.mockResolvedValueOnce({ url: 'https://x.png' });

      const item = makeItem({ roomType: 'terraza', style: 'tropical' });
      const { result } = setupStoreWithMessage([item]);

      await act(async () => {
        await result.current.generateVenueVisualization(item, MESSAGE_ID);
      });

      const expectedKey = MESSAGE_ID + 'tropical' + 'terraza';
      expect(result.current.venueImageLoading[expectedKey]).toBe(false);
    });
  });

  // ━━━ Escenario: Error en la generación ━━━

  describe('La generación de imagen falla', () => {
    it('guarda error del servicio en el item', async () => {
      mockGenerateVenueDesign.mockResolvedValueOnce({
        error: 'No se pudo generar la imagen: Backend error 500',
      });

      const item = makeItem();
      const { result, updateContentSpy } = setupStoreWithMessage([item]);

      await act(async () => {
        await result.current.generateVenueVisualization(item, MESSAGE_ID);
      });

      const updatedItems = getUpdatedItems(updateContentSpy);
      expect(updatedItems[0].error).toBe('No se pudo generar la imagen: Backend error 500');
    });

    it('guarda error de excepción en el item', async () => {
      mockGenerateVenueDesign.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const item = makeItem();
      const { result, updateContentSpy } = setupStoreWithMessage([item]);

      await act(async () => {
        await result.current.generateVenueVisualization(item, MESSAGE_ID);
      });

      const updatedItems = getUpdatedItems(updateContentSpy);
      expect(updatedItems[0].error).toBe('ECONNREFUSED');
    });

    it('error no-Error se captura como "Error desconocido"', async () => {
      mockGenerateVenueDesign.mockRejectedValueOnce('algo raro');

      const item = makeItem();
      const { result, updateContentSpy } = setupStoreWithMessage([item]);

      await act(async () => {
        await result.current.generateVenueVisualization(item, MESSAGE_ID);
      });

      const updatedItems = getUpdatedItems(updateContentSpy);
      expect(updatedItems[0].error).toBe('Error desconocido');
    });
  });

  // ━━━ Escenario: Batch – usuario genera varias imágenes a la vez ━━━

  describe('Usuario pide generar varias imágenes (visualize_venue)', () => {
    it('genera todas las imágenes en paralelo', async () => {
      mockGenerateVenueDesign
        .mockResolvedValueOnce({ url: 'https://cdn/romantico.png' })
        .mockResolvedValueOnce({ url: 'https://cdn/industrial.png' });

      const items = [
        makeItem({ roomType: 'salon-banquetes', style: 'romantico' }),
        makeItem({ roomType: 'rooftop', style: 'industrial' }),
      ];
      const { result } = setupStoreWithMessage(items);

      await act(async () => {
        await result.current.visualize_venue(MESSAGE_ID, items);
      });

      expect(mockGenerateVenueDesign).toHaveBeenCalledTimes(2);
      expect(mockGenerateVenueDesign).toHaveBeenCalledWith(
        expect.objectContaining({ style: 'romantico' }),
      );
      expect(mockGenerateVenueDesign).toHaveBeenCalledWith(
        expect.objectContaining({ style: 'industrial' }),
      );
    });
  });

  // ━━━ Escenario: toggleVenueLoading ━━━

  describe('toggleVenueLoading', () => {
    it('establece loading true/false para una clave', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.toggleVenueLoading('key-1', true);
      });
      expect(result.current.venueImageLoading['key-1']).toBe(true);

      act(() => {
        result.current.toggleVenueLoading('key-1', false);
      });
      expect(result.current.venueImageLoading['key-1']).toBe(false);
    });

    it('no afecta otras claves de loading', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.toggleVenueLoading('key-a', true);
        result.current.toggleVenueLoading('key-b', true);
      });

      act(() => {
        result.current.toggleVenueLoading('key-a', false);
      });

      expect(result.current.venueImageLoading['key-a']).toBe(false);
      expect(result.current.venueImageLoading['key-b']).toBe(true);
    });
  });

  // ━━━ Escenario: updateVenueItem con mensaje inexistente ━━━

  describe('updateVenueItem con mensaje que no existe', () => {
    it('no hace nada si el mensaje no existe', async () => {
      vi.spyOn(chatSelectors, 'getMessageById').mockImplementation(() => () => undefined as any);

      const { result } = renderHook(() => useChatStore());
      const updateSpy = vi.fn();
      act(() => {
        useChatStore.setState({ internal_updateMessageContent: updateSpy });
      });

      await act(async () => {
        await result.current.updateVenueItem('nonexistent-id', (draft) => {
          draft[0].error = 'test';
        });
      });

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });
});
