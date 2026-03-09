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
      //@ts-ignore
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
