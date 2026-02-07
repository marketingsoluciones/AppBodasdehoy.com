import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/services/__tests__/**/*.test.ts',
    '**/pages/api/**/__tests__/**/*.test.ts',
    '**/utils/__tests__/**/*.test.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default createJestConfig(config);
