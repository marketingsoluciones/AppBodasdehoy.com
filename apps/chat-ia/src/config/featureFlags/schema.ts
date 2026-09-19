/* eslint-disable sort-keys-fix/sort-keys-fix */
import { z } from 'zod';

// Define a union type for feature flag values: either boolean or array of user IDs
const FeatureFlagValue = z.union([z.boolean(), z.array(z.string())]);

export const FeatureFlagsSchema = z.object({
  check_updates: FeatureFlagValue.optional(),
  pin_list: FeatureFlagValue.optional(),

  // settings
  language_model_settings: FeatureFlagValue.optional(),
  provider_settings: FeatureFlagValue.optional(),

  openai_api_key: FeatureFlagValue.optional(),
  openai_proxy_url: FeatureFlagValue.optional(),

  // profile
  api_key_manage: FeatureFlagValue.optional(),

  create_session: FeatureFlagValue.optional(),
  edit_agent: FeatureFlagValue.optional(),

  plugins: FeatureFlagValue.optional(),
  dalle: FeatureFlagValue.optional(),
  ai_image: FeatureFlagValue.optional(),
  speech_to_text: FeatureFlagValue.optional(),
  token_counter: FeatureFlagValue.optional(),

  welcome_suggest: FeatureFlagValue.optional(),
  changelog: FeatureFlagValue.optional(),

  clerk_sign_up: FeatureFlagValue.optional(),

  market: FeatureFlagValue.optional(),
  knowledge_base: FeatureFlagValue.optional(),

  rag_eval: FeatureFlagValue.optional(),

  // internal flag
  cloud_promotion: FeatureFlagValue.optional(),

  group_chat: FeatureFlagValue.optional(),

  // the flags below can only be used with commercial license
  // if you want to use it in the commercial usage
  // please contact us for more information: hello@lobehub.com
  commercial_hide_github: FeatureFlagValue.optional(),
  commercial_hide_docs: FeatureFlagValue.optional(),
});

export type IFeatureFlags = z.infer<typeof FeatureFlagsSchema>;

/**
 * Evaluate a feature flag value against a user ID
 * @param flagValue - The feature flag value (boolean or array of user IDs)
 * @param userId - The current user ID
 * @returns boolean indicating if the feature is enabled for the user
 */
export const evaluateFeatureFlag = (
  flagValue: boolean | string[] | undefined,
  userId?: string,
): boolean | undefined => {
  if (typeof flagValue === 'boolean') return flagValue;

  if (Array.isArray(flagValue)) {
    return userId ? flagValue.includes(userId) : false;
  }
};

export const DEFAULT_FEATURE_FLAGS: IFeatureFlags = {
  // REACTIVADO 2026-06-12: probar todo sin perder funcionalidad (REGLA 0). Según plan se ajustará.
  pin_list: true,

  language_model_settings: true,
  provider_settings: true,

  openai_api_key: true,
  openai_proxy_url: true,

  // REACTIVADO 2026-06-12: probar todo (gestión de API keys en settings).
  api_key_manage: true,

  create_session: true,
  edit_agent: true,

  plugins: true,
  // dalle SE MANTIENE: es la tool de generar imágenes EN el chat (builtin tool, sí se usa).
  dalle: true,
  // ai_image (página /image standalone): REACTIVADO 2026-06-12 para probar todo.
  // Backend api-ia /webapi/text-to-image verificado (200). El plan de extraer a visor
  // genérico se hará después; mientras, no perder funcionalidad (REGLA 0).
  ai_image: true,

  check_updates: true,
  welcome_suggest: true,
  token_counter: true,

  // Knowledge/RAG: REACTIVADO 2026-06-12 para probar todo (REGLA 0 — no perder funcionalidad).
  // ⚠️ Requiere re-registrar chunkRouter en server/routers/lambda/index.ts (RAG nativo) para que
  // el backend responda; api-ia /lobechat-kb tiene bugs pendientes (IA-1..3). El plan de migrar
  // a api-mcp KB se hará cuando api-ia esté listo. Ver docs/ANALISIS-FEATURES-DESACTIVADAS.md.
  knowledge_base: true,
  rag_eval: true,

  clerk_sign_up: true,

  cloud_promotion: false,

  // Discover/Marketplace: REACTIVADO 2026-06-12 para probar todo. Es el marketplace genérico
  // de LobeHub (hub público). El plan de marketplace PROPIO del cliente se hará después.
  market: true,
  speech_to_text: true,
  changelog: true,

  // REACTIVADO 2026-06-12 para probar todo (chat grupal multi-agente).
  group_chat: true,

  // the flags below can only be used with commercial license
  // if you want to use it in the commercial usage
  // please contact us for more information: hello@lobehub.com
  commercial_hide_github: false,
  commercial_hide_docs: false,
};

export const mapFeatureFlagsEnvToState = (config: IFeatureFlags, userId?: string) => {
  return {
    isAgentEditable: evaluateFeatureFlag(config.edit_agent, userId),

    showCreateSession: evaluateFeatureFlag(config.create_session, userId),
    enableGroupChat: evaluateFeatureFlag(config.group_chat, userId),
    showLLM: evaluateFeatureFlag(config.language_model_settings, userId),
    showProvider: evaluateFeatureFlag(config.provider_settings, userId),
    showPinList: evaluateFeatureFlag(config.pin_list, userId),

    showOpenAIApiKey: evaluateFeatureFlag(config.openai_api_key, userId),
    showOpenAIProxyUrl: evaluateFeatureFlag(config.openai_proxy_url, userId),

    showApiKeyManage: evaluateFeatureFlag(config.api_key_manage, userId),

    enablePlugins: evaluateFeatureFlag(config.plugins, userId),
    showDalle: evaluateFeatureFlag(config.dalle, userId),
    showAiImage: evaluateFeatureFlag(config.ai_image, userId),
    showChangelog: evaluateFeatureFlag(config.changelog, userId),

    enableCheckUpdates: evaluateFeatureFlag(config.check_updates, userId),
    showWelcomeSuggest: evaluateFeatureFlag(config.welcome_suggest, userId),

    enableClerkSignUp: evaluateFeatureFlag(config.clerk_sign_up, userId),

    enableKnowledgeBase: evaluateFeatureFlag(config.knowledge_base, userId),
    enableRAGEval: evaluateFeatureFlag(config.rag_eval, userId),

    showCloudPromotion: evaluateFeatureFlag(config.cloud_promotion, userId),

    showMarket: evaluateFeatureFlag(config.market, userId),
    enableSTT: evaluateFeatureFlag(config.speech_to_text, userId),

    hideGitHub: evaluateFeatureFlag(config.commercial_hide_github, userId),
    hideDocs: evaluateFeatureFlag(config.commercial_hide_docs, userId),
  };
};

export type IFeatureFlagsState = ReturnType<typeof mapFeatureFlagsEnvToState>;
