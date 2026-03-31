import { StateCreator } from 'zustand/vanilla';

import { generateTableSVG, tableToDataURL } from '@bodasdehoy/shared/utils';
import type { TableConfig, TableShape } from '@bodasdehoy/shared/utils';

import { ChatStore } from '@/store/chat/store';

interface OpenFloorPlanData {
  eventId?: string;
  label?: string;
  seats?: number;
  tableCount?: number;
  tableType?: string;
}

interface SuggestTableConfigData {
  label?: string;
  seats: number;
  tableType: string;
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
            label: data.label,
            seats: data.seats,
            tableCount: data.tableCount,
            tableType: data.tableType,
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
        seats: data.seats,
        shape: (data.tableType as TableShape) ?? 'round',
        showName: !!data.label,
        showNumber: true,
        tableName: data.label,
      };

      const svgString = generateTableSVG(config);
      const svgDataUrl = tableToDataURL(svgString);

      const preview = [
        {
          label: data.label,
          seats: data.seats,
          svgDataUrl,
          tableType: data.tableType,
        },
      ];

      // Actualizar el mensaje con el contenido del preview (patrón venueVisualizer)
      await get().internal_updateMessageContent(id, JSON.stringify(preview));
    } catch (e) {
      console.error('[FloorPlanEditor] Error generando SVG:', e);
    }
  },
});
