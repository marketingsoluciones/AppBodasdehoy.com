import { NextRequest, NextResponse } from 'next/server';

// Forzar uso del runtime de Node.js para poder hacer peticiones HTTP
export const runtime = 'nodejs';

/**
 * API Route: Login con JWT
 * Proxy al backend Python para autenticación completa con JWT
 *
 * POST /api/auth/login-with-jwt
 * Body: { email: string, password: string, developer: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, developer = 'bodasdehoy' } = body;

    console.log('📥 /api/auth/login-with-jwt proxy recibido:', {
      developer,
      email: email ? `${email.slice(0, 10)}...` : undefined,
      hasPassword: !!password,
    });

    // Validación básica
    if (!email || !password) {
      return NextResponse.json(
        {
          error: 'Email y password son requeridos',
          success: false,
        },
        { status: 400 },
      );
    }

    const PYTHON_BACKEND_URL =
      process.env.PYTHON_BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'https://api-ia.bodasdehoy.com';

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/auth/login-with-jwt`, {
      body: JSON.stringify({
        developer,
        email,
        password,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: AbortSignal.timeout(15_000), // 15 segundos timeout (login puede tardar más)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error ${response.status} del backend Python:`, errorText);

      // Si es 401 (no autorizado), retornar mensaje específico
      if (response.status === 401) {
        return NextResponse.json(
          {
            error: 'Credenciales incorrectas',
            success: false,
          },
          { status: 401 },
        );
      }

      return NextResponse.json(
        {
          error: `Backend error: ${response.statusText}`,
          success: false,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    console.log('✅ Respuesta del backend Python:', {
      development: data.development,
      hasToken: !!data.token,
      success: data.success,
      user_id: data.user_id ? `${data.user_id.slice(0, 20)}...` : undefined,
      user_type: data.user_type,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error en /api/auth/login-with-jwt:', error?.message || error);
    const isConnectionError =
      error?.message?.includes('ECONNREFUSED') ||
      error?.message?.includes('fetch failed') ||
      error?.message?.includes('ENOTFOUND');
    const status = isConnectionError ? 502 : 500;
    return NextResponse.json(
      {
        error: isConnectionError
          ? 'No se pudo conectar al backend IA. Intenta más tarde.'
          : error?.message || 'Error interno del servidor',
        success: false,
      },
      { status },
    );
  }
}

type GraphQLJson = {
  data?: Record<string, any>;
  errors?: Array<{ message?: string } | string>;
};

const resolveGraphqlUrls = (): string[] => {
  const urls = [
    process.env.GRAPHQL_ENDPOINT,
    process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/graphql` : undefined,
    process.env.API2_GRAPHQL_URL,
    'https://api2.eventosorganizador.com/graphql',
  ];

  const sanitized = urls.filter((url): url is string => typeof url === 'string' && url.length > 0);

  return Array.from(new Set<string>(sanitized));
};

const extractGraphqlErrorMessage = (payload?: GraphQLJson | null): string | undefined => {
  if (!payload?.errors || !Array.isArray(payload.errors)) return undefined;

  const messages = payload.errors
    .map((error) => {
      if (typeof error === 'string') return error;
      return error?.message;
    })
    .filter(Boolean);

  return messages.length > 0 ? messages.join(' | ') : undefined;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _generateCRMToken(email: string, password: string, development?: string) {
  const mutation = `
    mutation GenerateToken($input: CRM_GenerateTokenInput!) {
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
  `;

  const input: Record<string, string> = { email, password };
  if (development) {
    input.development = development;
  }

  const variables = { input };

  const graphqlUrls = resolveGraphqlUrls();
  let lastError: string | undefined;

  for (const graphqlUrl of graphqlUrls) {
    try {
      console.log(`🔐 Intentando generateCRMToken contra: ${graphqlUrl}`);

      const response = await fetch(graphqlUrl, {
        body: JSON.stringify({ query: mutation, variables }),
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://eventosorganizador.com',
          'User-Agent': 'LobeChat-Server/1.0',
        },
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(
          `⚠️ generateCRMToken HTTP ${response.status} en ${graphqlUrl}: ${errorText.slice(0, 200)}...`,
        );
        lastError = `HTTP ${response.status}`;
        continue;
      }

      const json: GraphQLJson = await response.json();
      const errorMessage = extractGraphqlErrorMessage(json);

      const tokenPayload = json.data?.generateCRMToken;
      if (tokenPayload?.success && tokenPayload.token) {
        console.log('✅ Token JWT obtenido correctamente (longitud %d)', tokenPayload.token.length);
        return tokenPayload.token as string;
      }

      if (errorMessage) {
        console.warn(`⚠️ generateCRMToken devolvió errores: ${errorMessage}`);
        lastError = errorMessage;
        continue;
      }

      if (tokenPayload?.errors?.length) {
        const firstError = tokenPayload.errors[0];
        const message = typeof firstError === 'string' ? firstError : firstError?.message;
        lastError = message || 'Error desconocido generando token';
        console.warn(`⚠️ generateCRMToken - resultado sin éxito: ${lastError}`);
        continue;
      }

      lastError = 'No se pudo obtener token (respuesta inesperada)';
    } catch (error: any) {
      const message = error?.message || String(error);
      console.error(`❌ Error solicitando generateCRMToken en ${graphqlUrl}: ${message}`);
      lastError = message;
    }
  }

  throw new Error(lastError || 'No se pudo obtener token JWT');
}

/**
 * API Route para login completo con JWT
 * POST /api/auth/login-with-jwt
 */
