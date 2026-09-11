import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchApiEventosServer } from '../../../utils/Fetching';

// BUG-5 (informe QA 21-jun): queryenEvento_id es legacy apiapp retirado. api-mcp usa
// getEventoById(id:ID!).
const QUERY = `
  query ($eventId: ID!) {
    getEventoById(id: $eventId) {
      _id nombre tipo imgEventoUrl
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query as { eventId: string };

  let eventName = 'Mi evento';
  let eventType = 'evento';
  let iconUrl = '/logo.png';

  try {
    const data = await fetchApiEventosServer({ query: QUERY, variables: { eventId } });
    const ev = data?.getEventoById;
    if (ev) {
      eventName = ev.nombre ?? eventName;
      eventType = ev.tipo ?? eventType;
      if (ev.imgEventoUrl) {
        iconUrl = ev.imgEventoUrl;
      }
    }
  } catch { /* usa defaults */ }

  const manifest = {
    name: eventName,
    short_name: eventName.length > 12 ? eventName.split(' ').slice(0, 2).join(' ') : eventName,
    description: `Portal de invitados — ${eventName}`,
    display: 'standalone',
    orientation: 'portrait',
    start_url: `/e/${eventId}`,
    scope: `/e/${eventId}`,
    theme_color: '#f43f5e',
    background_color: '#fff5f7',
    lang: 'es',
    icons: [
      { src: iconUrl, sizes: 'any', type: 'image/png', purpose: 'any maskable' },
      { src: '/favicon.ico', sizes: '64x64 32x32 24x24 16x16', type: 'image/x-icon' },
    ],
    categories: ['lifestyle', 'social', 'photography'],
  };

  res.setHeader('Content-Type', 'application/manifest+json');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  res.status(200).json(manifest);
}
