import { redirect } from 'next/navigation';

/**
 * /tasks legacy → /pendientes
 *
 * /tasks era una ruta vestigio del fork LobeChat sin uso real en Bodas
 * de Hoy. Las tareas/servicios viven en appEventos `/servicios` y los
 * comentarios sobre cada uno generan notificaciones que se ven en la
 * vista unificada /pendientes (chat-ia).
 *
 * Mantenemos la ruta para compatibilidad con notificaciones históricas
 * cuyo focused empieza con /tasks/... pero ahora apunta a /pendientes
 * (antes apuntaba a /messages).
 */
export default function TasksLegacyPage() {
  redirect('/pendientes');
}
