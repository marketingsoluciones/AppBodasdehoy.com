import type { ChatInputEditor } from '@/features/ChatInput';

export interface MainSendMessageOperation {
  abortController?: AbortController | null;
  inputEditorTempState?: any | null;
  inputSendErrorMsg?: string;
  isLoading: boolean;
}

export interface ChatAIChatState {
  /**
   * is the AI message is generating
   */
  chatLoadingIds: string[];
  chatLoadingIdsAbortController?: AbortController;
  inputFiles: File[];
  inputMessage: string;
  mainInputEditor: ChatInputEditor | null;
  /**
   * sendMessageInServer operations map, keyed by sessionId|topicId
   * Contains both loading state and AbortController
   */
  mainSendMessageOperations: Record<string, MainSendMessageOperation>;
  messageInToolsCallingIds: string[];
  /**
   * is the message is in RAG flow
   */
  messageRAGLoadingIds: string[];
  /**
   * Whether the chat is running in negative balance (debt) mode.
   * When true, the user can continue chatting even with balance <= 0.
   * A non-blocking warning banner is shown instead of a blocking modal.
   */
  negativeBalanceMode: boolean;
  pluginApiLoadingIds: string[];
  /**
   * is the AI message is reasoning
   */
  reasoningLoadingIds: string[];
  searchWorkflowLoadingIds: string[];
  /**
   * Whether the insufficient balance modal should be shown
   * Triggered when the backend returns a 402 insufficient_balance error
   */
  showInsufficientBalance: boolean;
  /**
   * Whether the login required modal should be shown
   * Triggered when api-ia returns 401 (community user without auth hitting the limit)
   */
  showLoginRequired: boolean;
  threadInputEditor: ChatInputEditor | null;
  /**
   * the tool calling stream ids
   */
  toolCallingStreamIds: Record<string, boolean[]>;
}

export const initialAiChatState: ChatAIChatState = {
  chatLoadingIds: [],
  inputFiles: [],
  inputMessage: '',
  mainInputEditor: null,
  mainSendMessageOperations: {},
  messageInToolsCallingIds: [],
  messageRAGLoadingIds: [],
  negativeBalanceMode: false,
  pluginApiLoadingIds: [],
  reasoningLoadingIds: [],
  searchWorkflowLoadingIds: [],
  showInsufficientBalance: false,
  showLoginRequired: false,
  threadInputEditor: null,
  toolCallingStreamIds: {},
};
