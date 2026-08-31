import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAgentStore } from '@/store/agent';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { LobeSessionType, type LobeAgentSession } from '@/types/session';

// Mocks del rail para evitar navegación de Next dentro del test
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/agentes',
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('@/hooks/useAuthCheck', () => ({
  useAuthCheck: () => ({ checkAuth: () => ({ userId: 'u1', development: 'bodasdehoy' }) }),
}));

vi.mock('@/store/session', () => ({
  useSessionStore: vi.fn(),
}));
vi.mock('@/store/agent', () => ({
  useAgentStore: vi.fn(),
}));

function buildAgentSession(overrides: Partial<LobeAgentSession> = {}): LobeAgentSession {
  return {
    id: 'agent-1',
    type: LobeSessionType.Agent,
    config: {
      chatConfig: {} as any,
      model: 'gpt-4o-mini',
      params: {} as any,
      systemRole: 'Eres Ana, asistente de invitados',
    },
    meta: { title: 'Ana', description: 'Especialista invitados', avatar: '✦' },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as LobeAgentSession;
}

/**
 * Helper: hace que useSessionStore devuelva distintos valores según el
 * selector recibido. El componente hace 4 llamadas separadas:
 *   1. defaultSessions filtered
 *   2. switchSession action
 *   3. activeId
 *   4. isSessionListInit
 */
function mockSessionStore({
  agents,
  activeId = null,
  isInit = true,
  switchSession = vi.fn(),
}: {
  agents: LobeAgentSession[];
  activeId?: string | null;
  isInit?: boolean;
  switchSession?: ReturnType<typeof vi.fn>;
}) {
  vi.mocked(useSessionStore).mockImplementation((selector: any) => {
    const state: any = {
      defaultSessions: agents,
      activeId,
      switchSession,
    };
    if (selector === sessionSelectors.isSessionListInit) return isInit;
    return selector(state);
  });
}

function mockAgentStore(updateAgentConfig = vi.fn().mockResolvedValue(undefined)) {
  vi.mocked(useAgentStore).mockImplementation((selector: any) => {
    const state = { updateAgentConfig };
    return selector(state);
  });
  return updateAgentConfig;
}

describe('AgentesPage — Cowork', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('empty state cuando no hay agentes creados', async () => {
    mockSessionStore({ agents: [], isInit: true });
    mockAgentStore();

    const { default: AgentesPage } = await import('./page');
    render(<AgentesPage />);

    expect(screen.getByText('Aún no tienes agentes creados')).toBeInTheDocument();
    // El CTA "Ir a Copilot" apunta a la ruta real
    const cta = screen.getByRole('link', { name: /Ir a Copilot/i });
    expect(cta).toHaveAttribute('href', '/chat');
  });

  it('loading state mientras las sessions no están inicializadas', async () => {
    mockSessionStore({ agents: [], isInit: false });
    mockAgentStore();

    const { default: AgentesPage } = await import('./page');
    render(<AgentesPage />);

    expect(screen.getByText(/Cargando tus agentes/i)).toBeInTheDocument();
  });

  it('renderiza el agente real seleccionado con prompt en textarea', async () => {
    mockSessionStore({ agents: [buildAgentSession()], isInit: true });
    mockAgentStore();

    const { default: AgentesPage } = await import('./page');
    render(<AgentesPage />);

    expect(screen.getByRole('heading', { name: 'Ana' })).toBeInTheDocument();
    expect(screen.getByText('Especialista invitados')).toBeInTheDocument();
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Eres Ana, asistente de invitados');
  });

  it('toggle Pausar → estado pasa a "Pausado" y persiste en localStorage', async () => {
    mockSessionStore({ agents: [buildAgentSession()], isInit: true });
    mockAgentStore();

    const { default: AgentesPage } = await import('./page');
    render(<AgentesPage />);

    // Estado inicial: activo
    expect(screen.getByText('Activo')).toBeInTheDocument();
    const pauseBtn = screen.getByRole('button', { name: 'Pausar' });
    fireEvent.click(pauseBtn);

    expect(screen.getByText('Pausado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reanudar' })).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem('cowork_agent_state_agent-1') || '{}');
    expect(stored.disabled).toBe(true);
  });

  it('toggle canal WhatsApp → chip activo + persiste en localStorage', async () => {
    mockSessionStore({ agents: [buildAgentSession()], isInit: true });
    mockAgentStore();

    const { default: AgentesPage } = await import('./page');
    render(<AgentesPage />);

    const waChip = screen.getByRole('button', { name: /WhatsApp/i });
    expect(waChip).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(waChip);
    expect(waChip).toHaveAttribute('aria-pressed', 'true');

    const stored = JSON.parse(localStorage.getItem('cowork_agent_state_agent-1') || '{}');
    expect(stored.channels).toEqual(['whatsapp']);
  });

  it('editar textarea prompt dispara updateAgentConfig tras debounce 800ms', async () => {
    const switchSession = vi.fn();
    mockSessionStore({
      agents: [buildAgentSession()],
      activeId: null, // fuerza que se llame switchSession
      isInit: true,
      switchSession,
    });
    const updateAgentConfig = mockAgentStore();

    const { default: AgentesPage } = await import('./page');
    render(<AgentesPage />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Nuevo prompt actualizado' } });

    // Antes del debounce: NO llamado
    expect(updateAgentConfig).not.toHaveBeenCalled();

    // Adelantar los 800ms del debounce
    await vi.advanceTimersByTimeAsync(900);

    await waitFor(() => {
      expect(switchSession).toHaveBeenCalledWith('agent-1');
      expect(updateAgentConfig).toHaveBeenCalledWith({ systemRole: 'Nuevo prompt actualizado' });
    });
  });

  it('cambiar de agente re-hidrata el prompt en el textarea', async () => {
    const agent1 = buildAgentSession({
      id: 'a1',
      meta: { title: 'Ana', description: '', avatar: '' },
      config: { chatConfig: {} as any, model: 'gpt-4o-mini', params: {} as any, systemRole: 'Prompt A' },
    });
    const agent2 = buildAgentSession({
      id: 'a2',
      meta: { title: 'Beto', description: '', avatar: '' },
      config: { chatConfig: {} as any, model: 'gpt-4o-mini', params: {} as any, systemRole: 'Prompt B' },
    });
    mockSessionStore({ agents: [agent1, agent2], isInit: true });
    mockAgentStore();

    const { default: AgentesPage } = await import('./page');
    render(<AgentesPage />);

    // Selección inicial: primer agente
    let textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Prompt A');

    // Click en el segundo agente de la lista
    const betoBtn = screen.getByRole('button', { name: /Beto/ });
    fireEvent.click(betoBtn);

    textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Prompt B');
  });

  it('badge GUARDADO EN LA NUBE visible en la sección Instrucciones', async () => {
    mockSessionStore({ agents: [buildAgentSession()], isInit: true });
    mockAgentStore();

    const { default: AgentesPage } = await import('./page');
    render(<AgentesPage />);

    // El badge existe y comunica al usuario que el prompt persiste real
    expect(screen.getByText('GUARDADO EN LA NUBE')).toBeInTheDocument();
    // Los mocks pendientes de backend muestran PRÓXIMAMENTE
    const proximamente = screen.getAllByText('PRÓXIMAMENTE');
    expect(proximamente.length).toBeGreaterThanOrEqual(2); // Métricas + Actividad
  });
});
