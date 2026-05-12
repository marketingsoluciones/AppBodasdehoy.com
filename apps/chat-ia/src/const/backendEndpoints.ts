export const DEFAULT_API_IA_ORIGIN = 'https://api3-ia.eventosorganizador.com';

export function resolvePublicBackendOrigin(): string {
  const u =
    process.env.NEXT_PUBLIC_API_IA_URL?.trim() ||
    process.env.NEXT_PUBLIC_API3_IA_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
    process.env.API_IA_URL?.trim() ||
    process.env.API3_IA_URL?.trim() ||
    process.env.BACKEND_URL?.trim() ||
    process.env.PYTHON_BACKEND_URL?.trim();

  return u || DEFAULT_API_IA_ORIGIN;
}

export function resolveServerBackendOrigin(): string {
  const u =
    process.env.API_IA_URL?.trim() ||
    process.env.API3_IA_URL?.trim() ||
    process.env.PYTHON_BACKEND_URL?.trim() ||
    process.env.BACKEND_INTERNAL_URL?.trim() ||
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim();

  return u || DEFAULT_API_IA_ORIGIN;
}

export function resolveServerBackendGraphqlUrl(): string {
  const origin = resolveServerBackendOrigin().replace(/\/graphql\/?$/i, '');
  return `${origin}/graphql`;
}

export function resolveServerBackendChatUrl(): string {
  const origin = resolveServerBackendOrigin().replace(/\/$/, '');
  return `${origin}/api/chat`;
}
