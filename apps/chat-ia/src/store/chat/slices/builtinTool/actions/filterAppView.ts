import { StateCreator } from 'zustand/vanilla';

import { ChatStore } from '@/store/chat/store';
import { setNamespace } from '@/utils/storeDebug';

const n = setNamespace('tool');

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
> = (set, get) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  filter_view: async (_id, data) => {
    if (typeof window === 'undefined') return;

    const { entity, ids, query } = data;

    if (!entity) return;

    window.parent.postMessage(
      {
        payload: { entity, ids: ids ?? [], query },
        source: 'copilot-chat',
        timestamp: Date.now(),
        type: 'FILTER_VIEW',
      },
      '*',
    );

    console.log('[FilterAppView] FILTER_VIEW enviado:', { entity, ids: ids?.length ?? 0, query });
  },
});
