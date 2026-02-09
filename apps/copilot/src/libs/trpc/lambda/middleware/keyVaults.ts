import { getXorPayload } from '@lobechat/utils/server';
import { TRPCError } from '@trpc/server';

import { enableClerk } from '@/const/auth';

import { trpc } from '../init';

export const keyVaults = trpc.middleware(async (opts) => {
  const { ctx } = opts;

  // ✅ MODO DESARROLLO: Si no hay autenticación Clerk, usar jwtPayload vacío
  // Las API keys vendrán de las variables de entorno del servidor
  if (!enableClerk) {
    // Si hay authorizationHeader, intentar decodificarlo
    if (ctx.authorizationHeader) {
      try {
        const jwtPayload = getXorPayload(ctx.authorizationHeader);
        return opts.next({ ctx: { jwtPayload } });
      } catch {
        // Si falla la decodificación, usar payload vacío
        console.log('[keyVaults] Dev mode: Using empty jwtPayload');
        return opts.next({ ctx: { jwtPayload: {} } });
      }
    }
    // Sin header, usar payload vacío para desarrollo
    console.log('[keyVaults] Dev mode: No authorizationHeader, using empty jwtPayload');
    return opts.next({ ctx: { jwtPayload: {} } });
  }

  if (!ctx.authorizationHeader) throw new TRPCError({ code: 'UNAUTHORIZED' });

  try {
    const jwtPayload = getXorPayload(ctx.authorizationHeader);

    return opts.next({ ctx: { jwtPayload } });
  } catch (e) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: (e as Error).message });
  }
});
