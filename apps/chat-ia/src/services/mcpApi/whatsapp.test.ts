/**
 * Tests del WhatsApp Service
 * ==========================
 * Simulan acciones del admin configurando canales WhatsApp:
 * - Admin lista canales WhatsApp activos
 * - Admin crea un nuevo canal QR
 * - Admin elimina un canal
 * - Admin agrega un miembro al canal
 * - Admin lista miembros de un canal
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addWhatsAppChannelMember,
  createWhatsAppChannel,
  deleteWhatsAppChannel,
  getWhatsAppChannelMembers,
  getWhatsAppChannels,
  invalidateChannelsCache,
} from './whatsapp';

import { mcpClient } from './client';

vi.mock('./client', () => ({
  mcpClient: { query: vi.fn() },
}));

const mockQuery = vi.mocked(mcpClient.query);

beforeEach(() => {
  mockQuery.mockReset();
  invalidateChannelsCache();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  // Mock global fetch so the REST fallback in getWhatsAppChannels doesn't make real HTTP calls
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue({ success: false }),
    ok: false,
  }));
});

describe('WhatsApp Service', () => {
  describe('Admin lista canales', () => {
    it('retorna canales con status y tipo', async () => {
      mockQuery.mockResolvedValueOnce({
        getWhatsAppChannels: [
          { id: 'ch-1', name: 'Bodas Principal', phoneNumber: '+34600111222', status: 'ACTIVE', type: 'WAB' },
          { id: 'ch-2', name: 'QR Pruebas', status: 'CONNECTING', type: 'QR_USER' },
        ],
      });

      const channels = await getWhatsAppChannels();

      expect(channels).toHaveLength(2);
      expect(channels[0].status).toBe('ACTIVE');
      expect(channels[0].type).toBe('WAB');
      expect(channels[1].type).toBe('QR_USER');
    });

    it('retorna array vacío si la API falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Error'));

      const channels = await getWhatsAppChannels();

      expect(channels).toEqual([]);
    });
  });

  describe('Admin crea canal QR', () => {
    it('crea canal exitosamente y retorna datos', async () => {
      mockQuery.mockResolvedValueOnce({
        createWhatsAppChannel: {
          channel: { id: 'ch-new', name: 'Mi Canal', status: 'CONNECTING', type: 'QR_USER' },
          success: true,
        },
      });

      const channel = await createWhatsAppChannel('Mi Canal') as any;

      expect(channel?.id).toBe('ch-new');
      expect(channel?.type).toBe('QR_USER');
    });

    it('envía type por defecto QR_USER', async () => {
      mockQuery.mockResolvedValueOnce({
        createWhatsAppChannel: { channel: { id: 'x' }, success: true },
      });

      await createWhatsAppChannel('Test');

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.input.type).toBe('QR_USER');
    });

    it('permite especificar tipo WAB', async () => {
      mockQuery.mockResolvedValueOnce({
        createWhatsAppChannel: { channel: { id: 'x' }, success: true },
      });

      await createWhatsAppChannel('Business', 'WAB');

      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.input.type).toBe('WAB');
    });

    it('retorna null si success=false', async () => {
      mockQuery.mockResolvedValueOnce({
        createWhatsAppChannel: { error: 'Límite alcanzado', success: false },
      });

      const channel = await createWhatsAppChannel('Extra');

      expect(channel).toBeNull();
    });
  });

  describe('Admin elimina canal', () => {
    it('elimina exitosamente', async () => {
      mockQuery.mockResolvedValueOnce({
        deleteWhatsAppChannel: { success: true },
      });

      const result = await deleteWhatsAppChannel('ch-1');

      expect(result).toBe(true);
    });
  });

  describe('Admin gestiona miembros', () => {
    it('lista miembros de un canal', async () => {
      mockQuery.mockResolvedValueOnce({
        getWhatsAppChannelMembers: [
          { id: 'm-1', isActive: true, role: 'ADMIN', userId: 'user-1' },
          { id: 'm-2', isActive: true, role: 'AGENT', userId: 'user-2' },
        ],
      });

      const members = await getWhatsAppChannelMembers('ch-1');

      expect(members).toHaveLength(2);
      expect(members[0].role).toBe('ADMIN');
    });

    it('agrega miembro con rol', async () => {
      mockQuery.mockResolvedValueOnce({
        addWhatsAppChannelMember: { member: { role: 'AGENT', userId: 'user-3' }, success: true },
      });

      const result = await addWhatsAppChannelMember('ch-1', 'user-3', 'AGENT');

      expect(result).toBe(true);
      const vars = mockQuery.mock.calls[0][1] as any;
      expect(vars.channelId).toBe('ch-1');
      expect(vars.userId).toBe('user-3');
      expect(vars.role).toBe('AGENT');
    });

    it('retorna false si agregar miembro falla', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Forbidden'));

      const result = await addWhatsAppChannelMember('ch-1', 'user-4', 'READONLY');

      expect(result).toBe(false);
    });
  });
});
