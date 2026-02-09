import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

// ✅ MEJORA: Wrapper de seguridad para evitar errores durante la carga del módulo
let oidcEnv: ReturnType<typeof createEnv>;
try {
  oidcEnv = createEnv({
    client: {},
    runtimeEnv: {
      ENABLE_OIDC: process.env.ENABLE_OIDC === '1',
      OIDC_JWKS_KEY: process.env.OIDC_JWKS_KEY,
    },
    server: {
      // 是否启用 OIDC
      ENABLE_OIDC: z.boolean().optional().default(false),
      // OIDC 签名密钥
      // 必须是一个包含私钥的 JWKS (JSON Web Key Set) 格式的 JSON 字符串。
      // 可以使用 `node scripts/generate-oidc-jwk.mjs` 命令生成。
      OIDC_JWKS_KEY: z.string().optional(),
    },
  });
} catch (error: any) {
  // En desarrollo, usar valores por defecto en lugar de fallar
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.warn('⚠️ Error al cargar oidcEnv, usando valores por defecto:', error.message);
    oidcEnv = {
      ENABLE_OIDC: false,
      OIDC_JWKS_KEY: undefined,
    } as any;
  } else {
    // En producción, lanzar el error
    throw error;
  }
}

export { oidcEnv };
