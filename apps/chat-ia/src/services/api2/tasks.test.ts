/**
 * Tests del Tasks Service
 * ========================
 * Simulan acciones del usuario con tareas del itinerario de boda:
 * - Usuario marca tarea como completada (checkbox)
 * - Usuario edita un campo de una tarea
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { completeTask, updateTaskField } from './tasks';

vi.mock('./client', () => ({
  api2Client: { query: vi.fn() },
}));

import { api2Client } from './client';

const mockQuery = vi.mocked(api2Client.query);

beforeEach(() => {
  mockQuery.mockReset();
});

describe('Tasks Service', () => {
  describe('Usuario marca tarea como completada', () => {
    it('envía mutation con estatus=true', async () => {
      mockQuery.mockResolvedValueOnce({});

      await completeTask('evt-1', 'itin-1', 'task-1');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('EditTask'),
        {
          eventID: 'evt-1',
          itinerarioID: 'itin-1',
          taskID: 'task-1',
          variable: 'estatus',
          valor: 'true',
        },
      );
    });
  });

  describe('Usuario edita campo de tarea', () => {
    it('envía mutation con campo y valor arbitrarios', async () => {
      mockQuery.mockResolvedValueOnce({});

      await updateTaskField('evt-1', 'itin-1', 'task-1', 'nombre', 'Contratar DJ');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('EditTask'),
        {
          eventID: 'evt-1',
          itinerarioID: 'itin-1',
          taskID: 'task-1',
          variable: 'nombre',
          valor: 'Contratar DJ',
        },
      );
    });

    it('puede actualizar fecha de una tarea', async () => {
      mockQuery.mockResolvedValueOnce({});

      await updateTaskField('evt-2', 'itin-1', 'task-5', 'fecha', '2025-06-15');

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.variable).toBe('fecha');
      expect(vars.valor).toBe('2025-06-15');
    });
  });
});
