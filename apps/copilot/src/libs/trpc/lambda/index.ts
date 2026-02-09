/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @link https://trpc.io/docs/v11/router
 * @link https://trpc.io/docs/v11/procedures
 */
import { DESKTOP_USER_ID } from '@/const/desktop';
import { isDesktop } from '@/const/version';

import { userAuth } from '../middleware/userAuth';
import { trpc } from './init';
import { oidcAuth } from './middleware/oidcAuth';

/**
 * Create a router
 * @link https://trpc.io/docs/v11/router
 */
export const router = trpc.router;

/**
 * Create an unprotected procedure
 * @link https://trpc.io/docs/v11/procedures
 * ✅ FIX: Asignar userId por defecto cuando no hay autenticación
 **/
export const publicProcedure = trpc.procedure.use(({ next, ctx }) => {
  // ✅ Prioridad de userId:
  // 1. Si es desktop, usar DESKTOP_USER_ID
  // 2. Si hay ctx.userId (de cookie/header), usarlo
  // 3. Fallback a 'dev-user@localhost' para desarrollo sin auth
  const userId = isDesktop
    ? DESKTOP_USER_ID
    : ctx.userId || 'dev-user@localhost';

  return next({
    ctx: { ...ctx, userId },
  });
});

// procedure that asserts that the user is logged in
export const authedProcedure = trpc.procedure.use(oidcAuth).use(userAuth);

/**
 * Create a server-side caller
 * @link https://trpc.io/docs/v11/server/server-side-calls
 */
export const createCallerFactory = trpc.createCallerFactory;
