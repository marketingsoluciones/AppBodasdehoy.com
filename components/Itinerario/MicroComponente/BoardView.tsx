import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Settings,
  X,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  History,
  Zap,
  Grid3x3,
  List,
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Archive,
  Hash,
  Layers,
  MoreVertical,
  Save
} from 'lucide-react';
import { Task, Itinerary, Event as EventInterface } from '../../../utils/Interfaces';
import { BoardColumn } from './BoardColumn';
import { TaskCard } from './TaskCard';
import { BoardFilters } from './BoardFilters';
import { AddColumnModal } from './BoardModals';
import { SubTaskModal } from './SubTaskModal';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { toast } from "react-toastify";
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import TaskDetailModal from './TaskDetailModal';
import { AuthContextProvider } from '../../../context';

// Hook personalizado para debounce
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  // Cleanup en desmontaje
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Interfaces para orden
interface TaskOrder {
  taskId: string;
  order: number;
  columnId: string;
}

interface ColumnOrder {
  columnId: string;
  order: number;
}

// Tipos actualizados para el tablero
export interface BoardColumn {
  id: string;
  title: string;
  color: string;
  colorConfig?: {
    bg: string;
    border: string;
    text: string;
  };
  icon?: React.ReactNode;
  tasks: Task[];
  isCollapsed: boolean;
  isHidden?: boolean;
  order: number;
  bgColor?: string;
}

export interface BoardState {
  columns: Record<string, BoardColumn>;
  columnOrder: string[];
  deletedColumns: BoardColumn[];
  isGlobalCollapsed: boolean;
  viewMode?: 'board' | 'compact' | 'list';
}

export interface DragItem {
  id: string;
  type: 'task' | 'column';
  data: Task | BoardColumn;
  sourceColumnId?: string; // Metadatos adicionales para tareas
}

// Props del componente
interface BoardViewProps {
  data: Task[];
  itinerario: Itinerary;
  event: EventInterface;
  selectTask: string;
  setSelectTask: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (task: Partial<Task>) => void;
  setEvent: (event: EventInterface | ((prev: EventInterface) => EventInterface)) => void;
  tempPastedAndDropFiles?: any[];
  setTempPastedAndDropFiles?: any;
}

// Configuración de columnas - SOLO las 4 permitidas
const COLUMN_CONFIG: Record<string, {
  title: string;
  colorConfig: { bg: string; border: string; text: string };
  icon: React.ReactNode;
  color: string;
}> = {
  pending: {
    title: 'Pendiente',
    colorConfig: {
      bg: 'bg-gray-50',
      border: 'border-gray-300',
      text: 'text-white'
    },
    icon: <Circle className="w-4 h-4" />,
    color: 'bg-gray-50 border-gray-300'
  },
  in_progress: {
    title: 'En Curso',
    colorConfig: {
      bg: 'bg-pink-50',
      border: 'border-pink-300',
      text: 'text-white'
    },
    icon: <Clock className="w-4 h-4" />,
    color: 'bg-pink-50 border-pink-300'
  },
  completed: {
    title: 'Completado',
    colorConfig: {
      bg: 'bg-[#eeffee]',
      border: 'border-[#7bff7b]',
      text: 'text-white'
    },
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'bg-[#eeffee] border-[#7bff7b]'
  },
  blocked: {
    title: 'Bloqueado',
    colorConfig: {
      bg: 'bg-[#fff0f0]',
      border: 'border-[#ffa7a7]',
      text: 'text-white'
    },
    icon: <XCircle className="w-4 h-4" />,
    color: 'bg-[#fff0f0] border-[#ffa7a7]'
  }
};

