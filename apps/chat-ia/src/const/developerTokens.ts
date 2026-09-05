/**
 * Tokens JWT por developer para modo desarrollo LOCAL.
 *
 * 🔒 SEGURIDAD: estas son credenciales `role:admin`. NO deben estar hardcodeadas
 * en el código (viajarían en el bundle de test/prod y permitirían suplantar admin).
 *
 * Se cargan EXCLUSIVAMENTE desde la variable de entorno opcional
 * `NEXT_PUBLIC_DEV_TOKENS_JSON`, que solo se define en `.env.local` de desarrollo
 * (nunca commiteada). En test/prod la variable no existe → el mapa queda vacío →
 * no hay ningún token predefinido que inyectar.
 *
 * Además, la auto-inyección está gateada por `isLocalDevBypassEnabled()` en
 * EventosAutoAuth (requiere hostname local + `localStorage.dev_bypass='true'`).
 *
 * Formato de la env var (JSON de un objeto developer → jwt):
 *   NEXT_PUBLIC_DEV_TOKENS_JSON='{"bodasdehoy":"<jwt>","marcablanca":"<jwt>"}'
 */

const parseDevTokens = (): Record<string, string> => {
  const raw = process.env.NEXT_PUBLIC_DEV_TOKENS_JSON;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      // filtrar solo valores string
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string' && v) out[k] = v;
      }
      return out;
    }
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[developerTokens] NEXT_PUBLIC_DEV_TOKENS_JSON no es JSON válido; ignorado.');
    }
  }
  return {};
};

export const DEVELOPER_TOKENS: Record<string, string> = parseDevTokens();

export const getDeveloperToken = (developer: string): string | undefined => {
  return DEVELOPER_TOKENS[developer];
};

export const setDeveloperToken = (developer: string, token: string): void => {
  if (typeof window !== 'undefined' && token) {
    // Guardar en localStorage para que apolloClient lo use
    localStorage.setItem('jwt_token', token);

    // También actualizar en dev-user-config
    try {
      const configStr = localStorage.getItem('dev-user-config');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let config: Record<string, any> = {};
      if (configStr) {
        try {
          if (configStr.trim().startsWith('{') || configStr.trim().startsWith('[')) {
            config = JSON.parse(configStr);
          }
        } catch (e) {
          console.warn('[developerTokens] Error parseando dev-user-config:', e);
          config = {};
        }
      }
      config.token = token;
      config.development = developer;
      config.timestamp = Date.now();
      localStorage.setItem('dev-user-config', JSON.stringify(config));
    } catch (e) {
      console.warn('Error guardando config:', e);
    }
  }
};
