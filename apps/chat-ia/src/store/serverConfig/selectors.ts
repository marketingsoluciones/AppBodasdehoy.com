import { ServerConfigStore } from './store';

// BUG-CRASH-01 QA #17 (25-jun): si el SSR fast-timeout (200ms) no resuelve
// serverConfig a tiempo, el store queda con featureFlags/serverConfig undefined
// en hidratación. Los selectores deben ser defensivos para no crashear
// destructures aguas abajo (Desktop layout, StoreInit, useInitUserState).
const EMPTY_FEATURE_FLAGS = {} as any;

export const featureFlagsSelectors = (s: ServerConfigStore) =>
  s.featureFlags ?? EMPTY_FEATURE_FLAGS;

export const serverConfigSelectors = {
  enableUploadFileToServer: (s: ServerConfigStore) =>
    s.serverConfig?.enableUploadFileToServer,
  enabledAccessCode: (s: ServerConfigStore) => !!s.serverConfig?.enabledAccessCode,
  enabledOAuthSSO: (s: ServerConfigStore) => s.serverConfig?.enabledOAuthSSO,
  enabledTelemetryChat: (s: ServerConfigStore) =>
    s.serverConfig?.telemetry?.langfuse || false,
  isMobile: (s: ServerConfigStore) => s.isMobile || false,
  oAuthSSOProviders: (s: ServerConfigStore) => s.serverConfig?.oAuthSSOProviders ?? [],
};
