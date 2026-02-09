import debug from 'debug';

import { lambdaClient } from '@/libs/trpc/client';
import { CreateImageServicePayload } from '@/server/routers/lambda/image';

// Create debug logger
const log = debug('lobe-image:service');

// ============================================
// Configuración del Backend Python
// ============================================
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/**
 * Obtiene la configuración del usuario desde localStorage
 */
function getDevUserConfig(): { development?: string; token?: string, userId?: string; } | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawConfig = localStorage.getItem('dev-user-config');
    if (!rawConfig) return null;
    return JSON.parse(rawConfig);
  } catch {
    return null;
  }
}

/**
 * Genera imagen usando el Backend Python con AUTO-ROUTING inteligente
 *
 * El sistema selecciona automáticamente el mejor proveedor según:
 * - Disponibilidad de API keys
 * - Calidad de texto en imágenes (importante para invitaciones)
 * - Costo por imagen
 *
 * Proveedores soportados:
 * - OpenAI DALL-E 3 (buena calidad, buen texto)
 * - Google Imagen 3 (excelente texto)
 * - Ideogram 3 (MEJOR para texto)
 * - Stability AI (económico)
 * - Replicate FLUX (alta calidad)
 * - ComfyUI Local (gratis, fallback)
 */
async function createImageWithBackend(payload: CreateImageServicePayload): Promise<{
  error?: string;
  images?: Array<{ b64_json?: string, base64?: string; url: string; }>;
  success: boolean;
}> {
  const userConfig = getDevUserConfig();

  // =====================================================
  // AUTO-ROUTING: Usar "auto" como provider por defecto
  // El backend seleccionará el mejor proveedor disponible
  // =====================================================
  let provider = 'auto'; // Default: auto-routing inteligente

  // Si el usuario especificó un provider específico, usarlo
  if (payload.provider) {
    if (payload.provider === 'google' || payload.model?.startsWith('imagen')) {
      provider = 'google';
    } else if (payload.provider === 'openai') {
      provider = 'openai';
    } else if (['ideogram', 'stability', 'replicate', 'comfyui'].includes(payload.provider)) {
      provider = payload.provider;
    }
    // Si no coincide con ninguno conocido, usar auto-routing
  }

  // Determinar caso de uso basado en el prompt
  // Esto ayuda al auto-router a seleccionar el mejor modelo
  const promptLower = payload.params.prompt.toLowerCase();
  let useCase = 'invitation'; // Default para bodas
  if (promptLower.includes('menu') || promptLower.includes('menú')) {
    useCase = 'menu';
  } else if (promptLower.includes('decoración') || promptLower.includes('decoration') || promptLower.includes('fondo')) {
    useCase = 'decoration';
  } else if (promptLower.includes('save the date') || promptLower.includes('save-the-date')) {
    useCase = 'save_the_date';
  }

  // ¿Requiere texto en la imagen?
  const requiresText = promptLower.includes('texto') ||
    promptLower.includes('text') ||
    promptLower.includes('invitación') ||
    promptLower.includes('invitation') ||
    promptLower.includes('save the date') ||
    promptLower.includes('fecha') ||
    promptLower.includes('nombre') ||
    useCase !== 'decoration';

  const backendPayload = {
    development: userConfig?.development || 'bodasdehoy',
    model: payload.model, 
    n: payload.imageNum || 1,
    
prompt: payload.params.prompt,
    
quality: 'standard',
    
requires_text: requiresText,
    // Puede ser null, el auto-router elegirá el mejor
size: payload.params.width && payload.params.height
      ? `${payload.params.width}x${payload.params.height}`
      : '1024x1024',
    token: userConfig?.token,
    
    // Parámetros para auto-routing
use_case: useCase,
    
user_id: userConfig?.userId || 'anonymous',
  };

  log('Creating image with backend Python (auto-routing): %O', { provider, requiresText, useCase, ...backendPayload });

  const response = await fetch(`${BACKEND_URL}/webapi/text-to-image/${provider}`, {
    body: JSON.stringify(backendPayload),
    headers: {
      'Content-Type': 'application/json',
      ...(userConfig?.userId && { 'X-User-ID': userConfig.userId }),
      ...(userConfig?.development && { 'X-Development': userConfig.development }),
      ...(userConfig?.token && { 'Authorization': `Bearer ${userConfig.token}` }),
    },
    method: 'POST',
  });

  if (!response.ok) {
    const errorText = await response.text();
    log('Backend image creation failed: %s', errorText);
    throw new Error(`Error generando imagen: ${errorText}`);
  }

  const result = await response.json();
  log('Backend image creation result: %O', result);

  return result;
}

export class AiImageService {
  async createImage(payload: CreateImageServicePayload) {
    log('Creating image with payload: %O', payload);

    // ============================================
    // MODO WHITELABEL: Usar Backend Python
    // ============================================
    // Detectar si estamos en modo whitelabel (sin Clerk / dev-login)
    const useBackend = typeof window !== 'undefined' && localStorage.getItem('dev-user-config');

    if (useBackend) {
      log('Using backend Python for image generation (whitelabel mode)');

      try {
        const backendResult = await createImageWithBackend(payload);

        if (backendResult.error) {
          throw new Error(backendResult.error);
        }

        // Adaptar respuesta al formato esperado por el store
        // El store espera: { success: boolean, data: { batch, generations } }
        // Soporta múltiples formatos de imagen: url, base64, b64_json
        return {
          data: {
            batch: {
              id: `batch-${Date.now()}`,
              model: payload.model,
              prompt: payload.params.prompt,
              provider: payload.provider,
            },
            generations: (backendResult.images || []).map((img: any, idx: number) => {
              // Determinar URL de imagen según formato de respuesta
              let imageUrl = '';
              if (img.url) {
                imageUrl = img.url;
              } else if (img.b64_json) {
                imageUrl = `data:image/png;base64,${img.b64_json}`;
              } else if (img.base64) {
                imageUrl = `data:image/png;base64,${img.base64}`;
              }

              return {
                id: `gen-${Date.now()}-${idx}`,
                imageUrl,
                
model: img.model,
                
                // Metadatos adicionales del auto-routing
provider: img.provider,
                revised_prompt: img.revised_prompt,
                status: 'completed',
              };
            }),
          },
          success: true,
        };
      } catch (error) {
        log('Backend image creation failed: %O', error);
        throw error;
      }
    }

    // ============================================
    // MODO ESTÁNDAR: Usar tRPC Lambda (LobeChat original)
    // ============================================
    try {
      const result = await lambdaClient.image.createImage.mutate(payload);
      log('Image creation service call completed successfully: %O', {
        batchId: result.data?.batch?.id,
        generationCount: result.data?.generations?.length,
        success: result.success,
      });

      return result;
    } catch (error) {
      log('Image creation service call failed: %O', {
        error: (error as Error).message,
        payload,
      });

      throw error;
    }
  }
}

export const imageService = new AiImageService();
