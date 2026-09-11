import { mcpClient } from './client';

const INIT_SOCIAL_CONNECT = `
  mutation InitSocialConnect($platform: SMM_SocialPlatform!, $development: String!, $callbackUrl: String!) {
    SMM_initSocialConnect(platform: $platform, development: $development, callback_url: $callbackUrl) {
      authorization_url
      state
    }
  }
`;

const GET_SOCIAL_ACCOUNTS = `
  query GetSocialAccounts($development: String!) {
    SMM_getSocialAccounts(development: $development) {
      accounts {
        _id
        platform
        username
        display_name
        avatar_url
        access_token_status
        followers_count
        is_active
        connected_at
      }
    }
  }
`;

const DISCONNECT_SOCIAL = `
  mutation DisconnectSocial($id: ID!) {
    SMM_disconnectSocialAccount(id: $id) {
      success
    }
  }
`;

export type SMMPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK';

export interface SMMSocialAccount {
  _id: string;
  access_token_status: string;
  avatar_url?: string;
  connected_at: string;
  display_name: string;
  followers_count: number;
  is_active: boolean;
  platform: SMMPlatform;
  username: string;
}

export async function initSocialConnect(
  platform: SMMPlatform,
  development: string,
  callbackUrl: string,
): Promise<{ authorization_url: string; state: string } | null> {
  try {
    const data = await mcpClient.query<{
      SMM_initSocialConnect: { authorization_url: string; state: string };
    }>(INIT_SOCIAL_CONNECT, { callbackUrl, development, platform });
    return data.SMM_initSocialConnect ?? null;
  } catch {
    return null;
  }
}

export async function getSocialAccounts(development: string): Promise<SMMSocialAccount[]> {
  try {
    const data = await mcpClient.query<{
      SMM_getSocialAccounts: { accounts: SMMSocialAccount[] };
    }>(GET_SOCIAL_ACCOUNTS, { development });
    return data.SMM_getSocialAccounts?.accounts ?? [];
  } catch {
    return [];
  }
}

export async function disconnectSocialAccount(id: string): Promise<boolean> {
  try {
    const data = await mcpClient.query<{
      SMM_disconnectSocialAccount: { success: boolean };
    }>(DISCONNECT_SOCIAL, { id });
    return data.SMM_disconnectSocialAccount?.success ?? false;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bandeja unificada SMM + mejores franjas para publicar.
//
// ⚠️ Los nombres llevan prefijo SMM_. En la coordinación de api-mcp aparecen como
// "getUnifiedInbox" y "getBestTimes" SIN prefijo, y así no existen: GraphQL responde
// "Cannot query field". Verificado contra su esquema el 28-ago:
//   SMM_getUnifiedInbox  · smm/inbox.graphql:125
//   SMM_getBestTimes     · smm/analytics.graphql:179
// ─────────────────────────────────────────────────────────────────────────────

export type SMMUnifiedMessageSource = string;

export interface SMMUnifiedMessage {
  _id: string;
  content: string;
  development: string;
  message_type?: string | null;
  platform: string;
  received_at: string;
  sender_avatar?: string | null;
  sender_id: string;
  sender_name: string;
  source: SMMUnifiedMessageSource;
  status: string;
  thread_id?: string | null;
}

export interface SMMUnifiedInbox {
  limit: number;
  messages: SMMUnifiedMessage[];
  page: number;
  total: number;
  totalPages: number;
}

/** `day_of_week`: 0 = domingo … 6 = sábado. `hour`: 0-23. */
export interface SMMBestTime {
  day_of_week: number;
  hour: number;
  label?: string | null;
  score: number;
}

export interface SMMBestTimes {
  /** 'grid' = rejilla curada por plataforma · 'data' = calculado de engagement (futuro). */
  platform?: string | null;
  slots: SMMBestTime[];
  source: string;
}

const GET_UNIFIED_INBOX = `
  query GetUnifiedInbox($development: String!, $page: Int, $limit: Int) {
    SMM_getUnifiedInbox(development: $development, page: $page, limit: $limit) {
      messages {
        _id
        source
        platform
        development
        sender_id
        sender_name
        sender_avatar
        content
        status
        message_type
        received_at
        thread_id
      }
      total
      page
      limit
      totalPages
    }
  }
`;

const GET_BEST_TIMES = `
  query GetBestTimes($development: String!, $platform: SMM_SocialPlatform) {
    SMM_getBestTimes(development: $development, platform: $platform) {
      platform
      source
      slots { day_of_week hour score label }
    }
  }
`;

/**
 * Bandeja unificada (SMM + WhatsApp) paginada.
 *
 * NO se traga el error: si la query falla hay que verlo. El patrón `catch { return [] }`
 * de este fichero ha escondido fallos reales en otras pantallas (auditoría 27-ago).
 */
export async function getUnifiedInbox(
  development: string,
  page = 1,
  limit = 20,
): Promise<SMMUnifiedInbox> {
  const data = await mcpClient.query<{ SMM_getUnifiedInbox: SMMUnifiedInbox }>(
    GET_UNIFIED_INBOX,
    { development, limit, page },
  );
  return (
    data.SMM_getUnifiedInbox ?? { limit, messages: [], page, total: 0, totalPages: 0 }
  );
}

/** Mejores franjas para publicar. Hoy rejilla curada por plataforma (source='grid'). */
export async function getBestTimes(
  development: string,
  platform?: string,
): Promise<SMMBestTimes> {
  const data = await mcpClient.query<{ SMM_getBestTimes: SMMBestTimes }>(GET_BEST_TIMES, {
    development,
    platform,
  });
  return data.SMM_getBestTimes ?? { platform: platform ?? null, slots: [], source: 'grid' };
}
