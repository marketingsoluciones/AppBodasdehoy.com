import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchApiEventosServer } from '../../../../utils/Fetching';

/**
 * GET /api/public/event/[eventId]
 *
 * Datos básicos del evento para el portal público de invitados.
 * Solo devuelve las tareas del itinerario con spectatorView=true.
 * No requiere autenticación.
 */

// BUG-5 (informe QA 21-jun): queryenEvento_id es legacy apiapp retirado. api-mcp
// usa getEventoById(id:ID!). Endpoint público.
const EVENT_PUBLIC_QUERY = `
  query ($eventId: ID!) {
    getEventoById(id: $eventId) {
      _id
      nombre
      tipo
      fecha
      timeZone
      poblacion
      pais
      color
      imgEventoUrl
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

  try {
    const data = await fetchApiEventosServer({
      query: EVENT_PUBLIC_QUERY,
      variables: { eventId },
      development: false, // portal público: todos los tenants
    });

    const evento = data?.getEventoById;

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
