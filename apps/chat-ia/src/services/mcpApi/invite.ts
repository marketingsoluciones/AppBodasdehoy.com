interface InviteTokenBaseResponse {
  message?: string;
  success: boolean;
}

interface ConsumeInviteRequestPayload {
  developer?: string | null;
  email?: string | null;
  phone?: string | null;
  token: string;
}

export interface ConsumeInviteResponse extends InviteTokenBaseResponse {
  development?: string;
  eventos?: unknown[];
  invite?: {
    expires_at?: number;
    expires_at_iso?: string | null;
    invite_id?: string;
    scopes?: string[];
  };
  role?: string;
  token?: string;
  token_expires_at?: number;
  token_expires_at_iso?: string;
  token_source?: string;
  user_data?: {
    displayName?: string;
    email?: string;
    nombre?: string | null;
    telefono?: string;
  };
  user_id?: string;
  user_type?: 'guest' | 'registered';
}

export interface InviteTokenResponse extends InviteTokenBaseResponse {
  development?: string;
  email?: string | null;
  expires_at?: number;
  expires_at_iso?: string;
  metadata?: Record<string, unknown>;
  mode?: string;
  phone?: string | null;
  scopes?: string[];
  token?: string;
}

export async function consumeInviteToken(payload: ConsumeInviteRequestPayload): Promise<ConsumeInviteResponse> {
  const response = await fetch('/api/auth/consume-invite', {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const data: ConsumeInviteResponse = await response.json();

  if (!response.ok) {
    return {
      message: data?.message || `Error ${response.status}`,
      success: false,
    };
  }

  return data;
}

export async function createInviteToken(payload: {
  admin_secret?: string;
  developer?: string;
  email?: string;
  expires_in_minutes?: number;
  metadata?: Record<string, unknown>;
  phone?: string;
  scopes?: string[];
}): Promise<InviteTokenResponse> {
  const response = await fetch('/api/auth/invite-token', {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const data: InviteTokenResponse = await response.json();

  if (!response.ok) {
    return {
      message: data?.message || `Error ${response.status}`,
      success: false,
    };
  }

  return data;
}





