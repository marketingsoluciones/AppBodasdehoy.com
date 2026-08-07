import { resolveServerBackendOrigin } from '@/const/backendEndpoints';
/**
 * TTS proxy → api-ia backend
 * No llama a OpenAI directamente. Todo el audio pasa por api-ia para
 * mantener el enrutamiento y facturación centralizada.
 */

// SPRINT-AC 2026-05-20: edge runtime (antes nodejs). Solo hace fetch a api-ia
// + reenvía stream binario audio — todas Web APIs disponibles en edge.
export const runtime = 'edge';

const getBackendUrl = () =>
  resolveServerBackendOrigin();

export const POST = async (req: Request) => {
  const backendUrl = getBackendUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (!['host', 'connection', 'content-length', 'transfer-encoding'].includes(k)) {
      headers[key] = value;
    }
  });

  const body = await req.text();

  const upstream = await fetch(`${backendUrl}/webapi/tts/openai`, {
    body,
    headers,
    method: 'POST',
  });

  return new Response(upstream.body, {
    headers: upstream.headers,
    status: upstream.status,
  });
};
