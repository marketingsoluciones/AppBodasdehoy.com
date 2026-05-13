export const DEFAULT_MCP_GRAPHQL_URL = '';

export const DEFAULT_API_IA_ORIGIN = '';

export function resolveApiBodasGraphqlUrl(): string {
  const u =
    process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API3_MCP_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BODAS_URL?.trim() ||
    process.env.API_MCP_GRAPHQL_URL?.trim() ||
    process.env.API3_MCP_GRAPHQL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API2_URL?.trim() ||
    process.env.API_BODAS_URL?.trim();

  if (!u) {
    throw new Error('Missing MCP GraphQL URL. Set API_MCP_GRAPHQL_URL or NEXT_PUBLIC_API_MCP_GRAPHQL_URL.');
  }

  return u;
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

  if (!u) {
    throw new Error('Missing API IA origin. Set API_IA_URL (or NEXT_PUBLIC_API_IA_URL).');
  }

  return u;
}
