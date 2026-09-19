/**
 * Tests del Notifications Service
 * ================================
 * Simulan acciones reales del usuario con notificaciones:
 * - Usuario ve badge con conteo de no leídas
 * - Usuario abre panel de notificaciones
 * - Usuario marca todas como leídas
 * - Usuario marca una notificación individual
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './notifications';

vi.mock('./client', () => ({
  mcpClient: { query: vi.fn() },
}));

import { mcpClient } from './client';

const mockQuery = vi.mocked(mcpClient.query);

beforeEach(() => {
  mockQuery.mockReset();
});

describe('Notifications Service', () => {
  describe('Badge de notificaciones no leídas', () => {
    it('retorna conteo de no leídas', async () => {
      mockQuery.mockResolvedValueOnce({ getUnreadNotificationsCount: 5 });

      const count = await getUnreadNotificationsCount();

      expect(count).toBe(5);
    });

    it('retorna 0 si la API falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Timeout'));

      const count = await getUnreadNotificationsCount();

      expect(count).toBe(0);
    });

    it('retorna 0 si el campo es null', async () => {
      mockQuery.mockResolvedValueOnce({ getUnreadNotificationsCount: null });

      const count = await getUnreadNotificationsCount();

      expect(count).toBe(0);
    });
  });

  describe('Panel de notificaciones', () => {
    it('retorna notificaciones con metadata', async () => {
      mockQuery.mockResolvedValueOnce({
        getNotifications: {
          errors: [],
          notifications: [
            { id: 'n-1', message: 'Nuevo invitado confirmó', read: false, type: 'RSVP' },
            { id: 'n-2', message: 'Pago recibido', read: true, type: 'PAYMENT' },
          ],
          success: true,
          total: 2,
          unreadCount: 1,
        },
      });

      const result = await getNotifications(20, false, 1);

      expect(result.success).toBe(true);
      expect(result.notifications).toHaveLength(2);
      expect(result.unreadCount).toBe(1);
      expect(result.total).toBe(2);
    });

    it('filtra solo no leídas', async () => {
      mockQuery.mockResolvedValueOnce({
        getNotifications: { success: true, notifications: [], total: 0, unreadCount: 0, errors: [] },
      });

      await getNotifications(20, true);

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.filters).toEqual({ read: false });
    });

    it('sin filtro de unreadOnly no envía filters', async () => {
      mockQuery.mockResolvedValueOnce({
        getNotifications: { success: true, notifications: [], total: 0, unreadCount: 0, errors: [] },
      });

      await getNotifications(10, false);

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.filters).toBeUndefined();
    });

    it('retorna vacío si la API falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Error'));

      const result = await getNotifications();

      expect(result.success).toBe(false);
      expect(result.notifications).toEqual([]);
    });

    it('mapea errores de objetos a strings', async () => {
      mockQuery.mockResolvedValueOnce({
        getNotifications: {
          errors: [{ message: 'Permiso denegado' }],
          notifications: [],
          success: false,
          total: 0,
          unreadCount: 0,
        },
      });

      const result = await getNotifications();

      expect(result.errors).toEqual(['Permiso denegado']);
    });
  });

  describe('Marcar como leídas', () => {
    it('marca todas como leídas', async () => {
      mockQuery.mockResolvedValueOnce({
        markAllNotificationsAsRead: { success: true, count: 5 },
      });

      const result = await markAllNotificationsAsRead();

      expect(result).toBe(true);
    });

    it('retorna false si falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Error'));

      const result = await markAllNotificationsAsRead();

      expect(result).toBe(false);
    });

    it('marca una notificación individual', async () => {
      mockQuery.mockResolvedValueOnce({
        markNotificationAsRead: { success: true },
      });

      const result = await markNotificationAsRead('n-1');

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('MarkNotificationAsRead'),
        { notificationId: 'n-1' },
      );
    });

    it('marca individual retorna false si falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Not found'));

      const result = await markNotificationAsRead('invalid');

      expect(result).toBe(false);
    });
  });
});
