/**
 * Tests del Servicio de Eventos
 * =============================
 * Simulan escenarios reales del usuario en el selector de eventos:
 * - Usuario ve lista de sus bodas/eventos
 * - Cada evento muestra nombre + fecha formateado
 * - Eventos sin nombre muestran ID parcial como fallback
 * - Eventos sin fecha muestran solo el nombre
 */
import { describe, expect, it, vi } from 'vitest';

import { formatEventoLabel, getEventosByUsuario } from './eventos';

// ─── Mock del client GraphQL ─────────────────────────────

vi.mock('./client', () => ({
  api2Client: {
    query: vi.fn(),
  },
}));

import { api2Client } from './client';

const mockQuery = vi.mocked(api2Client.query);

// ─── Tests ───────────────────────────────────────────────

describe('Eventos Service', () => {
  // ━━━ formatEventoLabel ━━━

  describe('formatEventoLabel — formato en selector de eventos', () => {
    it('muestra nombre_evento + fecha_boda', () => {
      const label = formatEventoLabel({
        _id: 'evt-001',
        fecha_boda: '2025-06-15',
        nombre_evento: 'Boda María y Pedro',
      });

      expect(label).toBe('Boda María y Pedro (2025-06-15)');
    });

    it('usa nombre si no hay nombre_evento', () => {
      const label = formatEventoLabel({
        _id: 'evt-002',
        fecha_boda: '2025-08-20',
        nombre: 'Mi Boda',
      });

      expect(label).toBe('Mi Boda (2025-08-20)');
    });

    it('usa fecha si no hay fecha_boda', () => {
      const label = formatEventoLabel({
        _id: 'evt-003',
        fecha: '2025-12-01',
        nombre_evento: 'Comunión',
      });

      expect(label).toBe('Comunión (2025-12-01)');
    });

    it('prioriza fecha_boda sobre fecha', () => {
      const label = formatEventoLabel({
        _id: 'evt-004',
        fecha: '2025-01-01',
        fecha_boda: '2025-09-15',
        nombre_evento: 'Evento',
      });

      expect(label).toBe('Evento (2025-09-15)');
    });

    it('prioriza nombre_evento sobre nombre', () => {
      const label = formatEventoLabel({
        _id: 'evt-005',
        nombre: 'Nombre genérico',
        nombre_evento: 'Boda Especial',
      });

      expect(label).toBe('Boda Especial');
    });

    it('sin nombre muestra "Evento" + últimos 6 chars del ID', () => {
      const label = formatEventoLabel({
        _id: 'abcdef123456',
      });

      expect(label).toBe('Evento 123456');
    });

    it('sin fecha muestra solo el nombre', () => {
      const label = formatEventoLabel({
        _id: 'evt-006',
        nombre_evento: 'Boda sin fecha',
      });

      expect(label).toBe('Boda sin fecha');
    });

    it('sin nombre ni fecha muestra fallback con últimos 6 chars del ID', () => {
      const label = formatEventoLabel({
        _id: 'abcdefxyz789',
      });

      expect(label).toBe('Evento xyz789');
    });
  });

  // ━━━ getEventosByUsuario ━━━

  describe('getEventosByUsuario — carga eventos del backend', () => {
    it('retorna lista de eventos del usuario', async () => {
      mockQuery.mockResolvedValueOnce({
        getEventosByUsuario: [
          { _id: 'e1', nombre_evento: 'Boda', fecha_boda: '2025-06-15' },
          { _id: 'e2', nombre_evento: 'Comunión', fecha: '2025-09-01' },
        ],
      });

      const eventos = await getEventosByUsuario('dev-123');

      expect(eventos).toHaveLength(2);
      expect(eventos[0].nombre_evento).toBe('Boda');
      expect(eventos[1].nombre_evento).toBe('Comunión');
    });

    it('envía development como variable GraphQL', async () => {
      mockQuery.mockResolvedValueOnce({ getEventosByUsuario: [] });

      await getEventosByUsuario('my-dev-id');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('GetEventosByUsuario'),
        { development: 'my-dev-id' },
      );
    });

    it('retorna array vacío si la respuesta es null', async () => {
      mockQuery.mockResolvedValueOnce({ getEventosByUsuario: null });

      const eventos = await getEventosByUsuario('dev-123');

      expect(eventos).toEqual([]);
    });
  });
});
