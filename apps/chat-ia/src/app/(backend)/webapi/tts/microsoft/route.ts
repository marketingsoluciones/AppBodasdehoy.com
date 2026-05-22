/**
 * Microsoft Speech TTS proxy → api-ia backend
 * Migrado 2026-05-20 LOTE 5. Antes usaba @lobehub/tts MicrosoftSpeechTTS local.
 * Ahora proxea el payload tal cual a api-ia que gestiona keys Azure centralizadas.
 */

export const runtime = 'edge';

const getBackendUrl = () =>
  process.env.API_IA_URL ||
  process.env.NEXT_PUBLIC_API_IA_URL ||
  'https://api-ia.bodasdehoy.com';

export const POST = async (req: Request) => {
  const backendUrl = getBackendUrl();

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (!['host', 'connection', 'content-length', 'transfer-encoding'].includes(k)) {
      headers[key] = value;
    }
  });

  const body = await req.arrayBuffer();

  const upstream = await fetch(`${backendUrl}/webapi/tts/microsoft`, {
    body,
    headers,
    method: 'POST',
  });

  return new Response(upstream.body, {
    headers: {
      'content-type': upstream.headers.get('content-type') || 'audio/mpeg',
    },
    status: upstream.status,
  });
};
