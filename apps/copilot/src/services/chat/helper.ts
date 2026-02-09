import { isDeprecatedEdition } from '@lobechat/const';
import { ModelProvider } from 'model-bank';

import { getAiInfraStoreState } from '@/store/aiInfra';
import { aiModelSelectors, aiProviderSelectors } from '@/store/aiInfra/selectors';
import { getUserStoreState, useUserStore } from '@/store/user';
import { modelConfigSelectors, modelProviderSelectors } from '@/store/user/selectors';
import { getPythonBackendConfig } from '@/utils/checkPythonBackendConfig';

export const isCanUseVision = (model: string, provider: string): boolean => {
  // TODO: remove isDeprecatedEdition condition in V2.0
  if (isDeprecatedEdition) {
    return modelProviderSelectors.isModelEnabledVision(model)(getUserStoreState());
  }
  return aiModelSelectors.isModelSupportVision(model, provider)(getAiInfraStoreState());
};

export const isCanUseVideo = (model: string, provider: string): boolean => {
  return aiModelSelectors.isModelSupportVideo(model, provider)(getAiInfraStoreState()) || false;
};

/**
 * TODO: we need to update this function to auto find deploymentName with provider setting config
 */
export const findDeploymentName = (model: string, provider: string) => {
  let deploymentId = model;

  // TODO: remove isDeprecatedEdition condition in V2.0
  if (isDeprecatedEdition) {
    const chatModelCards = modelProviderSelectors.getModelCardsById(ModelProvider.Azure)(
      useUserStore.getState(),
    );

    const deploymentName = chatModelCards.find((i) => i.id === model)?.deploymentName;
    if (deploymentName) deploymentId = deploymentName;
  } else {
    // find the model by id
    const modelItem = getAiInfraStoreState().enabledAiModels?.find(
      (i) => i.id === model && i.providerId === provider,
    );

    if (modelItem && modelItem.config?.deploymentName) {
      deploymentId = modelItem.config?.deploymentName;
    }
  }

  return deploymentId;
};

export const isEnableFetchOnClient = (provider: string) => {
  // ✅ CRÍTICO: Si se usa backend Python, SIEMPRE forzar request al servidor
  // Esto evita que ModelRuntime valide API keys en el cliente
  // El backend Python manejará todas las credenciales desde el whitelabel
  try {
    const { USE_PYTHON_BACKEND, PYTHON_BACKEND_URL } = getPythonBackendConfig();

    if (USE_PYTHON_BACKEND && PYTHON_BACKEND_URL) {
      // ✅ Retornar false para que el request vaya al servidor directamente (NO usar ModelRuntime en el cliente)
      // El route handler (/webapi/chat/[provider]) hará proxy al backend Python, evitando validación de API keys
      console.log(`✅ Backend Python activado - provider: ${provider} - forzando request al servidor (evita validación de API keys en cliente)`);
      return false; // NO usar fetchOnClient, ir al servidor directamente
    }
  } catch (e) {
    console.warn('⚠️ No se pudo verificar configuración de backend Python:', e);
  }

  // TODO: remove this condition in V2.0
  if (isDeprecatedEdition) {
    return modelConfigSelectors.isProviderFetchOnClient(provider)(useUserStore.getState());
  } else {
    return aiProviderSelectors.isProviderFetchOnClient(provider)(getAiInfraStoreState());
  }
};

export const resolveRuntimeProvider = (provider: string) => {
  if (isDeprecatedEdition) return provider;

  // ✅ PASO 1: Verificar SIEMPRE si se usa backend Python (para TODOS los providers)
  // Si se usa backend Python, mantener el provider original para que el backend lo maneje
  try {
    const { USE_PYTHON_BACKEND, PYTHON_BACKEND_URL } = getPythonBackendConfig();

    if (USE_PYTHON_BACKEND && PYTHON_BACKEND_URL) {
      // ✅ Mantener el provider original para que el backend Python lo maneje
      // Esto evita que se resuelva a "openai" y active la validación de API keys
      console.log(`✅ Backend Python activado - manteniendo provider original: ${provider}`);
      return provider;
    }
  } catch (e) {
    console.warn('⚠️ No se pudo verificar configuración de backend Python:', e);
  }

  const isBuiltin = Object.values(ModelProvider).includes(provider as any);
  if (isBuiltin) return provider;

  const providerConfig = aiProviderSelectors.providerConfigById(provider)(getAiInfraStoreState());

  return providerConfig?.settings.sdkType || 'openai';
};