// Estados por defecto - SOLO las 4 columnas permitidas
const DEFAULT_COLUMNS: Record<string, Omit<BoardColumn, 'tasks'>> = {
  pending: {
    id: 'pending',
    title: 'Pendiente',
    color: 'bg-gray-50 border-gray-300',
    colorConfig: COLUMN_CONFIG.pending.colorConfig,
    icon: COLUMN_CONFIG.pending.icon,
    isCollapsed: false,
    isHidden: false,
    order: 0,
    bgColor: 'bg-gray-700',
  },
  in_progress: {
    id: 'in_progress',
    title: 'En Curso',
    color: 'bg-pink-50 border-pink-300',
    colorConfig: COLUMN_CONFIG.in_progress.colorConfig,
    icon: COLUMN_CONFIG.in_progress.icon,
    isCollapsed: false,
    isHidden: false,
    order: 1,
    bgColor: 'bg-primary',
  },
  completed: {
    id: 'completed',
    title: 'Completado',
    color: 'bg-[#eeffee] border-[#7bff7b]',
    colorConfig: COLUMN_CONFIG.completed.colorConfig,
    icon: COLUMN_CONFIG.completed.icon,
    isCollapsed: false,
    isHidden: false,
    order: 2,
    bgColor: 'bg-[#00b341]',
  },
  blocked: {
    id: 'blocked',
    title: 'Bloqueado',
    color: 'bg-[#fff0f0] border-[#ffa7a7]',
    colorConfig: COLUMN_CONFIG.blocked.colorConfig,
    icon: COLUMN_CONFIG.blocked.icon,
    isCollapsed: false,
    isHidden: false,
    order: 3,
    bgColor: 'bg-[#ff2525]',
  }
};

