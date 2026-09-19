import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// La cabecera usa useRouter (botón "volver a la bandeja"). Sin App Router montado, Next
// lanza "invariant expected app router to be mounted" y el test no llegaba ni a renderizar.
// Este fallo estaba tapado por otro: faltaba enlazar `random-words` en el worktree, que
// reventaba antes en la fase de imports.
// M2 (16-09): asignar ya no es solo localStorage, también escribe en el servidor. Aquí se
// comprueba la interfaz, no la red: sin este doble, el test se quedaba 15 s esperando a
// GraphQL y acababa fallando por tiempo.
// La cabecera carga el nivel de IA al montar y puede tocar mutaciones de api-mcp. En jsdom
// no hay red: sin estos dobles las promesas nunca resuelven y el test muere por tiempo.
// El panel de compartir no es lo que se prueba aquí, y arrastra el cliente GraphQL entero.
// Doblarlo mantiene el test centrado en la cabecera.
vi.mock('./SharePanel', () => ({ SharePanel: () => null }));

vi.mock('../data/iaConfig', () => ({
  getIaLevel: vi.fn().mockResolvedValue(null),
  saveIaLevel: vi.fn().mockResolvedValue(true),
}));
vi.mock('@/services/mcpApi/whatsapp', () => ({
  assignConversationToUser: vi.fn().mockResolvedValue(true),
  blockConversation: vi.fn().mockResolvedValue(true),
  setConversationAgent: vi.fn().mockResolvedValue(true),
  setConversationStatus: vi.fn().mockResolvedValue(true),
  // El panel de compartir entra en el grafo del módulo aunque no se abra: si el doble no
  // exporta lo que importa data/sharing, el import dinámico del test ni resuelve.
  shareConversation: vi.fn().mockResolvedValue(true),
  unblockConversation: vi.fn().mockResolvedValue(true),
  unshareConversation: vi.fn().mockResolvedValue(true),
}));

vi.mock('../data/conversationMeta', () => ({
  fromServerStatus: () => null,
  persistAssignee: vi.fn().mockResolvedValue(true),
  persistStatus: vi.fn().mockResolvedValue(true),
}));

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

  // 30 s a propósito: el test hace vi.resetModules() y luego importa la cabecera entera con
  // antd y lobe-ui detrás. Rondaba los 15 s del límite por defecto y fallaba de forma
  // intermitente según la carga de la máquina, no por el código.
  it('toggles assignment to current user', { timeout: 30_000 }, async () => {
    const { ConversationHeader } = await import('./ConversationHeader');

    render(<ConversationHeader channel="web" conversationId="c1" />);

    // Rediseño A.3 (18-jul): el badge de estado dejó de ser <span> y pasó a
    // <select> nativo con opciones. Se comprueba el select con value inicial "open".
    const statusSelect = screen.getByRole('combobox', {
      name: 'Cambiar estado de la conversación',
    }) as HTMLSelectElement;
    expect(statusSelect.value).toBe('open');
    expect(screen.getByText('Abierta', { selector: 'option' })).toBeInTheDocument();

    // El botón de asignación pasó a icono el 17-09 (el texto ocupaba ~90px de barra para un
    // dato que se cambia una vez por conversación); el significado vive ahora en el aria-label.
    const assignBtn = screen.getByRole('button', { name: /Sin asignar/ });
    fireEvent.click(assignBtn);

    expect(screen.getByRole('button', { name: /Asignada a ti/ })).toBeInTheDocument();
  });
});
