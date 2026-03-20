/**
 * s3Config — Obtiene credenciales R2 desde el whitelabel de api2
 *
 * Patrón idéntico al de api-ia (whitelabel_config.py):
 *  - Fetch lazy por development (no en startup)
 *  - Cache in-memory 15 min
 *  - Si api2 cae → error propagado → sin servicio de storage (aceptado)
 *
 * NUNCA leer S3_ACCESS_KEY_ID ni S3_SECRET_ACCESS_KEY de variables de entorno.
 * Las credenciales viven en api2 MongoDB:
 *   whitelabel.externalServices[cloudflare_r2].config.credentials
 */

const GET_WHITELABEL_STORAGE_CONFIG = `
  query GetWhitelabelStorageConfig($development: String!, $supportKey: String) {
    getWhiteLabelStorageConfig(development: $development, supportKey: $supportKey) {
      success
      r2AccountId
      r2AccessKeyId
      r2SecretAccessKey
      r2Bucket
      publicBaseUrl
      errors { field message }
    }
  }
`;

export interface S3WhitelabelConfig {
  accessKeyId: string;
  bucket: string;
  enablePathStyle: boolean;
  endpoint: string;
  publicDomain: string | null;
  region: string;
  secretAccessKey: string;
}

interface CacheEntry {
  config: S3WhitelabelConfig;
  expiresAt: number;
}

const CONFIG_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min — igual que api-ia
const FETCH_TIMEOUT_MS = 10_000; // 10s

/**
 * Obtiene la configuración S3/R2 para el development dado.
 * Usa cache in-memory de 15 min.
 *
 * @param development - Tenant/development (ej: 'bodasdehoy')
 * @throws Error si api2 no responde o no tiene config R2 para ese development
 */
export async function getServerS3Config(development = 'bodasdehoy'): Promise<S3WhitelabelConfig> {
  const cached = CONFIG_CACHE.get(development);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.config;
  }

  const api2Url = process.env.API2_GRAPHQL_URL || 'https://api2.eventosorganizador.com';
  const supportKey = process.env[`SUPPORT_KEY_${development.toUpperCase().replaceAll('-', '_')}`]
    || process.env.API2_SUPPORT_KEY;

  const res = await fetch(`${api2Url}/graphql`, {
    body: JSON.stringify({
      query: GET_WHITELABEL_STORAGE_CONFIG,
      variables: { development, supportKey },
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`[s3Config] api2 returned ${res.status} for development=${development}`);
  }

  const { data, errors } = await res.json();

  if (errors?.length) {
    throw new Error(`[s3Config] api2 GraphQL error: ${errors[0].message}`);
  }

  const cfg = data?.getWhiteLabelStorageConfig;
  if (!cfg?.success || !cfg.r2AccessKeyId) {
    const detail = cfg?.errors?.[0]?.message || 'no config found';
    throw new Error(`[s3Config] No R2 config for development="${development}": ${detail}`);
  }

  const config: S3WhitelabelConfig = {
    accessKeyId: cfg.r2AccessKeyId,
    bucket: cfg.r2Bucket,
    enablePathStyle: true,
    endpoint: `https://${cfg.r2AccountId}.r2.cloudflarestorage.com`,
    publicDomain: cfg.publicBaseUrl || null,
    region: 'auto',
    secretAccessKey: cfg.r2SecretAccessKey,
  };

  CONFIG_CACHE.set(development, { config, expiresAt: Date.now() + CACHE_TTL_MS });
  return config;
}

/**
 * Invalida el cache de un development (o todos si no se especifica).
 * Útil si se actualizan las credenciales R2 en api2.
 */
export function invalidateS3Config(development?: string) {
  if (development) {
    CONFIG_CACHE.delete(development);
  } else {
    CONFIG_CACHE.clear();
  }
}
