import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchApiEventosServer } from '../../../../utils/Fetching';

/**
 * GET /api/public/event/[eventId]
 *
 * Datos básicos del evento para el portal público de invitados.
 * Solo devuelve las tareas del itinerario con spectatorView=true.
 * No requiere autenticación.
 */

const EVENT_PUBLIC_QUERY = `
  query ($variable: String, $valor: String, $development: String!) {
    queryenEvento(variable: $variable, valor: $valor, development: $development) {
      _id
      nombre
      tipo
      fecha
      timeZone
      poblacion
      pais
      color
      imgEvento { i800 }
      lugar { _id title slug }
      itinerarios_array {
        _id
        title
        tipo
        tasks {
          _id
          fecha
          hora
          horaActiva
          icon
          descripcion
          duracion
          spectatorView
          estatus
        }
      }
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const eventId = req.query.eventId as string;
  const development = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';

  try {
    const data = await fetchApiEventosServer({
      query: EVENT_PUBLIC_QUERY,
      variables: { variable: '_id', valor: eventId, development },
    });

    const eventos = data?.queryenEvento;
    const evento = Array.isArray(eventos) ? eventos[0] : eventos;

    if (!evento) {
      return res.status(404).json({ error: 'not_found' });
    }

    // Filtrar tasks a solo las marcadas spectatorView=true
    const filtered = {
      ...evento,
      itinerarios_array: (evento.itinerarios_array ?? []).map((it: any) => ({
        ...it,
        tasks: (it.tasks ?? []).filter((t: any) => t.spectatorView === true),
      })),
    };

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res.status(200).json({ event: filtered });
  } catch (error) {
    console.error('[/api/public/event]', error);
    return res.status(500).json({ error: 'server_error' });
  }
}
