/**
 * TTS proxy → api-ia backend
 * No llama a OpenAI directamente. Todo el audio pasa por api-ia para
 * mantener el enrutamiento y facturación centralizada.
 */

export const runtime = 'nodejs';

const getBackendUrl = () =>
  process.env.PYTHON_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://api-ia.bodasdehoy.com';

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
