import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('ConversationItem meta', () => {
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

  it('renders status and assignee badges from localStorage meta', async () => {
    localStorage.setItem(
      'inbox_conversation_meta',
      JSON.stringify({ c1: { status: 'pending', assignedUserId: 'u1' } }),
    );

    const { ConversationItem } = await import('./ConversationItem');

    render(
      <ConversationItem
        conversation={{
          channel: 'web',
          contact: { name: 'Carlos', phone: '600000000' },
          id: 'c1',
          lastMessage: {
            fromUser: true,
            text: 'Hola',
            timestamp: '2026-01-01T10:00:00.000Z',
          },
          unreadCount: 0,
        }}
      />,
    );

    expect(screen.getByText('En espera')).toBeInTheDocument();
    expect(screen.getByText('Asignada')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
  });
});
