type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

type SessionBridgeModule = typeof import('../../../../packages/shared/src/auth/SessionBridge');
type AuthBridgeModule = typeof import('../../../../packages/shared/src/auth/AuthBridge');

const makeToken = (payload: Record<string, unknown>) => {
  const base64Url = (value: string) =>
    Buffer.from(value, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/u, '');

  return `${base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${base64Url(JSON.stringify(payload))}.sig`;
};

describe('shared auth session hardening', () => {
  let writes: string[];
  let cookieJar: Map<string, string>;
  let localStorageMock: StorageLike;
  let sessionStorageMock: StorageLike;
  let sessionBridge: SessionBridgeModule;
  let authBridgeModule: AuthBridgeModule;

  beforeEach(() => {
    jest.resetModules();
    writes = [];
    cookieJar = new Map();

    const buildStorage = (): StorageLike => {
      const store = new Map<string, string>();
      return {
        getItem: (key) => store.get(key) ?? null,
        setItem: (key, value) => {
          store.set(key, value);
        },
        removeItem: (key) => {
          store.delete(key);
        },
        clear: () => {
          store.clear();
        },
      };
    };

    localStorageMock = buildStorage();
    sessionStorageMock = buildStorage();

    Object.defineProperty(global, 'window', {
      configurable: true,
      writable: true,
      value: {
        location: {
          hostname: 'app-dev.bodasdehoy.com',
          protocol: 'https:',
        },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        localStorage: localStorageMock,
        sessionStorage: sessionStorageMock,
      },
    });

    Object.defineProperty(global, 'localStorage', {
      configurable: true,
      writable: true,
      value: localStorageMock,
    });

    Object.defineProperty(global, 'sessionStorage', {
      configurable: true,
      writable: true,
      value: sessionStorageMock,
    });

    Object.defineProperty(global, 'document', {
      configurable: true,
      writable: true,
      value: {},
    });

    Object.defineProperty(global.document, 'cookie', {
      configurable: true,
      get: () =>
        [...cookieJar.entries()]
          .map(([key, value]) => `${key}=${value}`)
          .join('; '),
      set: (value: string) => {
        writes.push(value);
        const [firstPart] = value.split(';');
        const [rawName, ...rawValue] = firstPart.split('=');
        const name = rawName.trim();
        const cookieValue = rawValue.join('=').trim();
        const lower = value.toLowerCase();
        if (lower.includes('max-age=0')) {
          cookieJar.delete(name);
          return;
        }
        cookieJar.set(name, cookieValue);
      },
    });

    Object.defineProperty(global, 'atob', {
      configurable: true,
      writable: true,
      value: (input: string) => Buffer.from(input, 'base64').toString('binary'),
    });

    sessionBridge = require('../../../../packages/shared/src/auth/SessionBridge');
    authBridgeModule = require('../../../../packages/shared/src/auth/AuthBridge');
  });

  afterEach(() => {
    sessionBridge.clearLogoutTransition();
    localStorageMock.clear();
    sessionStorageMock.clear();
    cookieJar.clear();
    writes = [];
    jest.clearAllMocks();
  });

  test('clearCrossAppSession expira id token, development y cookies de sesión/guest en variantes host-only y cross-domain', () => {
    sessionBridge.clearCrossAppSession();

    expect(writes.some((entry) => entry.startsWith(`${sessionBridge.CROSS_APP_ID_TOKEN_COOKIE}=`))).toBe(true);
    expect(writes.some((entry) => entry.startsWith(`${sessionBridge.CROSS_APP_DEVELOPMENT_COOKIE}=`))).toBe(true);
    expect(writes.some((entry) => entry.startsWith('sessionBodas='))).toBe(true);
    expect(writes.some((entry) => entry.startsWith('guestbodas='))).toBe(true);
    expect(writes.some((entry) => entry.startsWith('sessionOrganizador='))).toBe(true);
    expect(writes.some((entry) => entry.includes('Domain=.bodasdehoy.com') && entry.startsWith('sessionBodas='))).toBe(true);
    expect(writes.some((entry) => !entry.includes('Domain=') && entry.startsWith('sessionBodas='))).toBe(true);
  });

  test('getSharedAuthState ignora cookies válidas mientras existe transición de logout activa', () => {
    const sessionToken = makeToken({
      user_id: 'uid-test',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    document.cookie = `sessionBodas=${sessionToken}; path=/`;
    localStorage.setItem('dev-user-config', JSON.stringify({
      development: 'bodasdehoy',
      user_data: { email: 'bodasdehoy.com@gmail.com' },
    }));

    expect(authBridgeModule.authBridge.getSharedAuthState().isAuthenticated).toBe(true);

    sessionBridge.beginLogoutTransition(15_000);

    expect(sessionBridge.isLogoutTransitionActive()).toBe(true);
    expect(authBridgeModule.authBridge.getSharedAuthState()).toMatchObject({
      isAuthenticated: false,
      user: null,
    });
  });

  test('getFreshIdToken reutiliza el token vigente y refresca el próximo a expirar', async () => {
    const stableToken = makeToken({
      sub: 'uid-stable',
      iss: 'https://securetoken.google.com/bodasdehoy-1063',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const expiringToken = makeToken({
      sub: 'uid-expiring',
      iss: 'https://securetoken.google.com/bodasdehoy-1063',
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    const refreshedToken = makeToken({
      sub: 'uid-expiring',
      iss: 'https://securetoken.google.com/bodasdehoy-1063',
      exp: Math.floor(Date.now() / 1000) + 7200,
    });

    const stableGetter = jest.fn().mockResolvedValue(refreshedToken);
    const expiringGetter = jest.fn().mockResolvedValue(refreshedToken);

    await expect(
      sessionBridge.getFreshIdToken({
        currentToken: stableToken,
        getToken: stableGetter,
      })
    ).resolves.toBe(stableToken);

    await expect(
      sessionBridge.getFreshIdToken({
        currentToken: expiringToken,
        getToken: expiringGetter,
      })
    ).resolves.toBe(refreshedToken);

    expect(stableGetter).not.toHaveBeenCalled();
    expect(expiringGetter).toHaveBeenCalledTimes(1);
    expect(writes.some((entry) => entry.startsWith(`${sessionBridge.CROSS_APP_ID_TOKEN_COOKIE}=${refreshedToken}`))).toBe(true);
  });
});
