/**
 * Resuelve el evento actual del usuario registrado desde `dev-user-config` (localStorage).
 * Mismo origen que usa el upload de archivos (store/file/slices/upload/action.ts).
 * Prioridad: current_event_id → primer evento de la lista.
 */
export function getCurrentEventId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('dev-user-config');
    if (!raw) return null;
    const config = JSON.parse(raw);
    if (config.current_event_id) return String(config.current_event_id);
    const first = Array.isArray(config.eventos) ? config.eventos[0] : undefined;
    return first ? String(first._id || first.id) : null;
  } catch {
    return null;
  }
}
