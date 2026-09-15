import { defineConfig } from 'vitest/config';

/**
 * Este paquete no tenía runner: los tests que ya vivían aquí
 * (`src/branding/__tests__/whitelabel.test.ts`) no los ejecutaba nadie, porque
 * la única config de vitest del monorepo está en `apps/chat-ia` y su `include`
 * no sale de esa app.
 *
 * `happy-dom` porque el código de subida usa File/Blob/DataView del navegador.
 *
 * Ejecutar:  cd packages/shared && npx vitest run --silent='passed-only'
 */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
