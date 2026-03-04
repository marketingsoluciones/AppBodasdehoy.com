import { NextRequest, NextResponse } from 'next/server';

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  exp?: string;
  iss?: string;
  name?: string;
  picture?: string;
  sub?: string;
};

type IdentifyUserResponse = {
  development?: string;
  eventos?: unknown[];
  message?: string;
  role?: string;
  success?: boolean;
  user_data?: {
    displayName?: string;
    email?: string;
    nombre?: string;
    phone?: string;
    telefono?: string;
  };
  user_id?: string;
  user_type?: string;
};

const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
const DEFAULT_BACKEND_URL = process.env.BACKEND_URL || 'https://api-ia.bodasdehoy.com';

const resolveGoogleAudiences = () => {
  const possible = [
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_IDS,
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  ]
    .filter(Boolean)
    .join(',');

  return possible
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const resolveGraphqlUrls = (): string[] => {
  const urls = [
    process.env.GRAPHQL_ENDPOINT,
    process.env.API2_GRAPHQL_URL,
    process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/graphql` : undefined,
    'https://api2.eventosorganizador.com/graphql',
  ];

  return Array.from(
    new Set(
      urls.filter((url): url is string => typeof url === 'string' && url.length > 0)
    )
  );
};

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo> {
  const response = await fetch(`${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`, {
    method: 'GET',
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Token de Google inválido (HTTP ${response.status}): ${errorText.slice(0, 120)}`
    );
  }

  const payload: GoogleTokenInfo = await response.json();
  return payload;
}

async function identifyUserByEmail(email: string, development: string) {
  const backendUrl = `${DEFAULT_BACKEND_URL.replace(/\/$/, '')}/api/auth/identify-user`;

  try {
    const response = await fetch(backendUrl, {
      body: JSON.stringify({ developer: development, email }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(
        `⚠️ identify-user devolvió HTTP ${response.status}: ${errorText.slice(0, 150)}`
      );
      return null;
    }

    const json: IdentifyUserResponse = await response.json();
    return json;
  } catch (error: any) {
    console.warn('⚠️ No se pudo contactar al backend identify-user:', error?.message || error);
    return null;
  }
}

async function fetchUserEventsByEmail(email: string, development: string) {
  const query = `
    query GetAllUserRelatedEventsByEmail($email: String!, $development: String!, $pagination: CRM_PaginationInput!) {
      getAllUserRelatedEventsByEmail(email: $email, development: $development, pagination: $pagination) {
        success
        eventos {
          id
          nombre
          fecha
          tipo
          estatus
          usuario_nombre
        }
        total
        errors {
          message
          code
        }
      }
    }
  `;

  const variables = {
    development,
    email,
    pagination: { limit: 25, page: 1 },
  };

  const graphqlUrls = resolveGraphqlUrls();
  for (const url of graphqlUrls) {
    try {
      const response = await fetch(url, {
        body: JSON.stringify({ query, variables }),
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://eventosorganizador.com',
          'X-Development': development,
        },
        method: 'POST',
        signal: AbortSignal.timeout(7000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️ GraphQL HTTP ${response.status} en ${url}: ${errorText.slice(0, 150)}`);
        continue;
      }

      const result = await response.json();
      const eventsResponse = result?.data?.getAllUserRelatedEventsByEmail;
      if (eventsResponse?.success && Array.isArray(eventsResponse.eventos)) {
        return eventsResponse.eventos as unknown[];
      }
    } catch (error: any) {
      console.warn(`⚠️ Error consultando eventos en ${url}:`, error?.message || error);
      continue;
    }
  }

  return [];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const credential: string | undefined = body?.credential;
    const development: string = body?.developer || 'bodasdehoy';

    if (!credential) {
      return NextResponse.json(
        {
          message: 'El token de Google (credential) es requerido',
          success: false,
        },
        { status: 400 }
      );
    }

    const tokenInfo = await verifyGoogleIdToken(credential);
    const allowedAudiences = resolveGoogleAudiences();

    if (allowedAudiences.length > 0 && tokenInfo.aud && !allowedAudiences.includes(tokenInfo.aud)) {
      return NextResponse.json(
        {
          message: `El token de Google no corresponde a los clientes configurados (${tokenInfo.aud})`,
          success: false,
        },
        { status: 401 }
      );
    }

    const email = tokenInfo.email;
    if (!email) {
      return NextResponse.json(
        {
          message: 'El token de Google no incluye email. No se puede continuar.',
          success: false,
        },
        { status: 400 }
      );
    }

    const identifyPayload = await identifyUserByEmail(email, development);
    const eventos =
      identifyPayload?.eventos && Array.isArray(identifyPayload.eventos)
        ? identifyPayload.eventos
        : await fetchUserEventsByEmail(email, development);

    const responseBody = {
      development: identifyPayload?.development ?? development,
      eventos,
      google_profile: {
        aud: tokenInfo.aud,
        email,
        email_verified:
          typeof tokenInfo.email_verified === 'string'
            ? tokenInfo.email_verified === 'true'
            : Boolean(tokenInfo.email_verified),
        name: tokenInfo.name,
        picture: tokenInfo.picture,
        sub: tokenInfo.sub,
      },
      message:
        identifyPayload?.message ??
        (Array.isArray(eventos) && eventos.length > 0
          ? 'Login con Google exitoso. Eventos disponibles.'
          : 'Login con Google exitoso (modo básico).'),
      role: identifyPayload?.role ?? 'creator',
      success: true,
      token: credential,
      token_source: 'google-identity',
      user_data: {
        displayName:
          identifyPayload?.user_data?.displayName || tokenInfo.name || email.split('@')[0],
        email,
        nombre: identifyPayload?.user_data?.nombre || tokenInfo.name || email.split('@')[0],
        phone: identifyPayload?.user_data?.phone || identifyPayload?.user_data?.telefono,
      },
      user_id: identifyPayload?.user_id || email,
      user_type: identifyPayload?.user_type ?? 'registered',
    };

    return NextResponse.json(responseBody);
  } catch (error: any) {
    console.error('❌ Error en login-with-google:', error);
    return NextResponse.json(
      {
        message: `Error autenticando con Google: ${error?.message || 'Error desconocido'}`,
        success: false,
      },
      { status: 500 }
    );
  }
}