/**
 * Obtener usuario por email o teléfono desde GraphQL
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _getUserByEmailOrPhone(
  email?: string,
  phone?: string,
  development: string = 'bodasdehoy',
) {
  try {
    if (!email && !phone) {
      console.log('⚠️ getUserByEmailOrPhone: No se proporcionó email ni teléfono');
      return null;
    }

    console.log(`🔍 Buscando usuario en GraphQL:`, {
      development,
      email: email ? `${email.slice(0, 5)}...` : undefined,
      phone: phone ? `${phone.slice(0, 5)}...` : undefined,
    });

    // ✅ CORRECCIÓN: Usar getAllUserRelatedEventsByEmail que SÍ existe en GraphQL
    // Esta query retorna eventos Y datos del usuario
    const query = `
      query GetUserEventsByEmail($email: String!, $development: String!, $pagination: CRM_PaginationInput!) {
        getAllUserRelatedEventsByEmail(email: $email, development: $development, pagination: $pagination) {
          success
          total
          eventos {
            id
            nombre
            fecha
            tipo
            estatus
            usuario_id
            usuario_nombre
            poblacion
          }
          errors {
            field
            message
            code
          }
        }
      }
    `;

    // ✅ CORRECCIÓN: Usar estructura correcta con pagination
    const variables: any = {
      development,
      pagination: {
        limit: 10,
        page: 1,
      },
    };
    if (email) variables.email = email;
    // Si solo hay phone, necesitaríamos otra query (getAllUserRelatedEventsByPhone)
    // Por ahora solo soportamos email
    if (phone && !email) {
      console.warn('⚠️ Login con phone requiere implementar getAllUserRelatedEventsByPhone');
      return null;
    }

    if (!email) {
      return null;
    }

    console.log(`📤 Query GraphQL:`, {
      development,
      email: variables.email ? `${variables.email.slice(0, 5)}...` : undefined,
      phone: variables.phone ? `${variables.phone.slice(0, 5)}...` : undefined,
    });

    const graphqlUrls = resolveGraphqlUrls();
    console.log(`📡 Endpoints GraphQL disponibles:`, graphqlUrls);

    for (const graphqlUrl of graphqlUrls) {
      try {
        console.log(`📡 Haciendo consulta GraphQL a: ${graphqlUrl}`);

        const response = await fetch(graphqlUrl, {
          body: JSON.stringify({ query, variables }),
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://eventosorganizador.com',
            'User-Agent': 'LobeChat-Server/1.0',
          },
          method: 'POST',
          signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `❌ Error GraphQL HTTP ${response.status} en ${graphqlUrl}:`,
            errorText.slice(0, 200),
          );
          continue;
        }

        const result: GraphQLJson = await response.json();

        if (result.errors) {
          console.warn(`⚠️ Errores GraphQL en ${graphqlUrl}:`, result.errors);
          continue;
        }

        const eventosResponse = result.data?.getAllUserRelatedEventsByEmail || null;
        console.log(`📦 Respuesta GraphQL parseada (${graphqlUrl}):`, {
          eventos_count: eventosResponse?.eventos?.length || 0,
          has_errors: !!eventosResponse?.errors?.length,
          has_response: !!eventosResponse,
          success: eventosResponse?.success,
          total: eventosResponse?.total,
        });

        if (eventosResponse && eventosResponse.success !== false) {
          const eventos = eventosResponse.eventos || [];
          if (eventos.length > 0) {
            const primerEvento = eventos[0];
            const localPart = email.split('@')[0] ?? email;
            const userData = {
              _id: primerEvento.usuario_id || email || 'unknown',
              development,
              displayName: primerEvento.usuario_nombre || localPart,
              email,
              nombre: primerEvento.usuario_nombre || localPart,
              phoneNumber: undefined,
              telefono: undefined,
            };
            console.log(`✅ Usuario encontrado en GraphQL (desde eventos):`, {
              _id: userData._id?.slice(0, 20) + '...',
              development,
              email: userData.email?.slice(0, 5) + '...',
              eventos_count: eventos.length,
            });
            return userData;
          }

          // Usuario sin eventos pero existente
          console.log(`✅ Usuario encontrado pero sin eventos (válido):`, { development, email });
          const localPart = email.split('@')[0] ?? email;
          return {
            _id: email,
            development,
            displayName: localPart,
            email,
            nombre: localPart,
            phoneNumber: undefined,
            telefono: undefined,
          };
        }

        if (eventosResponse?.errors && eventosResponse.errors.length > 0) {
          console.error(`❌ Errores GraphQL en ${graphqlUrl}:`, eventosResponse.errors);
        }
      } catch (err: any) {
        console.error(`❌ Error consultando GraphQL en ${graphqlUrl}:`, {
          message: err.message,
          name: err.name,
          stack: err.stack?.slice(0, 200),
          url: graphqlUrl,
        });
        continue;
      }
    }

    return null;
  } catch (error: any) {
    console.error('❌ Error obteniendo usuario:', {
      email: email ? `${email.slice(0, 5)}...` : undefined,
      message: error.message,
      phone: phone ? `${phone.slice(0, 5)}...` : undefined,
      stack: error.stack,
    });
    return null;
  }
}

// NOTA: La función POST exportada está al inicio del archivo (líneas 13-97)
// como proxy al backend Python en localhost:8030
// Las funciones helper de arriba (generateCRMToken, getUserByEmailOrPhone)
// se mantienen por si se necesitan en el futuro para implementación directa
