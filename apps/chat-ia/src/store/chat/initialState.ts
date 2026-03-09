// sort-imports-ignore
import { ChatToolState, initialToolState } from './slices/builtinTool/initialState';
import { ChatPortalState, initialChatPortalState } from './slices/portal/initialState';
import { ChatMessageState, initialMessageState } from './slices/message/initialState';
import { ChatTopicState, initialTopicState } from './slices/topic/initialState';
import { ChatAIChatState, initialAiChatState } from './slices/aiChat/initialState';
import { ChatThreadState, initialThreadState } from './slices/thread/initialState';
import { ExternalChatState, initialExternalChatState } from './slices/externalChat/initialState';

export type ChatStoreState = ChatTopicState &
  ChatMessageState &
  ChatAIChatState &
  ChatToolState &
  ChatThreadState &
  ChatPortalState &
  ExternalChatState;

export const initialState: ChatStoreState = {
  ...initialMessageState,
  ...initialAiChatState,
  ...initialTopicState,
  ...initialToolState,
  ...initialThreadState,
  ...initialChatPortalState,
  ...initialExternalChatState,

  // cloud
};
