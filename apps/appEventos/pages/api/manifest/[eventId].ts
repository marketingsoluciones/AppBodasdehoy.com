import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchApiEventosServer } from '../../../utils/Fetching';

const QUERY = `
  query ($var_1: String) {
    queryenEvento_id(var_1: $var_1) {
      _id nombre tipo imgEvento { i800 }
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query as { eventId: string };

  let eventName = 'Mi evento';
  let eventType = 'evento';
  let iconUrl = '/logo.png';

  try {
    const data = await fetchApiEventosServer({ query: QUERY, variables: { var_1: eventId } });
    const ev = Array.isArray(data?.queryenEvento_id) ? data.queryenEvento_id[0] : data?.queryenEvento_id;
    if (ev) {
      eventName = ev.nombre ?? eventName;
      eventType = ev.tipo ?? eventType;
      if (ev.imgEvento?.i800) {
        iconUrl = `https://apiapp.bodasdehoy.com/${ev.imgEvento.i800}`;
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
