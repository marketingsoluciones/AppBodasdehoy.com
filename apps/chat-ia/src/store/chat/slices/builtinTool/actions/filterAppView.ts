import { StateCreator } from 'zustand/vanilla';

import { ENTITY_TO_SECTION, useEventPanelStore } from '@/features/EventPanel/store';
import { ChatStore } from '@/store/chat/store';

interface FilterViewData {
  entity: string;
  ids?: string[];
  query?: string;
}

export interface ChatFilterAppViewAction {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  filter_view: (id: string, data: FilterViewData) => Promise<void>;
}

export const filterAppViewSlice: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ChatFilterAppViewAction
> = () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  filter_view: async (_id, data) => {
    if (typeof window === 'undefined') return;

    const { entity, ids, query } = data;

    if (!entity) return;

    // EMBEBIDO (chat-ia dentro del iframe de appEventos): avisar al parent para que
    // filtre su vista nativa. En STANDALONE window.parent === window → ese postMessage
    // no lo escucha nadie (audit F1). En ese caso, si la entidad es una sección de
    // evento (presupuesto/itinerario/servicios), abrir el PANEL CONTEXTUAL local (#7).
    const isEmbedded = window.parent !== window;
    const section = ENTITY_TO_SECTION[String(entity).toLowerCase()];

    if (!isEmbedded && section) {
      // ids[0] puede venir como id de evento; si no, el panel resuelve el evento actual.
      useEventPanelStore.getState().open(section, ids?.[0]);
      return;
    }

    window.parent.postMessage(
      {
        payload: { entity, ids: ids ?? [], query },
        source: 'copilot-chat',
        timestamp: Date.now(),
        type: 'FILTER_VIEW',
      },
      '*',
    );
  },
});
