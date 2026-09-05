import { redirect } from 'next/navigation';

/**
 * /tasks legacy → /bandeja?view=esperan (vista "Esperan respuesta")
 *
 * /tasks era una ruta vestigio del fork LobeChat sin uso real en Bodas
 * de Hoy. Las tareas/servicios viven en appEventos `/servicios` y los
 * comentarios sobre cada uno generan notificaciones que se ven en la
 * vista unificada de no-leídos de la Bandeja.
 *
 * Fase B (14-ago): /pendientes se fusionó en /bandeja?view=esperan, así que
 * apuntamos directo ahí para evitar un doble redirect (antes: /tasks →
 * /pendientes → /bandeja). Mantenemos la ruta para notificaciones históricas
 * cuyo focused empieza con /tasks/...
 */
export default function TasksLegacyPage() {
  redirect('/bandeja?view=esperan');
}
