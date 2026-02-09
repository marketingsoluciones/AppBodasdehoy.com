/**
 * Configuración de autenticación
 *
 * Este archivo exporta las constantes y tipos necesarios para la autenticación.
 * La autenticación está deshabilitada para este deployment, pero las constantes
 * son necesarias para que el código compile y funcione correctamente.
 */

// Desactivar autenticación (sin usar variables de entorno que no están configuradas)
export const enableClerk = false;
export const enableNextAuth = false;
export const enableAuth = false;

// Headers de autenticación - necesarios para el funcionamiento del código
export const LOBE_CHAT_AUTH_HEADER = 'X-lobe-chat-auth';
export const LOBE_CHAT_OIDC_AUTH_HEADER = 'Oidc-Auth';

export const OAUTH_AUTHORIZED = 'X-oauth-authorized';

export const SECRET_XOR_KEY = 'LobeHub · LobeHub';

/* eslint-disable typescript-sort-keys/interface */
export interface ClientSecretPayload {
  /**
   * password
   */
  accessCode?: string;
  /**
   * Represents the user's API key
   *
   * If provider need multi keys like bedrock,
   * this will be used as the checker whether to use frontend key
   */
  apiKey?: string;
  /**
   * Represents the endpoint of provider
   */
  baseURL?: string;

  azureApiVersion?: string;

  awsAccessKeyId?: string;
  awsRegion?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;

  cloudflareBaseURLOrAccountID?: string;

  /**
   * user id
   * in client db mode it's a uuid
   * in server db mode it's a user id
   */
  userId?: string;
}
/* eslint-enable */
