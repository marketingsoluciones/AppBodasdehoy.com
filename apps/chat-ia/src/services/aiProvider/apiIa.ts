import {
  AiProviderDetailItem,
  AiProviderRuntimeState,
  AiProviderSortMap,
  CreateAiProviderParams,
  UpdateAiProviderConfigParams,
} from '@/types/aiProvider';

import { IAiProviderService } from './type';

// CAPA 2 PASO C 2026-06-05 — opción (c) con api-ia confirmado (msg 07:50, 08:47):
//
//   Las API keys del USUARIO se guardan en userConfig.api_keys (api-ia CIFRA en
//   save-user-config, NUNCA texto plano). El resto (providerId/enabled/order/config)
//   libre en userConfig.aiProviders[].
//
//   Las API keys del WHITELABEL viven en api-mcp por development — NO el frontend
//   las toca. Read-only via /api/providers/{development} cuando se necesite runtime.
//
// CRÍTICO: nunca enviar API keys del USUARIO en `userConfig.aiProviders[].apiKey`.
// La key va en `userConfig.api_keys[providerId].key` (campo separado que api-ia cifra).

const API_IA_BASE = process.env.NEXT_PUBLIC_API_IA_URL || 'http://localhost:8080';

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

interface UserConfigAiProvider {
  providerId: string;
  enabled?: boolean;
  order?: number;
  config?: Record<string, unknown>;
}

interface UserConfigApiKey {
  key: string;
  enabled?: boolean;
}

async function loadUserConfig(): Promise<{
  aiProviders: UserConfigAiProvider[];
  api_keys: Record<string, UserConfigApiKey>;
}> {
  const { userId, development } = getCtx();
  if (!userId) return { aiProviders: [], api_keys: {} };
  try {
    // ?development= obligatorio en query: api-ia NO resuelve la config por el header
    // X-Development (verificado 13-jun: sin él → config:null). Sin esto el selector
    // mostraba "No hay proveedores habilitados" pese a responder el modelo (informe §2.2).
    const res = await fetch(
      `${API_IA_BASE}/api/auth/get-user-config?user_id=${encodeURIComponent(userId)}&development=${encodeURIComponent(development)}`,
      { headers: authHeaders(), method: 'GET' },
    );
    if (!res.ok) return { aiProviders: [], api_keys: {} };
    const json = await res.json().catch(() => null);
    const cfg = json?.config ?? json ?? {};
    return {
      aiProviders: Array.isArray(cfg.aiProviders) ? cfg.aiProviders : [],
      api_keys: cfg.api_keys && typeof cfg.api_keys === 'object' ? cfg.api_keys : {},
    };
  } catch {
    return { aiProviders: [], api_keys: {} };
  }
}

async function saveUserConfig(partial: Record<string, unknown>): Promise<void> {
  const { userId, development } = getCtx();
  if (!userId) return;
  await fetch(`${API_IA_BASE}/api/auth/save-user-config`, {
    body: JSON.stringify({ config: partial, development, user_id: userId }),
    headers: authHeaders(),
    method: 'POST',
  });
}

function toDetailItem(p: UserConfigAiProvider): AiProviderDetailItem {
  return {
    config: p.config ?? {},
    enabled: p.enabled !== false,
    id: p.providerId,
    sort: p.order ?? 0,
  } as unknown as AiProviderDetailItem;
}

export class ApiIaAiProviderService implements IAiProviderService {
  getAiProviderList = async () => {
    const { aiProviders } = await loadUserConfig();
    return aiProviders.map(toDetailItem);
  };

  getAiProviderById = async (id: string) => {
    const { aiProviders } = await loadUserConfig();
    const p = aiProviders.find((x) => x.providerId === id);
    return p ? toDetailItem(p) : undefined;
  };

  createAiProvider = async (params: CreateAiProviderParams) => {
    const cfg = await loadUserConfig();
    const id = (params as any).id || (params as any).providerId;
    const next = cfg.aiProviders.filter((p) => p.providerId !== id);
    next.push({
      config: (params as any).config ?? {},
      enabled: (params as any).enabled !== false,
      order: (params as any).sort ?? next.length,
      providerId: id,
    });
    // Si la entrada incluye una API key del usuario, sepárala a api_keys (cifrado).
    const apiKey: string | undefined = (params as any).apiKey ?? (params as any).keyVaults?.apiKey;
    const api_keys = { ...cfg.api_keys };
    if (apiKey) {
      api_keys[id] = { enabled: true, key: apiKey };
    }
    await saveUserConfig({ aiProviders: next, api_keys });
  };

  updateAiProvider = async (id: string, value: any) => {
    const cfg = await loadUserConfig();
    const next = cfg.aiProviders.map((p) =>
      p.providerId === id ? { ...p, ...value, providerId: id } : p,
    );
    await saveUserConfig({ aiProviders: next });
  };

