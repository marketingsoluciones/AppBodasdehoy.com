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

export const getOffsetMinutes = (date?: Date | number | string, timeZone?: string) => {
  const targetDate = date ? new Date(date) : new Date();

  // Crear una fecha en UTC
  const utcDate = new Date(targetDate.getTime() + (targetDate.getTimezoneOffset() * 60000));

  // Crear una fecha en la zona horaria especificada
  const timeInTimezone = new Date(targetDate.toLocaleString('en-US', { timeZone }));

  // Calcular la diferencia en minutos (timezone offset respecto a UTC)
  const offsetMs = timeInTimezone.getTime() - utcDate.getTime();
  const offsetMin = Math.round(offsetMs / 60000);

  return offsetMin;
}
