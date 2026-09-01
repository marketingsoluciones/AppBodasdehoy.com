import { OpenAIImagePayload } from '@/types/openai/image';

interface FetchOptions {
  signal?: AbortSignal | undefined;
}

// Fase 1 diseño (1-sep): la generación de imágenes usa el motor MODERNO de api-ia
// (Stability, nivel "ultra", auto-enrutado por el image_ai_router con billing por modelo),
// en vez del DALL-E 3 hardcodeado del fork LobeChat. Contrato confirmado en openapi:
//   POST /api/ai/images/generate/ultra  body {prompt}  →  {success, url, service_type, credits_used}
// El rewrite /api/:path* del front reenvía a api-ia; auth = Bearer del jwt_token (mismo
// patrón que services/api-ia.ts). Devuelve una URL string, igual que antes (interfaz intacta
// para dalle.ts / ToolBar). Modelos más modernos = mejor calidad; api-ia elige/cobra.
const getJWT = (): string =>
  (typeof window !== 'undefined' &&
    (localStorage.getItem('jwt_token') || localStorage.getItem('mcp_jwt_token'))) ||
  '';

class ImageGenerationService {
  generateImage = async (
    params: Omit<OpenAIImagePayload, 'model' | 'n'>,
    options?: FetchOptions,
  ) => {
    const res = await fetch('/api/ai/images/generate/ultra', {
      body: JSON.stringify({ prompt: params.prompt }),
      headers: { Authorization: `Bearer ${getJWT()}`, 'Content-Type': 'application/json' },
      method: 'POST',
      signal: options?.signal,
    });
    if (!res.ok) {
      throw await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
    }
    const json = await res.json();
    const url = json?.url ?? (Array.isArray(json) ? json[0] : undefined);
    if (!url) throw new Error('api-ia images: respuesta sin url');
    return url as string;
  };
}

export const imageGenerationService = new ImageGenerationService();
