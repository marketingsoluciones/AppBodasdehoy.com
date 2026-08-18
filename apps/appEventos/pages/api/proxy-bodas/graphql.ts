import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { resolveApiBodasAuthGraphqlUrl } from '../../../utils/apiEndpoints';

// bodyParser DESHABILITADO: el parser JSON de Next NO procesa multipart/form-data (uploads),
// dejaba req.body vacío y reenviaba un multipart corrupto a api-mcp → singleUpload HTTP 400.
// Leemos el body CRUDO y lo reenviamos tal cual con su Content-Type original (sirve para JSON
// y para multipart por igual).
export const config = { api: { bodyParser: false } };

function readRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const graphqlUrl = resolveApiBodasAuthGraphqlUrl();
    const contentType = (req.headers['content-type'] as string) || 'application/json';

    const headers: any = { 'Content-Type': contentType };
    if (req.headers.authorization) headers.Authorization = req.headers.authorization;

    // crm-ui / planLimits envían X-Development; Node lo expone como x-development.
    const developmentHeader =
      (req.headers['x-development'] as string | undefined) ||
      (req.headers.development as string | undefined);
    if (developmentHeader) {
      headers['X-Development'] = developmentHeader;
      headers.Development = developmentHeader;
    }
    if (req.headers.isproduction) headers.IsProduction = req.headers.isproduction;
    // Apollo exige este header para peticiones multipart (prevención CSRF de uploads).
    // El proxy anterior NO lo reenviaba → api-mcp rechazaba la subida.
    if (req.headers['x-apollo-operation-name']) {
      headers['x-apollo-operation-name'] = req.headers['x-apollo-operation-name'];
    }

    const rawBody = await readRawBody(req);
    const isMultipart = contentType.includes('multipart/form-data');

    console.log('[API Proxy Bodas] →', graphqlUrl, {
      hasAuth: !!headers.Authorization,
      hasDevelopment: !!headers.Development,
      contentType,
      multipart: isMultipart,
      bytes: rawBody.length,
    });

    const response = await axios.post(graphqlUrl, rawBody, {
      headers,
      timeout: isMultipart ? 60000 : 30000, // uploads pueden tardar más
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      responseType: 'json',
    });

    return res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('[API Proxy Bodas] Error:', JSON.stringify({
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    }, null, 2));

    if (error?.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(503).json({ error: 'Proxy error', message: error?.message });
  }
}
