import { NextRequest, NextResponse } from 'next/server';

const API2_URL = 'https://api2.eventosorganizador.com/graphql';

const SUPPORT_KEYS: Record<string, string> = {
  bodasdehoy: 'SK-bodasdehoy-a71f5b3c',
  eventosorganizador: 'SK-eventosorganizador-6e38d7f4',
};

const EVENTS_WITH_TASKS_QUERY = `
  query GetEventsWithTasks($email: String!, $development: String!) {
    getAllUserRelatedEventsByEmail(
      email: $email
      development: $development
      pagination: { page: 1, limit: 100 }
    ) {
      success
      eventos {
        id
        nombre
        fecha
        tipo
        itinerarios_array
      }
    }
  }
`;

function extractUserConfig(req: NextRequest): { userId: string | null; development: string } {
  let userId: string | null = null;
  let development = 'bodasdehoy';

  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const devConfigMatch = cookieHeader.match(/dev-user-config=([^;]+)/);
    if (devConfigMatch) {
      const decoded = decodeURIComponent(devConfigMatch[1]);
      if (decoded.startsWith('{')) {
        const config = JSON.parse(decoded);
        userId = config.userId || config.user_id || null;
        development = config.development || development;
      }
    }
  } catch {
    // cookie not available
  }

  // Fallback: X-User-ID header
  if (!userId) userId = req.headers.get('X-User-ID');

  const devHeader = req.headers.get('X-Development');
  if (devHeader) development = devHeader;

  return { userId, development };
}

export async function GET(req: NextRequest) {
  const { userId, development } = extractUserConfig(req);

  if (!userId || userId === 'visitante@guest.local' || userId.startsWith('visitor_')) {
    return NextResponse.json({ events: [] });
  }

  // Only works with email-based userId
  if (!userId.includes('@')) {
    return NextResponse.json({ events: [] });
  }

  try {
    const supportKey = SUPPORT_KEYS[development] || SUPPORT_KEYS.bodasdehoy;

    const res = await fetch(API2_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://bodasdehoy.com',
        'X-Development': development,
        'X-Support-Key': supportKey,
      },
      body: JSON.stringify({
        query: EVENTS_WITH_TASKS_QUERY,
        variables: { email: userId, development },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return NextResponse.json({ events: [], error: `api2 error ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const rawEvents: any[] = data?.data?.getAllUserRelatedEventsByEmail?.eventos ?? [];

    // Keep only events with at least one pending task
    const events = rawEvents
      .map((event: any) => {
        const itinerarios: any[] = event.itinerarios_array || [];
        return {
          id: event.id,
          nombre: event.nombre || 'Sin nombre',
          fecha: event.fecha || null,
          tipo: event.tipo || 'boda',
          services: itinerarios
            .map((s: any) => ({
              id: s._id || String(Math.random()),
              title: s.title || 'Sin título',
              pendingTasks: (s.tasks || []).filter((t: any) => !t.estatus || t.estatus === 'false' || t.estatus === false),
              totalTasks: (s.tasks || []).length,
            }))
            .filter((s: any) => s.pendingTasks.length > 0),
        };
      })
      .filter((e: any) => e.services.length > 0);

    return NextResponse.json({ events });
  } catch (err: any) {
    return NextResponse.json({ events: [], error: err.message }, { status: 500 });
  }
}
