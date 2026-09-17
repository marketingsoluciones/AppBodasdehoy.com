import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// El indicador de modo de IA pide el nivel de la bandeja al montar. En el test no hay red:
// sin esto el fetch real falla contra localhost y ensucia la salida con un rechazo suelto.
vi.mock('../data/iaConfig', () => ({
  getConversationIaLevel: vi.fn().mockResolvedValue({ level: 'copilot', source: 'workspace' }),
  getIaLevel: vi.fn().mockResolvedValue('copilot'),
  saveConversationIaLevel: vi.fn().mockResolvedValue(true),
  saveIaLevel: vi.fn().mockResolvedValue(true),
}));

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
    localStorage.setItem('mcp_jwt_token', 'x.y.z');
    localStorage.setItem('api2_jwt_expires_at', new Date('2099-01-01').toISOString());
  });

  // 30 s a propósito: hace vi.resetModules() y luego importa el componente con antd y
  // lobe-ui detrás. Con la máquina cargada pasaba de los 15 s por defecto y caía por tiempo,
  // no por el código (verificado volviendo al commit anterior: cae igual).
  it('renders status and assignee badges from localStorage meta', { timeout: 30_000 }, async () => {
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
    // "Asignada a ti" pasó a "Tuya" el 17-09 al comprimir la fila a dos líneas: la etiqueta
    // vive ahora en la línea del nombre, donde compite con el estado y la hora.
    expect(screen.getByText('Tuya')).toBeInTheDocument();

    // La fila ya no es el único botón: ahora convive con el atajo de acceso, que va fuera
    // del <button> de la fila (anidar interactivos es inválido). Se pulsa la fila por su
    // texto, no "el botón" a secas.
    fireEvent.click(screen.getByText('Carlos'));
  });
});
