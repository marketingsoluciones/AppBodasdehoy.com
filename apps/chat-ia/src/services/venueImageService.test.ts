/**
 * Tests del Venue Image Service
 * ================================
 * Simulan las acciones reales del usuario en el Venue Visualizer:
 * - Usuario elige estilo "romántico" para un salón de banquetes
 * - Usuario elige estilo "industrial" para un rooftop
 * - Usuario sube una foto de referencia para decorar
 * - Usuario agrega un prompt personalizado
 * - Backend devuelve imagen como URL
 * - Backend devuelve imagen como base64
 * - Backend no disponible → error amigable en español
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateVenueDesign } from './venueImageService';

// ─── Mock fetch & auth ──────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('@/services/_auth', () => ({
  createHeaderWithAuth: vi.fn(async (params) => ({
    Authorization: 'Bearer test-token',
    ...params?.headers,
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Helpers ─────────────────────────────────────────────

function mockImageResponse(data: Record<string, unknown>) {
  mockFetch.mockResolvedValueOnce({
    json: () => Promise.resolve(data),
    ok: true,
  });
}

function mockImageError(status: number, text: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    text: () => Promise.resolve(text),
  });
}

// ─── Tests ───────────────────────────────────────────────

describe('Venue Image Service', () => {
  // ━━━ Escenario: Usuario elige estilo + tipo de sala ━━━

  describe('Usuario elige estilo "romántico" para salón de banquetes', () => {
    it('genera prompt con descripción del estilo y tipo de sala', async () => {
      mockImageResponse({
        images: [{ url: 'https://cdn.example.com/romantico-salon.png' }],
        provider: 'fal-ai',
      });

      await generateVenueDesign({
        roomType: 'salon-banquetes',
        style: 'romantico',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      // Prompt incluye descripción del estilo romántico
      expect(body.prompt).toContain('romantic classic wedding');
      expect(body.prompt).toContain('blush pink');
      expect(body.prompt).toContain('peonies');
      // Prompt incluye contexto del tipo de sala
      expect(body.prompt).toContain('ballroom banquet hall');
      // Configuración de imagen correcta
      expect(body.size).toBe('1024x1024');
      expect(body.use_case).toBe('decoration');
      expect(body.requires_text).toBe(false);
    });

    it('retorna la URL de la imagen generada', async () => {
      mockImageResponse({
        images: [{ url: 'https://cdn.example.com/romantico-salon.png' }],
        provider: 'fal-ai',
      });

      const result = await generateVenueDesign({
        roomType: 'salon-banquetes',
        style: 'romantico',
      });

      expect(result.url).toBe('https://cdn.example.com/romantico-salon.png');
      expect(result.provider).toBe('fal-ai');
      expect(result.error).toBeUndefined();
    });
  });

  describe('Usuario elige estilo "industrial" para rooftop', () => {
    it('genera prompt con descripción industrial y rooftop', async () => {
      mockImageResponse({
        images: [{ url: 'https://cdn.example.com/industrial-rooftop.png' }],
      });

      await generateVenueDesign({
        roomType: 'rooftop',
        style: 'industrial',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.prompt).toContain('industrial chic');
      expect(body.prompt).toContain('Edison bulb');
      expect(body.prompt).toContain('rooftop venue with city views');
    });
  });

  describe('Usuario elige estilo "tropical" para jardín', () => {
    it('genera prompt con descripción tropical y jardín', async () => {
      mockImageResponse({
        images: [{ url: 'https://cdn.example.com/tropical-jardin.png' }],
      });

      await generateVenueDesign({
        roomType: 'jardin',
        style: 'tropical',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.prompt).toContain('tropical beach wedding');
      expect(body.prompt).toContain('palm leaf');
      expect(body.prompt).toContain('outdoor garden venue');
    });
  });

  // ━━━ Escenario: Todos los estilos producen prompts distintos ━━━

  describe('Cada estilo genera un prompt diferente', () => {
    const styles = [
      { keywords: ['romantic classic', 'blush pink'], style: 'romantico' as const },
      { keywords: ['rustic boho', 'macrame'], style: 'rustico-boho' as const },
      { keywords: ['minimalist modern', 'pampas grass'], style: 'minimalista' as const },
      { keywords: ['ultra-glamorous', 'gold chandeliers'], style: 'glamour' as const },
      { keywords: ['enchanted garden', 'flower arches'], style: 'jardin-floral' as const },
      { keywords: ['industrial chic', 'exposed brick'], style: 'industrial' as const },
      { keywords: ['Mediterranean', 'olive branches'], style: 'mediterraneo' as const },
      { keywords: ['tropical beach', 'monstera'], style: 'tropical' as const },
    ];

    for (const { keywords, style } of styles) {
      it(`estilo "${style}" incluye ${keywords[0]}`, async () => {
        mockImageResponse({ images: [{ url: 'https://img.test/x.png' }] });

        await generateVenueDesign({ roomType: 'salon-banquetes', style });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        for (const kw of keywords) {
          expect(body.prompt).toContain(kw);
        }
      });
    }
  });

  // ━━━ Escenario: Usuario sube foto de referencia ━━━

  describe('Usuario sube una foto de referencia para decorar', () => {
    it('incluye image_url y strength en el body', async () => {
      mockImageResponse({
        images: [{ url: 'https://cdn.example.com/decorated.png' }],
      });

      await generateVenueDesign({
        imageUrl: 'https://storage.example.com/mi-salon.jpg',
        roomType: 'salon-banquetes',
        style: 'glamour',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.image_url).toBe('https://storage.example.com/mi-salon.jpg');
      expect(body.strength).toBe(0.75);
    });

    it('sin foto de referencia no incluye image_url', async () => {
      mockImageResponse({
        images: [{ url: 'https://cdn.example.com/decorated.png' }],
      });

      await generateVenueDesign({
        roomType: 'salon-banquetes',
        style: 'glamour',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.image_url).toBeUndefined();
      expect(body.strength).toBeUndefined();
    });
  });

  // ━━━ Escenario: Usuario agrega prompt personalizado ━━━

  describe('Usuario agrega instrucciones extra', () => {
    it('incluye el prompt del usuario al final del prompt generado', async () => {
      mockImageResponse({
        images: [{ url: 'https://cdn.example.com/custom.png' }],
      });

      await generateVenueDesign({
        prompt: 'con flores azules y moradas',
        roomType: 'terraza',
        style: 'minimalista',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.prompt).toContain('con flores azules y moradas');
      expect(body.prompt).toContain('outdoor terrace venue');
    });
  });

  // ━━━ Escenario: Backend devuelve distintos formatos de imagen ━━━

  describe('Backend devuelve imagen en distintos formatos', () => {
    it('extrae URL directa del array images', async () => {
      mockImageResponse({
        images: [{ url: 'https://cdn.example.com/result.png' }],
      });

      const result = await generateVenueDesign({
        roomType: 'finca',
        style: 'rustico-boho',
      });

      expect(result.url).toBe('https://cdn.example.com/result.png');
    });

    it('convierte b64_json a data URI', async () => {
      mockImageResponse({
        images: [{ b64_json: 'iVBORw0KGgoAAAANS...' }],
      });

      const result = await generateVenueDesign({
        roomType: 'finca',
        style: 'rustico-boho',
      });

      expect(result.url).toBe('data:image/png;base64,iVBORw0KGgoAAAANS...');
    });

    it('convierte base64 a data URI', async () => {
      mockImageResponse({
        images: [{ base64: 'R0lGODlhAQABAIAA...' }],
      });

      const result = await generateVenueDesign({
        roomType: 'iglesia',
        style: 'romantico',
      });

      expect(result.url).toBe('data:image/png;base64,R0lGODlhAQABAIAA...');
    });

    it('usa data.url cuando no hay array images', async () => {
      mockImageResponse({
        url: 'https://cdn.example.com/direct.png',
      });

      const result = await generateVenueDesign({
        roomType: 'restaurante',
        style: 'mediterraneo',
      });

      expect(result.url).toBe('https://cdn.example.com/direct.png');
    });

    it('retorna provider del response', async () => {
      mockImageResponse({
        images: [{ provider: 'dall-e-3', url: 'https://x.png' }],
        provider: 'openai',
      });

      const result = await generateVenueDesign({
        roomType: 'salon-banquetes',
        style: 'glamour',
      });

      expect(result.provider).toBe('openai');
    });

    it('usa provider de la imagen cuando no hay provider global', async () => {
      mockImageResponse({
        images: [{ provider: 'dall-e-3', url: 'https://x.png' }],
      });

      const result = await generateVenueDesign({
        roomType: 'salon-banquetes',
        style: 'glamour',
      });

      expect(result.provider).toBe('dall-e-3');
    });
  });

  // ━━━ Escenario: Backend no disponible → error amigable ━━━

  describe('Backend devuelve error', () => {
    it('error HTTP 500 retorna mensaje en español', async () => {
      mockImageError(500, 'Internal Server Error');

      const result = await generateVenueDesign({
        roomType: 'salon-banquetes',
        style: 'romantico',
      });

      expect(result.error).toContain('No se pudo generar la imagen');
      expect(result.error).toContain('500');
      expect(result.url).toBeUndefined();
    });

    it('error de red retorna mensaje amigable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const result = await generateVenueDesign({
        roomType: 'jardin',
        style: 'tropical',
      });

      expect(result.error).toContain('No se pudo generar la imagen');
      expect(result.error).toContain('ECONNREFUSED');
    });

    it('respuesta sin imagen retorna error', async () => {
      mockImageResponse({ images: [] });

      const result = await generateVenueDesign({
        roomType: 'terraza',
        style: 'minimalista',
      });

      expect(result.error).toContain('No se pudo generar la imagen');
    });
  });

  // ━━━ Escenario: Verificar llamada al API ━━━

  describe('Llamada al API', () => {
    it('envía al endpoint correcto con provider auto', async () => {
      mockImageResponse({
        images: [{ url: 'https://cdn.example.com/x.png' }],
      });

      await generateVenueDesign({
        roomType: 'salon-banquetes',
        style: 'romantico',
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('/webapi/text-to-image/auto');
    });

    it('envía método POST con headers de autenticación', async () => {
      mockImageResponse({
        images: [{ url: 'https://cdn.example.com/x.png' }],
      });

      await generateVenueDesign({
        roomType: 'salon-banquetes',
        style: 'romantico',
      });

      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBe('POST');
      expect(options.headers.Authorization).toBe('Bearer test-token');
      expect(options.headers['Content-Type']).toBe('application/json');
    });
  });
});
