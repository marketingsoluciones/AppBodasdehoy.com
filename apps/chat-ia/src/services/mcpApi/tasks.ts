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
