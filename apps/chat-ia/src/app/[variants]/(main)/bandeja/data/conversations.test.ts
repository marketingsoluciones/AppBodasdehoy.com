import { describe, expect, it } from 'vitest';

import { normalizeConversation } from './conversations';

/**
 * M1 — cobertura donde duele. La normalización es el punto por el que pasa TODA la bandeja:
 * si aquí se pierde un campo, la interfaz miente y nadie se entera (fue lo que pasó con
 * `shared_with`). Estos casos fijan las dos formas reales que llegan: api-mcp (camelCase,
 * displayName/phoneNumber) y api-ia (snake_case, contact:{name,phone}).
 */
describe('normalizeConversation', () => {
  it('lee la forma de api-mcp', () => {
    const c = normalizeConversation(
      {
        assignedUserId: 'u1',
        channelId: 'ch1',
        channelType: 'WAB',
        displayName: 'Ana Gómez',
        id: 'conv1',
        lastMessage: 'Hola',
        lastMessageAt: '2026-01-01T10:00:00.000Z',
        lastMessageFromMe: false,
        phoneNumber: '34600000000',
        shared_with: [{ principal_id: 'u2', principal_type: 'user' }],
        unreadCount: 3,
      },
      true,
    );
    expect(c.id).toBe('conv1');
    expect(c.contact.name).toBe('Ana Gómez');
    expect(c.channel).toBe('whatsapp');
    expect(c.channelType).toBe('WAB');
    expect(c.assignedToUserId).toBe('u1');
    expect(c.sharedWith).toHaveLength(1);
    expect(c.unreadCount).toBe(3);
    expect(c.lastMessage.fromUser).toBe(true);
  });

  it('lee la forma de api-ia (snake_case y contact anidado)', () => {
    const c = normalizeConversation(
      {
        assigned_agent_name: 'Copiloto',
        channel_type: 'WEB_QR',
        contact: { name: 'Carlos', phone: '34611111111' },
        conversationId: 'conv2',
        linked_event_id: 'ev1',
        sharedWith: [{ principalId: 't1', principalType: 'team' }],
      },
      true,
    );
    expect(c.id).toBe('conv2');
    expect(c.contact.name).toBe('Carlos');
    expect(c.channelType).toBe('WEB_QR');
    expect(c.assignedAgentName).toBe('Copiloto');
    expect(c.linkedEventId).toBe('ev1');
    expect(c.sharedWith?.[0].principalType).toBe('team');
  });

  it('en la vista de "otros", lo desconocido cae a web y no se pierde', () => {
    // Si esto vuelve a 'whatsapp' o a undefined, la conversación desaparece al abrirla.
    expect(normalizeConversation({ id: 'c3' }, false).channel).toBe('web');
    expect(normalizeConversation({ channel: 'telegram', id: 'c4' }, false).channel).toBe('telegram');
  });

  it('sobrevive a una conversación vacía sin romper la lista', () => {
    const c = normalizeConversation({}, true);
    expect(c.lastMessage.text).toBe('');
    expect(c.unreadCount).toBe(0);
    expect(c.sharedWith).toEqual([]);
    expect(typeof c.lastMessage.timestamp).toBe('string');
  });
});
