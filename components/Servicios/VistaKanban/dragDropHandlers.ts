import { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { BoardState, DragItem, TaskOrder } from '../types';
import { Task } from '../../../utils/Interfaces';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { toast } from 'react-toastify';

// Función para manejar el drag start
export const createHandleDragStart = (
  boardState: BoardState,
  setDraggedItem: (item: DragItem | null) => void
) => (dragEvent: DragStartEvent) => {
  const { active } = dragEvent;
  const activeId = active.id as string;


  // Buscar si es una tarea
  for (const [columnId, column] of Object.entries(boardState.columns)) {
    const task = column.tasks.find(t => t._id === activeId);
    if (task) {
      setDraggedItem({
        id: activeId,
        type: 'task',
        data: task,
        sourceColumnId: columnId
      });
      return;
    }
  }

  // Si no es una tarea, verificar si es una columna
  const column = boardState.columns[activeId];
  if (column) {
    setDraggedItem({
      id: activeId,
      type: 'column',
      data: column,
    });
  }
};

// Función para manejar el drag over
export const createHandleDragOver = (
  draggedItem: DragItem | null,
  boardState: BoardState
) => (dragEvent: DragOverEvent) => {
  const { active, over } = dragEvent;

  if (!over) return;

  const activeId = active.id as string;
  const overId = over.id as string;

  if (activeId === overId) return;

  // Si estamos arrastrando una tarea
  if (draggedItem?.type === 'task') {
    return; // Permitir todos los drag over de tareas
  }

  // Si estamos arrastrando una columna
  if (draggedItem?.type === 'column') {
    // Solo permitir si el destino es otra columna
    const isOverColumn = boardState.columns[overId] !== undefined;
    if (isOverColumn) return;
  }
};

// Función para manejar el drag end
export const createHandleDragEnd = (
  draggedItem: DragItem | null,
  boardState: BoardState,
  setBoardState: React.Dispatch<React.SetStateAction<BoardState>>,
  setDraggedItem: (item: DragItem | null) => void,
  event: any,
  itinerario: any,
  config: any,
  setEvent: Function,
  t: (key: string) => string
) => async (dragEvent: DragEndEvent) => {
  
  const { active, over } = dragEvent;

  if (!over || !draggedItem) {
    setDraggedItem(null);
    return;
  }

  const activeId = active.id as string;
  const overId = over.id as string;

  if (draggedItem.type === 'task') {
    let sourceColumnId = draggedItem?.sourceColumnId;
    let targetColumnId = '';
    let movedTask = draggedItem.data as Task;

    // Buscar la columna origen si no la tenemos
    if (!sourceColumnId) {
      for (const [columnId, column] of Object.entries(boardState.columns)) {
        if (column.tasks.some(t => t._id === activeId)) {
          sourceColumnId = columnId;
          break;
        }
      }
    }

    if (!sourceColumnId || !movedTask) {
      setDraggedItem(null);
      return;
    }

    // Determinar la columna destino
    const validColumnIds = Object.keys(boardState.columns);

    if (validColumnIds.includes(overId)) {
      targetColumnId = overId;
    } else if (dragEvent.collisions) {
      // Buscar la primera colisión que sea una columna válida
      const collision = dragEvent.collisions.find(c =>
        validColumnIds.includes(String(c.id))
      );
      if (collision) {
        targetColumnId = String(collision.id);
      } else {
        // Buscar si el overId corresponde a una tarea dentro de alguna columna
        for (const [columnId, column] of Object.entries(boardState.columns)) {
          if (column.tasks.some(t => String(t._id) === overId)) {
            targetColumnId = columnId;
            break;
          }
        }
      }
    } else if (overId.startsWith('column-')) {
      // Extraer el id real después de 'column-'
      const columnId = overId.replace('column-', '');
      if (boardState.columns.hasOwnProperty(columnId) && isNaN(Number(columnId))) {
        targetColumnId = columnId;
      }
    } else {
      // Buscar si el overId corresponde a una tarea dentro de alguna columna
      for (const [columnId, column] of Object.entries(boardState.columns)) {
        if (column.tasks.some(t => t._id === overId)) {
          targetColumnId = columnId;
          break;
        }
      }
    }

    // Validar que tenemos una columna destino válida
    if (!targetColumnId || !boardState.columns.hasOwnProperty(targetColumnId)) {
      console.error('No se pudo determinar la columna destino:', { overId, targetColumnId });
      setDraggedItem(null);
      return;
    }

    // Si es la misma columna y la misma posición, no hacer nada
    if (sourceColumnId === targetColumnId && overId === activeId) {
      setDraggedItem(null);
      return;
    }


    // Preparar los cambios
    const tasksToUpdate: TaskOrder[] = [];

    // Actualizar el estado local inmediatamente
    setBoardState(prevState => {
      const newColumns = { ...prevState.columns };

      // Clonar las columnas afectadas
      const sourceColumn = {
        ...newColumns[sourceColumnId],
        tasks: [...newColumns[sourceColumnId].tasks]
      };

      const targetColumn = sourceColumnId === targetColumnId
        ? sourceColumn
        : {
          ...newColumns[targetColumnId],
          tasks: [...newColumns[targetColumnId].tasks]
        };

      // Encontrar y remover la tarea de la columna origen
      const taskIndex = sourceColumn.tasks.findIndex(t => t._id === activeId);
      if (taskIndex === -1) {
        console.error('No se encontró la tarea en la columna origen');
        return prevState;
      }

      const [removedTask] = sourceColumn.tasks.splice(taskIndex, 1);

      // Actualizar la tarea con el nuevo estado
      const updatedTask = {
        ...removedTask,
        estado: targetColumnId,
        estatus: targetColumnId === 'completed'
      };

      // Determinar la posición de inserción
      let targetIndex = targetColumn.tasks.length; // Por defecto, al final

      // Si soltamos sobre una tarea específica
      if (overId !== targetColumnId && !overId.startsWith('column-')) {
        const overIndex = targetColumn.tasks.findIndex(t => t._id === overId);
        if (overIndex !== -1) {
          // Si estamos en la misma columna y moviendo hacia abajo
          if (sourceColumnId === targetColumnId && overIndex > taskIndex) {
            targetIndex = overIndex;
          } else {
            targetIndex = overIndex + 1;
          }
        }
      }

      // Insertar la tarea en la nueva posición
      targetColumn.tasks.splice(targetIndex, 0, updatedTask);

      // Actualizar los índices de orden
      sourceColumn.tasks.forEach((task, index) => {
        task.order = index;
        tasksToUpdate.push({
          taskId: task._id,
          order: index,
          columnId: sourceColumnId
        });
      });

      // Si cambió de columna, actualizar también la columna destino
      if (sourceColumnId !== targetColumnId) {
        targetColumn.tasks.forEach((task, index) => {
          task.order = index;
          tasksToUpdate.push({
            taskId: task._id,
            order: index,
            columnId: targetColumnId
          });
        });
      }

      // Actualizar las columnas en el estado
      newColumns[sourceColumnId] = sourceColumn;
      if (sourceColumnId !== targetColumnId) {
        newColumns[targetColumnId] = targetColumn;
      }

      return {
        ...prevState,
        columns: newColumns
      };
    });

    // Guardar cambios en la API
    try {
      // Si cambió de columna, actualizar el estado
      if (sourceColumnId !== targetColumnId) {
        await fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: activeId,
            variable: "estado",
            valor: targetColumnId
          },
          domain: config.domain
        });

        // Actualizar estatus si se movió a completado
        const isCompleted = targetColumnId === 'completed';
        await fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: activeId,
            variable: "estatus",
            valor: String(isCompleted)
          },
          domain: config.domain
        });
      }

      // Actualizar el orden de todas las tareas afectadas
      const updatePromises = tasksToUpdate.map(taskOrder =>
        fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: taskOrder.taskId,
            variable: "order",
            valor: String(taskOrder.order)
          },
          domain: config.domain
        })
      );

      await Promise.all(updatePromises);

      // Actualizar el evento global
      setEvent((prevEvent: any) => {
        const newEvent = { ...prevEvent };
        const itineraryIndex = newEvent.itinerarios_array.findIndex(
          (it: any) => it._id === itinerario._id
        );

        if (itineraryIndex !== -1) {
          tasksToUpdate.forEach(taskOrder => {
            const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks.findIndex(
              (t: Task) => t._id === taskOrder.taskId
            );
            if (taskIndex !== -1) {
              newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex].order = taskOrder.order;
              if (taskOrder.taskId === activeId) {
                newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex].estado = targetColumnId;
                newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex].estatus = targetColumnId === 'completed';
              }
            }
          });
        }

        return newEvent;
      });

      if (sourceColumnId !== targetColumnId) {
        toast.success(t('Tarea movida correctamente'));
      }

    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      toast.error(t('Error al mover la tarea'));
    }
  }

  

  setDraggedItem(null);
};