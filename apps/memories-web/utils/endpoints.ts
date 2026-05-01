export const DEFAULT_MCP_GRAPHQL_URL = 'https://api3-mcp-graphql.eventosorganizador.com/graphql';
export const DEFAULT_API_IA_ORIGIN = 'https://api3-ia.eventosorganizador.com';

export function resolvePublicMcpGraphqlUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API3_MCP_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API2_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API2_URL?.trim() ||
    DEFAULT_MCP_GRAPHQL_URL
  );
}

export function resolvePublicApiIaOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_API_IA_URL?.trim() ||
    process.env.NEXT_PUBLIC_API3_IA_URL?.trim() ||
    process.env.NEXT_PUBLIC_MEMORIES_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
    DEFAULT_API_IA_ORIGIN
  );
}

