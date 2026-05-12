import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchApiEventosServer } from '../../../utils/Fetching';

/**
 * GET /api/public/validate-guest?g=TOKEN
 *
 * Valida un token de invitado personalizado (pGuestToken / QR).
 * No requiere autenticación. Devuelve solo los datos mínimos seguros.
 * Nunca expone correo, teléfono, ni datos sensibles del invitado.
 *
 * Respuesta OK:   { valid: true,  guestId, guestName, eventId }
 * Respuesta fail: { valid: false }          (token inválido o no encontrado)
 */

// Query idéntico al de guest-upload.ts (sin _id en el top-level, que no existe en el schema)
const GET_PGUEST_QUERY = `
  query($p: String) {
    getPGuestEvent(p: $p) {
      invitados {
        id
        nombre
      }
    }
  }
`;

export interface ValidateGuestOk {
  valid: true;
  guestId: string;
  guestName: string;
}

export interface ValidateGuestFail {
  valid: false;
}

export type ValidateGuestResponse = ValidateGuestOk | ValidateGuestFail;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ValidateGuestResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).end('Method Not Allowed');
  }

  const token = req.query.g as string | undefined;
  if (!token || token.length < 4) {
    return res.status(200).json({ valid: false });
  }

  try {
    const data = await fetchApiEventosServer({
      query: GET_PGUEST_QUERY,
      variables: { p: token },
    });

    const guests: any[] = data?.getPGuestEvent?.invitados ?? [];
    const mainGuest = guests[0];

    if (!mainGuest?.id) {
      return res.status(200).json({ valid: false });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      valid: true,
      guestId: mainGuest.id,
      guestName: mainGuest.nombre ?? 'Invitado',
    });
  } catch (error) {
    console.error('[validate-guest] Error:', error);
    return res.status(200).json({ valid: false });
  }
}
