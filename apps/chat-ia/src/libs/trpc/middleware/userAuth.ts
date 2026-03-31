import { TRPCError } from '@trpc/server';

import { enableClerk } from '@/const/auth';
import { DESKTOP_USER_ID } from '@/const/desktop';
import { isDesktop } from '@/const/version';

import { trpc } from '../lambda/init';

export const userAuth = trpc.middleware(async (opts) => {
  const { ctx } = opts;

  // ✅ MODO DESARROLLO: Si ya hay userId desde cookie/header API2, usarlo
  // Solo usar fallback 'dev-user@localhost' si no hay autenticación
  if (!enableClerk) {
    // Si ya hay userId en el contexto (de dev-user-config cookie o x-user-id header), usarlo
    if (ctx.userId) {
      // Bloquear usuarios visitantes (visitor_*) — no tienen registro en la DB
      if (ctx.userId.startsWith('visitor_')) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Visitor users cannot perform this operation' });
      }
      return opts.next({
        ctx: { userId: ctx.userId },
      });
    }
    // Fallback para desarrollo sin autenticación
    return opts.next({
      ctx: { userId: 'dev-user@localhost' },
    });
  }

  // 桌面端模式下，跳过默认鉴权逻辑
  if (isDesktop) {
    return opts.next({
      ctx: { userId: DESKTOP_USER_ID },
    });
  }
  // `ctx.user` is nullable
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return opts.next({
    // ✅ user value is known to be non-null now
    ctx: { userId: ctx.userId },
  });
});
