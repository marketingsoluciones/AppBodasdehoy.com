/* eslint-disable sort-keys-fix/sort-keys-fix , typescript-sort-keys/interface */
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const getLangfuseConfig = () => {
  return createEnv({
    runtimeEnv: {
      ENABLE_LANGFUSE: process.env.ENABLE_LANGFUSE === '1',
      LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY || '',
      LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY || '',
      LANGFUSE_HOST: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
    },

    server: {
      ENABLE_LANGFUSE: z.boolean(),
      LANGFUSE_SECRET_KEY: z.string().optional(),
      LANGFUSE_PUBLIC_KEY: z.string().optional(),
      LANGFUSE_HOST: z.string().url(),
    },
  });
};

// ✅ MEJORA: Wrapper de seguridad para evitar errores durante la carga del módulo
let langfuseEnv: ReturnType<typeof getLangfuseConfig>;
try {
  langfuseEnv = getLangfuseConfig();
} catch (error: any) {
  // En desarrollo, usar valores por defecto en lugar de fallar
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.warn('⚠️ Error al cargar langfuseEnv, usando valores por defecto:', error.message);
    langfuseEnv = {
      ENABLE_LANGFUSE: false,
      LANGFUSE_PUBLIC_KEY: '',
      LANGFUSE_SECRET_KEY: '',
      LANGFUSE_HOST: 'https://cloud.langfuse.com',
    } as any;
  } else {
    // En producción, lanzar el error
    throw error;
  }
}

export { langfuseEnv };
