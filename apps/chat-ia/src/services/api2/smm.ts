import { api2Client } from './client';

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
  platform: SMMPlatform;
  username: string;
  display_name: string;
  avatar_url?: string;
  access_token_status: string;
  followers_count: number;
  is_active: boolean;
  connected_at: string;
}

export async function initSocialConnect(
  platform: SMMPlatform,
  development: string,
  callbackUrl: string,
): Promise<{ authorization_url: string; state: string } | null> {
  try {
    const data = await api2Client.query<{
      SMM_initSocialConnect: { authorization_url: string; state: string };
    }>(INIT_SOCIAL_CONNECT, { platform, development, callbackUrl });
    return data.SMM_initSocialConnect ?? null;
  } catch {
    return null;
  }
}

export async function getSocialAccounts(development: string): Promise<SMMSocialAccount[]> {
  try {
    const data = await api2Client.query<{
      SMM_getSocialAccounts: { accounts: SMMSocialAccount[] };
    }>(GET_SOCIAL_ACCOUNTS, { development });
    return data.SMM_getSocialAccounts?.accounts ?? [];
  } catch {
    return [];
  }
}

export async function disconnectSocialAccount(id: string): Promise<boolean> {
  try {
    const data = await api2Client.query<{
      SMM_disconnectSocialAccount: { success: boolean };
    }>(DISCONNECT_SOCIAL, { id });
    return data.SMM_disconnectSocialAccount?.success ?? false;
  } catch {
    return false;
  }
}
