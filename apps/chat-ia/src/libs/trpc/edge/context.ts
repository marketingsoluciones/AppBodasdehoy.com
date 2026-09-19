import { ClientSecretPayload } from '@lobechat/types';
import { NextRequest } from 'next/server';

import { LOBE_CHAT_AUTH_HEADER } from '@/const/auth';

// SPRINT-P 2026-05-19 — migración Clerk-out + NextAuth-out:
// Eliminados imports @clerk + next-auth + ClerkAuth + IClerkAuth + User.
// bodasdehoy usa Firebase via api-ia. El contexto edge solo lee el
// LOBE_CHAT_AUTH_HEADER y queda como pasarela mínima.

export interface AuthContext {
  authorizationHeader?: string | null;
  jwtPayload?: ClientSecretPayload | null;
  userId?: string | null;
}

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export const createContextInner = async (params?: {
  authorizationHeader?: string | null;
  userId?: string | null;
}): Promise<AuthContext> => ({
  authorizationHeader: params?.authorizationHeader,
  userId: params?.userId,
});

export type EdgeContext = Awaited<ReturnType<typeof createContextInner>>;

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/v11/context
 */
export const createEdgeContext = async (request: NextRequest): Promise<EdgeContext> => {
  const authorization = request.headers.get(LOBE_CHAT_AUTH_HEADER);
  return createContextInner({ authorizationHeader: authorization });
};
