import type { PartialDeep } from 'type-fest';

import { DEFAULT_FEATURE_FLAGS, mapFeatureFlagsEnvToState } from '@/config/featureFlags';
import { lambdaClient } from '@/libs/trpc/client';
import { LobeAgentConfig } from '@/types/agent';
import { GlobalRuntimeConfig } from '@/types/serverConfig';

const VERSION_URL = 'https://registry.npmmirror.com/@lobehub/chat/latest';

interface ConfigCache {
  config: GlobalRuntimeConfig | null;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let globalConfigCache: ConfigCache = { config: null, timestamp: 0 };

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

    // Fallback config used when the server takes >3s to respond
    const minimalConfig: GlobalRuntimeConfig = {
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

    const timeoutPromise = new Promise<GlobalRuntimeConfig>((resolve) => {
      setTimeout(() => resolve(minimalConfig), 3000);
    });

    try {
      const result = await Promise.race([
        lambdaClient.config.getGlobalConfig.query(),
        timeoutPromise,
      ]);

      if (result !== minimalConfig) {
        globalConfigCache = { config: result, timestamp: Date.now() };
      } else {
        // Load full config in background after timeout
        lambdaClient.config.getGlobalConfig.query().then((fullConfig) => {
          globalConfigCache = { config: fullConfig, timestamp: Date.now() };
        }).catch(() => {});
      }

      return result;
    } catch (error) {
      if (globalConfigCache.config) return globalConfigCache.config;
      return minimalConfig;
    }
  };

  getDefaultAgentConfig = async (): Promise<PartialDeep<LobeAgentConfig>> => {
    return lambdaClient.config.getDefaultAgentConfig.query();
  };
}

export const globalService = new GlobalService();
