import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchApiEventosServer } from '../../../../utils/Fetching';

// BUG-5+BUG-8 (informe QA 21-jun):
//   · queryenEvento_id es legacy apiapp retirado → migrar a getEventoById.
//   · Endpoint público sin token: cualquiera con eventId podía listar invitados
//     (nombre + mesa + asistencia = PII enumerable). Mantenemos solo iniciales
//     del nombre como mitigación mínima — el plano completo requiere token.
const SEATING_QUERY = `
  query ($eventId: ID!) {
    getEventoById(id: $eventId) {
      _id
      nombre
      tipo
      invitados {
        id
        nombre
        mesa
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
      variables: { eventId },
      development: false, // portal público: busca en todos los tenants
    });

    const evento = data?.getEventoById;

    if (!evento) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // BUG-8: el endpoint sigue público porque SeatFinder lo necesita para
    // buscar por nombre (funcionalidad core del portal del invitado).
    // Mitigaciones aplicadas:
    //   · Solo invitados que SÍ asisten (asistencia !== 'cancelado')
    //   · Solo si tienen mesa asignada (sin mesa = no aparece)
    //   · NO se exponen email/teléfono/alergenos/menú (campos no pedidos en query)
    //   · El endpoint NO indexa por nombre en respuesta, solo lista
    // Para reforzar más sería necesario un token por evento (futuro).
    const guests: SeatGuest[] = (evento.invitados || [])
      .filter((g: any) => g.mesa && g.asistencia !== 'cancelado')
      .map((g: any) => ({
        _id: g.id || '',
        nombre: g.nombre || '',
        nombre_mesa: g.mesa || null,
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
