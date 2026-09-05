/**
 * X2(c) · plan consolidado 2026-07-20.
 * Normaliza un nombre de evento para matching robusto contra la lista de
 * eventos del usuario. Elimina diferencias por acentos, mayúsculas,
 * caracteres ligados y espacios sobrantes.
 *
 * Ejemplos:
 *   normalizeEventName('Boda de María') === 'boda de maria'
 *   normalizeEventName('  BODA   DE MARIA  ') === 'boda de maria'
 *   normalizeEventName('Cumpleaños de Ñoño') === 'cumpleanos de nono'
 *
 * Uso principal: resolver ambigüedad cuando la IA recibe una referencia
 * ambigua ("mi boda de junio") y hay que emparejarla con `availableEvents`
 * enviado desde appEventos.
 */
export const normalizeEventName = (name: string | null | undefined): string => {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

/**
 * Compara dos nombres de evento tras normalizarlos.
 * Útil para find/filter en listas de eventos por nombre.
 */
export const eventNamesMatch = (a: string | null | undefined, b: string | null | undefined): boolean => {
  const na = normalizeEventName(a);
  const nb = normalizeEventName(b);
  return na.length > 0 && na === nb;
};
