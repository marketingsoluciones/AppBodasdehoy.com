/**
 * Tests para las acciones del store de Memories
 *
 * NOTA: Requiere MSW (Mock Service Worker) para mockear las llamadas al backend.
 * Instalar: pnpm add -D msw
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { memoriesActionSlice } from '../action';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';

// Mock server (solo si MSW está instalado)
let server: ReturnType<typeof setupServer> | null = null;

try {
  server = setupServer();
  beforeAll(() => server?.listen());
  afterEach(() => server?.resetHandlers());
  afterAll(() => server?.close());
} catch (e) {
  console.warn('MSW no está instalado. Los tests de integración no funcionarán.');
}

describe('Memories Actions', () => {
  const set = vi.fn();
  const get = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAlbum', () => {
    it('debe cargar álbum correctamente', async () => {
      const mockAlbum = {
        _id: 'album123',
        name: 'Test Album',
        description: 'Test',
      };

      server.use(
        http.get(`${BACKEND_URL}/api/memories/albums/album123`, () => {
          return HttpResponse.json({
            success: true,
            album: mockAlbum,
          });
        })
      );

      const actions = memoriesActionSlice(set, get, {} as any);
      await actions.fetchAlbum('album123', 'user123', 'bodasdehoy');

      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({
          currentAlbum: mockAlbum,
          currentAlbumLoading: false,
        })
      );
    });

    it('debe manejar errores correctamente', async () => {
      server.use(
        http.get(`${BACKEND_URL}/api/memories/albums/album123`, () => {
          return HttpResponse.json(
            { success: false, error: 'Not found' },
            { status: 404 }
          );
        })
      );

      const actions = memoriesActionSlice(set, get, {} as any);
      await actions.fetchAlbum('album123', 'user123', 'bodasdehoy');

      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({
          currentAlbumError: expect.any(String),
          currentAlbumLoading: false,
        })
      );
    });

    it('debe cancelar request si excede timeout', async () => {
      server.use(
        http.get(`${BACKEND_URL}/api/memories/albums/album123`, async () => {
          await new Promise(resolve => setTimeout(resolve, 35000)); // Más de 30 segundos
          return HttpResponse.json({ success: true });
        })
      );

      const actions = memoriesActionSlice(set, get, {} as any);
      await actions.fetchAlbum('album123', 'user123', 'bodasdehoy');

      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({
          currentAlbumError: 'Tiempo de espera agotado al cargar el álbum',
          currentAlbumLoading: false,
        })
      );
    });
  });

  describe('createAlbum', () => {
    it('debe crear álbum correctamente', async () => {
      const mockAlbum = {
        _id: 'album123',
        name: 'New Album',
      };

      server.use(
        http.post(`${BACKEND_URL}/api/memories/albums`, () => {
          return HttpResponse.json({
            success: true,
            album: mockAlbum,
          });
        })
      );

      const actions = memoriesActionSlice(set, get, {} as any);
      const result = await actions.createAlbum(
        { name: 'New Album', visibility: 'private' },
        'user123',
        'bodasdehoy'
      );

      expect(result).toEqual(mockAlbum);
      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({
          albums: expect.arrayContaining([mockAlbum]),
        })
      );
    });
  });

  describe('fetchAlbumMedia', () => {
    it('debe cargar media correctamente', async () => {
      const mockMedia = [
        { _id: 'media1', originalUrl: 'url1' },
        { _id: 'media2', originalUrl: 'url2' },
      ];

      server.use(
        http.get(`${BACKEND_URL}/api/memories/albums/album123/media`, () => {
          return HttpResponse.json({
            success: true,
            media: mockMedia,
          });
        })
      );

      const actions = memoriesActionSlice(set, get, {} as any);
      await actions.fetchAlbumMedia('album123', 'user123', 'bodasdehoy');

      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({
          currentAlbumMedia: mockMedia,
          mediaLoading: false,
        })
      );
    });
  });
});
















































