import { StateCreator } from 'zustand/vanilla';

import { getEventoDetalle } from '@/services/mcpApi/eventos';
import { ChatStore } from '@/store/chat/store';

interface ShowEventSectionData {
  eventoId: string;
  section: string;
}

/** Estado que consume el Portal (event-panel/Portal). */
export interface EventPanelState {
  error?: 'not_found' | 'fetch_failed';
  evento?: unknown;
  loading?: boolean;
  section?: string;
}

export interface ChatEventPanelAction {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  show_event_section: (id: string, data: ShowEventSectionData) => Promise<void>;
}

/** development del usuario (misma fuente que useAuthCheck: dev-user-config en localStorage). */
function resolveDevelopment(): string {
  if (typeof window === 'undefined') return 'bodasdehoy';
  try {
    const raw = localStorage.getItem('dev-user-config');
    const cfg = raw ? JSON.parse(raw) : null;
    return cfg?.development || 'bodasdehoy';
  } catch {
    return 'bodasdehoy';
  }
}

export const eventPanelSlice: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ChatEventPanelAction
> = (set, get) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  show_event_section: async (id, data) => {
    const { section, eventoId } = data ?? ({} as ShowEventSectionData);
    const { updatePluginState, openToolUI } = get();

    // Abrir el panel de inmediato en estado "cargando" (UX: no esperar al fetch).
    openToolUI(id, 'lobe-event-panel');
    await updatePluginState(id, { loading: true, section } as EventPanelState);

    if (!eventoId) {
      await updatePluginState(id, { error: 'not_found', section } as EventPanelState);
      return;
    }

    try {
      const evento = await getEventoDetalle(resolveDevelopment(), eventoId);
      // BUG#5 (api-mcp DB caída): distinguir "no encontrado" de "error de servidor"
      // no es posible aquí sin más señal → si no hay evento, marcarlo como not_found
      // (el consumer muestra estado honesto + reintento, no miente con datos vacíos).
      await updatePluginState(id, {
        error: evento ? undefined : 'not_found',
        evento: evento ?? undefined,
        loading: false,
        section,
      } as EventPanelState);
    } catch {
      await updatePluginState(id, { error: 'fetch_failed', loading: false, section } as EventPanelState);
    }
  },
});
