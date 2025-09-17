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

export const getOffsetMinutes = (timeZone: string) => {
  const now = new Date();

  // Hora local en la zona deseada
  const localTime = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(now);

  // Extraer horas, minutos, segundos
  const parts = Object.fromEntries(localTime.map(p => [p.type, p.value]));
  const localDate = new Date(now.toDateString() + ' ' + parts.hour + ':' + parts.minute + ':' + parts.second + ' UTC');

  // Calcular diferencia en milisegundos
  const offsetMs = localDate.getTime() - now.getTime();
  const offsetMin = offsetMs / 60000;

  return offsetMin;
}
