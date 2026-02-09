import { ModelRuntime } from '@lobechat/model-runtime';

import { createPayloadWithKeyVaults } from '../_auth';
import { getPythonBackendConfig } from '@/utils/checkPythonBackendConfig';

export interface InitializeWithClientStoreOptions {
  payload?: any;
  provider: string;
  runtimeProvider?: string;
}

/**
 * Initializes the AgentRuntime with the client store.
 * @param options.provider - Provider identifier used to resolve key vaults.
 * @param options.runtimeProvider - Actual runtime implementation key (defaults to provider).
 * @param options.payload - Additional initialization payload.
 * @returns The initialized AgentRuntime instance
 *
 * **Note**: if you try to fetch directly, use `fetchOnClient` instead.
 */
export const initializeWithClientStore = ({
  provider,
  runtimeProvider,
  payload,
}: InitializeWithClientStoreOptions) => {
  /**
   * Since #5267, we map parameters for client-fetch in function `getProviderAuthPayload`
   * which called by `createPayloadWithKeyVaults` below.
   * @see https://github.com/lobehub/lobe-chat/pull/5267
   * @file src/services/_auth.ts
   */
  const providerAuthPayload = { ...payload, ...createPayloadWithKeyVaults(provider) };

  // ✅ CORRECCIÓN: Si se usa backend Python y no hay apiKey, usar placeholder
  // El backend Python manejará las credenciales, pero ModelRuntime requiere apiKey
  const { USE_PYTHON_BACKEND, PYTHON_BACKEND_URL } = getPythonBackendConfig();

  // ✅ MEJORA: También aplicar cuando el provider es "auto" (auto-routing)
  // ✅ CRÍTICO: Aplicar SIEMPRE cuando se usa backend Python, independientemente del provider
  const shouldUsePlaceholder = USE_PYTHON_BACKEND && PYTHON_BACKEND_URL;

  if (shouldUsePlaceholder) {
    // ✅ Si se usa backend Python y no hay apiKey (o provider es "auto"), usar placeholder para evitar InvalidProviderAPIKey
    // El proxy se ejecutará ANTES de que ModelRuntime valide la key
    const resolvedRuntimeProvider = runtimeProvider || providerAuthPayload.runtimeProvider || provider;
    
    // Determinar placeholder según el provider
    let placeholderKey = 'sk-placeholder-for-python-backend-ignored-by-server-1234567890abcdef';
    
    if (resolvedRuntimeProvider === 'anthropic') {
      placeholderKey = 'sk-ant-api03-placeholder-for-python-backend-ignored-by-server-1234567890abcdef';
    } else if (resolvedRuntimeProvider === 'openai') {
      placeholderKey = 'sk-proj-placeholder-for-python-backend-ignored-by-server-1234567890abcdef';
    }
    
    console.log(`✅ Usando backend Python - provider: ${provider}, runtimeProvider: ${resolvedRuntimeProvider}, usando placeholder para API key (el backend manejará las credenciales)`);

    // Para providers que requieren apiKey, usar un valor placeholder que el backend Python ignorará
    // ✅ IMPORTANTE: También para "auto" porque el backend Python manejará el auto-routing
    if (provider !== 'ollama') {
      providerAuthPayload.apiKey = placeholderKey;
    }
  }

  const commonOptions = {
    // Allow OpenAI SDK and Anthropic SDK run on browser
    dangerouslyAllowBrowser: true,
  };
  /**
   * Configuration override order:
   * payload -> providerAuthPayload -> commonOptions
   */
  return ModelRuntime.initializeWithProvider(runtimeProvider ?? provider, {
    ...commonOptions,
    ...providerAuthPayload,
    ...payload,
  });
};
