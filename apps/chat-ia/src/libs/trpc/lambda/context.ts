import { ClientSecretPayload } from '@lobechat/types';
import { parse } from 'cookie';
import debug from 'debug';
import { NextRequest } from 'next/server';

import { LOBE_CHAT_AUTH_HEADER, LOBE_CHAT_OIDC_AUTH_HEADER } from '@/const/auth';
import { oidcEnv } from '@/envs/oidc';
import { validateOIDCJWT } from '@/libs/oidc-provider/jwt';

// SPRINT-P 2026-05-19 — migración Clerk-out + NextAuth-out:
// Eliminados imports @clerk + next-auth + enableClerk/enableNextAuth + ClerkAuth.
// bodasdehoy usa Firebase via api-ia + OIDC opcional. El contexto mantiene
// soporte completo para OIDC, dev-user-config cookie, x-user-id header
// y LOBE_CHAT_AUTH_HEADER.

const log = debug('lobe-trpc:lambda:context');

export interface OIDCAuth {
  [key: string]: any;
  payload: any;
  sub: string;
}

export interface AuthContext {
  authorizationHeader?: string | null;
  jwtPayload?: ClientSecretPayload | null;
  marketAccessToken?: string;
  oidcAuth?: OIDCAuth | null;
  resHeaders?: Headers;
  userAgent?: string;
  userId?: string | null;
}

/**
 * Inner function for `createContext` where we create the context.
 */
export const createContextInner = async (params?: {
  authorizationHeader?: string | null;
  marketAccessToken?: string;
  oidcAuth?: OIDCAuth | null;
  userAgent?: string;
  userId?: string | null;
}): Promise<AuthContext> => {
  log('createContextInner called with params: %O', params);
  const responseHeaders = new Headers();

  return {
    authorizationHeader: params?.authorizationHeader,
    marketAccessToken: params?.marketAccessToken,
    oidcAuth: params?.oidcAuth,
    resHeaders: responseHeaders,
    userAgent: params?.userAgent,
    userId: params?.userId,
  };
};

export type LambdaContext = Awaited<ReturnType<typeof createContextInner>>;

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/v11/context
 */
export const createLambdaContext = async (request: NextRequest): Promise<LambdaContext> => {
  // Header especial debug solo en development
  const isDebugApi = request.headers.get('lobe-auth-dev-backend-api') === '1';
  const isMockUser = process.env.ENABLE_MOCK_DEV_USER === '1';

  if (process.env.NODE_ENV === 'development' && (isDebugApi || isMockUser)) {
    return { userId: process.env.MOCK_DEV_USER_ID };
  }

  // Autenticación desde dev-user-config cookie (dev-login)
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = parse(cookieHeader);
    const devUserConfig = cookies['dev-user-config'];
    if (devUserConfig) {
      try {
        const config = JSON.parse(decodeURIComponent(devUserConfig));
        if (config.userId) {
          log('Auth from dev-user-config cookie, userId: %s', config.userId);
          return createContextInner({ userId: config.userId });
        }
      } catch (e) {
        log('Failed to parse dev-user-config cookie: %O', e);
      }
    }
  }

  // x-user-id header para chat API
  const xUserId = request.headers.get('x-user-id');
  if (xUserId) {
    log('Auth from x-user-id header, userId: %s', xUserId);
    return createContextInner({ userId: xUserId });
  }

  log('createLambdaContext for request');

  const authorization = request.headers.get(LOBE_CHAT_AUTH_HEADER);
  const userAgent = request.headers.get('user-agent') || undefined;

  const existingCookieHeader = cookieHeader || request.headers.get('cookie');
  const cookies = existingCookieHeader ? parse(existingCookieHeader) : {};
  const marketAccessToken = cookies['mp_token'];

  log('marketAccessToken from cookie:', marketAccessToken ? '[HIDDEN]' : 'undefined');
  const commonContext = {
    authorizationHeader: authorization,
    marketAccessToken,
    userAgent,
  };

  let userId;
  let oidcAuth: OIDCAuth | null = null;

  // OIDC primero (si activado)
  if (oidcEnv.ENABLE_OIDC) {
    log('OIDC enabled, attempting OIDC auth');
    const oidcAuthToken = request.headers.get(LOBE_CHAT_OIDC_AUTH_HEADER);

    try {
      if (oidcAuthToken) {
        const tokenInfo = await validateOIDCJWT(oidcAuthToken);
        oidcAuth = {
          payload: tokenInfo.tokenData,
          ...tokenInfo.tokenData,
          sub: tokenInfo.userId,
        };
        userId = tokenInfo.userId;
        log('OIDC auth successful, userId: %s', userId);

        return createContextInner({
          oidcAuth,
          ...commonContext,
          userId,
        });
      }
    } catch (error) {
      if (oidcAuthToken) {
        log('OIDC auth failed, error: %O', error);
        console.error('OIDC auth failed, trying other methods:', error);
      }
    }
  }

  // Fallback final con authorization header (firebase JWT via api-ia)
  log('Returning final context, userId: %s', userId || 'not authenticated');
  return createContextInner({ ...commonContext, userId });
};
