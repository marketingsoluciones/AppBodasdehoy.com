import { LobeTool } from '@lobechat/types';
import { LobeChatPluginManifest } from '@lobehub/chat-plugin-sdk';

import { LobeToolCustomPlugin } from '@/types/tool/plugin';

import { InstallPluginParams, IPluginService } from './type';

// CAPA 2 PASO C 2026-06-05: plugin opción (c) — DEPRECAR persistencia.
// Confirmado por api-ia: el registry instalado pasa a un único campo en userConfig
// (enabledPlugins: string[]). Los manifests/settings/customParams NO se persisten —
// se cargan en runtime al invocar el plugin vía /webapi/plugin/gateway.
//
// Implementación:
//   - getInstalledPlugins → lee enabledPlugins de userConfig (memoria + remoto)
//   - installPlugin(plugin) → añade identifier al array, save-user-config
//   - uninstallPlugin(id)  → quita del array, save-user-config
//   - removeAllPlugins     → enabledPlugins = []
//   - updatePlugin / updatePluginManifest / updatePluginSettings → NO-OP
//     (los manifests son URL-driven en runtime; no hay persistencia de overrides)
//   - createCustomPlugin   → añade su identifier (custom plugin URL la añade el user en UI)
//
// Trade-offs vs versión tRPC anterior:
//   - Pierde: settings/customParams persistidos por plugin
//   - Pierde: caching de manifests (se refetchean en cada sesión)
//   - Gana: sin tabla user_installed_plugins en BD, simplicidad
//   - Alineado con recomendación api-ia (api-ia.txt 2026-06-05)

const API_IA_BASE = process.env.NEXT_PUBLIC_API_IA_URL || 'http://localhost:8080';
const ENABLED_PLUGINS_KEY = 'enabledPlugins';
// Cache en memoria de manifests resueltos vía gateway. No persiste entre sesiones.
const manifestCache = new Map<string, LobeChatPluginManifest>();

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

async function getEnabledPluginIds(): Promise<string[]> {
  const { userId } = getCtx();
  if (!userId) return [];
  try {
    const res = await fetch(
      `${API_IA_BASE}/api/auth/get-user-config?user_id=${encodeURIComponent(userId)}`,
      { headers: authHeaders(), method: 'GET' },
    );
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    const list = json?.config?.[ENABLED_PLUGINS_KEY] ?? json?.[ENABLED_PLUGINS_KEY];
    return Array.isArray(list) ? (list as string[]) : [];
  } catch {
    return [];
  }
}

async function saveEnabledPluginIds(ids: string[]): Promise<void> {
  const { userId, development } = getCtx();
  if (!userId) return;
  await fetch(`${API_IA_BASE}/api/auth/save-user-config`, {
    body: JSON.stringify({
      config: { [ENABLED_PLUGINS_KEY]: ids },
      development,
      user_id: userId,
    }),
    headers: authHeaders(),
    method: 'POST',
  });
}

function toLobeTool(identifier: string): LobeTool {
  return {
    identifier,
    manifest: manifestCache.get(identifier),
    type: 'plugin',
  } as LobeTool;
}

export class ApiIaPluginService implements IPluginService {
  installPlugin = async (plugin: InstallPluginParams) => {
    const current = await getEnabledPluginIds();
    if (current.includes(plugin.identifier)) return;
    if (plugin.manifest) manifestCache.set(plugin.identifier, plugin.manifest);
    await saveEnabledPluginIds([...current, plugin.identifier]);
  };

  getInstalledPlugins = async (): Promise<LobeTool[]> => {
    const ids = await getEnabledPluginIds();
    return ids.map(toLobeTool);
  };

  uninstallPlugin = async (identifier: string) => {
    const current = await getEnabledPluginIds();
    manifestCache.delete(identifier);
    await saveEnabledPluginIds(current.filter((id) => id !== identifier));
  };

  createCustomPlugin = async (customPlugin: LobeToolCustomPlugin) => {
    // Para custom plugins, identifier es la URL del manifest provista por el user.
    const current = await getEnabledPluginIds();
    if (current.includes(customPlugin.identifier)) return;
    if (customPlugin.manifest) manifestCache.set(customPlugin.identifier, customPlugin.manifest);
    await saveEnabledPluginIds([...current, customPlugin.identifier]);
  };

  updatePlugin = async (_id: string, _value: Partial<LobeToolCustomPlugin>) => {
    // No-op: opción (c) no persiste settings/customParams por plugin.
    // Si en el futuro hace falta, se guarda en userConfig.pluginSettings[identifier].
    return;
  };

  updatePluginManifest = async (id: string, manifest: LobeChatPluginManifest) => {
    // Refresca solo el cache en memoria.
    manifestCache.set(id, manifest);
  };

  removeAllPlugins = async () => {
    manifestCache.clear();
    await saveEnabledPluginIds([]);
  };

  updatePluginSettings = async (_id: string, _settings: any, _signal?: AbortSignal) => {
    // No-op: opción (c) no persiste settings por plugin.
    return;
  };
}
