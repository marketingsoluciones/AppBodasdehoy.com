import { LOBE_CHAT_AUTH_HEADER, isDeprecatedEdition } from '@lobechat/const';
import {
  AWSBedrockKeyVault,
  AzureOpenAIKeyVault,
  ClientSecretPayload,
  CloudflareKeyVault,
  ComfyUIKeyVault,
  OpenAICompatibleKeyVault,
  VertexAIKeyVault,
} from '@lobechat/types';
import { clientApiKeyManager } from '@lobechat/utils/client';
import { ModelProvider } from 'model-bank';

import { aiProviderSelectors, useAiInfraStore } from '@/store/aiInfra';
import { useUserStore } from '@/store/user';
import { keyVaultsConfigSelectors, userProfileSelectors } from '@/store/user/selectors';
import { obfuscatePayloadWithXOR } from '@/utils/client/xor-obfuscation';

import { resolveRuntimeProvider } from './chat/helper';
import { getPythonBackendConfig } from '@/utils/checkPythonBackendConfig';

export const getProviderAuthPayload = (
  provider: string,
  keyVaults: OpenAICompatibleKeyVault &
    AzureOpenAIKeyVault &
    AWSBedrockKeyVault &
    CloudflareKeyVault &
    ComfyUIKeyVault &
    VertexAIKeyVault,
) => {
  switch (provider) {
    case ModelProvider.Bedrock: {
      const { accessKeyId, region, secretAccessKey, sessionToken } = keyVaults;

      const awsSecretAccessKey = secretAccessKey;
      const awsAccessKeyId = accessKeyId;

      const apiKey = (awsSecretAccessKey || '') + (awsAccessKeyId || '');

      return {
        accessKeyId,
        accessKeySecret: awsSecretAccessKey,
        apiKey,
        /** @deprecated */
        awsAccessKeyId,
        /** @deprecated */
        awsRegion: region,
        /** @deprecated */
        awsSecretAccessKey,
        /** @deprecated */
        awsSessionToken: sessionToken,
        region,
        sessionToken,
      };
    }

    case ModelProvider.Azure: {
      return {
        apiKey: clientApiKeyManager.pick(keyVaults.apiKey),

        apiVersion: keyVaults.apiVersion,
        /** @deprecated */
        azureApiVersion: keyVaults.apiVersion,
        baseURL: keyVaults.baseURL || keyVaults.endpoint,
      };
    }

    case ModelProvider.Ollama: {
      return { baseURL: keyVaults?.baseURL };
    }

    case ModelProvider.Cloudflare: {
      return {
        apiKey: clientApiKeyManager.pick(keyVaults?.apiKey),

        baseURLOrAccountID: keyVaults?.baseURLOrAccountID,
        /** @deprecated */
        cloudflareBaseURLOrAccountID: keyVaults?.baseURLOrAccountID,
      };
    }

    case ModelProvider.ComfyUI: {
      return {
        apiKey: keyVaults?.apiKey,
        authType: keyVaults?.authType,
        baseURL: keyVaults?.baseURL,
        customHeaders: keyVaults?.customHeaders,
        password: keyVaults?.password,
        username: keyVaults?.username,
      };
    }

    case ModelProvider.VertexAI: {
      // Vertex AI uses JSON credentials, should not split by comma
      return {
        apiKey: keyVaults?.apiKey,
        baseURL: keyVaults?.baseURL,
        vertexAIRegion: keyVaults?.region,
      };
    }

    default: {
      return { apiKey: clientApiKeyManager.pick(keyVaults?.apiKey), baseURL: keyVaults?.baseURL };
    }
  }
};

const createAuthTokenWithPayload = (payload = {}) => {
  const accessCode = keyVaultsConfigSelectors.password(useUserStore.getState());
  const userId = userProfileSelectors.userId(useUserStore.getState());

  return obfuscatePayloadWithXOR<ClientSecretPayload>({ accessCode, userId, ...payload });
};

interface AuthParams {
  // eslint-disable-next-line no-undef
  headers?: HeadersInit;
  payload?: Record<string, any>;
  provider?: string;
}

