import {
  ChatGroupAgentItem,
  ChatGroupItem,
  NewChatGroup,
  NewChatGroupAgent,
} from '@/database/schemas';

import { IChatGroupService } from './type';

// CAPA 2 PASO C 2026-06-05 — opción (c) según api-ia (msg 07:50, 08:47):
//
//   chatGroup HÍBRIDO:
//     - Sessions del grupo  → PATCH /chat/session-groups/{id} { sessionIds[] } (api-mcp)
//     - Order/role agentes  → userConfig.chatGroups[] = [{groupId, agents:[{agentId, order, role}]}]
//
// api-mcp NO modela ChatGroupAgent con order/role — vive en userConfig.

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
  } catch { /* ignore */ }
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

interface UserConfigGroupAgent { agentId: string; order?: number; role?: string }
interface UserConfigChatGroup {
  groupId: string;
  title?: string;
  description?: string;
  config?: Record<string, unknown>;
  agents: UserConfigGroupAgent[];
}

async function loadGroups(): Promise<UserConfigChatGroup[]> {
  const { userId } = getCtx();
  if (!userId) return [];
  try {
    const res = await fetch(
      `${API_IA_BASE}/api/auth/get-user-config?user_id=${encodeURIComponent(userId)}`,
      { headers: authHeaders(), method: 'GET' },
    );
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    const cfg = json?.config ?? json ?? {};
    return Array.isArray(cfg.chatGroups) ? cfg.chatGroups : [];
  } catch {
    return [];
  }
}

async function saveGroups(chatGroups: UserConfigChatGroup[]): Promise<void> {
  const { userId, development } = getCtx();
  if (!userId) return;
  await fetch(`${API_IA_BASE}/api/auth/save-user-config`, {
    body: JSON.stringify({ config: { chatGroups }, development, user_id: userId }),
    headers: authHeaders(),
    method: 'POST',
  });
}

// session-groups en api-mcp (sessions del grupo)
async function patchSessionGroup(groupId: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${API_IA_BASE}/chat/session-groups/${encodeURIComponent(groupId)}`, {
    body: JSON.stringify(body),
    headers: authHeaders(),
    method: 'PATCH',
  });
  if (!res.ok) throw new Error(`patchSessionGroup HTTP ${res.status}`);
  return res.json().catch(() => null);
}

function toChatGroupItem(g: UserConfigChatGroup): ChatGroupItem {
  return {
    config: g.config ?? null,
    description: g.description ?? null,
    id: g.groupId,
    title: g.title ?? null,
  } as unknown as ChatGroupItem;
}

export class ApiIaChatGroupService implements IChatGroupService {
  createGroup = async (params: Omit<NewChatGroup, 'userId'>): Promise<ChatGroupItem> => {
    const groups = await loadGroups();
    const id = (params as any).id || `cg_${Date.now()}`;
    const newGroup: UserConfigChatGroup = {
      agents: [],
      config: (params.config as any) ?? {},
      description: params.description ?? '',
      groupId: id,
      title: params.title ?? '',
    };
    await saveGroups([...groups, newGroup]);
    return toChatGroupItem(newGroup);
  };

  updateGroup = async (id: string, value: Partial<ChatGroupItem>): Promise<ChatGroupItem> => {
    const groups = await loadGroups();
    const next = groups.map((g) =>
      g.groupId === id
        ? {
            ...g,
            config: (value.config as any) ?? g.config,
            description: value.description ?? g.description,
            title: value.title ?? g.title,
          }
        : g,
    );
    await saveGroups(next);
    const updated = next.find((g) => g.groupId === id);
    return updated ? toChatGroupItem(updated) : ({ id } as ChatGroupItem);
  };

  deleteGroup = async (id: string) => {
    const groups = await loadGroups();
    await saveGroups(groups.filter((g) => g.groupId !== id));
  };

  getGroup = async (id: string): Promise<ChatGroupItem | undefined> => {
    const groups = await loadGroups();
    const g = groups.find((x) => x.groupId === id);
    return g ? toChatGroupItem(g) : undefined;
  };

  getGroups = async (): Promise<ChatGroupItem[]> => {
    const groups = await loadGroups();
    return groups.map(toChatGroupItem);
  };

  addAgentsToGroup = async (groupId: string, agentIds: string[]): Promise<ChatGroupAgentItem[]> => {
    const groups = await loadGroups();
    const next = groups.map((g) => {
      if (g.groupId !== groupId) return g;
      const existing = new Set(g.agents.map((a) => a.agentId));
      const baseOrder = g.agents.length;
      const newAgents: UserConfigGroupAgent[] = agentIds
        .filter((id) => !existing.has(id))
        .map((id, i) => ({ agentId: id, order: baseOrder + i }));
      return { ...g, agents: [...g.agents, ...newAgents] };
    });
    await saveGroups(next);
    const grp = next.find((g) => g.groupId === groupId);
    return (grp?.agents || []).map((a) => ({
      agentId: a.agentId,
      groupId,
      order: a.order ?? 0,
      role: a.role ?? null,
    } as unknown as ChatGroupAgentItem));
  };

  removeAgentsFromGroup = async (groupId: string, agentIds: string[]) => {
    const groups = await loadGroups();
    const ids = new Set(agentIds);
    const next = groups.map((g) =>
      g.groupId === groupId ? { ...g, agents: g.agents.filter((a) => !ids.has(a.agentId)) } : g,
    );
    await saveGroups(next);
  };

  updateAgentInGroup = async (
    groupId: string,
    agentId: string,
    updates: Partial<Pick<NewChatGroupAgent, 'order' | 'role'>>,
  ): Promise<ChatGroupAgentItem> => {
    const groups = await loadGroups();
    const next = groups.map((g) => {
      if (g.groupId !== groupId) return g;
      return {
        ...g,
        agents: g.agents.map((a) =>
          a.agentId === agentId
            ? {
                ...a,
                order: updates.order === null ? a.order : updates.order ?? a.order,
                role: updates.role === null ? a.role : updates.role ?? a.role,
              }
            : a,
        ),
      };
    });
    await saveGroups(next);
    const grp = next.find((g) => g.groupId === groupId);
    const ag = grp?.agents.find((a) => a.agentId === agentId);
    return {
      agentId,
      groupId,
      order: ag?.order ?? 0,
      role: ag?.role ?? null,
    } as unknown as ChatGroupAgentItem;
  };

  getGroupAgents = async (groupId: string): Promise<ChatGroupAgentItem[]> => {
    const groups = await loadGroups();
    const grp = groups.find((g) => g.groupId === groupId);
    return (grp?.agents || []).map((a) => ({
      agentId: a.agentId,
      groupId,
      order: a.order ?? 0,
      role: a.role ?? null,
    } as unknown as ChatGroupAgentItem));
  };
}
