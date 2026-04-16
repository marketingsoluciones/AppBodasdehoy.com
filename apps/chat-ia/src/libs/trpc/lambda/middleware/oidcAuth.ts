import { trpc } from '../init';

export const oidcAuth = trpc.middleware(async (opts) => {
  const { ctx, next } = opts;

  // 检查 OIDC 认证
  if (ctx.oidcAuth) {
    return next({
      ctx: { oidcAuth: ctx.oidcAuth, userId: ctx.oidcAuth.sub },
    });
  }

  // ✅ Si ya hay userId desde cookie API2 (dev-user-config), preservarlo
  if (ctx.userId) {
    return next({
      ctx: { userId: ctx.userId },
    });
  }

  // Fallback para desarrollo sin autenticación
  const mockAuth = {
    email: 'dev-user@localhost',
    sub: 'dev-user@localhost',
  };
  return next({
    ctx: { oidcAuth: mockAuth, userId: mockAuth.sub },
  });
});
