export const DEFAULT_API_IA_ORIGIN = 'https://api3-ia.eventosorganizador.com';

const LEGACY_ALIASES = [
  'NEXT_PUBLIC_API3_IA_URL',
  'NEXT_PUBLIC_BACKEND_URL',
  'API3_IA_URL',
  'BACKEND_INTERNAL_URL',
  'BACKEND_URL',
  'PYTHON_BACKEND_URL',
] as const;

function failIfLegacyAliasSet(): void {
  const detected = LEGACY_ALIASES.filter((k) => process.env[k]?.trim());
  if (detected.length === 0) return;
  const lines = detected.map((k) => `  - ${k}`).join('\n');
  throw new Error(
    `Legacy API IA env vars detected:\n${lines}\n` +
      `Allowed: API_IA_URL, NEXT_PUBLIC_API_IA_URL.`,
  );
}

export function resolvePublicBackendOrigin(): string {
  failIfLegacyAliasSet();
  const u = process.env.NEXT_PUBLIC_API_IA_URL?.trim() || process.env.API_IA_URL?.trim();
  return u?.replace(/\/+$/, '') || DEFAULT_API_IA_ORIGIN;
}

export function resolveServerBackendOrigin(): string {
  failIfLegacyAliasSet();
  const u = process.env.API_IA_URL?.trim() || process.env.NEXT_PUBLIC_API_IA_URL?.trim();
  return u?.replace(/\/+$/, '') || DEFAULT_API_IA_ORIGIN;
}

export function resolveServerBackendGraphqlUrl(): string {
  const origin = resolveServerBackendOrigin().replace(/\/graphql\/?$/i, '');
  return `${origin}/graphql`;
}

export function resolveServerBackendChatUrl(): string {
  const origin = resolveServerBackendOrigin().replace(/\/$/, '');
  return `${origin}/api/chat`;
}
