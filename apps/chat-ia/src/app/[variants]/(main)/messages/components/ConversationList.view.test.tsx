import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<any>('next/navigation');
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams('view=unassigned'),
  };
});

vi.mock('../hooks/useConversations', () => ({
  useConversations: () => ({
    conversations: [
      {
        channel: 'web',
        contact: { name: 'Asignada', phone: '600000001' },
        id: 'c1',
        lastMessage: { fromUser: true, text: 'Hola', timestamp: '2026-01-01T10:00:00.000Z' },
        unreadCount: 0,
      },
      {
        channel: 'web',
        contact: { name: 'Sin asignar', phone: '600000002' },
        id: 'c2',
        lastMessage: { fromUser: true, text: 'Hola', timestamp: '2026-01-01T10:00:00.000Z' },
        unreadCount: 0,
      },
      {
        channel: 'web',
        contact: { name: 'Cerrada', phone: '600000003' },
        id: 'c3',
        lastMessage: { fromUser: true, text: 'Hola', timestamp: '2026-01-01T10:00:00.000Z' },
        unreadCount: 0,
      },
    ],
    error: null,
    loading: false,
  }),
}));

vi.mock('../hooks/useConversationActions', () => ({
  useConversationActions: () => ({
    deleteConversation: vi.fn(),
    isArchived: () => false,
    isMuted: () => false,
    toggleArchive: vi.fn(),
    toggleMute: vi.fn(),
  }),
}));

describe('ConversationList view filtering', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    localStorage.setItem('dev-user-config', JSON.stringify({ user_id: 'u1', development: 'bodasdehoy' }));
    localStorage.setItem('api2_jwt_token', 'x.y.z');
    localStorage.setItem('api2_jwt_expires_at', new Date('2099-01-01').toISOString());
    localStorage.setItem('channel_connected_web_bodasdehoy', 'true');
    localStorage.setItem(
      'inbox_conversation_meta',
      JSON.stringify({
        c1: { assignedUserId: 'u1', status: 'open' },
        c2: { assignedUserId: null, status: 'open' },
        c3: { assignedUserId: null, status: 'closed' },
      }),
    );
  });

  it('shows only unassigned, non-closed conversations when view=unassigned', async () => {
    const { ConversationList } = await import('./ConversationList');

    render(<ConversationList channel="web" />);

    expect(screen.getByText('Sin asignar')).toBeInTheDocument();
    expect(screen.queryByText('Asignada')).not.toBeInTheDocument();
    expect(screen.queryByText('Cerrada')).not.toBeInTheDocument();
  });
});
