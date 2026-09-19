/**
 * Tests del Wedding Chat Service
 * ================================
 * Simulan las acciones reales del usuario en el Wedding Creator:
 * - Usuario dice su nombre y el de su pareja
 * - Usuario pone la fecha de la boda
 * - Usuario elige un estilo/paleta
 * - Usuario agrega o quita secciones
 * - Backend no disponible → fallback local
 * - Backend responde con acciones JSON
 */
import type { WeddingWebData } from '@bodasdehoy/wedding-creator';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { checkBackendHealth, sendWeddingChatMessage } from './weddingChatService';

// ─── Mock fetch global ───────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('@/utils/authToken', () => ({
  buildAuthHeaders: vi.fn((extra) => ({ Authorization: 'Bearer test-token', ...extra })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Helpers ─────────────────────────────────────────────

const makeWedding = (overrides?: Partial<WeddingWebData>): WeddingWebData =>
  ({
    id: 'wedding-1',
    couple: {
      partner1: { name: '' },
      partner2: { name: '' },
    },
    date: { date: null },
    style: { palette: 'romantic' },
    sections: [
      { type: 'schedule', enabled: true },
      { type: 'location', enabled: true },
      { type: 'gallery', enabled: false },
      { type: 'info', enabled: false },
      { type: 'rsvp', enabled: false },
      { type: 'registry', enabled: false },
    ],
    ...overrides,
  }) as unknown as WeddingWebData;

/** Simula una respuesta exitosa del backend con acciones JSON embebidas */
function mockBackendResponse(message: string, actions?: any[]) {
  const actionBlock = actions
    ? `\n<!--WEDDING_ACTIONS\n${JSON.stringify(actions)}\nWEDDING_ACTIONS-->`
    : '';

  mockFetch.mockResolvedValueOnce({
    json: () => Promise.resolve({
      metadata: { model: 'claude-sonnet-4-20250514', provider: 'anthropic', response_time_ms: 450 },
      response: message + actionBlock,
    }),
    ok: true,
  });
}

/** Simula que el backend no está disponible (fetch falla) */
function mockBackendDown() {
  mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
}

// ─── Tests ───────────────────────────────────────────────

describe('Wedding Chat Service', () => {
  // ━━━ Escenario: Usuario dice su nombre ━━━

  describe('Usuario dice "Me llamo María"', () => {
    it('en modo local: detecta nombre y genera acción updateCouple', async () => {
      mockBackendDown();

      const result = await sendWeddingChatMessage(
        'Me llamo María',
        makeWedding(),
      );

      expect(result.success).toBe(true);
      expect(result.actions).toEqual([
        { type: 'updateCouple', payload: { partner: 'partner1', name: 'María' } },
      ]);
      expect(result.message).toContain('María');
      expect(result.metadata?.provider).toBe('local-fallback');
    });
  });

  describe('Usuario dice "Mi pareja se llama Juan"', () => {
    it('en modo local: detecta nombre de pareja como partner2', async () => {
      mockBackendDown();

      const result = await sendWeddingChatMessage(
        'Mi pareja se llama Juan',
        makeWedding(),
      );

      expect(result.success).toBe(true);
      expect(result.actions).toEqual([
        { type: 'updateCouple', payload: { partner: 'partner2', name: 'Juan' } },
      ]);
      expect(result.message).toContain('Juan');
    });
  });

  // ━━━ Escenario: Usuario pone la fecha ━━━

  describe('Usuario dice "La boda es el 15 de junio de 2025"', () => {
    it('en modo local: parsea la fecha y genera acción updateDate', async () => {
      mockBackendDown();

      const result = await sendWeddingChatMessage(
        'La boda es el 15 de junio de 2025',
        makeWedding(),
      );

      expect(result.success).toBe(true);
      expect(result.actions).toHaveLength(1);
      expect(result.actions![0].type).toBe('updateDate');

      // Verifica que la fecha es correcta (15 junio 2025)
      const parsedDate = new Date(result.actions![0].payload.date);
      expect(parsedDate.getDate()).toBe(15);
      expect(parsedDate.getMonth()).toBe(5); // junio = 5 (0-indexed)
      expect(parsedDate.getFullYear()).toBe(2025);
    });

    it('en modo local: parsea fecha numérica 20/08/2025', async () => {
      mockBackendDown();

      const result = await sendWeddingChatMessage(
        'El evento será el 20/08/2025',
        makeWedding(),
      );

      expect(result.actions).toHaveLength(1);
      const parsedDate = new Date(result.actions![0].payload.date);
      expect(parsedDate.getDate()).toBe(20);
      expect(parsedDate.getMonth()).toBe(7); // agosto
      expect(parsedDate.getFullYear()).toBe(2025);
    });
  });

  // ━━━ Escenario: Usuario elige estilo ━━━

  describe('Usuario dice "Quiero estilo romántico"', () => {
    it('en modo local: detecta paleta romantic', async () => {
      mockBackendDown();

      const result = await sendWeddingChatMessage(
        'Quiero un estilo romántico',
        makeWedding(),
      );

      expect(result.actions).toEqual([
        { type: 'updatePalette', payload: { palette: 'romantic' } },
      ]);
    });

    it('en modo local: detecta "elegante" como paleta elegant', async () => {
      mockBackendDown();

      const result = await sendWeddingChatMessage(
        'Prefiero algo elegante como color',
        makeWedding(),
      );

      expect(result.actions).toEqual([
        { type: 'updatePalette', payload: { palette: 'elegant' } },
      ]);
    });

    it('en modo local: detecta "playa" como paleta beach', async () => {
      mockBackendDown();

      const result = await sendWeddingChatMessage(
        'El estilo será de playa',
        makeWedding(),
      );

      expect(result.actions).toEqual([
        { type: 'updatePalette', payload: { palette: 'beach' } },
      ]);
    });
  });

  // ━━━ Escenario: Usuario agrega/quita secciones ━━━

  describe('Usuario dice "Agrega la galería de fotos"', () => {
    it('en modo local: habilita sección gallery', async () => {
      mockBackendDown();

      const result = await sendWeddingChatMessage(
        'Quiero agregar la galeria de fotos',
        makeWedding(),
      );

      expect(result.actions).toEqual([
        { type: 'toggleSection', payload: { section: 'gallery', enabled: true } },
      ]);
    });
  });

  describe('Usuario dice "Quita la sección de regalos"', () => {
    it('en modo local: deshabilita sección registry', async () => {
      mockBackendDown();

      const result = await sendWeddingChatMessage(
        'Quiero quitar la sección de regalos',
        makeWedding(),
      );

      expect(result.actions).toEqual([
        { type: 'toggleSection', payload: { section: 'registry', enabled: false } },
      ]);
    });
  });

  describe('Usuario dice "Habilita el RSVP"', () => {
    it('en modo local: habilita sección rsvp', async () => {
      mockBackendDown();

      const result = await sendWeddingChatMessage(
        'Quiero agregar rsvp para confirmación',
        makeWedding(),
      );

      expect(result.actions).toEqual([
        { type: 'toggleSection', payload: { section: 'rsvp', enabled: true } },
      ]);
    });
  });

  // ━━━ Escenario: Mensaje genérico sin acción ━━━

  describe('Usuario dice algo genérico', () => {
    it('en modo local: retorna mensaje de ayuda sin acciones', async () => {
      mockBackendDown();

      const result = await sendWeddingChatMessage(
        'Hola, necesito ayuda',
        makeWedding(),
      );

      expect(result.success).toBe(true);
      expect(result.actions).toEqual([]);
      expect(result.message).toContain('Puedo ayudarte con');
    });
  });

  // ━━━ Escenario: Backend responde con acciones JSON ━━━

  describe('Backend AI responde con acciones', () => {
    it('extrae acciones del bloque <!--WEDDING_ACTIONS-->', async () => {
      mockBackendResponse(
        '¡He actualizado los nombres! Tu web ya muestra los nuevos nombres.',
        [
          { type: 'updateCouple', payload: { partner: 'partner1', name: 'Ana' } },
          { type: 'updateCouple', payload: { partner: 'partner2', name: 'Luis' } },
        ],
      );

      const result = await sendWeddingChatMessage(
        'Los novios son Ana y Luis',
        makeWedding(),
      );

      expect(result.success).toBe(true);
      expect(result.actions).toHaveLength(2);
      expect(result.actions![0]).toEqual({
        type: 'updateCouple',
        payload: { partner: 'partner1', name: 'Ana' },
      });
      expect(result.actions![1]).toEqual({
        type: 'updateCouple',
        payload: { partner: 'partner2', name: 'Luis' },
      });

      // Mensaje limpio sin el bloque JSON
      expect(result.message).not.toContain('WEDDING_ACTIONS');
      expect(result.message).toContain('nombres');
    });

    it('envía sistema prompt con contexto del evento actual', async () => {
      const wedding = makeWedding({
        couple: {
          partner1: { name: 'María' },
          partner2: { name: 'Pedro' },
        },
        style: { palette: 'elegant' },
      } as any);

      mockBackendResponse('¡Listo!', []);

      await sendWeddingChatMessage('Hola', wedding);

      // Verifica que fetch fue llamado con el contexto correcto
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/chat');

      const body = JSON.parse(options.body);
      expect(body.message).toBe('Hola');
      expect(body.auto_route).toBe(true);

      // Sistema prompt incluye info del evento
      const systemMsg = body.conversation_history[0];
      expect(systemMsg.role).toBe('system');
      expect(systemMsg.content).toContain('María');
      expect(systemMsg.content).toContain('Pedro');
      expect(systemMsg.content).toContain('elegant');
    });

    it('incluye solo los últimos 10 mensajes del historial', async () => {
      mockBackendResponse('Ok', []);

      const history = Array.from({ length: 15 }, (_, i) => ({
        content: `Mensaje ${i}`,
        role: 'user' as const,
      }));

      await sendWeddingChatMessage('Nuevo', makeWedding(), history);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      // system + 10 últimos del historial + mensaje actual
      expect(body.conversation_history).toHaveLength(12);
      expect(body.conversation_history[1].content).toBe('Mensaje 5'); // primero del slice(-10)
    });

    it('envía headers de autenticación', async () => {
      mockBackendResponse('Ok', []);

      await sendWeddingChatMessage('Hola', makeWedding());

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer test-token');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('incluye metadata del modelo en la respuesta', async () => {
      mockBackendResponse('¡Perfecto!', []);

      const result = await sendWeddingChatMessage('Test', makeWedding());

      expect(result.metadata?.model).toBe('claude-sonnet-4-20250514');
      expect(result.metadata?.provider).toBe('anthropic');
      expect(result.metadata?.processing_time_ms).toBe(450);
    });
  });

  // ━━━ Escenario: Backend responde con error HTTP ━━━

  describe('Backend devuelve error', () => {
    it('cae a fallback local cuando el backend devuelve 500', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ error: 'Internal Server Error' }),
        ok: false,
        status: 500,
      });

      const result = await sendWeddingChatMessage(
        'Me llamo Carlos',
        makeWedding(),
      );

      // Fallback local funciona
      expect(result.success).toBe(true);
      expect(result.metadata?.provider).toBe('local-fallback');
      expect(result.actions).toEqual([
        { type: 'updateCouple', payload: { partner: 'partner1', name: 'Carlos' } },
      ]);
    });
  });

  // ━━━ Escenario: AI responde con keywords en texto (sin JSON) ━━━

  describe('Backend responde sin bloque JSON pero con keywords', () => {
    it('detecta "estilo romántico" en texto y genera acción', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          response: 'He cambiado a estilo romántico con colores rosas.',
        }),
        ok: true,
      });

      const result = await sendWeddingChatMessage('Quiero romántico', makeWedding());

      expect(result.actions).toEqual([
        { type: 'updatePalette', payload: { palette: 'romantic' } },
      ]);
    });

    it('detecta "habilitado la galería" en texto y genera toggle', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          response: 'He habilitado la galería de fotos para tu evento.',
        }),
        ok: true,
      });

      const result = await sendWeddingChatMessage('Agrega galería', makeWedding());

      expect(result.actions).toContainEqual({
        type: 'toggleSection',
        payload: { section: 'gallery', enabled: true },
      });
    });
  });

  // ━━━ Health check ━━━

  describe('checkBackendHealth', () => {
    it('retorna true cuando el backend responde ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const healthy = await checkBackendHealth();

      expect(healthy).toBe(true);
      expect(mockFetch.mock.calls[0][0]).toContain('/api/chat/health');
    });

    it('retorna false cuando el backend no responde', async () => {
      mockFetch.mockRejectedValueOnce(new Error('timeout'));

      const healthy = await checkBackendHealth();

      expect(healthy).toBe(false);
    });

    it('retorna false cuando el backend responde con error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

      const healthy = await checkBackendHealth();

      expect(healthy).toBe(false);
    });
  });
});
