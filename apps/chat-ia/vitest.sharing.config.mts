import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
 resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
 test: { environment: 'node', include: ['src/features/SharePermissions/sharing.test.ts'], maxWorkers: 1, minWorkers: 1 },
});
