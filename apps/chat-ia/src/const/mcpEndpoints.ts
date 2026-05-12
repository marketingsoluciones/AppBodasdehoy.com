// API MCP GraphQL endpoints (datos, eventos, invitados, billing)
/**
 * API MCP (GraphQL + REST bajo el mismo host). Un solo sitio para fallback y helpers.
 * Prioridad: variables de entorno del proyecto → valores por defecto en eventosorganizador.com.
 */
export const DEFAULT_MCP_ORIGIN = 'https://api3-mcp-graphql.eventosorganizador.com';
export const DEFAULT_MCP_GRAPHQL_URL = `${DEFAULT_MCP_ORIGIN}/graphql`;

/** Cliente + RSC: NEXT_PUBLIC primero; en servidor también suele existir API2_GRAPHQL_URL. */
export function resolvePublicMcpGraphqlUrl(): string {
  const u =
    process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL?.trim() ||
    process.env.API_MCP_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API3_MCP_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API2_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API2_URL?.trim() ||
    process.env.API3_MCP_GRAPHQL_URL?.trim() ||
    process.env.API2_GRAPHQL_URL?.trim();
  return u || DEFAULT_MCP_GRAPHQL_URL;
}

/** Handlers Node: env de servidor primero. */
export function resolveServerMcpGraphqlUrl(): string {
  const u =
    process.env.API_MCP_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL?.trim() ||
    process.env.API3_MCP_GRAPHQL_URL?.trim() ||
    process.env.GRAPHQL_ENDPOINT?.trim() ||
    process.env.API2_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API2_GRAPHQL_URL?.trim();
  return u || DEFAULT_MCP_GRAPHQL_URL;
}

export function resolveMcpOrigin(): string {
  return resolvePublicMcpGraphqlUrl().replace(/\/graphql\/?$/i, '');
}

/** OAuth Meta/SMM: callback expuesto por API MCP. */
export function resolveMcpSmmOAuthCallbackUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API2_SMM_OAUTH_CALLBACK_URL?.trim();
  if (explicit) return explicit;
  return `${resolveMcpOrigin()}/api/smm/oauth/callback`;
}
