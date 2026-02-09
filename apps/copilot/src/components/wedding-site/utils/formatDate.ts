/**
 * Date Formatting Utilities
 * =========================
 * Formateo de fechas para webs de boda
 */

/**
 * Formatear fecha completa para display
 * Ejemplo: "Sabado, 15 de Junio de 2025"
 */
export function formatWeddingDate(date: string | Date, locale = 'es-ES'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  });
}

/**
 * Formatear fecha corta
 * Ejemplo: "15 Jun 2025"
 */
export function formatShortDate(date: string | Date, locale = 'es-ES'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formatear hora
 * Ejemplo: "18:00" o "6:00 PM"
 */
export function formatTime(time: string, use24h = true): string {
  const [hours, minutes] = time.split(':').map(Number);

  if (use24h) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Calcular dias restantes hasta la fecha
 */
export function daysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calcular countdown completo
 */
export interface CountdownValues {
  days: number;
  hours: number;
  isPast: boolean;
  minutes: number;
  seconds: number;
  total: number;
}

export function calculateCountdown(date: string | Date): CountdownValues {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const total = d.getTime() - now.getTime();

  if (total <= 0) {
    return {
      days: 0,
      hours: 0,
      isPast: true,
      minutes: 0,
      seconds: 0,
      total: 0,
    };
  }

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    isPast: false,
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
    total,
  };
}