export const createPayloadWithKeyVaults = (provider: string) => {
  // ✅ Si se usa el backend Python, no requerir API Keys en el cliente
  // El backend Python maneja las credenciales desde MCP
  const { USE_PYTHON_BACKEND, PYTHON_BACKEND_URL } = getPythonBackendConfig();

  // ✅ CRÍTICO: Aplicar placeholder SIEMPRE cuando se usa backend Python
  // Esto evita que ModelRuntime valide API keys en el cliente
  const shouldUseBackendPython = USE_PYTHON_BACKEND && PYTHON_BACKEND_URL;

  if (shouldUseBackendPython) {
    // Cuando se usa backend Python, retornar payload con placeholder válido
    // El backend Python obtendrá las credenciales desde MCP y ignorará el placeholder
    const runtimeProvider = resolveRuntimeProvider(provider);

    // ✅ IMPORTANTE: Usar un formato que pase la validación básica de ModelRuntime
    // Para OpenAI/Anthropic, el formato debe ser "sk-..." o similar
    // Usamos un formato que parece válido pero que el backend Python ignorará
    let placeholderKey = 'sk-placeholder-for-python-backend-ignored-by-server-1234567890abcdef';

    // Si el runtimeProvider es Anthropic, usar formato específico de Anthropic
    if (runtimeProvider === 'anthropic') {
      // Formato Anthropic: sk-ant-api03-...
      placeholderKey = 'sk-ant-api03-placeholder-for-python-backend-ignored-by-server-1234567890abcdef';
    } else if (runtimeProvider === 'openai') {
      // Formato OpenAI: sk-proj-... o sk-...
      placeholderKey = 'sk-proj-placeholder-for-python-backend-ignored-by-server-1234567890abcdef';
    }

    console.log(`✅ Backend Python activado - provider: ${provider}, runtimeProvider: ${runtimeProvider}, usando placeholder para API key`);

    return {
      // ✅ Incluir placeholder para evitar validación de ModelRuntime
// El backend Python ignorará este valor y usará las keys del whitelabel
apiKey: placeholderKey,


      runtimeProvider,
    };
  }

  let keyVaults = {};

  // TODO: remove this condition in V2.0
  if (isDeprecatedEdition) {
    keyVaults = keyVaultsConfigSelectors.getVaultByProvider(provider as any)(
      useUserStore.getState(),
    );
  } else {
    keyVaults = aiProviderSelectors.providerKeyVaults(provider)(useAiInfraStore.getState()) || {};
  }

  const runtimeProvider = resolveRuntimeProvider(provider);

  return {
    ...getProviderAuthPayload(runtimeProvider, keyVaults as any),
    runtimeProvider,
  };
};

export const createXorKeyVaultsPayload = (provider: string) => {
  const payload = createPayloadWithKeyVaults(provider);
  return obfuscatePayloadWithXOR(payload);
};

// eslint-disable-next-line no-undef
export const createHeaderWithAuth = async (params?: AuthParams): Promise<HeadersInit> => {
  let payload = params?.payload || {};

  if (params?.provider) {
    payload = { ...payload, ...createPayloadWithKeyVaults(params?.provider) };
  }

  const token = createAuthTokenWithPayload(payload);

  // ✅ CRÍTICO: Incluir JWT token de nuestro sistema de auth (Firebase/MCP)
  // Esto permite que el backend Python identifique al usuario
  const headers: Record<string, string> = { [LOBE_CHAT_AUTH_HEADER]: token };
  if (params?.headers) Object.assign(headers, params.headers as Record<string, string>);

  // Obtener JWT de localStorage si está disponible y NO está expirado
  if (typeof window !== 'undefined') {
    // Verificar expiración antes de incluir el JWT
    const isJwtExpired = (): boolean => {
      const expiresAt =
        localStorage.getItem('mcp_jwt_expires_at') || localStorage.getItem('api2_jwt_expires_at');
      if (!expiresAt) return false;
      return new Date(expiresAt) <= new Date();
    };

    if (isJwtExpired()) {
      // Sesión expirada: no incluir JWT para evitar que api-ia devuelva datos privados
      // con un token caducado que el servidor aún no ha invalidado.
      console.warn('⚠️ [createHeaderWithAuth] JWT expirado — Authorization header OMITIDO. Disparando evento session-expired.');
      window.dispatchEvent(new CustomEvent('mcp:token-expired'));
      // Añadir header para que route.ts lo detecte y bloquee antes de llegar a api-ia
      (headers as Record<string, string>)['X-Session-Expired'] = '1';
    } else {
      const jwtToken =
        localStorage.getItem('jwt_token') ||
        localStorage.getItem('mcp_jwt_token') ||
        localStorage.getItem('api2_jwt_token');

      if (jwtToken && jwtToken !== 'null' && jwtToken !== 'undefined') {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${jwtToken}`;
        console.log('🔑 [createHeaderWithAuth] JWT token incluido en headers');
      } else {
        // Intentar desde dev-user-config
        try {
          const devConfig = localStorage.getItem('dev-user-config');
          if (devConfig) {
            const parsed = JSON.parse(devConfig);
            if (parsed.token) {
              (headers as Record<string, string>)['Authorization'] = `Bearer ${parsed.token}`;
              console.log('🔑 [createHeaderWithAuth] JWT token de dev-user-config incluido');
            }
          }
        } catch {
          // Ignorar errores de parsing
        }
      }
    }
  }

  return headers;
};
