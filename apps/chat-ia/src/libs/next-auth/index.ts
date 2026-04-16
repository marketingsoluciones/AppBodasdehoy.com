import NextAuth from 'next-auth';

import authConfig from './auth.config';

/**
 * NextAuth initialization without Database adapter
 *
 * @note
 * We currently use `jwt` strategy for session management.
 * So you don't need to import `signIn` or `signOut` from
 * this module, just import from `next-auth` directly.
 *
 * Inside react component
 * @example
 * ```ts
 * import { signOut } from 'next-auth/react';
 * signOut();
 * ```
 */

// ✅ MEJORA: Wrapper de seguridad para evitar errores durante la carga del módulo
let nextAuthInstance: ReturnType<typeof NextAuth>;
try {
  nextAuthInstance = NextAuth(authConfig);
} catch (error: any) {
  // En desarrollo, crear una instancia mínima en lugar de fallar
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.warn('⚠️ Error al inicializar NextAuth, usando instancia mínima:', error.message);
    // Crear una instancia mínima que no falle
    nextAuthInstance = NextAuth({
      providers: [],
      secret: process.env.NEXT_AUTH_SECRET || 'dev-secret',
    }) as any;
  } else {
    // En producción, lanzar el error
    throw error;
  }
}

export default nextAuthInstance;
