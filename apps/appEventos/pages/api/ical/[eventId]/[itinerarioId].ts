import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchApiEventosServer, queries } from '../../../../utils/Fetching';
import { Task } from '../../../../utils/Interfaces';

function escapeIcal(str: string): string {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function foldLine(line: string): string {
  // RFC 5545: lines longer than 75 octets should be folded
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const chunks: string[] = [];
  let offset = 0;
  let first = true;
  while (offset < bytes.length) {
    const limit = first ? 75 : 74;
    chunks.push((first ? '' : ' ') + bytes.slice(offset, offset + limit).toString('utf8'));
    offset += limit;
    first = false;
  }
  return chunks.join('\r\n');
}

function toIcalDate(date: Date): string {
  // Format: YYYYMMDDTHHMMSSZ (UTC)
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

function toIcalDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate())
  );
}

function parseHora(hora: string | undefined): { h: number; m: number } {
  if (!hora) return { h: 0, m: 0 };
  const parts = hora.split(':');
  return { h: parseInt(parts[0] || '0', 10), m: parseInt(parts[1] || '0', 10) };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end('Method Not Allowed');
  }

  const { eventId, itinerarioId } = req.query;

  if (!eventId || !itinerarioId || typeof eventId !== 'string' || typeof itinerarioId !== 'string') {
    return res.status(400).end('Bad Request');
  }

  // Remove .ics extension if present (Next.js may pass it as part of the param)
  const cleanItinerarioId = itinerarioId.replace(/\.ics$/, '');

  try {
    const data = await fetchApiEventosServer({
      query: queries.getItinerario,
      variables: {
        evento_id: eventId,
        itinerario_id: cleanItinerarioId,
      },
    });

    const evento = data?.getItinerario;
    if (!evento) {
      return res.status(404).end('Event not found');
    }

    const itinerario = evento.itinerarios_array?.[0];
    if (!itinerario) {
      return res.status(404).end('Itinerary not found');
    }

    const eventName = escapeIcal(evento.nombre || 'Evento');
    const itinerarioTitle = escapeIcal(itinerario.title || 'Itinerario');
    const timeZone = evento.timeZone || 'UTC';
    const now = toIcalDate(new Date());
    const prodId = `-//Bodas de Hoy//Itinerario ${cleanItinerarioId}//ES`;

    const publicTasks: Task[] = (itinerario.tasks || []).filter(
      (t: Task) => t.spectatorView === true
    );

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:${escapeIcal(prodId)}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${eventName} — ${itinerarioTitle}`,
      `X-WR-TIMEZONE:${escapeIcal(timeZone)}`,
    ];

    for (const task of publicTasks) {
      const taskDate = task.fecha ? new Date(task.fecha) : null;
      if (!taskDate) continue;

      const uid = `task-${task._id}@bodasdehoy.com`;
      const summary = escapeIcal(task.descripcion || 'Tarea');
      const description = escapeIcal(task.tips ? task.tips.replace(/<[^>]*>/g, '') : '');

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${now}`);

      if (task.horaActiva && task.hora) {
        const { h, m } = parseHora(task.hora);
        const start = new Date(
          Date.UTC(
            taskDate.getUTCFullYear(),
            taskDate.getUTCMonth(),
            taskDate.getUTCDate(),
            h,
            m,
            0
          )
        );
        const durationMinutes = task.duracion || 60;
        const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
        lines.push(`DTSTART:${toIcalDate(start)}`);
        lines.push(`DTEND:${toIcalDate(end)}`);
      } else {
        // All-day event
        lines.push(`DTSTART;VALUE=DATE:${toIcalDateOnly(taskDate)}`);
        const nextDay = new Date(taskDate);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        lines.push(`DTEND;VALUE=DATE:${toIcalDateOnly(nextDay)}`);
      }

      lines.push(`SUMMARY:${summary}`);
      if (description) {
        lines.push(`DESCRIPTION:${description}`);
      }
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    const icsContent = lines.map(foldLine).join('\r\n') + '\r\n';

    const filename = `itinerario-${cleanItinerarioId}.ics`;
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(icsContent);
  } catch (error) {
    console.error('[ical] Error generating iCal:', error);
    return res.status(500).end('Internal Server Error');
  }
}
