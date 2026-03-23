/**
 * Límites de mensajes para visitantes no registrados:
 * - Primer día: 5 mensajes (para que conozcan el producto).
 * - Días siguientes: 2 mensajes por día.
 * Persistencia por día en localStorage para recuperar sesión y no mostrar "pagar" antes del límite.
 */

const KEY_FIRST_DATE = 'vis_first_date';
const KEY_COUNT_TODAY = 'vis_count_today';
const KEY_DATE_TODAY = 'vis_date_today';

const LIMIT_FIRST_DAY = 5;
const LIMIT_PER_DAY = 2;

function getTodayDateString(): string {
  if (typeof window === 'undefined') return new Date().toISOString().slice(0, 10);
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface VisitorLimitState {
  dateKey: string;
  isFirstDay: boolean;
  limit: number;
  remaining: number;
  used: number;
}

/**
 * Obtiene el estado actual del límite para el visitante (por día).
 * Primer día = 5 mensajes; días siguientes = 2 mensajes. Se resetea el contador cada día.
 */
export function getVisitorLimitState(): VisitorLimitState | null {
  if (typeof localStorage === 'undefined') return null;
  const today = getTodayDateString();

  try {
    let firstDate = localStorage.getItem(KEY_FIRST_DATE);
    if (!firstDate) {
      firstDate = today;
      localStorage.setItem(KEY_FIRST_DATE, firstDate);
    }

    let used = 0;
    let dateKey = localStorage.getItem(KEY_DATE_TODAY);
    if (dateKey === today) {
      const n = localStorage.getItem(KEY_COUNT_TODAY);
      used = n ? parseInt(n, 10) : 0;
    } else {
      dateKey = today;
      localStorage.setItem(KEY_DATE_TODAY, today);
      localStorage.setItem(KEY_COUNT_TODAY, '0');
    }

    const isFirstDay = firstDate === today;
    const limit = isFirstDay ? LIMIT_FIRST_DAY : LIMIT_PER_DAY;
    const remaining = Math.max(0, limit - used);

    return { dateKey, isFirstDay, limit, remaining, used };
  } catch {
    return null;
  }
}

/**
 * Indica si el visitante puede enviar un mensaje más (según límite del día).
 */
export function canVisitorSendMessage(): boolean {
  const state = getVisitorLimitState();
  if (!state) return true;
  return state.used < state.limit;
}

/**
 * Incrementa el contador de mensajes del día para el visitante.
 * Debe llamarse después de validar con canVisitorSendMessage.
 */
export function incrementVisitorMessageCount(): void {
  if (typeof localStorage === 'undefined') return;
  const today = getTodayDateString();
  try {
    let dateKey = localStorage.getItem(KEY_DATE_TODAY);
    let count = 0;
    if (dateKey === today) {
      const n = localStorage.getItem(KEY_COUNT_TODAY);
      count = (n ? parseInt(n, 10) : 0) + 1;
    } else {
      localStorage.setItem(KEY_DATE_TODAY, today);
      count = 1;
    }
    localStorage.setItem(KEY_COUNT_TODAY, String(count));
  } catch {
    // ignorar
  }
}

/**
 * Sincroniza la cookie vis_mc con el número de mensajes usados hoy (para que el backend tenga un techo de seguridad).
 */
export function syncVisitorCookie(): void {
  if (typeof document === 'undefined') return;
  const state = getVisitorLimitState();
  if (!state) return;
  try {
    document.cookie = `vis_mc=${state.used}; path=/; max-age=86400; SameSite=Lax`;
  } catch {
    // ignorar
  }
}

export const VISITOR_LIMIT_FIRST_DAY = LIMIT_FIRST_DAY;
export const VISITOR_LIMIT_PER_DAY = LIMIT_PER_DAY;
