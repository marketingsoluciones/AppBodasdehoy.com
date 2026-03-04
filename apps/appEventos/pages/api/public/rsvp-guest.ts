import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchApiEventosServer } from '../../../utils/Fetching';

/**
 * GET /api/public/rsvp-guest?p=TOKEN
 *
 * Devuelve los datos completos del evento-invitado para la página de RSVP.
 * No requiere autenticación Firebase. Usa credenciales del servidor.
 *
 * Devuelve:
 *   {
 *     _id: string,                     ← event ID
 *     invitados_array: guests[],
 *     menus_array: menu[]
 *   }
 *
 * Error: { error: string }
 */

const GET_PGUEST_RSVP_QUERY = `
  query($p: String) {
    getPGuestEvent(p: $p) {
      _id
      invitados_array {
        _id
        sexo
        nombre
        estatus
        correo
        telefono
        asistencia
        alergenos
        passesQuantity
        father
        nombre_menu
        grupo_edad
      }
      menus_array {
        nombre_menu
        tipo
      }
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).end('Method Not Allowed');
  }

  const token = req.query.p as string | undefined;
  if (!token || token.length < 4) {
    return res.status(400).json({ error: 'Token requerido' });
  }

  try {
    const data = await fetchApiEventosServer({
      query: GET_PGUEST_RSVP_QUERY,
      variables: { p: token },
    });

    const guestEvent = data?.getPGuestEvent;
    if (!guestEvent?.invitados_array?.length) {
      return res.status(404).json({ error: 'Token no válido o no encontrado' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(guestEvent);
  } catch (error) {
    // Token no válido o error de GraphQL → 404 (no exponer detalles internos)
    return res.status(404).json({ error: 'Token no válido o no encontrado' });
  }
}
