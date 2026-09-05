import debug from 'debug';

// CAPA 2 PASO C 2026-06-04: image 100% vía api-ia REST (/webapi/text-to-image/{provider}).
// Eliminado fallback tRPC (lambdaClient.image.createImage) — el modo whitelabel siempre
// usa Backend Python.

const log = debug('lobe-image:service');

const BACKEND_URL = process.env.NEXT_PUBLIC_API_IA_URL || 'http://localhost:8080';

// Type local (antes vivía en server/routers/lambda/image.ts).
export interface CreateImageServicePayload {
  generationTopicId: string;
  imageNum: number;
  model: string;
  params: {
    cfg?: number;
    height?: number;
    imageUrls?: string[];
    prompt: string;
    seed?: number | null;
    steps?: number;
    width?: number;
  };
  provider: string;
}

/**
 * Obtiene la configuración del usuario desde localStorage
 */
function getDevUserConfig(): { development?: string; token?: string; userId?: string } | null {
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
 * Genera imagen usando el Backend Python (api-ia) con AUTO-ROUTING.
 *
 * Proveedores: OpenAI DALL-E 3, Google Imagen 3, Ideogram 3, Stability AI,
 * Replicate FLUX, ComfyUI Local. El backend selecciona el mejor según
 * disponibilidad / calidad de texto / coste.
 */
async function createImageWithBackend(payload: CreateImageServicePayload): Promise<{
  error?: string;
  images?: Array<{ b64_json?: string; base64?: string; url: string }>;
  success: boolean;
}> {
  const userConfig = getDevUserConfig();

  let provider = 'auto';

  if (payload.provider) {
    if (payload.provider === 'google' || payload.model?.startsWith('imagen')) {
      provider = 'google';
    } else if (payload.provider === 'openai') {
      provider = 'openai';
    } else if (['ideogram', 'stability', 'replicate', 'comfyui'].includes(payload.provider)) {
      provider = payload.provider;
    }
  }

  const promptLower = payload.params.prompt.toLowerCase();
  let useCase = 'invitation';
  if (promptLower.includes('menu') || promptLower.includes('menú')) {
    useCase = 'menu';
  } else if (promptLower.includes('decoración') || promptLower.includes('decoration') || promptLower.includes('fondo')) {
    useCase = 'decoration';
  } else if (promptLower.includes('save the date') || promptLower.includes('save-the-date')) {
    useCase = 'save_the_date';
  }

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
    size: payload.params.width && payload.params.height
      ? `${payload.params.width}x${payload.params.height}`
      : '1024x1024',
    token: userConfig?.token,
    use_case: useCase,
    user_id: userConfig?.userId || 'anonymous',
    ...(payload.params.imageUrls && payload.params.imageUrls.length > 0 && {
      image_url: payload.params.imageUrls[0],
      strength: 0.75,
    }),
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

    const backendResult = await createImageWithBackend(payload);

    if (backendResult.error) {
      throw new Error(backendResult.error);
    }

    // Adaptar respuesta al formato GenerationBatch esperado por el store.
    const now = new Date();
    return {
      data: {
        batch: {
          config: { prompt: payload.params.prompt },
          createdAt: now,
          generations: (backendResult.images || []).map((img, idx) => {
            let imageUrl = '';
            if (img.url) imageUrl = img.url;
            else if (img.b64_json) imageUrl = `data:image/png;base64,${img.b64_json}`;
            else if (img.base64) imageUrl = `data:image/png;base64,${img.base64}`;

            return {
              asset: imageUrl ? { originalUrl: imageUrl, type: 'image', url: imageUrl } : null,
              asyncTaskId: null,
              createdAt: now,
              id: `gen-${Date.now()}-${idx}`,
              task: { id: `task-${Date.now()}-${idx}`, status: 'success' as any },
            };
          }),
          id: `batch-${Date.now()}`,
          model: payload.model || 'gpt-image-1',
          prompt: payload.params.prompt,
          provider: payload.provider || 'openai',
        },
      },
      success: true,
    };
  }
}

export const imageService = new AiImageService();
