import { resolvePublicMcpGraphqlUrl } from '@/const/mcpEndpoints';

const MCP_GRAPHQL_URL = resolvePublicMcpGraphqlUrl();

const DEFAULT_DEVELOPMENT =
  process.env.NEXT_PUBLIC_MCP_DEVELOPMENT ??
  process.env.NEXT_PUBLIC_API2_DEVELOPMENT ??
  process.env.NEXT_PUBLIC_WHITELABEL ??
  'bodasdehoy';

export const DEMO_CREDENTIALS = Object.freeze({
  email: process.env.NEXT_PUBLIC_DEMO_LOGIN_EMAIL ?? process.env.DEMO_LOGIN_EMAIL ?? '',
  password: process.env.NEXT_PUBLIC_DEMO_LOGIN_PASSWORD ?? process.env.DEMO_LOGIN_PASSWORD ?? '',
});

interface GraphQLAuthResponse {
  data?: {
    generateCRMToken?: {
      errors?: Array<{ code?: string | null, field?: string | null; message?: string | null; }> | null;
      success: boolean;
      token?: string | null;
    };
  };
  errors?: Array<{ message?: string }>;
}

export interface LoginMcpParams {
  development?: string;
  email: string;
  password: string;
  rememberToken?: boolean;
}

export interface LoginMcpResult {
  errors?: string[];
  success: boolean;
  token?: string;
}

const buildAuthPayload = (email: string, password: string, development: string) => ({
  query: `
    mutation GenerateCRMToken($input: CRM_GenerateTokenInput!) {
      generateCRMToken(input: $input) {
        success
        token
        errors {
          field
          message
          code
        }
      }
    }
  `,
  variables: {
    input: {
      development,
      email,
      password,
      userInfo: {
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      },
    },
  },
});

export const loginMcp = async ({
  email,
  password,
  development = DEFAULT_DEVELOPMENT,
  rememberToken = true,
}: LoginMcpParams): Promise<LoginMcpResult> => {
  const response = await fetch(MCP_GRAPHQL_URL, {
    body: JSON.stringify(buildAuthPayload(email, password, development)),
    headers: {
      'Content-Type': 'application/json',
      'X-Development': development,
    },
    method: 'POST',
  });

  let payload: GraphQLAuthResponse | undefined;

  try {
    payload = (await response.json()) as GraphQLAuthResponse;
  } catch {
    return {
      errors: ['No se pudo parsear la respuesta del servidor'],
      success: false,
    };
  }

  const directErrors =
    payload?.errors
      ?.map((item) => item?.message)
      .filter((message): message is string => typeof message === 'string' && message.length > 0) ?? [];
  const mutation = payload?.data?.generateCRMToken;

  if (!mutation) {
    return {
      errors: directErrors.length ? directErrors : ['Respuesta inesperada de MCP'],
      success: false,
    };
  }

  const mutationErrors: string[] =
    mutation.errors?.reduce<string[]>((acc, item) => {
      if (item?.message) {
        acc.push(item.message);
      }
      return acc;
    }, []) ?? [];

  if (!mutation.success || !mutation.token) {
    return {
      errors: [...directErrors, ...mutationErrors, 'Credenciales inválidas o token no emitido'],
      success: false,
    };
  }

  if (rememberToken && typeof window !== 'undefined') {
    localStorage.setItem('jwt_token', mutation.token);
    localStorage.setItem('developer', development);
    localStorage.setItem('dev_login_email', email);
  }

  return {
    success: true,
    token: mutation.token,
  };
};

export const loginWithDemoCredentials = async (): Promise<LoginMcpResult> => {
  if (!DEMO_CREDENTIALS.email || !DEMO_CREDENTIALS.password) {
    console.warn(
      '[auth] DEMO_LOGIN_EMAIL / DEMO_LOGIN_PASSWORD no configuradas. Omitiendo login automático.',
    );
    return { errors: ['Credenciales demo no configuradas en variables de entorno'], success: false };
  }
  return loginMcp({
    email: DEMO_CREDENTIALS.email,
    password: DEMO_CREDENTIALS.password,
  });
};

/**
 * Login con Firebase ID Token
 * Intercambia el Firebase ID Token por un JWT oficial (MCP)
 */
export interface LoginWithFirebaseParams {
  development?: string;
  device?: string;
  fingerprint?: string;
  firebaseIdToken: string;
  rememberToken?: boolean;
}

export interface LoginWithFirebaseResult {
  errors?: string[];
  expiresAt?: string;
  success: boolean;
  token?: string;
}

export const loginWithFirebase = async ({
  firebaseIdToken,
  development = DEFAULT_DEVELOPMENT,
  device,
  fingerprint,
  rememberToken = true,
}: LoginWithFirebaseParams): Promise<LoginWithFirebaseResult> => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/firebase-login`, {
      body: JSON.stringify({
        development,
        device,
        fingerprint,
        firebaseIdToken,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      return {
        errors: [errorData.detail || `Error ${response.status}: ${response.statusText}`],
        success: false,
      };
    }

    const data = await response.json();

    if (!data.success || !data.token) {
      return {
        errors: ['No se recibió token de MCP'],
        success: false,
      };
    }

    // Guardar token en localStorage si se solicita
    if (rememberToken && typeof window !== 'undefined') {
      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('developer', data.development || development);
      localStorage.setItem('jwt_expires_at', data.expiresAt || '');
    }

    return {
      expiresAt: data.expiresAt,
      success: true,
      token: data.token,
    };
  } catch (error: any) {
    return {
      errors: [error.message || 'Error al comunicarse con el servidor'],
      success: false,
    };
  }
};
