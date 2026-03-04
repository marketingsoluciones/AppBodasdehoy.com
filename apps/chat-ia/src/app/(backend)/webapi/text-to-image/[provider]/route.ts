import { ChatCompletionErrorPayload, TextToImagePayload } from '@lobechat/model-runtime';
import { ChatErrorType } from '@lobechat/types';
import { NextResponse } from 'next/server';

import { checkAuth } from '@/app/(backend)/middleware/auth';
import { initModelRuntimeWithUserPayload } from '@/server/modules/ModelRuntime';
import { createErrorResponse } from '@/utils/errorResponse';

/**
 * Proxy al backend Python para proveedores no soportados por el model-runtime (p.ej. 'auto').
 * Reenvía la petición con los headers originales, incluido el JWT de autenticación.
 */
async function proxyToPythonBackend(
  req: Request,
  provider: string,
): Promise<Response | null> {
  if (process.env.USE_PYTHON_BACKEND === 'false') return null;

  const backendUrl =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.PYTHON_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) return null;

  try {
    const body = await req.text();
    const upstream = `${backendUrl}/webapi/text-to-image/${provider}`;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const auth = req.headers.get('Authorization');
    if (auth) headers['Authorization'] = auth;
    const cookie = req.headers.get('Cookie');
    if (cookie) headers['Cookie'] = cookie;

    const response = await fetch(upstream, { body, headers, method: 'POST' });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return null;
  }
}

export const preferredRegion = [
  'arn1',
  'bom1',
  'cdg1',
  'cle1',
  'cpt1',
  'dub1',
  'fra1',
  'gru1',
  'hnd1',
  'iad1',
  'icn1',
  'kix1',
  'lhr1',
  'pdx1',
  'sfo1',
  'sin1',
  'syd1',
];

// return NextResponse.json(
//   {
//     body: {
//       endpoint: 'https://ai****ix.com/v1',
//       error: {
//         code: 'content_policy_violation',
//         message:
//           'Your request was rejected as a result of our safety system. Image descriptions generated from your prompt may contain text that is not allowed by our safety system. If you believe this was done in error, your request may succeed if retried, or by adjusting your prompt.',
//         param: null,
//         type: 'invalid_request_error',
//       },
//       provider: 'openai',
//     },
//     errorType: 'OpenAIBizError',
//   },
//   { status: 400 },
// );

export const POST = checkAuth(async (req: Request, { params, jwtPayload }) => {
  const { provider } = await params;

  // Intentar proxy al backend Python primero para 'auto' y otros proveedores no nativos
  const proxyResponse = await proxyToPythonBackend(req.clone(), provider);
  if (proxyResponse) return proxyResponse;

  try {
    // ============  1. init chat model   ============ //
    const agentRuntime = await initModelRuntimeWithUserPayload(provider, jwtPayload);

    // ============  2. create chat completion   ============ //

    const data = (await req.json()) as TextToImagePayload;

    const images = await agentRuntime.textToImage(data);

    return NextResponse.json(images);
  } catch (e) {
    const {
      errorType = ChatErrorType.InternalServerError,
      error: errorContent,
      ...res
    } = e as ChatCompletionErrorPayload;

    const error = errorContent || e;
    // track the error at server side
    console.error(`Route: [${provider}] ${errorType}:`, error);

    return createErrorResponse(errorType, { error, ...res, provider });
  }
});
