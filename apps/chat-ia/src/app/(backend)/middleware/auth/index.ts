import { ChatErrorType, ClientSecretPayload } from '@lobechat/types';
import { getXorPayload } from '@lobechat/utils/server';

import { LOBE_CHAT_AUTH_HEADER, LOBE_CHAT_OIDC_AUTH_HEADER } from '@/const/auth';
import { validateOIDCJWT } from '@/libs/oidc-provider/jwt';
import { createErrorResponse } from '@/utils/errorResponse';

// SPRINT-N 2026-05-19 — migración Clerk-out:
// Eliminados @clerk/backend AuthObject, @lobechat/model-runtime AgentRuntimeError/ModelRuntime,
// @/libs/clerk-auth ClerkAuth, ./utils checkAuthMethod, enableClerk.
//
// bodasdehoy es web puro con Firebase via api-ia. El middleware /webapi/* del lado
// chat-ia ya no orquesta runtime LLM (api-ia hace eso). Esta función solo valida
// el JWT envuelto en LOBE_CHAT_AUTH_HEADER + OIDC opcional, y pasa al handler.

type RequestOptions = { params: Promise<{ provider: string }> };

export type RequestHandler = (
  req: Request,
  options: RequestOptions & {
    jwtPayload: ClientSecretPayload;
  },
) => Promise<Response>;

export const checkAuth =
  (handler: RequestHandler) => async (req: Request, options: RequestOptions) => {
    // header especial para debug api endpoint en dev
    const isDebugApi = req.headers.get('lobe-auth-dev-backend-api') === '1';
    if (process.env.NODE_ENV === 'development' && isDebugApi) {
      return handler(req, { ...options, jwtPayload: { userId: 'DEV_USER' } });
    }

    let jwtPayload: ClientSecretPayload;

    try {
      const authorization = req.headers.get(LOBE_CHAT_AUTH_HEADER);

      if (!authorization) {
        return createErrorResponse(ChatErrorType.Unauthorized, {
          error: new Error('Missing authorization header'),
        });
      }

      jwtPayload = getXorPayload(authorization);

      const oidcAuthorization = req.headers.get(LOBE_CHAT_OIDC_AUTH_HEADER);
      if (oidcAuthorization) {
        const oidc = await validateOIDCJWT(oidcAuthorization);
        jwtPayload = {
          ...jwtPayload,
          userId: oidc.userId,
        };
      }
    } catch (e) {
      const params = await options.params;

      if ((e as any).code === 'ERR_JWT_EXPIRED') {
        return createErrorResponse(ChatErrorType.SystemTimeNotMatchError, e);
      }

      console.error('[middleware/auth] auth check failed:', e);
      return createErrorResponse(ChatErrorType.InternalServerError, {
        error: e,
        provider: params?.provider,
      });
    }

    return handler(req, { ...options, jwtPayload });
  };
