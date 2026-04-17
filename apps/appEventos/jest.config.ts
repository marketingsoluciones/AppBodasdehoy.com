import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './', tsconfig: './tsconfig.test.json' } as any);

const config: Config = {
  // `jsdom` fuerza la carga del módulo nativo `canvas` (falla en muchos entornos).
  // Estos tests son API/servicios o smoke de exports; no necesitan DOM.
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '**/services/__tests__/**/*.test.ts',
    '**/pages/api/**/__tests__/**/*.test.ts',
    '**/utils/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.ts',
    '**/components/**/__tests__/**/*.test.{ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^nanoid$': '<rootDir>/__mocks__/nanoid.js',
    // @lobehub packages use ESM — mock them for tests that don't exercise UI rendering
    '^@lobehub/ui(.*)$': '<rootDir>/__mocks__/@lobehub/ui.js',
    '^@lobehub/editor(.*)$': '<rootDir>/__mocks__/@lobehub/editor.js',
    // lodash-es is ESM — use lodash CJS instead
    '^lodash-es$': 'lodash',
    '^lodash-es/(.*)$': 'lodash/$1',
  },
};

export default createJestConfig(config);
