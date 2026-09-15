import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// La cabecera usa useRouter (botón "volver a la bandeja"). Sin App Router montado, Next
// lanza "invariant expected app router to be mounted" y el test no llegaba ni a renderizar.
// Este fallo estaba tapado por otro: faltaba enlazar `random-words` en el worktree, que
// reventaba antes en la fase de imports.
vi.mock('next/navigation', () => ({
  usePathname: () => '/bandeja',
  useRouter: () => ({ back: vi.fn(), prefetch: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

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
    localStorage.setItem('mcp_jwt_token', 'x.y.z');
    localStorage.setItem('api2_jwt_expires_at', new Date('2099-01-01').toISOString());
  });

  it('toggles assignment to current user', async () => {
    const { ConversationHeader } = await import('./ConversationHeader');

    render(<ConversationHeader channel="web" conversationId="c1" />);

    // Rediseño A.3 (18-jul): el badge de estado dejó de ser <span> y pasó a
    // <select> nativo con opciones. Se comprueba el select con value inicial "open".
    const statusSelect = screen.getByRole('combobox', {
      name: 'Cambiar estado de la conversación',
    }) as HTMLSelectElement;
    expect(statusSelect.value).toBe('open');
    expect(screen.getByText('Abierta', { selector: 'option' })).toBeInTheDocument();

    const assignBtn = screen.getByRole('button', { name: 'Sin asignar' });
    fireEvent.click(assignBtn);

    expect(screen.getByRole('button', { name: 'Asignada a ti' })).toBeInTheDocument();
  });
});
