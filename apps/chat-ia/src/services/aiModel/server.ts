import { lambdaClient } from '@/libs/trpc/client';
import { IAiModelService } from '@/services/aiModel/type';

const API_IA_BASE = process.env.NEXT_PUBLIC_API_IA_URL || 'https://api-ia.bodasdehoy.com';

function getCtx(): { development: string; idToken?: string; userId?: string } {
  if (typeof window === 'undefined') {
    return { development: process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy' };
  }
  try {
    const raw = localStorage.getItem('dev-user-config');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        development: parsed?.development || process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy',
        idToken: parsed?.token,
        userId: parsed?.userId,
      };
    }
  } catch {
    // ignore
  }
  return { development: process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy' };
}

function authHeaders(): Record<string, string> {
  const { idToken, development, userId } = getCtx();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Development': development,
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (userId) headers['X-User-ID'] = userId;
  return headers;
}

interface UserConfigAiModelsState {
  disabled: string[]; // model ids forzados disabled por user (clave: `${providerId}:${modelId}`)
  order: Record<string, number>; // sort por provider:modelId
}

async function loadAiModelsState(): Promise<UserConfigAiModelsState> {
  const { userId, development } = getCtx();
  if (!userId) return { disabled: [], order: {} };
  // ?development= obligatorio en query (api-ia no resuelve config por header).
  const res = await fetch(
    `${API_IA_BASE}/api/auth/get-user-config?user_id=${encodeURIComponent(userId)}&development=${encodeURIComponent(development)}`,
    { headers: authHeaders(), method: 'GET' },
  );
  if (!res.ok) return { disabled: [], order: {} };
  const json = await res.json().catch(() => null);
  const cfg = json?.config ?? json ?? {};
  const aiModels = cfg.aiModels ?? {};
  return {
    disabled: Array.isArray(aiModels.disabled) ? aiModels.disabled : [],
    order: aiModels.order && typeof aiModels.order === 'object' ? aiModels.order : {},
  };
}

async function saveAiModelsState(state: Partial<UserConfigAiModelsState>): Promise<void> {
  const { userId, development } = getCtx();
  if (!userId) return;
  const current = await loadAiModelsState();
  const next = { ...current, ...state };
  await fetch(`${API_IA_BASE}/api/auth/save-user-config`, {
    body: JSON.stringify({ config: { aiModels: next }, development, user_id: userId }),
    headers: authHeaders(),
    method: 'POST',
  });
}

export class ServerService implements IAiModelService {
  // CAPA 3 PASO C — opción (c) confirmada por api-ia (F5 ts 1780641358):
  // Pequeños sets (decenas) van a userConfig.aiModels — patrón cross-device.
  // Lo grande (custom models CRUD, batch operaciones) sigue por tRPC hasta que
  // api-ia exponga endpoints REST para modelos custom por-usuario (P7 F9).

  createAiModel: IAiModelService['createAiModel'] = async (params) => {
    return lambdaClient.aiModel.createAiModel.mutate(params);
  };

  getAiProviderModelList: IAiModelService['getAiProviderModelList'] = async (id) => {
    return lambdaClient.aiModel.getAiProviderModelList.query({ id });
  };

  getAiModelById: IAiModelService['getAiModelById'] = async (id) => {
    return lambdaClient.aiModel.getAiModelById.query({ id });
  };

  toggleModelEnabled: IAiModelService['toggleModelEnabled'] = async (params) => {
    const { id, providerId, enabled } = params;
    const key = `${providerId}:${id}`;
    const state = await loadAiModelsState();
    const set = new Set(state.disabled);
    if (enabled) set.delete(key);
    else set.add(key);
    await saveAiModelsState({ disabled: [...set] });
  };

  updateAiModel: IAiModelService['updateAiModel'] = async (id, providerId, value) => {
    return lambdaClient.aiModel.updateAiModel.mutate({ id, providerId, value });
  };

  batchUpdateAiModels: IAiModelService['batchUpdateAiModels'] = async (id, models) => {
    return lambdaClient.aiModel.batchUpdateAiModels.mutate({ id, models });
  };

  batchToggleAiModels: IAiModelService['batchToggleAiModels'] = async (id, models, enabled) => {
    return lambdaClient.aiModel.batchToggleAiModels.mutate({ enabled, id, models });
  };

  clearModelsByProvider: IAiModelService['clearModelsByProvider'] = async (providerId) => {
    return lambdaClient.aiModel.clearModelsByProvider.mutate({ providerId });
  };

  clearRemoteModels: IAiModelService['clearRemoteModels'] = async (providerId) => {
    return lambdaClient.aiModel.clearRemoteModels.mutate({ providerId });
  };

  updateAiModelOrder: IAiModelService['updateAiModelOrder'] = async (providerId, items) => {
    const order: Record<string, number> = {};
    for (const item of items) {
      order[`${providerId}:${item.id}`] = item.sort;
    }
    const current = await loadAiModelsState();
    const merged = { ...current.order, ...order };
    await saveAiModelsState({ order: merged });
  };

  deleteAiModel: IAiModelService['deleteAiModel'] = async (params: {
    id: string;
    providerId: string;
  }) => {
    return lambdaClient.aiModel.removeAiModel.mutate(params);
  };
}
