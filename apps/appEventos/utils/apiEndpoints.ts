export const DEFAULT_MCP_GRAPHQL_URL = 'https://api3-mcp-graphql.eventosorganizador.com/graphql';

export const DEFAULT_API_IA_ORIGIN = 'https://api3-ia.eventosorganizador.com';

export function resolveApiBodasGraphqlUrl(): string {
  const u =
    process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API3_MCP_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BODAS_URL?.trim() ||
    process.env.API_MCP_GRAPHQL_URL?.trim() ||
    process.env.API3_MCP_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API2_URL?.trim() ||
    process.env.API_BODAS_URL?.trim();

  return u || DEFAULT_MCP_GRAPHQL_URL;
}

export function resolveApiBodasOrigin(): string {
  return resolveApiBodasGraphqlUrl().replace(/\/graphql\/?$/i, '');
}

export function resolveApiIaOrigin(): string {
  const u =
    process.env.API_IA_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_IA_URL?.trim() ||
    process.env.API3_IA_URL?.trim() ||
    process.env.NEXT_PUBLIC_API3_IA_URL?.trim() ||
    process.env.PYTHON_BACKEND_URL?.trim() ||
    process.env.BACKEND_INTERNAL_URL?.trim() ||
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim();

  return u || DEFAULT_API_IA_ORIGIN;
}
