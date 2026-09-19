import { produce } from 'immer';
import { StateCreator } from 'zustand/vanilla';

import { generateVenueDesign } from '@/services/venueImageService';
import { chatSelectors } from '@/store/chat/selectors';
import { ChatStore } from '@/store/chat/store';
import { VenueVisualizerItem } from '@/types/tool/venueVisualizer';
import { setNamespace } from '@/utils/storeDebug';

const n = setNamespace('tool');

export interface ChatVenueVisualizerAction {
  generateVenueVisualization: (item: VenueVisualizerItem, messageId: string) => Promise<void>;
  toggleVenueLoading: (key: string, value: boolean) => void;
  updateVenueItem: (id: string, updater: (data: VenueVisualizerItem[]) => void) => Promise<void>;
  // apiName used by invokeBuiltinTool (must match the api name in the manifest)
  // eslint-disable-next-line @typescript-eslint/naming-convention
  visualize_venue: (id: string, data: VenueVisualizerItem[]) => Promise<void>;
}

export const venueVisualizerSlice: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ChatVenueVisualizerAction
> = (set, get) => ({
  generateVenueVisualization: async (item, messageId) => {
    const { toggleVenueLoading, updateVenueItem } = get();

    const loadingKey = messageId + item.style + item.roomType;
    toggleVenueLoading(loadingKey, true);

    try {
      const result = await generateVenueDesign({
        imageUrl: item.originalUrl,
        prompt: item.prompt,
        roomType: item.roomType,
        style: item.style,
      });

      if (result.error) {
        await updateVenueItem(messageId, (draft) => {
          const target = draft.find(
            (d) => d.style === item.style && d.roomType === item.roomType,
          );
          if (target) target.error = result.error;
        });
      } else {
        await updateVenueItem(messageId, (draft) => {
          const target = draft.find(
            (d) => d.style === item.style && d.roomType === item.roomType,
          );
          if (target) {
            target.generatedUrl = result.url;
            target.provider = result.provider;
          }
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      await updateVenueItem(messageId, (draft) => {
        const target = draft.find(
          (d) => d.style === item.style && d.roomType === item.roomType,
        );
        if (target) target.error = msg;
      });
    } finally {
      toggleVenueLoading(loadingKey, false);
    }
  },

  toggleVenueLoading: (key, value) => {
    set(
      { venueImageLoading: { ...get().venueImageLoading, [key]: value } },
      false,
      n('toggleVenueLoading'),
    );
  },

  updateVenueItem: async (id, updater) => {
    const message = chatSelectors.getMessageById(id)(get());
    if (!message) return;

    const data: VenueVisualizerItem[] = JSON.parse(message.content);
    const nextContent = produce(data, updater);
    await get().internal_updateMessageContent(id, JSON.stringify(nextContent));
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  visualize_venue: async (id, data) => {
    const { generateVenueVisualization } = get();
    await Promise.all(data.map((item) => generateVenueVisualization(item, id)));
  },
});
