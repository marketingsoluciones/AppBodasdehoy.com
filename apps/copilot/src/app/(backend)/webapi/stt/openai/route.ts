/**
 * STT proxy → api-ia backend
 * No llama a OpenAI directamente. El audio pasa por api-ia para
 * mantener el enrutamiento y facturación centralizada.
 * Reenvía el formData (multipart) tal cual a api-ia.
 */

export const runtime = 'nodejs';

const getBackendUrl = () =>
  process.env.PYTHON_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://api-ia.bodasdehoy.com';

export const POST = async (req: Request) => {
  const backendUrl = getBackendUrl();

  // Reenviar headers relevantes (incluyendo content-type con boundary para multipart)
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (!['host', 'connection', 'content-length', 'transfer-encoding'].includes(k)) {
      headers[key] = value;
    }
  });

  // Reenviar el body raw (multipart formData con el blob de audio)
  const body = await req.arrayBuffer();

  const upstream = await fetch(`${backendUrl}/webapi/stt/openai`, {
    body,
    headers,
    method: 'POST',
  });

  const result = await upstream.json().catch(() => ({ text: '' }));
  return new Response(JSON.stringify(result), {
    headers: { 'content-type': 'application/json;charset=UTF-8' },
    status: upstream.status,
  });
};
