import type { AdapterAccount } from 'next-auth/adapters';
import type { PartialDeep } from 'type-fest';

import { UserGuide, UserInitializationState, UserPreference } from '@/types/user';
import { UserSettings } from '@/types/user/settings';

import { IUserService } from './type';

// CAPA 2 PASO C 2026-06-05: ApiIaUserService usa los endpoints REST de api-ia:
// - GET  /api/auth/get-user-config           → getUserState
// - POST /api/auth/save-user-config          → updateAvatar/Guide/Preference/Settings + reset
// Los 4 métodos SSO/registration (getUserSSOProviders, unlinkSSOProvider,
// getUserRegistrationDuration, resetUserSettings con efecto real) NO tienen endpoint
// equivalente en api-ia; ver pregunta 3.2 a backend en docs/backend-asks/slack-ready/.
// Mientras: stubs que devuelven valores neutros para no romper la UI de settings.

const API_IA_BASE = process.env.NEXT_PUBLIC_API_IA_URL || 'http://localhost:8080';

function getUserConfigContext(): { development: string; idToken?: string; userId?: string } {
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
  const { idToken, development, userId } = getUserConfigContext();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Development': development,
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (userId) headers['X-User-ID'] = userId;
  return headers;
}

async function saveUserConfig(partial: Record<string, unknown>): Promise<void> {
  const { userId, development } = getUserConfigContext();
  if (!userId) return;
  await fetch(`${API_IA_BASE}/api/auth/save-user-config`, {
    body: JSON.stringify({ config: partial, development, user_id: userId }),
    headers: authHeaders(),
    method: 'POST',
  });
}

async function getUserConfig(): Promise<Record<string, any> | null> {
  const { userId, development } = getUserConfigContext();
  if (!userId) return null;
  // ?development= obligatorio en query (api-ia no resuelve config por header).
  const res = await fetch(
    `${API_IA_BASE}/api/auth/get-user-config?user_id=${encodeURIComponent(userId)}&development=${encodeURIComponent(development)}`,
    { headers: authHeaders(), method: 'GET' },
  );
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

const DEFAULT_USER_STATE: UserInitializationState = {
  avatar: '',
  email: '',
  firstName: '',
  fullName: '',
  isOnboard: true,
  lastName: '',
  preference: undefined as any,
  settings: undefined as any,
  userId: '',
  username: '',
};

export class ApiIaUserService implements IUserService {
  getUserState = async (): Promise<UserInitializationState> => {
    const config = await getUserConfig();
    const { userId } = getUserConfigContext();
    if (!config) return { ...DEFAULT_USER_STATE, userId: userId || '' };
    return {
      ...DEFAULT_USER_STATE,
      ...(config as Partial<UserInitializationState>),
      userId: (config.userId as string) || userId || '',
    };
  };

  updateAvatar = async (avatar: string) => {
    await saveUserConfig({ avatar });
  };

  updateGuide = async (guide: Partial<UserGuide>) => {
    await saveUserConfig({ guide });
  };

  updatePreference = async (preference: Partial<UserPreference>) => {
    await saveUserConfig({ preference });
  };

  updateUserSettings = async (value: PartialDeep<UserSettings>, _signal?: AbortSignal) => {
    await saveUserConfig({ settings: value });
  };

  resetUserSettings = async () => {
    await saveUserConfig({ settings: null });
  };

  // ─── Sin endpoint api-ia equivalente — SSO se gestiona en Firebase SDK cliente ──
  // api-ia confirmó (msg 04:41, 05-jun): "SSO providers → Firebase SDK en cliente,
  // NO backend". Mantenemos stubs neutros para compatibilidad con IUserService.

  getUserSSOProviders = async (): Promise<AdapterAccount[]> => {
    return [];
  };

  unlinkSSOProvider = async (_provider: string, _providerAccountId: string) => {
    return;
  };

  // ─── /api/auth/registration-duration LIVE desde 05-jun 08:35 ──────────
  // Endpoint api-ia: GET /api/auth/registration-duration?user_id=...&development=...
  // Devuelve { createdAt, durationSeconds, durationDays }.
  getUserRegistrationDuration = async () => {
    const { userId, development } = getUserConfigContext();
    if (!userId) {
      const now = new Date();
      return { createdAt: now.toISOString(), duration: 0, updatedAt: now.toISOString() };
    }
    const qs = new URLSearchParams();
    qs.set('user_id', userId);
    if (development) qs.set('development', development);
    try {
      const res = await fetch(`${API_IA_BASE}/api/auth/registration-duration?${qs.toString()}`, {
        headers: authHeaders(),
        method: 'GET',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const createdAt = json.createdAt || json.created_at || new Date().toISOString();
      // BUG QA 10-jul #9: /profile/stats mostraba "8.896.524 días" — la API devuelve
      // `durationSeconds` (segundos) pero Welcome.tsx lo pinta como `days`. La API
      // también expone `durationDays`; preferirlo, y si solo llega en segundos
      // convertirlo a días (mínimo 1 para no leer "0 días" en día de registro).
      const days =
        Number(json.durationDays ?? json.duration_days ?? NaN) ||
        Math.max(1, Math.floor(Number(json.durationSeconds ?? json.duration_seconds ?? 0) / 86_400));
      return { createdAt, duration: days, updatedAt: new Date().toISOString() };
    } catch {
      const now = new Date();
      return { createdAt: now.toISOString(), duration: 0, updatedAt: now.toISOString() };
    }
  };
}
