export const DEFAULT_MCP_GRAPHQL_URL = '';
export const DEFAULT_API_IA_ORIGIN = '';

export function resolvePublicMcpGraphqlUrl(): string {
  const u =
    process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API3_MCP_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API2_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API2_URL?.trim();
  if (!u) throw new Error('Missing MCP GraphQL URL. Set NEXT_PUBLIC_API_MCP_GRAPHQL_URL.');
  return u;
}

export function resolvePublicApiIaOrigin(): string {
  const u =
    process.env.NEXT_PUBLIC_API_IA_URL?.trim() ||
    process.env.NEXT_PUBLIC_API3_IA_URL?.trim() ||
    process.env.NEXT_PUBLIC_MEMORIES_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (!u) throw new Error('Missing API IA origin. Set NEXT_PUBLIC_API_IA_URL (or NEXT_PUBLIC_BACKEND_URL).');
  return u;
}
