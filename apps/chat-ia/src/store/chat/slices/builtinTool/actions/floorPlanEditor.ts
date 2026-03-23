import { StateCreator } from 'zustand/vanilla';

import { generateTableSVG, tableToDataURL } from '@bodasdehoy/shared/utils';
import type { TableConfig, TableShape } from '@bodasdehoy/shared/utils';

import { ChatStore } from '@/store/chat/store';

interface OpenFloorPlanData {
  eventId?: string;
  tableType?: string;
  seats?: number;
  tableCount?: number;
  label?: string;
}

interface SuggestTableConfigData {
  tableType: string;
  seats: number;
  label?: string;
}

export interface ChatFloorPlanEditorAction {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  open_floor_plan_editor: (id: string, data: OpenFloorPlanData) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  suggest_table_config: (id: string, data: SuggestTableConfigData) => Promise<void>;
}

export const floorPlanEditorSlice: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ChatFloorPlanEditorAction
> = (set, get) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  open_floor_plan_editor: async (id, data) => {
    if (typeof window === 'undefined') return;

    window.parent.postMessage(
      {
        payload: {
          eventId: data.eventId,
          suggestedConfig: {
            tableType: data.tableType,
            seats: data.seats,
            tableCount: data.tableCount,
            label: data.label,
          },
        },
        source: 'copilot-chat',
        timestamp: Date.now(),
        type: 'OPEN_FLOOR_PLAN',
      },
      '*',
    );
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  suggest_table_config: async (id, data) => {
    if (typeof window === 'undefined') return;

    try {
      const config: TableConfig = {
        shape: (data.tableType as TableShape) ?? 'round',
        seats: data.seats,
        tableName: data.label,
        showNumber: true,
        showName: !!data.label,
      };

      const svgString = generateTableSVG(config);
      const svgDataUrl = tableToDataURL(svgString);

      const preview = [
        {
          svgDataUrl,
          tableType: data.tableType,
          seats: data.seats,
          label: data.label,
        },
      ];

      // Actualizar el mensaje con el contenido del preview (patrón venueVisualizer)
      await get().internal_updateMessageContent(id, JSON.stringify(preview));
    } catch (e) {
      console.error('[FloorPlanEditor] Error generando SVG:', e);
    }
  },
});