export const BoardView: React.FC<BoardViewProps> = ({
  data,
  itinerario,
  event,
  selectTask,
  setSelectTask,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate,
  setEvent,
  tempPastedAndDropFiles,
  setTempPastedAndDropFiles,
}) => {
  // Estados actualizados
  const [boardState, setBoardState] = useState<BoardState>({
    columns: {},
    columnOrder: [],
    deletedColumns: [],
    isGlobalCollapsed: false,
    viewMode: 'board'
  });

  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [showDeletedColumns, setShowDeletedColumns] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState<{ show: boolean; task?: Task }>({ show: false });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { t } = useTranslation();
  const { config } = AuthContextProvider();

  const [showSubTaskModal, setShowSubTaskModal] = useState<{
    show: boolean;
    parentTaskId?: string;
  }>({ show: false });

  const [hiddenEmptyColumns, setHiddenEmptyColumns] = useState<string[]>([]);

  // Configuración de sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Función auxiliar para validar si un objeto es una Task válida
  const isValidTask = (obj: any): obj is Task => {
    return obj && 
      typeof obj === 'object' &&
      '_id' in obj &&
      typeof obj._id === 'string' &&
      'fecha' in obj &&
      'descripcion' in obj &&
      typeof obj.descripcion === 'string';
  };

  // Función para determinar el estado de una tarea basado en sus propiedades
  const getTaskStatus = useCallback((task: Task): string => {
    if (!task) return 'pending';
    
    // Si tiene estado explícito y es válido, usarlo
    if (task.estado && DEFAULT_COLUMNS[task.estado]) {
      return task.estado;
    }
    
    // Mapear según propiedades de la tarea
    if (task.estatus === true) return 'completed';
    if (task.spectatorView === false) return 'blocked';
    if (task.responsable?.length > 0 && task.fecha) return 'in_progress';
    
    // Por defecto
    return 'pending';
  }, []);

  // Función para guardar el orden de las columnas (principalmente)
  const saveOrderToAPI = useCallback(async () => {
    if (!hasUnsavedChanges) return;
    
    setIsSaving(true);
    try {
      // Guardar el orden de las columnas en el itinerario
      const columnsOrder: ColumnOrder[] = boardState.columnOrder.map((columnId, index) => ({
        columnId,
        order: index
      }));

      await fetchApiEventos({
        query: queries.editItinerario,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          variable: "columnsOrder",
          valor: JSON.stringify(columnsOrder)
        },
        domain: config.domain
      });

      // Actualizar el evento global con el orden de columnas
      setEvent((prevEvent) => {
        const newEvent = { ...prevEvent };
        const itineraryIndex = newEvent.itinerarios_array.findIndex(
          it => it._id === itinerario._id
        );
        
        if (itineraryIndex !== -1) {
          newEvent.itinerarios_array[itineraryIndex].columnsOrder = columnsOrder;
        }
        
        return newEvent;
      });

      setHasUnsavedChanges(false);
      toast.success(t('Cambios guardados correctamente'));
    } catch (error) {
      console.error('Error al guardar orden de columnas:', error);
      toast.error(t('Error al guardar los cambios'));
    } finally {
      setIsSaving(false);
    }
  }, [boardState.columnOrder, hasUnsavedChanges, event._id, itinerario._id, config.domain, setEvent, t]);

  // Debounce para guardar automáticamente después de 2 segundos
  const debouncedSave = useDebounce(saveOrderToAPI, 2000);

  // Efecto para guardar automáticamente cuando hay cambios (solo para orden de columnas)
  useEffect(() => {
    if (hasUnsavedChanges && !isSaving) {
      debouncedSave();
    }
  }, [hasUnsavedChanges, debouncedSave, isSaving]);

  // useEffect para inicializar las columnas con las tareas
  useEffect(() => {
    const columns: Record<string, BoardColumn> = {};

    // Crear columnas por defecto
    Object.entries(DEFAULT_COLUMNS).forEach(([id, column]) => {
      columns[id] = {
        ...column,
        tasks: [],
      };
    });

    // Aplicar el orden de columnas si existe
    let columnOrder = Object.keys(columns);
    if (itinerario.columnsOrder && itinerario.columnsOrder.length > 0) {
      columnOrder = itinerario.columnsOrder
        .sort((a, b) => a.order - b.order)
        .map(col => col.columnId)
        .filter(id => columns[id]); // Solo columnas válidas
    }

    // Distribuir tareas por estado
    if (data && data.length > 0) {
      data.forEach(task => {
        const status = task.estado || getTaskStatus(task);
        
        // Solo agregar a columnas válidas
        if (columns[status]) {
          columns[status].tasks.push({
            ...task,
            estado: status,
            order: task.order ?? columns[status].tasks.length
          });
        } else {
          // Si el estado no es válido, poner en pending
          columns.pending.tasks.push({
            ...task,
            estado: 'pending',
            order: task.order ?? columns.pending.tasks.length
          });
        }
      });

      // Ordenar las tareas dentro de cada columna por su campo order
      Object.keys(columns).forEach(columnId => {
        columns[columnId].tasks.sort((a, b) => {
          // Primero ordenar por campo order si existe
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          // Si no, ordenar por fecha
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        });
      });
    }

    setBoardState(prev => ({
      columns,
      columnOrder,
      deletedColumns: [],
      isGlobalCollapsed: false,
      viewMode: prev.viewMode || 'board'
    }));
  }, [data, getTaskStatus, itinerario.columnsOrder]);

  // Función para manejar la creación de tareas
  const handleTaskCreate = useCallback(async (taskData: Partial<Task>) => {
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
      setEvent((prevEvent) => {
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
  }, [event, itinerario, config.domain, setEvent, setSelectTask, t, data, boardState]);

  // Función para manejar el drag start mejorada
  const handleDragStart = useCallback((dragEvent: DragStartEvent) => {
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
          sourceColumnId: columnId // Guardar la columna origen como metadato
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
  }, [boardState.columns]);

  // Función mejorada para manejar el drag end
const handleDragEnd = useCallback(async (dragEvent: DragEndEvent) => {
  const { active, over } = dragEvent;

  if (!over || !draggedItem) {
    setDraggedItem(null);
    return;
  }

  const activeId = active.id as string;
  const overId = over.id as string;

  if (draggedItem.type === 'task') {
    let sourceColumnId = draggedItem.sourceColumnId || '';
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
    // Si el ID empieza con "column-", es una columna
    if (overId.startsWith('column-')) {
      targetColumnId = overId.replace('column-', '');
    } 
    // Si es un ID directo de columna
    else if (boardState.columns[overId]) {
      targetColumnId = overId;
    }
    // Si es una tarea, buscar su columna
    else {
      for (const [columnId, column] of Object.entries(boardState.columns)) {
        if (column.tasks.some(t => t._id === overId)) {
          targetColumnId = columnId;
          break;
        }
      }
    }

    // Validar que tenemos una columna destino válida
    if (!targetColumnId || !boardState.columns[targetColumnId]) {
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
      setEvent((prevEvent) => {
        const newEvent = { ...prevEvent };
        const itineraryIndex = newEvent.itinerarios_array.findIndex(
          it => it._id === itinerario._id
        );
        
        if (itineraryIndex !== -1) {
          tasksToUpdate.forEach(taskOrder => {
            const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks.findIndex(
              t => t._id === taskOrder.taskId
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
  } else if (draggedItem.type === 'column') {
    // Lógica para mover columnas (sin cambios)
    // ... código existente
  }

  setDraggedItem(null);
}, [draggedItem, boardState, event._id, itinerario._id, config.domain, setEvent, t]);

// Función handleDragOver
const handleDragOver = useCallback((dragEvent: DragOverEvent) => {
  const { active, over } = dragEvent;
  
  if (!over) return;

  const activeId = active.id as string;
  const overId = over.id as string;

  if (activeId === overId) return;

  // Si estamos arrastrando una tarea
  if (draggedItem?.type === 'task') {
    // El over puede ser una columna (column-ID) o una tarea
    return; // Permitir todos los drag over de tareas
  }

  // Si estamos arrastrando una columna
  if (draggedItem?.type === 'column') {
    // Solo permitir si el destino es otra columna
    const isOverColumn = boardState.columns[overId] !== undefined;
    if (isOverColumn) return;
  }
}, [draggedItem, boardState.columns]);

  // Función para guardar manualmente
  const handleManualSave = useCallback(() => {
    if (hasUnsavedChanges && !isSaving) {
      saveOrderToAPI();
    }
  }, [hasUnsavedChanges, isSaving, saveOrderToAPI]);

  // Alternar colapso global
  const toggleGlobalCollapse = useCallback(() => {
    setBoardState(prev => ({
      ...prev,
      isGlobalCollapsed: !prev.isGlobalCollapsed,
      columns: Object.fromEntries(
        Object.entries(prev.columns).map(([id, column]) => [
          id,
          { ...column, isCollapsed: !prev.isGlobalCollapsed },
        ])
      ),
    }));
  }, []);

  // Alternar colapso de columna individual
  const toggleColumnCollapse = useCallback((columnId: string) => {
    setBoardState(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [columnId]: {
          ...prev.columns[columnId],
          isCollapsed: !prev.columns[columnId].isCollapsed,
        },
      },
    }));
  }, []);

  // Filtrar columnas visibles
  const visibleColumns = useMemo(() => {
    return boardState.columnOrder
      .filter(id => !boardState.columns[id]?.isHidden)
      .map(id => boardState.columns[id])
      .filter(Boolean);
  }, [boardState]);

  // Filtrar tareas basado en búsqueda y filtros
  const filteredColumns = useMemo(() => {
    if (!searchTerm && Object.keys(activeFilters).length === 0) {
      return boardState.columns;
    }

    const filtered: Record<string, BoardColumn> = {};

    Object.entries(boardState.columns).forEach(([id, column]) => {
      const filteredTasks = column.tasks.filter(task => {
        // Filtro de búsqueda
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch =
            (task.descripcion?.toLowerCase().includes(searchLower) ?? false) ||
            (task.tips?.toLowerCase().includes(searchLower) ?? false) ||
            (Array.isArray(task.responsable) && task.responsable.some(r => r?.toLowerCase().includes(searchLower))) ||
            (Array.isArray(task.tags) && task.tags.some(t => t?.toLowerCase().includes(searchLower)));

          if (!matchesSearch) return false;
        }

        // Filtros adicionales
        if (activeFilters.responsable && activeFilters.responsable.length > 0) {
          const hasResponsible = task.responsable?.some(r =>
            activeFilters.responsable.includes(r)
          );
          if (!hasResponsible) return false;
        }

        if (activeFilters.tags && activeFilters.tags.length > 0) {
          const hasTags = task.tags?.some(t =>
            activeFilters.tags.includes(t)
          );
          if (!hasTags) return false;
        }

        if (activeFilters.status && activeFilters.status.length > 0) {
          const taskStatus = task.estatus ? 'completed' : 'pending';
          if (!activeFilters.status.includes(taskStatus)) return false;
        }

        // Filtro de fechas
        if (activeFilters.dateFrom || activeFilters.dateTo) {
          const taskDate = task.fecha ? new Date(task.fecha) : null;
          if (!taskDate) return false;

          if (activeFilters.dateFrom) {
            const fromDate = new Date(activeFilters.dateFrom);
            if (taskDate < fromDate) return false;
          }

          if (activeFilters.dateTo) {
            const toDate = new Date(activeFilters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (taskDate > toDate) return false;
          }
        }

        return true;
      });

      filtered[id] = {
        ...column,
        tasks: filteredTasks,
      };
    });

    return filtered;
  }, [boardState.columns, searchTerm, activeFilters]);

  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
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
            valor: typeof value === 'boolean' ? value.toString() : String(value)
          },
          domain: config.domain
        });
      });

      await Promise.all(updatePromises);

      // Actualizar el estado local
      setBoardState(prev => {
        const newColumns = { ...prev.columns };

        Object.keys(newColumns).forEach(columnId => {
          const taskIndex = newColumns[columnId].tasks.findIndex(t => t._id === taskId);
          if (taskIndex !== -1) {
            newColumns[columnId].tasks[taskIndex] = {
              ...newColumns[columnId].tasks[taskIndex],
              ...updates
            };
          }
        });

        return {
          ...prev,
          columns: newColumns
        };
      });

      // Llamar al callback padre
      onTaskUpdate(taskId, updates);

      toast.success(t('Tarea actualizada correctamente'));
    } catch (error) {
      console.error('Error al actualizar la tarea:', error);
      toast.error(t('Error al actualizar la tarea'));
    }
  }, [event, itinerario, onTaskUpdate, t, config.domain]);

  // Crear sub-tarea
  const handleCreateSubTask = useCallback((parentTaskId: string, subTask: Partial<Task>) => {
    onTaskCreate({
      ...subTask,
      tags: [
        ...(subTask.tags || []),
        `subtask-of:${parentTaskId}`
      ]
    });

    setShowSubTaskModal({ show: false });
  }, [onTaskCreate]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            const searchInput = document.querySelector('input[type="text"][placeholder*="Buscar"]') as HTMLInputElement;
            searchInput?.focus();
            break;
          case 'e':
            e.preventDefault();
            toggleGlobalCollapse();
            break;
          case 'h':
            e.preventDefault();
            setShowShortcuts(true);
            break;
          case 's':
            e.preventDefault();
            handleManualSave();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleGlobalCollapse, handleManualSave]);

  // Exportar datos
  const exportData = useCallback(() => {
    const rows: any[] = [];
    boardState.columnOrder.forEach(columnId => {
      const column = boardState.columns[columnId];
      column.tasks.forEach(task => {
        rows.push({
          Estado: column.title,
          Título: task.descripcion,
          Responsable: Array.isArray(task.responsable) ? task.responsable.join(', ') : '',
          Prioridad: task.prioridad,
          EstadoTarea: task.estatus ? 'Completado' : 'Pendiente',
          Fecha: task.fecha ? new Date(task.fecha).toLocaleString() : '',
          Tags: Array.isArray(task.tags) ? task.tags.join(', ') : '',
          Tips: task.tips || ''
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tareas');

    XLSX.writeFile(workbook, `tablero-${itinerario.title}-${new Date().toISOString().split('T')[0]}.xlsx`);

    toast.success(t('Datos exportados correctamente'));
  }, [boardState, itinerario, t]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header del tablero */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {itinerario.title} - Vista Tablero
              </h2>
              {(isSaving || hasUnsavedChanges || draggedItem) && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {isSaving || draggedItem ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>{draggedItem ? t('Moviendo tarea...') : t('Guardando cambios...')}</span>
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>{t('Cambios sin guardar')}</span>
                    </>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Indicadores de estado */}
              <div className="flex items-center space-x-3 text-sm">
                <span className="flex items-center space-x-1 text-gray-500">
                  <Layers className="w-4 h-4" />
                  <span>{visibleColumns.length} columnas</span>
                </span>
                <span className="flex items-center space-x-1 text-gray-500">
                  <Hash className="w-4 h-4" />
                  <span>
                    {visibleColumns.reduce((acc, col) => acc + col.tasks.length, 0)} tareas
                  </span>
                </span>
              </div>

              {/* Búsqueda */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tareas... (Ctrl+F)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Botones de acción */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-md transition-colors ${showFilters || Object.keys(activeFilters).length > 0
                  ? 'bg-pink-100 text-primary'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                title="Filtros"
              >
                <Filter className="w-4 h-4" />
              </button>

              <button
                onClick={toggleGlobalCollapse}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                title={boardState.isGlobalCollapsed ? 'Expandir todo' : 'Contraer todo'}
              >
                {boardState.isGlobalCollapsed ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>

              {/* Botón de guardar manual */}
              {hasUnsavedChanges && (
                <button
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className={`p-2 rounded-md transition-colors ${
                    isSaving 
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-primary hover:text-white hover:bg-primary bg-pink-100'
                  }`}
                  title="Guardar cambios (Ctrl+S)"
                >
                  <Save className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={exportData}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                title="Exportar datos"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowShortcuts(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                title="Atajos de teclado (Ctrl+H)"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros expandibles */}
      {showFilters && (
        <BoardFilters
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
          onClose={() => setShowFilters(false)}
          tasks={data}
        />
      )}

      {/* Tablero principal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="flex h-full p-4 space-x-4" style={{ minWidth: 'fit-content' }}>
            <SortableContext
              items={boardState.columnOrder}
              strategy={horizontalListSortingStrategy}
            >
              {boardState.columnOrder
                .filter(columnId => !boardState.columns[columnId]?.isHidden)
                .map(columnId => {
                  const column = filteredColumns[columnId];
                  if (!column) return null;

                  return (
                    <BoardColumn
                      key={columnId}
                      column={column}
                      onTaskClick={(taskId) => {
                        const task = column.tasks.find(t => t._id === taskId);
                        if (task) {
                          setShowTaskDetail({ show: true, task });
                        }
                      }}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskDelete={onTaskDelete}
                      onTaskCreate={handleTaskCreate}
                      onToggleCollapse={() => toggleColumnCollapse(columnId)}
                      onCreateSubTask={(taskId) =>
                        setShowSubTaskModal({ show: true, parentTaskId: taskId })
                      }
                      selectedTask={selectTask}
                      itinerario={itinerario}
                      viewMode={boardState.viewMode || 'board'}
                    />
                  );
                })}
            </SortableContext>
          </div>

          {/* Overlay para arrastre */}
          <DragOverlay>
            {draggedItem && draggedItem.type === 'task' ? (
              <TaskCard
                task={draggedItem.data as Task}
                column={draggedItem.sourceColumnId ? boardState.columns[draggedItem.sourceColumnId] : undefined}
                onTaskClick={() => { }}
                onTaskUpdate={() => { }}
                onTaskDelete={() => { }}
                onCreateSubTask={() => { }}
                onTaskCreate={() => { }}
                isSelected={false}
                isDragging={true}
                itinerario={itinerario}
              />
            ) : draggedItem && draggedItem.type === 'column' ? (
              <div className="opacity-50">
                <BoardColumn
                  column={draggedItem.data as BoardColumn}
                  onTaskClick={() => { }}
                  onTaskUpdate={() => { }}
                  onTaskDelete={() => { }}
                  onTaskCreate={() => { }}
                  onToggleCollapse={() => { }}
                  onCreateSubTask={() => { }}
                  selectedTask=""
                  itinerario={itinerario}
                  viewMode={boardState.viewMode || 'board'}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modales */}
      {showSubTaskModal.show && (
        <SubTaskModal
          parentTaskId={showSubTaskModal.parentTaskId!}
          onSave={handleCreateSubTask}
          onClose={() => setShowSubTaskModal({ show: false })}
          itinerario={itinerario}
        />
      )}

      {/* Modal de atajos de teclado */}
      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {/* Modal de detalle de tarea */}
      {showTaskDetail.show && showTaskDetail.task && (
        <TaskDetailModal
          task={showTaskDetail.task}
          itinerario={itinerario}
          onClose={() => setShowTaskDetail({ show: false })}
          onUpdate={handleTaskUpdate}
          onDelete={(taskId) => {
            onTaskDelete(taskId);
            setShowTaskDetail({ show: false });
          }}
          onTaskCreate={handleTaskCreate}
          tempPastedAndDropFiles={tempPastedAndDropFiles}
          setTempPastedAndDropFiles={setTempPastedAndDropFiles}
        />
      )}
    </div>
  );
};

// Modal de atajos de teclado actualizado
function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();

  const shortcuts = [
    { keys: 'Ctrl + F', description: t('Buscar tareas') },
    { keys: 'Ctrl + E', description: t('Expandir/Contraer todo') },
    { keys: 'Ctrl + S', description: t('Guardar cambios') },
    { keys: 'Ctrl + H', description: t('Mostrar atajos') },
    { keys: 'Esc', description: t('Cerrar modales') },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            {t('Atajos de Teclado')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                  {shortcut.keys}
                </kbd>
                <span className="text-gray-600">{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}