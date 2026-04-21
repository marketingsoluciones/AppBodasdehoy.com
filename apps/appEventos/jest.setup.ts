import '@testing-library/jest-dom';

// En `testEnvironment: 'node'` no existe `window`; antd-style puede leer matchMedia al importar.
const _global = globalThis as any;
if (typeof _global.window === 'undefined') {
  Object.defineProperty(_global, 'window', {
    value: _global,
    writable: true,
    configurable: true,
  });
}

Object.defineProperty(_global.window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
