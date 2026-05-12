import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchApiEventosServer } from '../../../utils/Fetching';

/**
 * POST /api/memories/guest-upload
 *
 * Permite a un invitado subir una foto SIN cuenta Firebase.
 * Soporta dos modos según el nivel de identificación del invitado:
 *
 * Modo A — QR personalizado (nivel 2):
 *   Query params: albumId, pGuestToken
 *   → Valida el token contra api2, obtiene nombre real del invitado
 *   → userId = "guest_{_id_real}"
 *
 * Modo B — Nombre libre (nivel 1):
 *   Query params: albumId, guestId (anon_xxx), guestName
 *   → Sin validación de token, confía en el ID anónimo del cliente
 *   → userId = guestId (e.g. "anon_abc123")
 *
 * En ambos casos el archivo se reenvía a api-ia con el userId correspondiente.
 */

const MEMORIES_API_BASE =
  process.env.API_IA_URL ||
  process.env.NEXT_PUBLIC_API_IA_URL ||
  process.env.API3_IA_URL ||
  process.env.NEXT_PUBLIC_API3_IA_URL ||
  process.env.NEXT_PUBLIC_MEMORIES_API_URL ||
  process.env.MEMORIES_API_URL ||
  'https://api3-ia.eventosorganizador.com';

const GET_GUEST_QUERY = `
  query($p: String) {
    getPGuestEvent(p: $p) {
      invitados {
        id
        nombre
      }
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const albumId = req.query.albumId as string;
    const pGuestToken = req.query.pGuestToken as string | undefined;
    const anonGuestId = req.query.guestId as string | undefined;
    const anonGuestName = req.query.guestName as string | undefined;
    const development = (req.query.development as string) || process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';

    if (!albumId) {
      return res.status(400).json({ success: false, error: 'albumId es requerido' });
    }

    let userId: string;
    let caption: string;

    if (pGuestToken) {
      // ── Modo A: validar pGuestToken ──
      try {
        const result = await fetchApiEventosServer({
          query: GET_GUEST_QUERY,
          variables: { p: pGuestToken },
        });
        const guests: any[] = result?.getPGuestEvent?.invitados ?? [];
        const mainGuest = guests[0];

        if (!mainGuest?.id) {
          return res.status(401).json({ success: false, error: 'Token de invitado no válido' });
        }
        userId = `guest_${mainGuest.id}`;
        caption = mainGuest.nombre ?? 'Invitado';
      } catch {
        return res.status(401).json({ success: false, error: 'No se pudo validar el token de invitado' });
      }
    } else if (anonGuestId && anonGuestName) {
      // ── Modo B: nombre libre (sin validación) ──
      // Aceptamos cualquier ID que empiece por "anon_" (generado client-side)
      if (!anonGuestId.startsWith('anon_') && !anonGuestId.startsWith('guest_')) {
        return res.status(400).json({ success: false, error: 'guestId inválido' });
      }
      userId = anonGuestId;
      caption = anonGuestName.trim().slice(0, 80); // Limitar longitud del nombre
    } else {
      return res.status(400).json({
        success: false,
        error: 'Se requiere pGuestToken (QR personalizado) o guestId + guestName (nombre libre)',
      });
    }

    // ── Reenviar a api-ia ──
    const params = new URLSearchParams({ development, user_id: userId, caption });
    const targetUrl = `${MEMORIES_API_BASE.replace(/\/$/, '')}/api/memories/albums/${albumId}/upload?${params}`;

    const contentType = req.headers['content-type'] || '';
    const rawBody = await getRawBody(req);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(rawBody.length),
      },
      body: rawBody as unknown as BodyInit,
    });

    const responseText = await response.text();
    res.status(response.status);

    try {
      return res.json(JSON.parse(responseText));
    } catch {
      return res.end(responseText);
    }
  } catch (error) {
    console.error('[guest-upload]', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    });
  }
}

function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '20mb',
  },
};
