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
  // Auth/Stripe/notif/directorio legacy (api.bodasdehoy) → consolidado a api-mcp 2026-05-26
  'NEXT_PUBLIC_BASE_API_BODAS', 'BASE_API_BODAS',
  'NEXT_PUBLIC_BASE_API_BODAS_URL', 'BASE_API_BODAS_URL',
  // IA memories aliases redundantes → API_IA_URL
  'NEXT_PUBLIC_MEMORIES_API_URL', 'MEMORIES_API_URL',
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
  NEXT_PUBLIC_BASE_API_BODAS: 'API_MCP_GRAPHQL_URL',
  BASE_API_BODAS: 'API_MCP_GRAPHQL_URL',
  NEXT_PUBLIC_BASE_API_BODAS_URL: 'NEXT_PUBLIC_API_MCP_GRAPHQL_URL',
  BASE_API_BODAS_URL: 'NEXT_PUBLIC_API_MCP_GRAPHQL_URL',
  NEXT_PUBLIC_MEMORIES_API_URL: 'NEXT_PUBLIC_API_IA_URL',
  MEMORIES_API_URL: 'API_IA_URL',
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
export const DEFAULT_API_IA_ORIGIN = 'https://api-ia.bodasdehoy.com';
const DEFAULT_EVENTOS_ORIGIN = 'https://api-mcp.eventosorganizador.com';

export function resolveApiBodasGraphqlUrl(): string {
  failIfLegacyAliasSet();
  const raw = process.env.API_MCP_GRAPHQL_URL || process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL;
  const resolved = normalizeGraphqlUrl(raw || DEFAULT_MCP_GRAPHQL_URL);

  if (typeof window !== 'undefined' && window?.location?.hostname) {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocalhost) return '/api/proxy-bodas/graphql';
  }

  return resolved;
}

export function resolveApiBodasOrigin(): string {
  return resolveApiEventosOrigin();
}

export function resolveApiIaOrigin(): string {
  failIfLegacyAliasSet();
  const raw = process.env.API_IA_URL || process.env.NEXT_PUBLIC_API_IA_URL;
  return (raw || DEFAULT_API_IA_ORIGIN).trim().replace(/\/+$/, '');
}

export function resolveApiEventosOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_IMAGES_BASE_URL;
  return (raw || DEFAULT_EVENTOS_ORIGIN).trim().replace(/\/+$/, '');
}

export function resolveApiEventosGraphqlUrl(): string {
  return `${resolveApiEventosOrigin()}/graphql`;
}

export function resolveMcpOrigin(): string {
  return resolveApiBodasGraphqlUrl().replace(/\/graphql\/?$/i, '');
}

// Estándar 2026: auth/Stripe/notif/directorio viven en api-mcp (mismas 2 vars MCP).
// Los nombres NEXT_PUBLIC_BASE_API_BODAS* quedaron RETIRADOS — delega al canónico.
export function resolveApiBodasAuthGraphqlUrl(): string {
  return resolveApiBodasGraphqlUrl();
}

export function resolveApiBodasAuthOrigin(): string {
  return resolveMcpOrigin();
}
