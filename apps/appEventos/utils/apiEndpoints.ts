/**
 * Resolución de URLs de APIs canónicas.
 *
 * SOLO 2 APIs en este proyecto:
 *   - API MCP GraphQL  → datos (eventos, invitados, mesas, presupuesto)
 *   - API IA           → chat IA, memories, leads (sub-router), tools
 *
 * SOLO 2 nombres de env var por API (server + public):
 *   API_MCP_GRAPHQL_URL  + NEXT_PUBLIC_API_MCP_GRAPHQL_URL
 *   API_IA_URL           + NEXT_PUBLIC_API_IA_URL
 *
 * Cualquier alias legacy (API_BODAS_URL, PYTHON_BACKEND_URL, NEXT_PUBLIC_API2_URL,
 * API3_*, BACKEND_*, etc.) está RETIRADO desde 2026-05-14 y dispara error explícito.
 * Ver docs/ENV-ENDPOINTS-STANDARD.md para la única lista válida.
 */

const LEGACY_ALIASES = [
  // MCP GraphQL legacy
  'API_BODAS_URL', 'NEXT_PUBLIC_API_BODAS_URL',
  'API3_MCP_GRAPHQL_URL', 'NEXT_PUBLIC_API3_MCP_GRAPHQL_URL',
  'NEXT_PUBLIC_API2_URL', 'API2_URL',
  // API IA legacy
  'API3_IA_URL', 'NEXT_PUBLIC_API3_IA_URL',
  'PYTHON_BACKEND_URL', 'NEXT_PUBLIC_PYTHON_BACKEND_URL',
  'BACKEND_INTERNAL_URL', 'BACKEND_URL', 'NEXT_PUBLIC_BACKEND_URL',
] as const;

const MIGRATION_HINT = {
  API_BODAS_URL: 'API_MCP_GRAPHQL_URL',
  NEXT_PUBLIC_API_BODAS_URL: 'NEXT_PUBLIC_API_MCP_GRAPHQL_URL',
  API3_MCP_GRAPHQL_URL: 'API_MCP_GRAPHQL_URL',
  NEXT_PUBLIC_API3_MCP_GRAPHQL_URL: 'NEXT_PUBLIC_API_MCP_GRAPHQL_URL',
  NEXT_PUBLIC_API2_URL: 'NEXT_PUBLIC_API_MCP_GRAPHQL_URL',
  API2_URL: 'API_MCP_GRAPHQL_URL',
  API3_IA_URL: 'API_IA_URL',
  NEXT_PUBLIC_API3_IA_URL: 'NEXT_PUBLIC_API_IA_URL',
  PYTHON_BACKEND_URL: 'API_IA_URL',
  NEXT_PUBLIC_PYTHON_BACKEND_URL: 'NEXT_PUBLIC_API_IA_URL',
  BACKEND_INTERNAL_URL: 'API_IA_URL',
  BACKEND_URL: 'API_IA_URL',
  NEXT_PUBLIC_BACKEND_URL: 'NEXT_PUBLIC_API_IA_URL',
} as const;

function failIfLegacyAliasSet(): void {
  const detected = LEGACY_ALIASES.filter((k) => process.env[k]?.trim());
  if (detected.length === 0) return;
  const lines = detected.map((k) => `  - ${k} → use ${MIGRATION_HINT[k as keyof typeof MIGRATION_HINT]}`).join('\n');
  throw new Error(
    `Legacy env vars detected (retired 2026-05-14):\n${lines}\n` +
    `Allowed: API_MCP_GRAPHQL_URL, NEXT_PUBLIC_API_MCP_GRAPHQL_URL, API_IA_URL, NEXT_PUBLIC_API_IA_URL.\n` +
    `See docs/ENV-ENDPOINTS-STANDARD.md`,
  );
}

const normalizeGraphqlUrl = (u: string): string => {
  const trimmed = u.trim().replace(/\/+$/, '');
  return /\/graphql$/i.test(trimmed) ? trimmed : `${trimmed}/graphql`;
};

export const DEFAULT_MCP_GRAPHQL_URL = 'https://api-mcp.eventosorganizador.com/graphql';
export const DEFAULT_API_IA_ORIGIN = 'https://api3-ia.eventosorganizador.com';

export function resolveApiBodasGraphqlUrl(): string {
  failIfLegacyAliasSet();
  const raw = process.env.API_MCP_GRAPHQL_URL || process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL;
  return normalizeGraphqlUrl(raw || DEFAULT_MCP_GRAPHQL_URL);
}

export function resolveApiBodasOrigin(): string {
  return resolveApiBodasGraphqlUrl().replace(/\/graphql\/?$/i, '');
}

export function resolveApiIaOrigin(): string {
  failIfLegacyAliasSet();
  const raw = process.env.API_IA_URL || process.env.NEXT_PUBLIC_API_IA_URL;
  return (raw || DEFAULT_API_IA_ORIGIN).trim().replace(/\/+$/, '');
}
