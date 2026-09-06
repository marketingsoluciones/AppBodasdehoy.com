/**
 * Tests del guard de env vars canónicas (`apps/appEventos/utils/apiEndpoints.ts`).
 *
 * Regla del proyecto (2026-05-14):
 *   - Solo 4 nombres válidos: API_MCP_GRAPHQL_URL, NEXT_PUBLIC_API_MCP_GRAPHQL_URL,
 *     API_IA_URL, NEXT_PUBLIC_API_IA_URL.
 *   - Cualquier alias legacy debe lanzar error con sugerencia de migración.
 *
 * Ver docs/ENV-ENDPOINTS-STANDARD.md
 */

const LEGACY_KEYS = [
  'API_BODAS_URL',
  'NEXT_PUBLIC_API_BODAS_URL',
  'API3_MCP_GRAPHQL_URL',
  'NEXT_PUBLIC_API3_MCP_GRAPHQL_URL',
  'NEXT_PUBLIC_API2_URL',
  'API2_URL',
  'API3_IA_URL',
  'NEXT_PUBLIC_API3_IA_URL',
  'PYTHON_BACKEND_URL',
  'NEXT_PUBLIC_PYTHON_BACKEND_URL',
  'BACKEND_INTERNAL_URL',
  'BACKEND_URL',
  'NEXT_PUBLIC_BACKEND_URL',
];

const CANONICAL_KEYS = [
  'API_MCP_GRAPHQL_URL',
  'NEXT_PUBLIC_API_MCP_GRAPHQL_URL',
  'API_IA_URL',
  'NEXT_PUBLIC_API_IA_URL',
];

describe('apiEndpoints — guard de env vars canónicas', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    // Limpiar todas las vars relevantes para empezar de cero
    process.env = { ...originalEnv };
    for (const k of [...LEGACY_KEYS, ...CANONICAL_KEYS]) delete process.env[k];
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('resolveApiBodasGraphqlUrl', () => {
    it('devuelve la URL canónica cuando API_MCP_GRAPHQL_URL está definida', () => {
      process.env.API_MCP_GRAPHQL_URL = 'https://api-mcp.eventosorganizador.com/graphql';
      const { resolveApiBodasGraphqlUrl } = require('../../utils/apiEndpoints');
      expect(resolveApiBodasGraphqlUrl()).toBe('https://api-mcp.eventosorganizador.com/graphql');
    });

    it('añade /graphql si la URL no termina en /graphql', () => {
      process.env.API_MCP_GRAPHQL_URL = 'https://api-mcp.eventosorganizador.com';
      const { resolveApiBodasGraphqlUrl } = require('../../utils/apiEndpoints');
      expect(resolveApiBodasGraphqlUrl()).toBe('https://api-mcp.eventosorganizador.com/graphql');
    });

    it('cae al DEFAULT canónico cuando no hay env var (no throw)', () => {
      const { resolveApiBodasGraphqlUrl, DEFAULT_MCP_GRAPHQL_URL } = require('../../utils/apiEndpoints');
      expect(resolveApiBodasGraphqlUrl()).toBe(DEFAULT_MCP_GRAPHQL_URL);
      expect(DEFAULT_MCP_GRAPHQL_URL).toMatch(/^https:\/\/api-mcp\.eventosorganizador\.com\/graphql$/);
    });
  });

  describe('resolveApiIaOrigin', () => {
    it('devuelve la URL canónica cuando API_IA_URL está definida', () => {
      process.env.API_IA_URL = 'https://api-ia.bodasdehoy.com';
      const { resolveApiIaOrigin } = require('../../utils/apiEndpoints');
      expect(resolveApiIaOrigin()).toBe('https://api-ia.bodasdehoy.com');
    });

    it('quita trailing slash', () => {
      process.env.API_IA_URL = 'https://api-ia.bodasdehoy.com/';
      const { resolveApiIaOrigin } = require('../../utils/apiEndpoints');
      expect(resolveApiIaOrigin()).toBe('https://api-ia.bodasdehoy.com');
    });

    it('cae al DEFAULT canónico cuando no hay env var (no throw)', () => {
      const { resolveApiIaOrigin, DEFAULT_API_IA_ORIGIN } = require('../../utils/apiEndpoints');
      expect(resolveApiIaOrigin()).toBe(DEFAULT_API_IA_ORIGIN);
      expect(DEFAULT_API_IA_ORIGIN).toMatch(/^https:\/\/api-ia\.bodasdehoy\.com$/);
    });
  });

  describe('guard de aliases legacy retirados', () => {
    it.each(LEGACY_KEYS)('rechaza %s con mensaje de migración', (legacyKey) => {
      // Definimos canónica válida para que el guard sea la única causa de error
      process.env.API_MCP_GRAPHQL_URL = 'https://api-mcp.eventosorganizador.com/graphql';
      process.env.API_IA_URL = 'https://api-ia.bodasdehoy.com';
      process.env[legacyKey] = 'https://legacy.example.com';

      const { resolveApiBodasGraphqlUrl } = require('../../utils/apiEndpoints');
      expect(() => resolveApiBodasGraphqlUrl()).toThrow(/Legacy env vars detected/);
      expect(() => resolveApiBodasGraphqlUrl()).toThrow(new RegExp(legacyKey));
    });

    it('lista todas las legacy detectadas en un solo error (no falla en la primera)', () => {
      process.env.API_MCP_GRAPHQL_URL = 'https://api-mcp.eventosorganizador.com/graphql';
      process.env.API_BODAS_URL = 'https://legacy1.example.com';
      process.env.PYTHON_BACKEND_URL = 'https://legacy2.example.com';
      process.env.BACKEND_URL = 'https://legacy3.example.com';

      const { resolveApiBodasGraphqlUrl } = require('../../utils/apiEndpoints');
      try {
        resolveApiBodasGraphqlUrl();
        fail('expected throw');
      } catch (e) {
        const msg = (e as Error).message;
        expect(msg).toMatch(/API_BODAS_URL/);
        expect(msg).toMatch(/PYTHON_BACKEND_URL/);
        expect(msg).toMatch(/BACKEND_URL/);
        expect(msg).toMatch(/docs\/ENV-ENDPOINTS-STANDARD\.md/);
      }
    });

    it('NO lanza error si solo hay canónicas', () => {
      process.env.API_MCP_GRAPHQL_URL = 'https://api-mcp.eventosorganizador.com/graphql';
      process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL = 'https://api-mcp.eventosorganizador.com/graphql';
      process.env.API_IA_URL = 'https://api-ia.bodasdehoy.com';
      process.env.NEXT_PUBLIC_API_IA_URL = 'https://api-ia.bodasdehoy.com';

      const { resolveApiBodasGraphqlUrl, resolveApiIaOrigin } = require('../../utils/apiEndpoints');
      expect(() => resolveApiBodasGraphqlUrl()).not.toThrow();
      expect(() => resolveApiIaOrigin()).not.toThrow();
    });
  });
});
