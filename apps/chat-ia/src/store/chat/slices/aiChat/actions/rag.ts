import { chainRewriteQuery } from '@lobechat/prompts';
import { StateCreator } from 'zustand/vanilla';

const SPANISH_REWRITE_QUERY_PROMPT =
  'Dada la siguiente conversación y una pregunta de seguimiento, reformula la pregunta para que sea independiente (standalone), en el idioma original del usuario. ' +
  'Mantén todos los detalles posibles de los mensajes anteriores. ' +
  'Conserva nombres de entidades, cifras, fechas y cualquier dato específico. ' +
  'Si la pregunta ya es independiente, devuélvela tal cual.';

import { message } from '@/components/AntdStaticMethods';
import { chatService } from '@/services/chat';
import { ragService } from '@/services/rag';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { ChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';
import { toggleBooleanList } from '@/store/chat/utils';
import { useUserStore } from '@/store/user';
import { systemAgentSelectors } from '@/store/user/selectors';
import { ChatSemanticSearchChunk } from '@/types/chunk';

export interface ChatRAGAction {
  deleteUserMessageRagQuery: (id: string) => Promise<void>;
  /**
   * Retrieve chunks from semantic search
   */
  internal_retrieveChunks: (
    id: string,
    userQuery: string,
    messages: string[],
  ) => Promise<{ chunks: ChatSemanticSearchChunk[]; queryId?: string; rewriteQuery?: string }>;
  /**
   * Rewrite user content to better RAG query
   */
  internal_rewriteQuery: (id: string, content: string, messages: string[]) => Promise<string>;

  /**
   * Check if we should use RAG
   */
  internal_shouldUseRAG: () => boolean;
  internal_toggleMessageRAGLoading: (loading: boolean, id: string) => void;
  rewriteQuery: (id: string) => Promise<void>;
}

const knowledgeIds = () => agentSelectors.currentKnowledgeIds(useAgentStore.getState());
const hasEnabledKnowledge = () => agentSelectors.hasEnabledKnowledge(useAgentStore.getState());

export const chatRag: StateCreator<ChatStore, [['zustand/devtools', never]], [], ChatRAGAction> = (
  set,
  get,
) => ({
  deleteUserMessageRagQuery: async (id) => {
    const message = chatSelectors.getMessageById(id)(get());

    if (!message || !message.ragQueryId) return;

    // optimistic update the message's ragQuery
    get().internal_dispatchMessage({
      id,
      type: 'updateMessage',
      value: { ragQuery: null },
    });

    await ragService.deleteMessageRagQuery(message.ragQueryId);
    await get().refreshMessages();
  },

  internal_retrieveChunks: async (id, userQuery, messages) => {
    get().internal_toggleMessageRAGLoading(true, id);

    const message = chatSelectors.getMessageById(id)(get());

    // 1. get the rewrite query
    let rewriteQuery = message?.ragQuery as string | undefined;

    // if there is no ragQuery and there is a chat history
    // we need to rewrite the user message to get better results
    if (!message?.ragQuery && messages.length > 0) {
      rewriteQuery = await get().internal_rewriteQuery(id, userQuery, messages);
    }

    // 2. retrieve chunks from semantic search
    const files = chatSelectors.currentUserFiles(get()).map((f) => f.id);
    try {
      const { chunks, queryId } = await ragService.semanticSearchForChat({
        fileIds: knowledgeIds().fileIds.concat(files),
        knowledgeIds: knowledgeIds().knowledgeBaseIds,
        messageId: id,
        rewriteQuery: rewriteQuery || userQuery,
        userQuery,
      });

      get().internal_toggleMessageRAGLoading(false, id);

      return { chunks, queryId, rewriteQuery };
    } catch (e) {
      get().internal_toggleMessageRAGLoading(false, id);
      console.error('[RAG] semanticSearchForChat', e);
      const detail =
        typeof e === 'object' && e !== null && 'message' in e && typeof (e as any).message === 'string'
          ? (e as Error).message
          : String(e);
      message.error({
        content: `No se pudo consultar la base de conocimiento (KB). ${detail}`,
        duration: 12,
      });
      return { chunks: [], rewriteQuery };
    }
  },
  internal_rewriteQuery: async (id, content, messages) => {
    let rewriteQuery = content;

    const queryRewriteConfig = systemAgentSelectors.queryRewrite(useUserStore.getState());
    if (!queryRewriteConfig.enabled) return content;

    const rewriteQueryParams = {
      model: queryRewriteConfig.model,
      provider: queryRewriteConfig.provider,
      ...chainRewriteQuery(
        content,
        messages,
        queryRewriteConfig.customPrompt || SPANISH_REWRITE_QUERY_PROMPT,
      ),
    };

    let ragQuery = '';
    await chatService.fetchPresetTaskResult({
      onFinish: async (text) => {
        rewriteQuery = text;
      },

      onMessageHandle: (chunk) => {
        if (chunk.type !== 'text') return;
        ragQuery += chunk.text;

        get().internal_dispatchMessage({
          id,
          type: 'updateMessage',
          value: { ragQuery },
        });
      },
      params: rewriteQueryParams,
    });

    return rewriteQuery;
  },
  internal_shouldUseRAG: () => {
    //  if there is enabled knowledge, try with ragQuery
    return hasEnabledKnowledge();
  },

  internal_toggleMessageRAGLoading: (loading, id) => {
    set(
      {
        messageRAGLoadingIds: toggleBooleanList(get().messageRAGLoadingIds, id, loading),
      },
      false,
      'internal_toggleMessageLoading',
    );
  },

  rewriteQuery: async (id) => {
    const message = chatSelectors.getMessageById(id)(get());
    if (!message) return;

    // delete the current ragQuery
    await get().deleteUserMessageRagQuery(id);

    const chats = chatSelectors.mainAIChatsWithHistoryConfig(get());

    await get().internal_rewriteQuery(
      id,
      message.content,
      chats.map((m) => m.content),
    );
  },
});
