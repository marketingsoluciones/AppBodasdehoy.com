import type { PartialDeep } from 'type-fest';

import { DEFAULT_FEATURE_FLAGS, mapFeatureFlagsEnvToState } from '@/config/featureFlags';
import { LobeAgentConfig } from '@/types/agent';
import { GlobalRuntimeConfig } from '@/types/serverConfig';

// CAPA 2 PASO C 2026-06-04: getGlobalConfig vía api-ia REST (/chat/config?development=X).
// Confirmado api-ia: /chat/config proxy a getGlobalConfig de api-mcp. Keyed por
// development. Si retorna null/error, front cae a MINIMAL_CONFIG local.
// getDefaultAgentConfig: api-ia confirmó que si su endpoint retorna null, el front
// usa el DEFAULT del cliente — lo resolvemos directamente sin ir al backend.

const VERSION_URL = 'https://registry.npmmirror.com/@lobehub/chat/latest';

const API_IA_BASE = process.env.NEXT_PUBLIC_API_IA_URL || 'http://localhost:8080';

interface ConfigCache {
  config: GlobalRuntimeConfig | null;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000;
let globalConfigCache: ConfigCache = { config: null, timestamp: 0 };

function getDevelopment(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';
  try {
    const raw = localStorage.getItem('dev-user-config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.development) return parsed.development;
    }
  } catch {
    // ignore
  }
  return process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';
}

const MINIMAL_CONFIG: GlobalRuntimeConfig = {
  serverConfig: {
    aiProvider: {},
    enableUploadFileToServer: false,
    enabledAccessCode: false,
    enabledOAuthSSO: true,
    oAuthSSOProviders: ['google'],
    telemetry: { langfuse: false },
  },
  serverFeatureFlags: mapFeatureFlagsEnvToState(DEFAULT_FEATURE_FLAGS),
};

async function fetchGlobalConfigFromApiIa(): Promise<GlobalRuntimeConfig | null> {
  const development = getDevelopment();
  const url = `${API_IA_BASE}/chat/config?development=${encodeURIComponent(development)}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    if (!json || json.success === false) return null;
    return (json.data ?? json) as GlobalRuntimeConfig;
  } catch {
    return null;
  }
}

class GlobalService {
  /**
   * get latest version from npm
   */
  getLatestVersion = async (): Promise<string> => {
    const res = await fetch(VERSION_URL);
    const data = await res.json();
    return data['version'];
  };

  getGlobalConfig = async (): Promise<GlobalRuntimeConfig> => {
    const now = Date.now();
    if (globalConfigCache.config && now - globalConfigCache.timestamp < CACHE_TTL) {
      return globalConfigCache.config;
    }

    const timeoutPromise = new Promise<GlobalRuntimeConfig>((resolve) => {
      setTimeout(() => resolve(MINIMAL_CONFIG), 3000);
    });

    try {
      const result = await Promise.race([
        fetchGlobalConfigFromApiIa().then((c) => c ?? MINIMAL_CONFIG),
        timeoutPromise,
      ]);

      if (result !== MINIMAL_CONFIG) {
        globalConfigCache = { config: result, timestamp: Date.now() };
      } else {
        // si llegamos a MINIMAL por timeout, sigue cargando la real en background
        fetchGlobalConfigFromApiIa()
          .then((fullConfig) => {
            if (fullConfig) globalConfigCache = { config: fullConfig, timestamp: Date.now() };
          })
          .catch((e) => console.warn('[global] background fetchGlobalConfigFromApiIa falló:', e?.message));
      }

      return result;
    } catch {
      if (globalConfigCache.config) return globalConfigCache.config;
      return MINIMAL_CONFIG;
    }
  };

  /**
   * Default agent config — resuelto en el cliente. api-ia confirmó que si su
   * endpoint retorna null, el front usa el DEFAULT del propio cliente.
   */
  getDefaultAgentConfig = async (): Promise<PartialDeep<LobeAgentConfig>> => {
    const { DEFAULT_AGENT_CONFIG } = await import('@/const/settings');
    return DEFAULT_AGENT_CONFIG;
  };
}

export const globalService = new GlobalService();
