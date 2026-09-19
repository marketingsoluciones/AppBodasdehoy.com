// Movido desde @lobechat/model-runtime/src/utils/ 2026-05-20 SPRINT-Q Fase A.
// Lo natural es vivir en model-bank porque depende de LOBE_DEFAULT_MODEL_LIST.

import type { AiFullModelCard } from '../types';

export const getModelPropertyWithFallback = async <T>(
  modelId: string,
  propertyName: keyof AiFullModelCard,
  providerId?: string,
): Promise<T> => {
  const { LOBE_DEFAULT_MODEL_LIST } = await import('../aiModels');

  if (providerId) {
    const exactMatch = LOBE_DEFAULT_MODEL_LIST.find(
      (m) => m.id === modelId && m.providerId === providerId,
    );

    if (exactMatch && exactMatch[propertyName] !== undefined) {
      return exactMatch[propertyName] as T;
    }
  }

  const fallbackMatch = LOBE_DEFAULT_MODEL_LIST.find((m) => m.id === modelId);

  if (fallbackMatch && fallbackMatch[propertyName] !== undefined) {
    return fallbackMatch[propertyName] as T;
  }

  return (propertyName === 'type' ? 'chat' : undefined) as T;
};
