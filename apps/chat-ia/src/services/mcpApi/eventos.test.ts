/**
 * Tests del Servicio de Eventos
 * =============================
 * Schema api-mcp actual (15-jun): getEventosByUsuario(development, usuario_id, pagination)
 * → EventosResponse { total, eventos[] }. Campos del evento: _id, nombre, fecha, tipo.
 * (Los antiguos nombre_evento / fecha_boda fueron eliminados del schema.)
 */
import { describe, expect, it, vi } from 'vitest';

import { formatEventoLabel, getEventosByUsuario } from './eventos';

// ─── Mock del client GraphQL ─────────────────────────────

vi.mock('./client', () => ({
  mcpClient: {
    query: vi.fn(),
  },
}));

import { mcpClient } from './client';

const mockQuery = vi.mocked(mcpClient.query);

// ─── Tests ───────────────────────────────────────────────

describe('Eventos Service', () => {
  // ━━━ formatEventoLabel ━━━

  describe('formatEventoLabel — formato en selector de eventos', () => {
    it('muestra nombre + fecha', () => {
      const label = formatEventoLabel({
        _id: 'evt-001',
        fecha: '2025-06-15',
        nombre: 'Boda María y Pedro',
      });

      expect(label).toBe('Boda María y Pedro (2025-06-15)');
    });

    it('sin fecha muestra solo el nombre', () => {
      const label = formatEventoLabel({
        _id: 'evt-006',
        nombre: 'Boda sin fecha',
      });

      expect(label).toBe('Boda sin fecha');
    });

    it('sin nombre muestra "Evento" + últimos 6 chars del ID', () => {
      const label = formatEventoLabel({
        _id: 'abcdef123456',
      });

      expect(label).toBe('Evento 123456');
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
    it('retorna la lista eventos de EventosResponse', async () => {
      mockQuery.mockResolvedValueOnce({
        getEventosByUsuario: {
          eventos: [
            { _id: 'e1', fecha: '2025-06-15', nombre: 'Boda' },
            { _id: 'e2', fecha: '2025-09-01', nombre: 'Comunión' },
          ],
          total: 2,
        },
      });

      const eventos = await getEventosByUsuario('bodasdehoy', 'user@x.com');

      expect(eventos).toHaveLength(2);
      expect(eventos[0].nombre).toBe('Boda');
      expect(eventos[1].nombre).toBe('Comunión');
    });

    it('envía development, usuario_id y pagination como variables GraphQL', async () => {
      mockQuery.mockResolvedValueOnce({ getEventosByUsuario: { eventos: [], total: 0 } });

      await getEventosByUsuario('bodasdehoy', 'user@x.com');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('GetEventosByUsuario'),
        expect.objectContaining({
          development: 'bodasdehoy',
          pagination: { limit: 100, page: 1 },
          usuario_id: 'user@x.com',
        }),
      );
    });

    it('sin usuario_id devuelve [] sin llamar al backend', async () => {
      mockQuery.mockClear();
      const eventos = await getEventosByUsuario('bodasdehoy', '');

      expect(eventos).toEqual([]);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('retorna array vacío si la respuesta no trae eventos', async () => {
      mockQuery.mockResolvedValueOnce({ getEventosByUsuario: null });

      const eventos = await getEventosByUsuario('bodasdehoy', 'user@x.com');

      expect(eventos).toEqual([]);
    });
  });
});
