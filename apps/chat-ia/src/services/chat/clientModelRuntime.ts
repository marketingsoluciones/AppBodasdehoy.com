import { getPythonBackendConfig } from '@/utils/checkPythonBackendConfig';

import { createPayloadWithKeyVaults } from '../_auth';

export interface InitializeWithClientStoreOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
  provider: string;
  runtimeProvider?: string;
}

/**
 * Initializes the AgentRuntime with the client store.
 *
 * SPRINT-Q 2026-05-20: ModelRuntime ahora cargado via dynamic import (NO estático).
 * El bundle inicial /chat ya no incluye @lobechat/model-runtime ni sus 66 providers
 * (~3.3MB). La carga lazy ocurre solo cuando un provider está configurado como
 * `fetchOnClient: true` (Ollama, LM Studio local, etc).
 *
 * Para chat-ia bodasdehoy (USE_PYTHON_BACKEND=true por defecto), el flujo NORMAL
 * usa el proxy /webapi/chat/[provider] → api-ia, sin instanciar ModelRuntime cliente.
 *
 * @param options.provider - Provider identifier used to resolve key vaults.
 * @param options.runtimeProvider - Actual runtime implementation key (defaults to provider).
 * @param options.payload - Additional initialization payload.
 * @returns The initialized AgentRuntime instance.
 */
export const initializeWithClientStore = async ({
  provider,
  runtimeProvider,
  payload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: InitializeWithClientStoreOptions): Promise<any> => {
  /**
   * Since #5267, parameters for client-fetch are mapped in `getProviderAuthPayload`
   * called by `createPayloadWithKeyVaults`.
   * @file src/services/_auth.ts
   */
  const providerAuthPayload = { ...payload, ...createPayloadWithKeyVaults(provider) };

  // Backend Python placeholder: ModelRuntime exige apiKey, pero el backend la ignora.
  const { USE_PYTHON_BACKEND, PYTHON_BACKEND_URL } = getPythonBackendConfig();
  const shouldUsePlaceholder = USE_PYTHON_BACKEND && PYTHON_BACKEND_URL;

  if (shouldUsePlaceholder) {
    const resolvedRuntimeProvider =
      runtimeProvider || providerAuthPayload.runtimeProvider || provider;

    let placeholderKey =
      'sk-placeholder-for-python-backend-ignored-by-server-1234567890abcdef';

    if (resolvedRuntimeProvider === 'anthropic') {
      placeholderKey =
        'sk-ant-api03-placeholder-for-python-backend-ignored-by-server-1234567890abcdef';
    } else if (resolvedRuntimeProvider === 'openai') {
      placeholderKey =
        'sk-proj-placeholder-for-python-backend-ignored-by-server-1234567890abcdef';
    }

    if (provider !== 'ollama') {
      providerAuthPayload.apiKey = placeholderKey;
    }
  }

  // commonOptions y providerAuthPayload preparados pero NO usados —
  // refactor runtime-only-api-ia 24-jun-2026: el package @lobechat/model-runtime
  // fue eliminado (api-ia centraliza modelos). Esta función nunca se invoca en
  // el flujo normal: el chat NORMAL pasa por /webapi/chat/[provider] → api-ia,
  // sin instanciar runtime cliente. Solo se llamaba con fetchOnClient=true
  // (Ollama/LM Studio local), que NO usamos en bodasdehoy. Lanzamos error
  // claro si alguien intenta invocar — la rama era código muerto en prod.
  void providerAuthPayload;
  void runtimeProvider;
  throw new Error(
    '[clientModelRuntime] eliminado en refactor runtime-only-api-ia. ' +
      'api-ia centraliza modelos — usa /webapi/chat/[provider] o /chat/structured. ' +
      `Provider intentado: ${provider}`,
  );
};
