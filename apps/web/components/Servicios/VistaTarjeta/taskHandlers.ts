import { Task, Itinerary, Event as EventInterface } from '../../../utils/Interfaces';
import { BoardState } from '../types';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { toast } from 'react-toastify';
import { isValidTask } from '../VistaKanban/boardViewUtils';

// Función para manejar la creación de tareas
export const createHandleTaskCreate = (
  event: EventInterface,
  itinerario: Itinerary,
  config: any,
  setEvent: Function,
  setSelectTask: (taskId: string) => void,
  t: (key: string) => string,
  data: Task[],
  boardState: BoardState,
  setBoardState: React.Dispatch<React.SetStateAction<BoardState>>
) => async (taskData: Partial<Task>) => {
  try {
    // Si la tarea tiene un _id, significa que ya fue creada
    if (taskData._id) {
      console.log('La tarea ya existe, no se creará nuevamente');
      return;
    }

    // Determinar en qué columna se está creando la tarea
    const targetColumnId = taskData.estado || 'pending';

    // Calcular fecha por defecto
    let defaultDate: Date;
    if (taskData.fecha) {
      defaultDate = new Date(taskData.fecha);
    } else {
      const eventDate = new Date(parseInt(event.fecha));
      const eventYear = eventDate.getUTCFullYear();
      const eventMonth = eventDate.getUTCMonth();
      const eventDay = eventDate.getUTCDate();
      defaultDate = new Date(eventYear, eventMonth + 1, eventDay, 7, 0, 0);

      if (data && data.length > 0) {
        const sortedTasks = [...data].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        const lastTask = sortedTasks[sortedTasks.length - 1];
        const lastTaskTime = new Date(lastTask.fecha).getTime();
        const duration = (lastTask.duracion || 30) * 60 * 1000;
        defaultDate = new Date(lastTaskTime + duration);
      }
    }

    // Formatear fecha y hora correctamente
    const year = defaultDate.getFullYear();
    const month = defaultDate.getMonth() + 1;
    const day = defaultDate.getDate();
    const fechaString = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
    const horaString = `${defaultDate.getHours().toString().padStart(2, '0')}:${defaultDate.getMinutes().toString().padStart(2, '0')}`;

    // Crear la tarea
    const response = await fetchApiEventos({
      query: queries.createTask,
      variables: {
        eventID: event._id,
        itinerarioID: itinerario._id,
        descripcion: taskData.descripcion || "Nueva tarea",
        fecha: fechaString,
        hora: horaString,
        duracion: taskData.duracion || 30
      },
      domain: config.domain
    });

    if (!response || !isValidTask(response)) {
      throw new Error('Respuesta inválida del servidor');
    }
    
    const newTask = response;

    // Asignar estado y orden localmente
    newTask.estado = targetColumnId;
    newTask.order = boardState.columns[targetColumnId]?.tasks.length || 0;

    // Actualizar estado y estatus en la API
    await fetchApiEventos({
      query: queries.editTask,
      variables: {
        eventID: event._id,
        itinerarioID: itinerario._id,
        taskID: newTask._id,
        variable: "estado",
        valor: targetColumnId
      },
      domain: config.domain
    });

    await fetchApiEventos({
      query: queries.editTask,
      variables: {
        eventID: event._id,
        itinerarioID: itinerario._id,
        taskID: newTask._id,
        variable: "order",
        valor: String(newTask.order)
      },
      domain: config.domain
    });

    // Si se creó en completado, actualizar estatus
    if (targetColumnId === 'completed') {
      await fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: newTask._id,
          variable: "estatus",
          valor: "true"
        },
        domain: config.domain
      });
      newTask.estatus = true;
    }

    // Actualizar el estado global
    setEvent((prevEvent: EventInterface) => {
      const newEvent = { ...prevEvent };
      const itineraryIndex = newEvent.itinerarios_array.findIndex(
        it => it._id === itinerario._id
      );
      if (itineraryIndex !== -1) {
        if (!newEvent.itinerarios_array[itineraryIndex].tasks) {
          newEvent.itinerarios_array[itineraryIndex].tasks = [];
        }
        const taskExists = newEvent.itinerarios_array[itineraryIndex].tasks.some(
          t => t._id === newTask._id
        );
        if (!taskExists) {
          newEvent.itinerarios_array[itineraryIndex].tasks.push(newTask);
        }
      }
      return newEvent;
    });

    // Actualizar el estado local del tablero
    setBoardState(prev => {
      const newColumns = { ...prev.columns };

      if (newColumns[targetColumnId]) {
        const taskExists = newColumns[targetColumnId].tasks.some(
          t => t._id === newTask._id
        );
        if (!taskExists) {
          newColumns[targetColumnId] = {
            ...newColumns[targetColumnId],
            tasks: [...newColumns[targetColumnId].tasks, newTask],
          };
        }
      }

      return {
        ...prev,
        columns: newColumns,
      };
    });

    setSelectTask(newTask._id);
    toast.success(t("Tarea creada con éxito"));
  } catch (error) {
    console.error("Error al crear la tarea:", error);
    toast.error(t("Error al crear la tarea"));
  }
};

