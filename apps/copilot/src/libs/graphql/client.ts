import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, from, split } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

import { getSupportKey } from '@/const/supportKeys';
import { getAPIOriginHeader, getCurrentDevelopment } from '@/utils/developmentDetector';

// ✅ FIX: Suprimir errores de campos faltantes en cache de Apollo
// Estos errores ocurren cuando la API no devuelve campos opcionales como 'aiModel'
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    // Filtrar mensajes específicos de Apollo sobre campos faltantes
    const message = args[0];
    if (typeof message === 'string' && message.includes('Missing field')) {
      // Solo loguear en desarrollo como warning, no como error
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Apollo Cache] Campo opcional faltante:', message.slice(0, 100));
      }
      return; // No mostrar como error
    }
    originalError.apply(console, args);
  };
}

// Configuración de endpoints - en el navegador usar same-origin para evitar CORS
const getBackendUrl = () =>
  typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030');
const BACKEND_URL = getBackendUrl();
const HTTP_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
  (BACKEND_URL ? `${BACKEND_URL}/graphql` : '/api/graphql');
const WS_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT || `ws://localhost:8030/graphql`;

// Crear link para agregar headers de autenticación dinámicamente
const authLink = new SetContextLink((prevContext) => {
  // Obtener token del localStorage (solo en el cliente)
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      token = localStorage.getItem('jwt_token');
      // También intentar obtener de optimizedApiClient si está disponible
      if (!token) {
        const storedConfig = localStorage.getItem('dev-user-config');
        if (storedConfig) {
          const config = JSON.parse(storedConfig);
          token = config.token || null;
        }
      }
    } catch (error) {
      console.warn('Error obteniendo token:', error);
    }
  }

  // ✅ CORRECCIÓN: Obtener Origin dinámicamente según el development
  const originHeader =
    typeof window !== 'undefined' ? getAPIOriginHeader() : 'https://bodasdehoy.com';

  const currentDevelopment = typeof window !== 'undefined' ? getCurrentDevelopment() : 'bodasdehoy';

  // ✅ NUEVO: Obtener supportKey según el development
  const supportKey = getSupportKey(currentDevelopment);

  console.log(
    `🔐 GraphQL headers: Origin=${originHeader}, Development=${currentDevelopment}, SupportKey=${supportKey}`,
  );

  // Retornar headers extendidos
  const headers = prevContext.headers || {};
  return {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      // ✅ Header adicional para identificar el tenant
      'Developer': currentDevelopment,

      'Origin': originHeader,

      // ✅ Header Developer requerido por API2
      'SupportKey': supportKey,

      // ✅ Origin dinámico basado en development
      'User-Agent': 'LobeChat-Client/1.0',
      'X-Development': currentDevelopment, // ✅ SupportKey para acceso sin login
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
});

// HTTP Link con configuración base
const httpLink = new HttpLink({
  credentials: 'include',
  uri: HTTP_ENDPOINT,
});

// WebSocket Link para subscriptions
const wsLink =
  typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          connectionParams: {
            // Añadir headers de autenticación si es necesario
            // authorization: 'Bearer token',
          },
          shouldRetry: () => true,
          url: WS_ENDPOINT,
        }),
      )
    : null;

// ✅ Error link para manejar errores de GraphQL sin romper la UI
const errorLink = onError((errorResponse: any) => {
  const { graphQLErrors, networkError, operation } = errorResponse;
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }: any) => {
      // Solo loguear en desarrollo, no romper la UI
      if (process.env.NODE_ENV === 'development') {
        console.debug(
          `[GraphQL Error] ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`,
        );
      }
    });
  }
  if (
    networkError && // Solo loguear errores de red en desarrollo
    process.env.NODE_ENV === 'development'
  ) {
    console.debug(`[Network Error] ${operation.operationName}: ${networkError.message}`);
  }
});

// Combinar authLink con httpLink usando `from` de Apollo
const httpLinkWithAuth = from([errorLink, authLink, httpLink]);

// Split link: usa WS para subscriptions y HTTP para queries/mutations
const splitLink =
  typeof window !== 'undefined' && wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
          );
        },
        wsLink,
        httpLinkWithAuth,
      )
    : httpLinkWithAuth;

// Apollo Client
export const apolloClient = new ApolloClient({
  cache: new InMemoryCache({
    // ✅ FIX: Permitir campos faltantes en el cache (evita errores "Missing field 'aiModel'")
    // @ts-expect-error - Apollo InMemoryCache config
    addTypename: true,
    // ✅ NO fallar si hay campos undefined
    possibleTypes: {},
    typePolicies: {
      // ✅ FIX: Manejar campos opcionales en tipos de mensaje
      CHAT_Message: {
        fields: {
          aiModel: {
            read(existing) {
              return existing ?? null; // Retornar null si no existe
            },
          },
          role: {
            read(existing) {
              return existing ?? 'user';
            },
          },
        },
      },

      Query: {
        fields: {
          CHAT_getChatMessagesCursor: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          CHAT_getUserChatsCursor: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
      // ✅ FIX: Manejar campos opcionales en configuración de whitelabel
      WhiteLabelConfigResponse: {
        fields: {
          aiApiKey: {
            read(existing) {
              return existing ?? null;
            },
          },
          aiModel: {
            read(existing) {
              return existing ?? null;
            },
          },
          aiProvider: {
            read(existing) {
              return existing ?? null;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    query: {
      context: {
        fetchOptions: {
          // ✅ CORRECCIÓN: Timeout más largo y opcional para evitar errores al cambiar developer
          // Usar try-catch para crear el signal, si falla (navegadores antiguos), no usar timeout
          signal: (() => {
            try {
              return AbortSignal.timeout(60_000); // ✅ Aumentado a 60 segundos
            } catch {
              return undefined; // No usar timeout si no está soportado
            }
          })(),
        },
      },
      errorPolicy: 'all', // ✅ Permitir datos parciales con errores
      // ❌ REMOVIDO: returnPartialData solo está disponible para watchQuery, no para query
    },
    watchQuery: {
      // No romper UI si hay errores
      context: {
        // ✅ CORRECCIÓN: Timeout más largo y opcional
        fetchOptions: {
          signal: (() => {
            try {
              return AbortSignal.timeout(60_000); // ✅ Aumentado a 60 segundos
            } catch {
              return undefined; // No usar timeout si no está soportado
            }
          })(),
        },
      },
      errorPolicy: 'all',
      // ✅ Retornar datos aunque falten campos
      fetchPolicy: 'cache-and-network',
      // ✅ Permitir datos parciales con errores
      returnPartialData: true,
    },
  },
  link: splitLink as ApolloLink,
});
