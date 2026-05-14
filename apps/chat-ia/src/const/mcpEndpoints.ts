// API MCP GraphQL endpoints (datos, eventos, invitados, billing).
// Norma 2026-05-14: solo 2 nombres válidos (server + public).
// Aliases legacy retirados → ver docs/ENV-ENDPOINTS-STANDARD.md
export const DEFAULT_MCP_ORIGIN = 'https://api-mcp.eventosorganizador.com';
export const DEFAULT_MCP_GRAPHQL_URL = 'https://api-mcp.eventosorganizador.com/graphql';

const LEGACY_ALIASES = [
  'API_BODAS_URL', 'NEXT_PUBLIC_API_BODAS_URL',
  'API3_MCP_GRAPHQL_URL', 'NEXT_PUBLIC_API3_MCP_GRAPHQL_URL',
  'API2_URL', 'NEXT_PUBLIC_API2_URL', 'NEXT_PUBLIC_API2_GRAPHQL_URL',
  'API_MCP_URL', 'GRAPHQL_ENDPOINT',
] as const;

function failIfLegacyAliasSet(): void {
  const detected = LEGACY_ALIASES.filter((k) => process.env[k]?.trim());
  if (detected.length === 0) return;
  const lines = detected.map((k) => `  - ${k}`).join('\n');
  throw new Error(
    `Legacy MCP env vars detected (retired 2026-05-14):\n${lines}\n` +
      `Allowed: API_MCP_GRAPHQL_URL, NEXT_PUBLIC_API_MCP_GRAPHQL_URL.\n` +
      `See docs/ENV-ENDPOINTS-STANDARD.md`,
  );
}

const normalizeGraphqlUrl = (u: string): string => {
  const trimmed = u.trim().replace(/\/+$/, '');
  if (/\/graphql$/i.test(trimmed)) return trimmed;
  return `${trimmed}/graphql`;
};

/** Cliente + RSC */
export function resolvePublicMcpGraphqlUrl(): string {
  failIfLegacyAliasSet();
  const raw = process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL || process.env.API_MCP_GRAPHQL_URL;
  return normalizeGraphqlUrl(raw || DEFAULT_MCP_GRAPHQL_URL);
}

/** Handlers Node */
export function resolveServerMcpGraphqlUrl(): string {
  failIfLegacyAliasSet();
  const raw = process.env.API_MCP_GRAPHQL_URL || process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL;
  return normalizeGraphqlUrl(raw || DEFAULT_MCP_GRAPHQL_URL);
}

export function resolveMcpOrigin(): string {
  return resolvePublicMcpGraphqlUrl().replace(/\/graphql\/?$/i, '');
}

/** OAuth Meta/SMM: callback expuesto por API MCP. */
export function resolveMcpSmmOAuthCallbackUrl(): string {
  return `${resolveMcpOrigin()}/api/smm/oauth/callback`;
}
