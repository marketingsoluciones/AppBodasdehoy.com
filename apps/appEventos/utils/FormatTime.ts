export const getRelativeTime = (date: number) => {
  const units: any = {
    year: 24 * 60 * 60 * 1000 * 365,
    month: (24 * 60 * 60 * 1000 * 365) / 12,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000,
  };
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const elapsed = date - Date.now()

  for (var u in units)
    if (Math?.abs(elapsed) > units[u] || u == 'second') {
      // @ts-expect-error — `u` viene de Object.keys(units) (string genérico)
      // pero rtf.format espera Intl.RelativeTimeFormatUnit. Las claves de units
      // SON valores válidos del enum, pero TS no puede inferirlo.
      return rtf?.format(Math.round(elapsed / units[u]), u)
    }

};

/**
 * Extrae de forma segura la parte de la ciudad de una zona horaria
 * @param timeZone - La zona horaria (ej: "America/Caracas")
 * @returns La parte de la ciudad o "UTC" como fallback
 */
export const getTimeZoneCity = (timeZone?: string): string => {
  if (!timeZone || typeof timeZone !== 'string') {
    return 'UTC';
  }

  const parts = timeZone.split('/');
  return parts.length > 1 ? parts[1] : timeZone;
};

export const getOffsetMinutes = (date?: Date | number | string, timeZone?: string) => {
  const targetDate = date ? new Date(date) : new Date();

  // Validar que timeZone sea una cadena válida
  const validTimeZone = timeZone && typeof timeZone === 'string' ? timeZone : 'UTC';

  // Crear una fecha en UTC
  const utcDate = new Date(targetDate.getTime() + (targetDate.getTimezoneOffset() * 60000));

  try {
    // Crear una fecha en la zona horaria especificada
    const timeInTimezone = new Date(targetDate.toLocaleString('en-US', { timeZone: validTimeZone }));

    // Calcular la diferencia en minutos (timezone offset respecto a UTC)
    const offsetMs = timeInTimezone.getTime() - utcDate.getTime();
    const offsetMin = Math.round(offsetMs / 60000);

    return offsetMin;
  } catch (error) {
    // Si hay error con la zona horaria, usar UTC como fallback
    console.warn(`Error con timeZone "${validTimeZone}", usando UTC como fallback:`, error);
    return 0; // UTC offset
  }
}

export type EventDateParts = { year: number; month: number; day: number }

/** Día del evento (Y-M-D). Acepta epoch ms, string numérica o `YYYY-MM-DD`. */
export const getEventDateParts = (eventFecha?: string | number | null): EventDateParts => {
  if (typeof eventFecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(eventFecha)) {
    const [ys, ms, ds] = eventFecha.slice(0, 10).split('-')
    return { year: Number(ys), month: Number(ms), day: Number(ds) }
  }
  const parsed = eventFecha != null && eventFecha !== '' ? Number(eventFecha) : NaN
  const base = !Number.isNaN(parsed) && parsed > 0 ? new Date(parsed) : new Date()
  const safe = Number.isNaN(base.getTime()) ? new Date() : base
  return {
    year: safe.getUTCFullYear(),
    month: safe.getUTCMonth() + 1,
    day: safe.getUTCDate(),
  }
}

/**
 * Instant UTC para un horario de pared (wall clock) en una zona IANA.
 * Ej: 6:00 en America/Caracas → Date en UTC equivalente.
 */
export const zonedWallTimeToUtcDate = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone?: string
): Date => {
  const tz = timeZone && typeof timeZone === 'string' ? timeZone : 'UTC'
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0)
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(
      dtf.formatToParts(new Date(utc))
        .filter((p) => p.type !== 'literal')
        .map((p) => [p.type, p.value])
    ) as Record<string, string>
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second || 0)
    )
    const wanted = Date.UTC(year, month - 1, day, hour, minute, 0)
    utc += wanted - asUtc
  }
  return new Date(utc)
}

/**
 * Fecha/hora de tarea al estilo Old_AppBodasdehoy / TimeTask:
 * se guarda `YYYY-MM-DDTHH:mm:00.000Z` con los dígitos de pared deseados.
 * `timeFormated(..., event.timeZone)` muestra esos dígitos (Inicio = 06:00).
 */
export const eventDateAtHourZ = (
  eventFecha?: string | number | null,
  hour = 6,
  minute = 0
): Date => {
  const { year, month, day } = getEventDateParts(eventFecha)
  const y = String(year).padStart(4, '0')
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  const hh = String(hour).padStart(2, '0')
  const mm = String(minute).padStart(2, '0')
  return new Date(`${y}-${m}-${d}T${hh}:${mm}:00.000Z`)
}

/** @deprecated Prefer eventDateAtHourZ — misma convención UI que TimeTask. */
export const eventDateAt6Am = (
  eventFecha?: string | number | null,
  _timeZone?: string
): Date => eventDateAtHourZ(eventFecha, 6, 0)

