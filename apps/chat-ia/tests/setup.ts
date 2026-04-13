/* eslint-disable import/newline-after-import,import/first */
import '@testing-library/jest-dom';
import { theme } from 'antd';
// mock indexedDB to test with dexie
// refs: https://github.com/dumbmatter/fakeIndexedDB#dexie-and-other-indexeddb-api-wrappers
import 'fake-indexeddb/auto';
import React from 'react';
import { vi } from 'vitest';

// Global mock for @/const/agents to avoid loading the full system role string in tests
vi.mock('@/const/agents/defaultCopilotSystemRole', () => ({
  DEFAULT_COPILOT_SYSTEM_ROLE: 'mock-system-role',
  DEFAULT_OPENING_MESSAGE: 'mock-opening-message',
  DEFAULT_OPENING_QUESTIONS: [],
}));

// Global mock for @lobehub/analytics/react to avoid AnalyticsProvider dependency
// This prevents tests from failing when components use useAnalytics hook
vi.mock('@lobehub/analytics/react', () => ({
  useAnalytics: () => ({
    analytics: {
      track: vi.fn(),
    },
  }),
}));

// node runtime
if (typeof window === 'undefined') {
  // test with polyfill crypto
  const { Crypto } = await import('@peculiar/webcrypto');

  Object.defineProperty(global, 'crypto', {
    value: new Crypto(),
    writable: true,
  });
}

// remove antd hash on test
theme.defaultConfig.hashed = false;

// 将 React 设置为全局变量，这样就不需要在每个测试文件中导入它了
(global as any).React = React;
