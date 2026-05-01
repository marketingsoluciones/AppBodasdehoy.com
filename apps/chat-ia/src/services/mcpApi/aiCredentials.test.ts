/**
 * Tests del AI Credentials Service
 * ==================================
 * Simulan la obtención de API keys de IA por developer:
 * - Developer tiene credenciales Anthropic + OpenAI configuradas
 * - Developer no tiene credenciales → retorna objeto vacío
 * - Backend no disponible → retorna null
 * - Consulta credenciales de un provider específico
 * - Verifica si un provider está habilitado
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAICredentials, fetchProviderCredentials, hasProviderCredentials } from './aiCredentials';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AI Credentials Service', () => {
  describe('fetchAICredentials', () => {
    it('retorna credenciales por provider', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          credentials: {
            anthropic: { apiKey: 'sk-ant-xxx', enabled: true, model: 'claude-sonnet' },
            openai: { apiKey: 'sk-oai-xxx', enabled: true },
          },
          success: true,
        }),
        ok: true,
      });

      const creds = await fetchAICredentials('bodasdehoy');

      expect(creds?.anthropic?.apiKey).toBe('sk-ant-xxx');
      expect(creds?.anthropic?.enabled).toBe(true);
      expect(creds?.openai?.apiKey).toBe('sk-oai-xxx');
    });

    it('llama al endpoint correcto con developer ID', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ credentials: {}, success: true }),
        ok: true,
      });

      await fetchAICredentials('mi-empresa');

      expect(mockFetch.mock.calls[0][0]).toContain('/api/developers/mi-empresa/ai-credentials');
    });

    it('retorna objeto vacío cuando no hay credenciales configuradas', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ credentials: {}, success: true }),
        ok: true,
      });

      const creds = await fetchAICredentials('empty-dev');

      expect(creds).toEqual({});
    });

    it('retorna null cuando success=false', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ error: 'Developer not found', success: false }),
        ok: true,
      });

      const creds = await fetchAICredentials('invalid');

      expect(creds).toBeNull();
    });

    it('retorna null cuando HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const creds = await fetchAICredentials('bodasdehoy');

      expect(creds).toBeNull();
    });

    it('retorna null cuando fetch falla', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const creds = await fetchAICredentials('bodasdehoy');

      expect(creds).toBeNull();
    });
  });

  describe('fetchProviderCredentials', () => {
    it('retorna credenciales de un provider específico', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          credentials: {
            anthropic: { apiKey: 'sk-ant-xxx', enabled: true },
            openai: { apiKey: 'sk-oai-xxx', enabled: false },
          },
          success: true,
        }),
        ok: true,
      });

      const creds = await fetchProviderCredentials('dev-1', 'anthropic');

      expect(creds?.apiKey).toBe('sk-ant-xxx');
      expect(creds?.enabled).toBe(true);
    });

    it('retorna null si el provider no existe', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ credentials: { openai: { apiKey: 'x', enabled: true } }, success: true }),
        ok: true,
      });

      const creds = await fetchProviderCredentials('dev-1', 'anthropic');

      expect(creds).toBeNull();
    });
  });

  describe('hasProviderCredentials', () => {
    it('retorna true si provider está habilitado con API key', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          credentials: { anthropic: { apiKey: 'sk-xxx', enabled: true } },
          success: true,
        }),
        ok: true,
      });

      const has = await hasProviderCredentials('dev-1', 'anthropic');

      expect(has).toBe(true);
    });

    it('retorna false si provider está deshabilitado', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          credentials: { openai: { apiKey: 'sk-xxx', enabled: false } },
          success: true,
        }),
        ok: true,
      });

      const has = await hasProviderCredentials('dev-1', 'openai');

      expect(has).toBe(false);
    });

    it('retorna false si no hay API key', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          credentials: { openai: { apiKey: '', enabled: true } },
          success: true,
        }),
        ok: true,
      });

      const has = await hasProviderCredentials('dev-1', 'openai');

      expect(has).toBe(false);
    });

    it('retorna false si el backend falla', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Timeout'));

      const has = await hasProviderCredentials('dev-1', 'anthropic');

      expect(has).toBe(false);
    });
  });
});
