/**
 * Servicio para obtener credenciales de IA desde el backend local
 *
 * Este servicio se comunica con el endpoint REST del backend Python
 * que a su vez obtiene las credenciales desde API2 usando Access API Keys.
 *
 * Flujo:
 * 1. Frontend → Backend Local (puerto 8030)
 * 2. Backend Local → API2 (con Access API Key)
 * 3. API2 retorna credenciales configuradas en MongoDB
 *
 * Basado en: SISTEMA_CREDENCIALES_IA_COMPLETO.md
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_IA_URL || 'http://localhost:8030';

/**
 * Estructura de credenciales para un provider específico
 */
export interface AIProviderCredentials {
  apiKey: string;
  enabled: boolean;
  model?: string;
}

/**
 * Mapa de credenciales por provider
 */
export interface AICredentialsMap {
  [key: string]: AIProviderCredentials | undefined;
  anthropic?: AIProviderCredentials;
  google?: AIProviderCredentials;
  openai?: AIProviderCredentials;
}

/**
 * Respuesta del endpoint de credenciales
 */
interface AICredentialsResponse {
  credentials?: AICredentialsMap;
  error?: string;
  message?: string;
  success: boolean;
}

/**
 * Obtener credenciales de IA para un developer desde el backend local
 *
 * @param developerId - ID del developer (ej: "bodasdehoy")
 * @returns Mapa de credenciales por provider o null si falla
 *
 * @example
 * ```typescript
 * const credentials = await fetchAICredentials('bodasdehoy');
 * if (credentials?.anthropic) {
 *   console.log('Anthropic API Key:', credentials.anthropic.apiKey);
 * }
 * ```
 */
export async function fetchAICredentials(
  developerId: string
): Promise<AICredentialsMap | null> {
  try {
    // Guard 08-jul: el string literal 'development' es un placeholder sin
    // interpolar (leftover de código viejo o query `?developer=development`
    // en bookmarks). api-mcp responde 404 y dispara alerta
    // "Whitelabel no encontrado: development" (ver Slack 12:29 CET). NO llamar.
    if (!developerId || developerId === 'development') {
      console.warn(`⚠️ fetchAICredentials skip: developerId inválido "${developerId}" — usar tenant real`);
      return null;
    }
    console.log(`🔑 Obteniendo credenciales de IA para developer: ${developerId}`);

    const url = `${BACKEND_URL}/api/developers/${developerId}/ai-credentials`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
      // No incluir credentials ya que es un endpoint público
    });

    if (!response.ok) {
      console.error(`❌ Error HTTP ${response.status} obteniendo credenciales`);
      return null;
    }

    const data: AICredentialsResponse = await response.json();

    if (!data.success) {
      console.warn(`⚠️ Backend retornó success=false:`, data.error || data.message);
      return null;
    }

    // Si no hay credenciales configuradas, retornar objeto vacío
    if (!data.credentials || Object.keys(data.credentials).length === 0) {
      console.log(`ℹ️ No hay credenciales configuradas para ${developerId}`);
      return {};
    }

    console.log(`✅ Credenciales obtenidas para ${developerId}:`,
      Object.keys(data.credentials).join(', '));

    return data.credentials;
  } catch (error) {
    console.error('❌ Error obteniendo credenciales de IA:', error);
    return null;
  }
}

/**
 * Obtener credenciales para un provider específico
 *
 * @param developerId - ID del developer
 * @param provider - Nombre del provider (anthropic, openai, google, etc.)
 * @returns Credenciales del provider o null si no existe
 */
export async function fetchProviderCredentials(
  developerId: string,
  provider: string
): Promise<AIProviderCredentials | null> {
  const credentials = await fetchAICredentials(developerId);

  if (!credentials) {
    return null;
  }

  return credentials[provider] || null;
}

/**
 * Verificar si un provider tiene credenciales configuradas
 *
 * @param developerId - ID del developer
 * @param provider - Nombre del provider
 * @returns true si el provider tiene credenciales habilitadas
 */
export async function hasProviderCredentials(
  developerId: string,
  provider: string
): Promise<boolean> {
  const providerCreds = await fetchProviderCredentials(developerId, provider);
  return !!providerCreds && providerCreds.enabled && !!providerCreds.apiKey;
}
