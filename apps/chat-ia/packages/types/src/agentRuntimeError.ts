/* eslint-disable sort-keys-fix/sort-keys-fix */
/**
 * Agent Runtime errors — movidos desde @lobechat/model-runtime/src/types/error.ts
 * a @lobechat/types (2026-05-19) para romper la dep cruzada types ↔ model-runtime
 * y permitir tree-shaking de model-runtime del bundle chat-ia.
 *
 * model-runtime re-exporta estos símbolos desde aquí para backward compat.
 */
export const AgentRuntimeErrorType = {
  AgentRuntimeError: 'AgentRuntimeError',
  LocationNotSupportError: 'LocationNotSupportError',

  QuotaLimitReached: 'QuotaLimitReached',
  InsufficientQuota: 'InsufficientQuota',

  ModelNotFound: 'ModelNotFound',

  PermissionDenied: 'PermissionDenied',
  ExceededContextWindow: 'ExceededContextWindow',

  InvalidProviderAPIKey: 'InvalidProviderAPIKey',
  ProviderBizError: 'ProviderBizError',

  InvalidOllamaArgs: 'InvalidOllamaArgs',
  OllamaBizError: 'OllamaBizError',
  OllamaServiceUnavailable: 'OllamaServiceUnavailable',

  InvalidComfyUIArgs: 'InvalidComfyUIArgs',
  ComfyUIBizError: 'ComfyUIBizError',
  ComfyUIServiceUnavailable: 'ComfyUIServiceUnavailable',
  ComfyUIEmptyResult: 'ComfyUIEmptyResult',
  ComfyUIUploadFailed: 'ComfyUIUploadFailed',
  ComfyUIWorkflowError: 'ComfyUIWorkflowError',
  ComfyUIModelError: 'ComfyUIModelError',

  InvalidBedrockCredentials: 'InvalidBedrockCredentials',
  InvalidVertexCredentials: 'InvalidVertexCredentials',
  StreamChunkError: 'StreamChunkError',

  InvalidGithubToken: 'InvalidGithubToken',

  ConnectionCheckFailed: 'ConnectionCheckFailed',

  /**
   * @deprecated
   */
  NoOpenAIAPIKey: 'NoOpenAIAPIKey',
} as const;

export const AGENT_RUNTIME_ERROR_SET = new Set<string>(Object.values(AgentRuntimeErrorType));

export type ILobeAgentRuntimeErrorType =
  (typeof AgentRuntimeErrorType)[keyof typeof AgentRuntimeErrorType];

/**
 * Payload types — movidos desde @lobechat/model-runtime/src/types/type.ts
 * 2026-05-20 SPRINT-Q Fase A.
 */
export interface AgentInitErrorPayload {
  error: object;
  errorType: string | number;
}

export interface ChatCompletionErrorPayload {
  [key: string]: any;
  endpoint?: string;
  error: object;
  errorType: ILobeAgentRuntimeErrorType;
  provider: string;
}

export interface CreateImageErrorPayload {
  error: object;
  errorType: ILobeAgentRuntimeErrorType;
  provider: string;
}

/**
 * AgentRuntimeError helper — movido desde @lobechat/model-runtime/src/utils/createError.ts
 * 2026-05-20 SPRINT-Q Fase A. Solo factory functions sin runtime deps.
 */
export const AgentRuntimeError = {
  chat: (error: ChatCompletionErrorPayload): ChatCompletionErrorPayload => error,
  createError: (
    errorType: ILobeAgentRuntimeErrorType | string | number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error?: any,
  ): AgentInitErrorPayload => ({ error, errorType }),
  createImage: (error: CreateImageErrorPayload): CreateImageErrorPayload => error,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  textToImage: (error: any): any => error,
};
