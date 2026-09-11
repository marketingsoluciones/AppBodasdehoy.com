import { ServerConfigStore } from './store';

// QA 30-jun: todos los selectors aceptan state parcial / undefined sin crashear.
// El store puede quedar con serverConfig=undefined si setState lo sobrescribe
// con respuesta defectuosa de api-ia (initNonCritical en StoreInitialization).
export const featureFlagsSelectors = (s: ServerConfigStore | undefined) => s?.featureFlags;

export const serverConfigSelectors = {
  enableUploadFileToServer: (s: ServerConfigStore | undefined) =>
    s?.serverConfig?.enableUploadFileToServer,
  enabledAccessCode: (s: ServerConfigStore | undefined) => !!s?.serverConfig?.enabledAccessCode,
  enabledOAuthSSO: (s: ServerConfigStore | undefined) => s?.serverConfig?.enabledOAuthSSO,
  enabledTelemetryChat: (s: ServerConfigStore | undefined) =>
    s?.serverConfig?.telemetry?.langfuse || false,
  isMobile: (s: ServerConfigStore | undefined) => s?.isMobile || false,
  oAuthSSOProviders: (s: ServerConfigStore | undefined) =>
    s?.serverConfig?.oAuthSSOProviders ?? [],
};
