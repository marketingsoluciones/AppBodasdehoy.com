import type { PartialDeep } from 'type-fest';

import { lambdaClient } from '@/libs/trpc/client';
import { LobeAgentConfig } from '@/types/agent';
import { GlobalRuntimeConfig } from '@/types/serverConfig';

const VERSION_URL = 'https://registry.npmmirror.com/@lobehub/chat/latest';

// ✅ SOLUCIÓN RÁPIDA: Cache en memoria para getGlobalConfig
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
    // ✅ SOLUCIÓN RÁPIDA: Verificar cache primero
    const now = Date.now();
    if (globalConfigCache.config && now - globalConfigCache.timestamp < CACHE_TTL) {
      console.log('✅ [ServerConfig] Usando cache de configuración');
      return globalConfigCache.config;
    }

    // ✅ OPTIMIZACIÓN: Config mínima para retornar inmediatamente si hay timeout
    const minimalConfig: GlobalRuntimeConfig = {
      serverConfig: {
        aiProvider: {},
        enableUploadFileToServer: false,
        enabledAccessCode: false,
        enabledOAuthSSO: true,
        oAuthSSOProviders: ['google'],
        telemetry: { langfuse: false },
      },
      serverFeatureFlags: {},
    };

    // ✅ OPTIMIZACIÓN: Timeout REDUCIDO a 3s - si tarda más, usar minimal y cargar en background
    const timeoutPromise = new Promise<GlobalRuntimeConfig>((resolve) => {
      setTimeout(() => {
        console.warn('⚠️ [ServerConfig] Timeout después de 3s, usando config mínima');
        resolve(minimalConfig);
      }, 3000);
    });

    try {
      const startTime = Date.now();
      console.log('⏱️ [ServerConfig] Iniciando fetch de configuración del servidor...');

      const result = await Promise.race([
        lambdaClient.config.getGlobalConfig.query(),
        timeoutPromise
      ]);

      // ✅ Guardar en cache solo si es config completa (no la minimal)
      if (result !== minimalConfig) {
        globalConfigCache = { config: result, timestamp: Date.now() };
        const elapsed = Date.now() - startTime;
        console.log(`✅ [ServerConfig] Configuración obtenida en ${elapsed}ms`);
      } else {
        // ✅ Intentar cargar config completa en background sin bloquear
        lambdaClient.config.getGlobalConfig.query().then((fullConfig) => {
          globalConfigCache = { config: fullConfig, timestamp: Date.now() };
          console.log('✅ [ServerConfig] Config completa cargada en background');
        }).catch((err) => {
          console.warn('⚠️ [ServerConfig] Error cargando config en background:', err);
        });
      }

      return result;
    } catch (error) {
      console.error('❌ [ServerConfig] Error obteniendo configuración:', error);

      // ✅ SOLUCIÓN RÁPIDA: Si hay error pero tenemos cache, usar cache
      if (globalConfigCache.config) {
        console.warn('⚠️ [ServerConfig] Usando cache anterior debido a error');
        return globalConfigCache.config;
      }

      // ✅ Si no hay cache, retornar config mínima en vez de lanzar error
      console.warn('⚠️ [ServerConfig] Sin cache, usando config mínima');
      return minimalConfig;
    }
  };

  getDefaultAgentConfig = async (): Promise<PartialDeep<LobeAgentConfig>> => {
    return lambdaClient.config.getDefaultAgentConfig.query();
  };
}

export const globalService = new GlobalService();
