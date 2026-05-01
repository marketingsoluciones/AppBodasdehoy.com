import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../hooks/useConversations', () => ({
  useConversations: () => ({
    conversations: [
      {
        channel: 'web',
        contact: { name: 'Carlos', phone: '600000000' },
        id: 'c1',
        lastMessage: {
          fromUser: true,
          text: 'Hola',
          timestamp: '2026-01-01T10:00:00.000Z',
        },
        unreadCount: 0,
      },
    ],
  }),
}));

vi.mock('../hooks/useConversationActions', () => ({
  useConversationActions: () => ({
    clearChat: vi.fn(),
    isMuted: () => false,
    toggleArchive: vi.fn(),
    toggleMute: vi.fn(),
  }),
}));

describe('ConversationHeader meta', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    localStorage.setItem(
      'dev-user-config',
      JSON.stringify({ user_id: 'u1', development: 'bodasdehoy' }),
    );
    localStorage.setItem('api2_jwt_token', 'x.y.z');
    localStorage.setItem('api2_jwt_expires_at', new Date('2099-01-01').toISOString());
  });

  it('toggles assignment to current user', async () => {
    const { ConversationHeader } = await import('./ConversationHeader');

    render(<ConversationHeader channel="web" conversationId="c1" />);

    expect(screen.getByText('Abierta', { selector: 'span' })).toBeInTheDocument();
    const assignBtn = screen.getByRole('button', { name: 'Sin asignar' });
    fireEvent.click(assignBtn);

    expect(screen.getByRole('button', { name: 'Asignada a ti' })).toBeInTheDocument();
  });
});
