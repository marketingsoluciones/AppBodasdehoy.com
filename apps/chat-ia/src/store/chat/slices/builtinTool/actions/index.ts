import { StateCreator } from 'zustand/vanilla';

import { ChatStore } from '@/store/chat/store';

import { ChatDallEAction, dalleSlice } from './dalle';
import { ChatFilterAppViewAction, filterAppViewSlice } from './filterAppView';
import { ChatFloorPlanEditorAction, floorPlanEditorSlice } from './floorPlanEditor';
import { ChatCodeInterpreterAction, codeInterpreterSlice } from './interpreter';
import { SearchAction, searchSlice } from './search';
import { ChatVenueVisualizerAction, venueVisualizerSlice } from './venueVisualizer';

// SPRINT-M 2026-05-19: LocalFileAction / localSystemSlice eliminados.
// La tool local-system es desktop-only — bodasdehoy es web.

export interface ChatBuiltinToolAction
  extends ChatDallEAction,
    SearchAction,
    ChatCodeInterpreterAction,
    ChatVenueVisualizerAction,
    ChatFilterAppViewAction,
    ChatFloorPlanEditorAction {}

export const chatToolSlice: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ChatBuiltinToolAction
> = (...params) => ({
  ...dalleSlice(...params),
  ...searchSlice(...params),
  ...codeInterpreterSlice(...params),
  ...venueVisualizerSlice(...params),
  ...filterAppViewSlice(...params),
  ...floorPlanEditorSlice(...params),
});
