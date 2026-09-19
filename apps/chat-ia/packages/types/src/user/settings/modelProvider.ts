import { AiFullModelCard, ModelProvider } from 'model-bank';

// Inline ModelProviderKey (antes en @lobechat/model-runtime — package eliminado
// refactor runtime-only-api-ia 24-jun-2026, api-ia centraliza modelos).
// Mantenemos la definición original (lowercase del enum ModelProvider de
// model-bank) para que i18next typed-keys siga reconociendo los slots.
type ModelProviderKey = Lowercase<keyof typeof ModelProvider>;

import { ChatModelCard } from '../../llm';

export interface ProviderConfig {
  /**
   * whether to auto fetch model lists
   */
  autoFetchModelLists?: boolean;
  /**
   * user defined model cards
   */
  customModelCards?: ChatModelCard[];
  enabled: boolean;
  /**
   * enabled models id
   */
  enabledModels?: string[] | null;
  /**
   * whether fetch on client
   */
  fetchOnClient?: boolean;
  /**
   * the latest fetch model list time
   */
  latestFetchTime?: number;
  /**
   * fetched models from provider side
   */
  remoteModelCards?: ChatModelCard[];
  serverModelLists?: AiFullModelCard[];
}

export type GlobalLLMProviderKey = ModelProviderKey;

export type UserModelProviderConfig = Record<ModelProviderKey, ProviderConfig>;
