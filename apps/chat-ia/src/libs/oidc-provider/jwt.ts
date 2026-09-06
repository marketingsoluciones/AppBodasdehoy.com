import { TRPCError } from '@trpc/server';

// C7 2026-07-20: OIDC deshabilitado permanentemente. bodasdehoy no usa OIDC —
// auth va por Firebase + api-ia. El resto de libs/oidc-provider/* (adapter,
// provider, http-adapter, config, interaction-policy) se borró, junto con las
// rutas (backend)/oidc/* y (auth)/oauth/*.
// Solo se mantiene este stub porque:
//   - `libs/trpc/lambda/context.ts` importa `validateOIDCJWT` con guard
//     `if (oidcEnv.ENABLE_OIDC)` (default false, nunca activo en prod).
//   - `app/(backend)/middleware/auth/index.ts` lo importa con guard
//     `if (oidcAuthorization)` header presente (nunca sin OIDC habilitado).
// Si alguna vez llega una request OIDC por error → 401 explícito.

export const getJWKS = (): object => {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'OIDC deshabilitado (bodasdehoy usa Firebase + api-ia)',
  });
};

export const validateOIDCJWT = async (_token: string): Promise<never> => {
  throw new TRPCError({
    code: 'UNAUTHORIZED',
    message: 'OIDC deshabilitado (bodasdehoy usa Firebase + api-ia)',
  });
};