// Función para manejar la actualización de tareas
export const createHandleTaskUpdate = (
  event: EventInterface,
  itinerario: Itinerary,
  config: any,
  setBoardState: React.Dispatch<React.SetStateAction<BoardState>>,
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void,
  t: (key: string) => string
) => async (taskId: string, updates: Partial<Task>) => {
  try {
    // Actualizar primero en la API
    const updatePromises = Object.entries(updates).map(([key, value]) => {
      return fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: taskId,
          variable: key,
          valor: typeof value === 'boolean' ? value.toString() : 
                 typeof value === 'object' ? JSON.stringify(value) : 
                 String(value)
        },
        domain: config.domain
      });
    });

    await Promise.all(updatePromises);

    // Actualizar el estado local del BoardView inmediatamente
    setBoardState(prev => {
      const newColumns = { ...prev.columns };
      let sourceColumnId: string | null = null;
      let taskToUpdate: Task | null = null;

      // Primero encontrar la tarea y su columna actual
      for (const columnId in newColumns) {
        const taskIndex = newColumns[columnId].tasks.findIndex(t => t._id === taskId);
        if (taskIndex !== -1) {
          sourceColumnId = columnId;
          taskToUpdate = { ...newColumns[columnId].tasks[taskIndex] };
          break;
        }
      }

      // Si encontramos la tarea, aplicar las actualizaciones
      if (sourceColumnId && taskToUpdate) {
        // Aplicar todas las actualizaciones a la tarea
        const updatedTask = {
          ...taskToUpdate,
          ...updates,
          _lastUpdated: Date.now() // Forzar detección de cambios
        };

        // Si el estado cambió y es diferente de la columna actual
        if (updates.estado && updates.estado !== sourceColumnId && newColumns[updates.estado]) {
          // Remover de la columna actual
          newColumns[sourceColumnId].tasks = newColumns[sourceColumnId].tasks.filter(
            t => t._id !== taskId
          );

          // Agregar a la nueva columna manteniendo el orden
          newColumns[updates.estado].tasks.push(updatedTask);
          
          // Re-ordenar las tareas en ambas columnas
          newColumns[sourceColumnId].tasks.forEach((task, index) => {
            task.order = index;
          });
          newColumns[updates.estado].tasks.forEach((task, index) => {
            task.order = index;
          });
          
          // Crear nuevas referencias de arrays
          newColumns[sourceColumnId].tasks = [...newColumns[sourceColumnId].tasks];
          newColumns[updates.estado].tasks = [...newColumns[updates.estado].tasks];
        } else {
          // Si no cambió de columna, solo actualizar en su lugar
          const taskIndex = newColumns[sourceColumnId].tasks.findIndex(t => t._id === taskId);
          if (taskIndex !== -1) {
            newColumns[sourceColumnId].tasks[taskIndex] = updatedTask;
            // Crear nueva referencia del array
            newColumns[sourceColumnId].tasks = [...newColumns[sourceColumnId].tasks];
          }
        }

        // Si se actualizó el estatus y no se especificó un cambio de estado
        if (updates.estatus !== undefined && !updates.estado) {
          // Determinar si debe moverse automáticamente basado en el estatus
          if (updates.estatus === true && sourceColumnId !== 'completed') {
            // Mover a completado
            newColumns[sourceColumnId].tasks = newColumns[sourceColumnId].tasks.filter(
              t => t._id !== taskId
            );
            if (newColumns['completed']) {
              newColumns['completed'].tasks.push({
                ...updatedTask,
                estado: 'completed'
              });
              newColumns['completed'].tasks = [...newColumns['completed'].tasks];
            }
          } else if (updates.estatus === false && sourceColumnId === 'completed') {
            // Mover de vuelta a pendiente si estaba en completado
            newColumns[sourceColumnId].tasks = newColumns[sourceColumnId].tasks.filter(
              t => t._id !== taskId
            );
            if (newColumns['pending']) {
              newColumns['pending'].tasks.push({
                ...updatedTask,
                estado: 'pending'
              });
              newColumns['pending'].tasks = [...newColumns['pending'].tasks];
            }
          }
          
          // Crear nueva referencia del array en la columna origen
          newColumns[sourceColumnId].tasks = [...newColumns[sourceColumnId].tasks];
        }
      } else if (!taskToUpdate && updates.estado && newColumns[updates.estado]) {
        // Si no encontramos la tarea en el boardState pero tenemos un estado,
        // significa que es una tarea nueva o que viene de otra vista
        // Buscarla en el evento global y agregarla
        const globalTask = event.itinerarios_array
          .find(it => it._id === itinerario._id)
          ?.tasks.find(t => t._id === taskId);
          
        if (globalTask) {
          newColumns[updates.estado].tasks.push({
            ...globalTask,
            ...updates,
            estado: updates.estado,
            _lastUpdated: Date.now()
          });
          newColumns[updates.estado].tasks = [...newColumns[updates.estado].tasks];
        }
      }

      return {
        ...prev,
        columns: newColumns,
        _lastUpdate: Date.now() // Forzar re-render del board completo
      };
    });

    // Llamar al callback padre
    onTaskUpdate(taskId, updates);

    toast.success(t('Tarea actualizada correctamente'));
  } catch (error) {
    console.error('Error al actualizar la tarea:', error);
    toast.error(t('Error al actualizar la tarea'));
  }
};

// Función para crear sub-tarea
export const createHandleCreateSubTask = (
  onTaskCreate: (task: Partial<Task>) => void,
  setShowSubTaskModal: React.Dispatch<React.SetStateAction<{ show: boolean; parentTaskId?: string }>>
) => (parentTaskId: string, subTask: Partial<Task>) => {
  onTaskCreate({
    ...subTask,
    tags: [
      ...(subTask.tags || []),
      `subtask-of:${parentTaskId}`
    ]
  });

  setShowSubTaskModal({ show: false });
};