  updateAiProviderConfig = async (id: string, value: UpdateAiProviderConfigParams) => {
    const cfg = await loadUserConfig();
    const next = cfg.aiProviders.map((p) =>
      p.providerId === id ? { ...p, config: { ...(p.config ?? {}), ...(value as any) } } : p,
    );
    // Si el config contiene apiKey, separarla a api_keys.
    const apiKey = (value as any).apiKey ?? (value as any).keyVaults?.apiKey;
    const api_keys = { ...cfg.api_keys };
    if (apiKey) {
      api_keys[id] = { ...(api_keys[id] ?? {}), enabled: true, key: apiKey };
    }
    await saveUserConfig({ aiProviders: next, api_keys });
  };

  updateAiProviderOrder = async (items: AiProviderSortMap[]) => {
    const cfg = await loadUserConfig();
    const orderMap = new Map(items.map((i) => [i.id, i.sort]));
    const next = cfg.aiProviders.map((p) => ({
      ...p,
      order: orderMap.get(p.providerId) ?? p.order ?? 0,
    }));
    await saveUserConfig({ aiProviders: next });
  };

  deleteAiProvider = async (id: string) => {
    const cfg = await loadUserConfig();
    const next = cfg.aiProviders.filter((p) => p.providerId !== id);
    const api_keys = { ...cfg.api_keys };
    delete api_keys[id];
    await saveUserConfig({ aiProviders: next, api_keys });
  };

  toggleProviderEnabled = async (id: string, enabled: boolean) => {
    const cfg = await loadUserConfig();
    const next = cfg.aiProviders.map((p) => (p.providerId === id ? { ...p, enabled } : p));
    await saveUserConfig({ aiProviders: next });
  };

  getAiProviderRuntimeState = async (_isLogin?: boolean): Promise<AiProviderRuntimeState> => {
    // BUG-NEW-02 QA #20 (27-jun): api-ia devuelve {providers: [...]} pero el
    // front (store + selectors) espera la shape AiProviderRuntimeState:
    // {enabledAiProviders, enabledChatAiProviders, enabledImageAiProviders,
    //  enabledAiModels, runtimeConfig}. Sin esta transformación el chat IA
    // queda sin providers → "0/0 habilitados" → no responde.
    const { development } = getCtx();
    const emptyState = {
      enabledAiModels: [],
      enabledAiProviders: [],
      enabledChatAiProviders: [],
      enabledImageAiProviders: [],
      runtimeConfig: {},
    } as AiProviderRuntimeState;
    try {
      const res = await fetch(
        `${API_IA_BASE}/api/providers/${encodeURIComponent(development)}`,
        { headers: authHeaders(), method: 'GET' },
      );
      if (!res.ok) return emptyState;
      const json = await res.json().catch(() => null);
      if (!json) return emptyState;

      // Si api-ia ya retorna la shape final → pass-through.
      if (Array.isArray((json as any).enabledChatAiProviders)) {
        return (json.data ?? json) as AiProviderRuntimeState;
      }

      // Adaptación shape {providers: [{provider, enabled, model, base_url, has_key}]}
      // → AiProviderRuntimeState con providers + runtimeConfig + modelos derivados.
      const rawProviders = (json.providers ?? json.data?.providers ?? []) as Array<{
        provider: string;
        enabled: boolean;
        model?: string;
        base_url?: string | null;
        has_key?: boolean;
      }>;

      const enabledProvidersList = rawProviders.filter((p) => p.enabled && p.has_key !== false);

      const enabledAiProviders = enabledProvidersList.map((p) => ({
        id: p.provider,
        name: p.provider,
        source: 'builtin' as const,
      }));

      // Modelos por defecto del whitelabel: cada provider expone el modelo
      // marcado como `model` por api-ia. Sin esto el selector de modelos
      // queda vacío aunque el provider esté habilitado.
      const enabledAiModels = enabledProvidersList
        .filter((p) => !!p.model)
        .map((p) => ({
          id: p.model as string,
          providerId: p.provider,
          enabled: true,
          type: 'chat' as const,
          abilities: {} as any,
        }));

      const runtimeConfig: Record<string, any> = {};
      for (const p of enabledProvidersList) {
        runtimeConfig[p.provider] = {
          fetchOnClient: false,
          keyVaults: p.base_url ? { baseURL: p.base_url } : {},
        };
      }

      return {
        enabledAiModels,
        enabledAiProviders,
        enabledChatAiProviders: enabledAiProviders,
        enabledImageAiProviders: [],
        runtimeConfig,
      } as AiProviderRuntimeState;
    } catch {
      return emptyState;
    }
  };
}
