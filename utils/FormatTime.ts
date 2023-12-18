export const getFormatTime = (date?: Date | number, locale?: string, options?: object) => {
  return new Intl.DateTimeFormat(locale, options).format(date);
};

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
