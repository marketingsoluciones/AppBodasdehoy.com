import { mcpClient } from './client';

const EDIT_TASK_MUTATION = `
  mutation EditTask($eventID: String, $itinerarioID: String, $taskID: String, $variable: String, $valor: String) {
    editTask(eventID: $eventID, itinerarioID: $itinerarioID, taskID: $taskID, variable: $variable, valor: $valor)
  }
`;

/**
 * Marca una tarea como completada vía MCP GraphQL.
 * Usa la misma mutation que appEventos (editTask variable=estatus valor=true).
 */
export async function completeTask(
  eventId: string,
  itinerarioId: string,
  taskId: string,
): Promise<void> {
  await mcpClient.query(EDIT_TASK_MUTATION, {
    eventID: eventId,
    itinerarioID: itinerarioId,
    taskID: taskId,
    valor: 'true',
    variable: 'estatus',
  });
}

/**
 * Actualiza un campo arbitrario de una tarea.
 */
export async function updateTaskField(
  eventId: string,
  itinerarioId: string,
  taskId: string,
  field: string,
  value: string,
): Promise<void> {
  await mcpClient.query(EDIT_TASK_MUTATION, {
    eventID: eventId,
    itinerarioID: itinerarioId,
    taskID: taskId,
    valor: value,
    variable: field,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Crear tarea desde la Bandeja
//
// Se usa `crearTarea` (no `createTask`, que es otro sistema de tareas) porque escribe
// DENTRO del itinerario del evento — que es exactamente lo que lee ProximoPanel via
// itinerarios_array. Con createTask la tarea no apareceria en el panel.
//
// Firma verificada en el esquema de api-mcp (typeDefs, 30-ago):
//   crearTarea(evento_id: ID!, itinerario_id: ID!, tarea: TareaInput!): ItinerarioResponse!
//   input TareaInput { descripcion!, fecha, hora, responsable, duracion, tags, icon, ... }
// ─────────────────────────────────────────────────────────────────────────────

const CREAR_TAREA_MUTATION = `
  mutation CrearTarea($evento_id: ID!, $itinerario_id: ID!, $tarea: TareaInput!) {
    crearTarea(evento_id: $evento_id, itinerario_id: $itinerario_id, tarea: $tarea) {
      success
      errors { message }
    }
  }
`;

export interface NuevaTarea {
  descripcion: string;
  /** ISO date (YYYY-MM-DD). Sin fecha la tarea existe pero no sale en "Proximo". */
  fecha?: string;
  hora?: string;
}

/**
 * Crea una tarea en el itinerario de un evento.
 *
 * NO se traga el error: devuelve el mensaje del backend para que la interfaz lo muestre.
 * Prometer al cliente algo que no se guardo es peor que no ofrecer el boton.
 */
export async function crearTareaEnItinerario(
  eventoId: string,
  itinerarioId: string,
  tarea: NuevaTarea,
): Promise<{ error?: string; ok: boolean }> {
  const data = await mcpClient.query<{
    crearTarea: { errors?: Array<{ message: string }>; success: boolean };
  }>(CREAR_TAREA_MUTATION, {
    evento_id: eventoId,
    itinerario_id: itinerarioId,
    tarea: {
      descripcion: tarea.descripcion,
      ...(tarea.fecha ? { fecha: tarea.fecha } : {}),
      ...(tarea.hora ? { hora: tarea.hora, horaActiva: true } : {}),
    },
  });
  const r = data?.crearTarea;
  if (r?.success) return { ok: true };
  return { error: r?.errors?.[0]?.message || 'No se pudo crear la tarea.', ok: false };
}

const ELIMINAR_TAREA_MUTATION = `
  mutation EliminarTarea($evento_id: ID!, $itinerario_id: ID!, $tarea_id: ID!) {
    eliminarTarea(evento_id: $evento_id, itinerario_id: $itinerario_id, tarea_id: $tarea_id) {
      success
      errors { message }
    }
  }
`;

/**
 * Borra una tarea del itinerario. Devuelve el error del backend (no lo traga) para poder
 * avisar (p.ej. sin permiso). El backend enforce los permisos de itinerario server-side.
 */
export async function eliminarTareaDeItinerario(
  eventoId: string,
  itinerarioId: string,
  tareaId: string,
): Promise<{ error?: string; ok: boolean }> {
  try {
    const data = await mcpClient.query<{
      eliminarTarea: { errors?: Array<{ message: string }>; success: boolean };
    }>(ELIMINAR_TAREA_MUTATION, {
      evento_id: eventoId,
      itinerario_id: itinerarioId,
      tarea_id: tareaId,
    });
    const r = data?.eliminarTarea;
    if (r?.success) return { ok: true };
    return { error: r?.errors?.[0]?.message || 'No se pudo borrar la tarea.', ok: false };
  } catch (e: any) {
    return { error: e?.message || 'No se pudo borrar la tarea.', ok: false };
  }
}

/**
 * Edita un campo de una tarea devolviendo error si falla (p.ej. sin permiso). El backend
 * enforce los permisos; si mcpClient lanza (GraphQL error) lo tratamos como fallo.
 */
export async function editarTareaCampo(
  eventoId: string,
  itinerarioId: string,
  taskId: string,
  field: string,
  value: string,
): Promise<{ error?: string; ok: boolean }> {
  try {
    await updateTaskField(eventoId, itinerarioId, taskId, field, value);
    return { ok: true };
  } catch (e: any) {
    return { error: e?.message || 'No se pudo actualizar la tarea.', ok: false };
  }
}
