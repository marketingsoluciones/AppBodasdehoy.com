/**
 * CAPA 3 PASO C — cliente REST para POST /chat/export/pdf de api-ia.
 *
 * Backend devuelve StreamingResponse (PDF binario directo).
 * Convertimos el blob a base64 para mantener la firma { pdf, filename }
 * que esperan los hooks usePdfGeneration existentes.
 */

const API_IA_BASE = process.env.NEXT_PUBLIC_API_IA_URL || 'https://api-ia.bodasdehoy.com';

function getCtx(): { development: string; idToken?: string; userId?: string } {
  if (typeof window === 'undefined') {
    return { development: process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy' };
  }
  try {
    const raw = localStorage.getItem('dev-user-config');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        development: parsed?.development || process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy',
        idToken: parsed?.token,
        userId: parsed?.userId,
      };
    }
  } catch {
    // ignore
  }
  return { development: process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy' };
}

function authHeaders(): Record<string, string> {
  const { idToken, development, userId } = getCtx();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Development': development,
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (userId) headers['X-User-ID'] = userId;
  return headers;
}

export interface ExportPdfParams {
  content: string;
  sessionId: string;
  title?: string;
  topicId?: string;
}

export interface ExportPdfResult {
  filename: string;
  pdf: string;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('loadend', () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    });
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}

function parseFilename(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) return fallback;
  const match = contentDisposition.match(/filename="?([^";]+)"?/);
  return match?.[1] || fallback;
}

export async function exportPdf(params: ExportPdfParams): Promise<ExportPdfResult> {
  const res = await fetch(`${API_IA_BASE}/chat/export/pdf`, {
    body: JSON.stringify({
      content: params.content,
      sessionId: params.sessionId,
      title: params.title || 'conversacion',
      topicId: params.topicId,
    }),
    headers: authHeaders(),
    method: 'POST',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[/chat/export/pdf] HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const blob = await res.blob();
  const filename = parseFilename(res.headers.get('Content-Disposition'), 'conversacion.pdf');
  const pdf = await blobToBase64(blob);
  return { filename, pdf };
}
