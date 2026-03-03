import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchApiEventosServer } from '../../../../utils/Fetching';

// Query mínima: solo nombre del evento e invitados con sus mesas.
// No exponemos emails, teléfonos ni otros datos sensibles.
const SEATING_QUERY = `
  query ($var_1: String) {
    queryenEvento_id(var_1: $var_1) {
      _id
      nombre
      tipo
      invitados_array {
        _id
        nombre
        nombre_mesa
        puesto
        asistencia
      }
    }
  }
`;

export interface SeatGuest {
  _id: string;
  nombre: string;
  nombre_mesa: string | null;
  puesto: string | null;
}

export interface SeatingData {
  eventName: string;
  eventType: string;
  guests: SeatGuest[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end('Method Not Allowed');
  }

  const { eventId } = req.query;
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).end('Bad Request');
  }

  try {
    const data = await fetchApiEventosServer({
      query: SEATING_QUERY,
      variables: { var_1: eventId },
      development: false, // portal público: busca en todos los tenants
    });

    const eventos = data?.queryenEvento_id;
    const evento = Array.isArray(eventos) ? eventos[0] : eventos;

    if (!evento) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Filtrar invitados con mesa asignada y que no hayan cancelado
    const guests: SeatGuest[] = (evento.invitados_array || [])
      .filter((g: any) => g.nombre_mesa && g.asistencia !== 'cancelado')
      .map((g: any) => ({
        _id: g._id,
        nombre: g.nombre || '',
        nombre_mesa: g.nombre_mesa || null,
        puesto: g.puesto || null,
      }));

    const result: SeatingData = {
      eventName: evento.nombre || '',
      eventType: evento.tipo || '',
      guests,
    };

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(result);
  } catch (error) {
    console.error('[seating] Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
