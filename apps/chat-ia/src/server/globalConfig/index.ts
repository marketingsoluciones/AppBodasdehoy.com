import { enableNextAuth } from '@/const/auth';
import { isDesktop } from '@/const/version';
import { appEnv, getAppConfig } from '@/envs/app';
import { authEnv } from '@/envs/auth';
import { fileEnv } from '@/envs/file';
import { imageEnv } from '@/envs/image';
import { knowledgeEnv } from '@/envs/knowledge';
import { langfuseEnv } from '@/envs/langfuse';
import { parseSystemAgent } from '@/server/globalConfig/parseSystemAgent';
import { GlobalServerConfig } from '@/types/serverConfig';
import { cleanObject } from '@/utils/object';

import { genServerLLMConfig } from './_deprecated';
import { genServerAiProvidersConfig } from './genServerAiProviderConfig';
import { parseAgentConfig } from './parseDefaultAgent';
import { parseFilesConfig } from './parseFilesConfig';

// ============================================
// Cache en memoria para mejorar rendimiento
// ============================================
interface ConfigCache {
  config: GlobalServerConfig | null;
  timestamp: number;
}

// Cache con TTL de 5 minutos en producción, 5 minutos en desarrollo
// Aumentado significativamente en desarrollo para reducir regeneraciones frecuentes
// La configuración del servidor raramente cambia durante una sesión de desarrollo
const CACHE_TTL = process.env.NODE_ENV === 'production' ? 300_000 : 300_000;
let configCache: ConfigCache = { config: null, timestamp: 0 };

export const getServerGlobalConfig = async () => {
  // ✅ OPTIMIZACIÓN CRÍTICA: SIEMPRE retornar config mínima inmediatamente
  // La configuración completa se genera en background y se usará en requests posteriores
  const { ACCESS_CODES, DEFAULT_AGENT_CONFIG } = getAppConfig();

  // Si hay cache válido, retornarlo
  const now = Date.now();
  if (configCache.config && now - configCache.timestamp < CACHE_TTL) {
    return configCache.config;
  }

  // Generar configuración mínima INSTANTÁNEAMENTE (sin esperar nada)
  const minimalConfig: GlobalServerConfig = {
    aiProvider: {},
    defaultAgent: {
      config: parseAgentConfig(DEFAULT_AGENT_CONFIG),
    },
    enableUploadFileToServer: !!fileEnv.S3_SECRET_ACCESS_KEY,
    enabledAccessCode: ACCESS_CODES?.length > 0,
    enabledOAuthSSO: enableNextAuth,
    image: cleanObject({
      defaultImageNum: imageEnv.AI_IMAGE_DEFAULT_IMAGE_NUM,
    }),
    languageModel: genServerLLMConfig({
      azure: { enabledKey: 'ENABLED_AZURE_OPENAI', withDeploymentName: true },
      bedrock: { enabledKey: 'ENABLED_AWS_BEDROCK', modelListKey: 'AWS_BEDROCK_MODEL_LIST' },
      giteeai: { enabledKey: 'ENABLED_GITEE_AI', modelListKey: 'GITEE_AI_MODEL_LIST' },
      ollama: { fetchOnClient: !process.env.OLLAMA_PROXY_URL },
    }),
    oAuthSSOProviders: authEnv.NEXT_AUTH_SSO_PROVIDERS.trim().split(/[,，]/),
    systemAgent: parseSystemAgent(appEnv.SYSTEM_AGENT),
    telemetry: {
      langfuse: langfuseEnv.ENABLE_LANGFUSE,
    },
  };

  // Guardar cache mínimo inmediatamente
  configCache = { config: minimalConfig, timestamp: Date.now() };

  // Regenerar configuración completa en background (NO BLOQUEA)
  setImmediate(() => {
    regenerateFullConfig().catch(error => {
      console.warn('⚠️ [GlobalConfig] Error regenerando config en background:', error);
    });
  });

  return minimalConfig;
};

// ✅ Función auxiliar para regenerar configuración completa en background
const regenerateFullConfig = async () => {
  const { ACCESS_CODES, DEFAULT_AGENT_CONFIG } = getAppConfig();

  const config: GlobalServerConfig = {
    aiProvider: await genServerAiProvidersConfig({
      azure: {
        enabledKey: 'ENABLED_AZURE_OPENAI',
        withDeploymentName: true,
      },
      bedrock: {
        enabledKey: 'ENABLED_AWS_BEDROCK',
        modelListKey: 'AWS_BEDROCK_MODEL_LIST',
      },
      giteeai: {
        enabledKey: 'ENABLED_GITEE_AI',
        modelListKey: 'GITEE_AI_MODEL_LIST',
      },
      lmstudio: {
        fetchOnClient: isDesktop ? false : undefined,
      },
      ollama: {
        enabled: isDesktop ? true : undefined,
        fetchOnClient: isDesktop ? false : !process.env.OLLAMA_PROXY_URL,
      },
      ollamacloud: {
        enabledKey: 'ENABLED_OLLAMA_CLOUD',
      },
      qwen: {
        withDeploymentName: true,
      },
      tencentcloud: {
        enabledKey: 'ENABLED_TENCENT_CLOUD',
        modelListKey: 'TENCENT_CLOUD_MODEL_LIST',
      },
      volcengine: {
        withDeploymentName: true,
      },
    }),
    defaultAgent: {
      config: parseAgentConfig(DEFAULT_AGENT_CONFIG),
    },
    enableUploadFileToServer: !!fileEnv.S3_SECRET_ACCESS_KEY,
    enabledAccessCode: ACCESS_CODES?.length > 0,
    enabledOAuthSSO: enableNextAuth,
    image: cleanObject({
      defaultImageNum: imageEnv.AI_IMAGE_DEFAULT_IMAGE_NUM,
    }),
    languageModel: genServerLLMConfig({
      azure: {
        enabledKey: 'ENABLED_AZURE_OPENAI',
        withDeploymentName: true,
      },
      bedrock: {
        enabledKey: 'ENABLED_AWS_BEDROCK',
        modelListKey: 'AWS_BEDROCK_MODEL_LIST',
      },
      giteeai: {
        enabledKey: 'ENABLED_GITEE_AI',
        modelListKey: 'GITEE_AI_MODEL_LIST',
      },
      ollama: {
        fetchOnClient: !process.env.OLLAMA_PROXY_URL,
      },
    }),
    oAuthSSOProviders: authEnv.NEXT_AUTH_SSO_PROVIDERS.trim().split(/[,，]/),
    systemAgent: parseSystemAgent(appEnv.SYSTEM_AGENT),
    telemetry: {
      langfuse: langfuseEnv.ENABLE_LANGFUSE,
    },
  };

  // Actualizar cache con configuración completa
  configCache = { config, timestamp: Date.now() };
  console.log('✅ [GlobalConfig] Configuración completa regenerada en background');
};

export const getServerDefaultAgentConfig = () => {
  const { DEFAULT_AGENT_CONFIG } = getAppConfig();

  return parseAgentConfig(DEFAULT_AGENT_CONFIG) || {};
};

export const getServerDefaultFilesConfig = () => {
  return parseFilesConfig(knowledgeEnv.DEFAULT_FILES_CONFIG);
};
