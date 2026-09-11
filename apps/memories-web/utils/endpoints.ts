// URLs canónicas memorizadas (memory/MEMORY.md servicios backend 30-abr-2026)
// Si el env var no está seteado, fallback a producción. Throw eliminado para
// que `next build` pueda completar `Collecting page data` sin env local.
export const DEFAULT_MCP_GRAPHQL_URL = 'https://api-mcp.eventosorganizador.com/graphql';
export const DEFAULT_API_IA_ORIGIN = 'https://api-ia.bodasdehoy.com';

const LEGACY_ALIASES = [
  'NEXT_PUBLIC_API3_MCP_GRAPHQL_URL',
  'NEXT_PUBLIC_API2_GRAPHQL_URL',
  'NEXT_PUBLIC_API2_URL',
  'NEXT_PUBLIC_API3_IA_URL',
  'NEXT_PUBLIC_MEMORIES_API_URL',
  'NEXT_PUBLIC_BACKEND_URL',
] as const;

function failIfLegacyAliasSet(): void {
  const detected = LEGACY_ALIASES.filter((k) => process.env[k]?.trim());
  if (detected.length === 0) return;
  const lines = detected.map((k) => `  - ${k}`).join('\n');
  throw new Error(`Legacy env vars detected:\n${lines}\nAllowed: NEXT_PUBLIC_API_MCP_GRAPHQL_URL, NEXT_PUBLIC_API_IA_URL.`);
}

const normalizeGraphqlUrl = (u: string): string => {
  const trimmed = u.trim().replace(/\/+$/, '');
  return /\/graphql$/i.test(trimmed) ? trimmed : `${trimmed}/graphql`;
};

export function resolvePublicMcpGraphqlUrl(): string {
  failIfLegacyAliasSet();
  const raw = process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL;
  if (!raw?.trim()) return DEFAULT_MCP_GRAPHQL_URL;
  return normalizeGraphqlUrl(raw);
}

export function resolvePublicApiIaOrigin(): string {
  failIfLegacyAliasSet();
  const raw = process.env.NEXT_PUBLIC_API_IA_URL;
  if (!raw?.trim()) return DEFAULT_API_IA_ORIGIN;
  return raw.trim().replace(/\/+$/, '');
}
