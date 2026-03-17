import { join, resolve } from 'node:path';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  optimizeDeps: {
    exclude: ['crypto', 'util', 'tty'],
    include: ['@lobehub/tts'],
  },
  resolve: {
    // Deduplicate React to prevent React 18/19 dual-instance issues
    // (packages/wedding-creator had react@18 as a dependency)
    dedupe: ['react', 'react-dom'],
  },
  test: {
    alias: {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      // Force all packages to use the same React instance (avoids React 18/19 mismatch)
      // Including absolute paths for pnpm's React 18 copy (from packages/wedding-creator)
      'react': resolve(__dirname, './node_modules/react'),
      'react-dom': resolve(__dirname, './node_modules/react-dom'),
      [resolve(__dirname, '../../node_modules/.pnpm/react@18.3.1/node_modules/react')]: resolve(__dirname, './node_modules/react'),
      [resolve(__dirname, '../../node_modules/.pnpm/react-dom@18.3.1/node_modules/react-dom')]: resolve(__dirname, './node_modules/react-dom'),
      '@/database/_deprecated': resolve(__dirname, './src/database/_deprecated'),
      '@/database': resolve(__dirname, './packages/database/src'),
      '@/utils/client/switchLang': resolve(__dirname, './src/utils/client/switchLang'),
      '@/const/locale': resolve(__dirname, './src/const/locale'),
      // TODO: after refactor the errorResponse, we can remove it
      '@/utils/errorResponse': resolve(__dirname, './src/utils/errorResponse'),
      '@/utils/unzipFile': resolve(__dirname, './src/utils/unzipFile'),
      '@/utils/developmentDetector': resolve(__dirname, './src/utils/developmentDetector'),
      '@/utils/checkPythonBackendConfig': resolve(__dirname, './src/utils/checkPythonBackendConfig'),
      '@/utils/performanceMonitor': resolve(__dirname, './src/utils/performanceMonitor'),
      '@/utils/visitorLimit': resolve(__dirname, './src/utils/visitorLimit'),
      '@/const/supportKeys': resolve(__dirname, './src/const/supportKeys'),
      '@/utils': resolve(__dirname, './packages/utils/src'),
      '@/types': resolve(__dirname, './packages/types/src'),
      '@/const': resolve(__dirname, './packages/const/src'),
      '@': resolve(__dirname, './src'),
      '~test-utils': resolve(__dirname, './tests/utils.tsx'),
      /* eslint-enable */
    },
    coverage: {
      all: false,
      exclude: [
        // https://github.com/lobehub/lobe-chat/pull/7265
        ...coverageConfigDefaults.exclude,
        '__mocks__/**',
        '**/packages/**',
        // just ignore the migration code
        // we will use pglite in the future
        // so the coverage of this file is not important
        'src/database/client/core/db.ts',
        'src/utils/fetch/fetchEventSource/*.ts',
      ],
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'text-summary'],
      reportsDirectory: './coverage/app',
    },
    environment: 'happy-dom',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/apps/desktop/**',
      '**/apps/mobile/**',
      '**/packages/**',
      '**/e2e/**',
    ],
    env: {
      // Skip integration tests that require a live backend in normal test runs
      SKIP_BACKEND_TESTS: 'true',
    },
    globals: true,
    server: {
      deps: {
        // Force these packages through Vite's transformer so the react/react-dom
        // aliases apply and we don't end up with two React instances (18 + 19)
        inline: ['vitest-canvas-mock', '@bodasdehoy/wedding-creator', /packages\/wedding-creator/, 'antd', 'rc-field-form', '@ant-design/cssinjs'],
      },
    },
    setupFiles: join(__dirname, './tests/setup.ts'),
    testTimeout: 15000,
  },
});
