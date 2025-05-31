import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  MoreVertical
} from 'lucide-react';
import { Task, Itinerary, Event as EventInterface } from '../../../utils/Interfaces';
import { BoardColumn } from './BoardColumn';
import { TaskCard } from './TaskCard';
import { BoardFilters } from './BoardFilters';
import { AddColumnModal } from './AddColumnModal';
import { SubTaskModal } from './SubTaskModal';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { toast } from "react-toastify";
import { useTranslation } from 'react-i18next';

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
}

// Configuración mejorada de columnas con colores e íconos
const COLUMN_CONFIG: Record<string, {
  title: string;
  colorConfig: { bg: string; border: string; text: string };
  icon: React.ReactNode;
  color: string; // Para compatibilidad
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
      bg: 'bg-green-50', 
      border: 'border-green-300',
      text: 'text-white'
    },
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'bg-green-50 border-green-300'
  },
  blocked: {
    title: 'Bloqueado',
    colorConfig: { 
      bg: 'bg-red-50', 
      border: 'border-red-300',
      text: 'text-white'
    },
    icon: <XCircle className="w-4 h-4" />,
    color: 'bg-red-50 border-red-300'
  },
  review: {
    title: 'En Revisión',
    colorConfig: { 
      bg: 'bg-purple-50', 
      border: 'border-purple-300',
      text: 'text-white'
    },
    icon: <Eye className="w-4 h-4" />,
    color: 'bg-purple-50 border-purple-300'
  },
  archived: {
    title: 'Archivado',
    colorConfig: { 
      bg: 'bg-amber-50', 
      border: 'border-amber-300',
      text: 'text-white'
    },
    icon: <Archive className="w-4 h-4" />,
    color: 'bg-amber-50 border-amber-300'
  }
};

// Estados por defecto actualizados
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
    bgColor: 'bg-gray-700', // <-- Agrega esto
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
    bgColor: 'bg-primary', // <-- Agrega esto
  },
  completed: {
    id: 'completed',
    title: 'Completado',
    color: 'bg-green-50 border-green-300',
    colorConfig: COLUMN_CONFIG.completed.colorConfig,
    icon: COLUMN_CONFIG.completed.icon,
    isCollapsed: false,
    isHidden: false,
    order: 2,
    bgColor: 'bg-green', // <-- Agrega esto
  },
  blocked: {
    id: 'blocked',
    title: 'Bloqueado',
    color: 'bg-red-50 border-red-300',
    colorConfig: COLUMN_CONFIG.blocked.colorConfig,
    icon: COLUMN_CONFIG.blocked.icon,
    isCollapsed: false,
    isHidden: false,
    order: 3,
    bgColor: 'bg-red', // <-- Agrega esto
  },
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
  const { t } = useTranslation();

  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: (event as EventInterface)._id,
          itinerarioID: itinerario._id,
          taskID: taskId,
          ...updates,
        },
        domain: process.env.NEXT_PUBLIC_BASE_URL
      });
  
      if (response) {
        onTaskUpdate(taskId, updates);
        
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
  
        toast.success(t('Tarea actualizada correctamente'));
      }
    } catch (error) {
      console.error('Error al actualizar la tarea:', error);
      toast.error(t('Error al actualizar la tarea'));
    }
  }, [event, itinerario, onTaskUpdate, t]);

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

  // Memoizar getTaskStatus
  const getTaskStatus = useCallback((task: Task): string => {
    if (!task) return 'pending';
    if (task.estado) return task.estado;
    if (task.estatus === true) return 'completed';
    if (task.spectatorView === false) return 'blocked';
    if (task.responsable?.length > 0 && task.fecha) return 'in_progress';
    return 'pending';
  }, []);

  // useEffect actualizado con columnas mejoradas
  useEffect(() => {
    if (!data || data.length === 0) {
      // Si no hay datos, crear columnas vacías
      const columns: Record<string, BoardColumn> = {};
      
      Object.entries(DEFAULT_COLUMNS).forEach(([id, column]) => {
        columns[id] = {
          ...column,
          tasks: [],
        };
      });

      const columnOrder = Object.keys(columns).sort((a, b) => 
        columns[a].order - columns[b].order
      );

      setBoardState({
        columns,
        columnOrder,
        deletedColumns: [],
        isGlobalCollapsed: false,
        viewMode: 'board'
      });
      
      return;
    }

    const columns: Record<string, BoardColumn> = {};

    // Crear columnas por defecto con configuración mejorada
    Object.entries(DEFAULT_COLUMNS).forEach(([id, column]) => {
      columns[id] = {
        ...column,
        tasks: [],
      };
    });

    // Distribuir tareas por estado
    data.forEach(task => {
      const status = getTaskStatus(task);
      if (columns[status]) {
        columns[status].tasks.push(task);
      } else {
        // Si el estado no existe, ponerlo en pending
        console.warn(`Estado desconocido: ${status}, moviendo a pending`);
        columns.pending.tasks.push(task);
      }
    });

    const columnOrder = Object.keys(columns).sort((a, b) => 
      columns[a].order - columns[b].order
    );

    setBoardState(prev => ({
      columns,
      columnOrder,
      deletedColumns: prev.deletedColumns || [],
      isGlobalCollapsed: false,
      viewMode: prev.viewMode || 'board'
    }));
  }, [data, getTaskStatus]);

  // Función para eliminar columna
  const handleDeleteColumn = useCallback((columnId: string) => {
    setBoardState(prev => {
      const column = prev.columns[columnId];
      if (!column) return prev;

      const newColumns = { ...prev.columns };
      delete newColumns[columnId];

      return {
        ...prev,
        columns: newColumns,
        columnOrder: prev.columnOrder.filter(id => id !== columnId),
        deletedColumns: [...prev.deletedColumns, column]
      };
    });
    
    toast.success(t('Columna eliminada'));
  }, [t]);

  // Función para restaurar columna
  const handleRestoreColumn = useCallback((column: BoardColumn) => {
    setBoardState(prev => {
      const newOrder = [...prev.columnOrder, column.id].sort((a, b) => {
        const aOrder = prev.columns[a]?.order ?? column.order;
        const bOrder = prev.columns[b]?.order ?? column.order;
        return aOrder - bOrder;
      });

      return {
        ...prev,
        columns: {
          ...prev.columns,
          [column.id]: { ...column, isHidden: false }
        },
        columnOrder: newOrder,
        deletedColumns: prev.deletedColumns.filter(c => c.id !== column.id)
      };
    });
    
    toast.success(t('Columna restaurada'));
  }, [t]);

  // Función para alternar visibilidad de columna
  const handleToggleColumnVisibility = useCallback((columnId: string) => {
    setBoardState(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [columnId]: {
          ...prev.columns[columnId],
          isHidden: !prev.columns[columnId].isHidden
        }
      }
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
            task.descripcion?.toLowerCase().includes(searchLower) ||
            task.tips?.toLowerCase().includes(searchLower) ||
            task.responsable?.some(r => r.toLowerCase().includes(searchLower)) ||
            task.tags?.some(t => t.toLowerCase().includes(searchLower));
          
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
  
        return true;
      });
  
      filtered[id] = {
        ...column,
        tasks: filteredTasks,
      };
    });
  
    return filtered;
  }, [boardState.columns, searchTerm, activeFilters]);

  // Manejar inicio de arrastre
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    
    for (const column of Object.values(boardState.columns)) {
      const task = column.tasks.find(t => t._id === activeId);
      if (task) {
        setDraggedItem({
          id: activeId,
          type: 'task',
          data: task,
        });
        return;
      }
    }
    
    const column = boardState.columns[activeId];
    if (column) {
      setDraggedItem({
        id: activeId,
        type: 'column',
        data: column,
      });
    }
  }, [boardState.columns]);

  // Manejar finalización de arrastre
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !draggedItem) {
      setDraggedItem(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (draggedItem.type === 'task') {
      let sourceColumnId = '';
      for (const [columnId, column] of Object.entries(boardState.columns)) {
        if (column.tasks.some(t => t._id === activeId)) {
          sourceColumnId = columnId;
          break;
        }
      }

      let targetColumnId = overId;
      
      for (const [columnId, column] of Object.entries(boardState.columns)) {
        if (column.tasks.some(t => t._id === overId)) {
          targetColumnId = columnId;
          break;
        }
      }

      if (sourceColumnId !== targetColumnId) {
        const newEstatus = getStatusFromColumnId(targetColumnId);
        onTaskUpdate(activeId, { estatus: newEstatus, estado: targetColumnId });
        
        setBoardState(prev => {
          const newColumns = { ...prev.columns };
          const task = newColumns[sourceColumnId].tasks.find(t => t._id === activeId);
          
          if (task) {
            const updatedTask = {
              ...task,
              estatus: newEstatus,
              estado: targetColumnId
            };
            
            newColumns[sourceColumnId] = {
              ...newColumns[sourceColumnId],
              tasks: newColumns[sourceColumnId].tasks.filter(t => t._id !== activeId),
            };
            
            newColumns[targetColumnId] = {
              ...newColumns[targetColumnId],
              tasks: [...newColumns[targetColumnId].tasks, updatedTask],
            };
          }
          
          return {
            ...prev,
            columns: newColumns,
          };
        });
      }
    } else if (draggedItem.type === 'column') {
      if (activeId !== overId) {
        setBoardState(prev => {
          const newColumnOrder = [...prev.columnOrder];
          const oldIndex = newColumnOrder.indexOf(activeId);
          const newIndex = newColumnOrder.indexOf(overId);
          
          newColumnOrder.splice(oldIndex, 1);
          newColumnOrder.splice(newIndex, 0, activeId);
          
          return {
            ...prev,
            columnOrder: newColumnOrder,
          };
        });
      }
    }

    setDraggedItem(null);
  }, [draggedItem, boardState.columns, onTaskUpdate]);

  // Convertir columnId a status
  const getStatusFromColumnId = (columnId: string): boolean => {
    switch (columnId) {
      case 'completed':
        return true;
      case 'blocked':
        return true;
      default:
        return false;
    }
  };

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

  // Agregar nueva columna
  const handleAddColumn = useCallback((column: Omit<BoardColumn, 'tasks' | 'order'>) => {
    setBoardState(prev => {
      const newColumn: BoardColumn = {
        ...column,
        tasks: [],
        order: prev.columnOrder.length,
      };
      
      return {
        ...prev,
        columns: {
          ...prev.columns,
          [column.id]: newColumn,
        },
        columnOrder: [...prev.columnOrder, column.id],
      };
    });
    setShowAddColumn(false);
    toast.success(t('Columna agregada'));
  }, [t]);

  // Manejar creación de tareas
  interface ApiResponse {
    data: Task;
    _id: string;
    success: boolean;
  }

const handleTaskCreate = async (taskData: Partial<Task>) => {
  try {
    const eventID = (event as EventInterface)._id;
    if (!eventID) throw new Error("No se pudo obtener el ID del evento");

    console.log('Creando tarea con datos:', taskData);

    // Primer fetch: Crear la tarea
    const createResponse = await fetchApiEventos({
      query: queries.createTask,
      variables: {
        eventID: eventID,
        itinerarioID: itinerario._id,
        descripcion: taskData.descripcion || "Nueva tarea",
        fecha: taskData.fecha || new Date(),
        duracion: taskData.duracion || 30,
      },
      domain: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    });

    if (!createResponse) throw new Error("No se recibió respuesta del servidor al crear la tarea");

    // La respuesta puede venir directamente como Task o dentro de data
    const newTask: Task = (createResponse as { data?: Task }).data || (createResponse as Task);
    
    if (!newTask._id) throw new Error("La tarea creada no tiene ID válido");

    console.log('Tarea creada con ID:', newTask._id);

    // Preparar los datos completos para la actualización
    const fullTaskData = {
      descripcion: taskData.descripcion || "Nueva tarea",
      fecha: taskData.fecha || new Date(),
      duracion: taskData.duracion || 30,
      responsable: taskData.responsable || [],
      tags: taskData.tags || [],
      attachments: taskData.attachments || [],
      tips: taskData.tips || "",
      spectatorView: taskData.spectatorView !== undefined ? taskData.spectatorView : true,
      estatus: taskData.estatus !== undefined ? taskData.estatus : false,
      estado: taskData.estado || 'pending',
      prioridad: taskData.prioridad || 'media',
    };

    // Segundo fetch: Actualizar la tarea con todos los datos incluyendo el estado
    const updateResponse = await fetchApiEventos({
      query: queries.editTask,
      variables: {
        eventID: eventID,
        itinerarioID: itinerario._id,
        taskID: newTask._id,
        variable: "all",
        valor: JSON.stringify(fullTaskData)
      },
      domain: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    });

    if (!updateResponse) throw new Error("No se pudo actualizar la tarea con los datos completos");

    // Combinar los datos de la tarea creada con los datos actualizados
    const finalTask: Task = {
      ...newTask,
      ...fullTaskData
    };

    console.log('Tarea actualizada:', finalTask);

    // Actualizar el evento global
    setEvent((prevEvent: EventInterface) => {
      const newEvent = { ...prevEvent };
      const itineraryIndex = newEvent.itinerarios_array.findIndex(
        it => it._id === itinerario._id
      );
      if (itineraryIndex !== -1) {
        newEvent.itinerarios_array[itineraryIndex].tasks.push(finalTask);
      }
      return newEvent;
    });

    // Actualizar el estado local del tablero inmediatamente
    setBoardState(prev => {
      const newColumns = { ...prev.columns };
      
      // Usar el estado especificado o determinar basado en la tarea
      const targetColumnId = taskData.estado || 'pending';
      
      if (newColumns[targetColumnId]) {
        newColumns[targetColumnId] = {
          ...newColumns[targetColumnId],
          tasks: [...newColumns[targetColumnId].tasks, finalTask],
        };
      } else {
        console.warn(`Columna ${targetColumnId} no encontrada, agregando a pending`);
        if (newColumns.pending) {
          newColumns.pending = {
            ...newColumns.pending,
            tasks: [...newColumns.pending.tasks, finalTask],
          };
        }
      }
      
      return {
        ...prev,
        columns: newColumns,
      };
    });

    // Seleccionar la nueva tarea
    if (finalTask._id) {
      setSelectTask(finalTask._id);
    }

    toast.success(t("Tarea creada con éxito"));
  } catch (error) {
    console.error("Error al crear la tarea:", error);
    toast.error(t("Error al crear la tarea"));
  }
};

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
        switch(e.key) {
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
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleGlobalCollapse]);

  // Exportar datos
  const exportData = useCallback(() => {
    const exportData = {
      itinerario: itinerario.title,
      fecha: new Date().toISOString(),
      columnas: boardState.columnOrder.map(columnId => ({
        nombre: boardState.columns[columnId].title,
        tareas: boardState.columns[columnId].tasks.map(task => ({
          titulo: task.descripcion,
          responsable: task.responsable,
          prioridad: task.prioridad,
          estado: task.estatus ? 'Completado' : 'Pendiente'
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tablero-${itinerario.title}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(t('Datos exportados correctamente'));
  }, [boardState, itinerario, t]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header del tablero mejorado */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {itinerario.title} - Vista Tablero
              </h2>
              

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
                {boardState.deletedColumns.length > 0 && (
                  <button
                    onClick={() => setShowDeletedColumns(!showDeletedColumns)}
                    className="flex items-center space-x-1 text-orange-600 hover:text-orange-700"
                  >
                    <Archive className="w-4 h-4" />
                    <span>{boardState.deletedColumns.length} eliminadas</span>
                  </button>
                )}
              </div>

              {/* Selector de vista */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setBoardState(prev => ({ ...prev, viewMode: 'board' }))}
                  className={`p-2 rounded transition-all ${
                    boardState.viewMode === 'board' 
                      ? 'bg-white shadow-sm text-primary' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="Vista Tablero"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setBoardState(prev => ({ ...prev, viewMode: 'compact' }))}
                  className={`p-2 rounded transition-all ${
                    boardState.viewMode === 'compact' 
                      ? 'bg-white shadow-sm text-primary' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="Vista Compacta"
                >
                  <Layers className="w-4 h-4" />
                </button>
{/*                 <button
                  onClick={() => setBoardState(prev => ({ ...prev, viewMode: 'list' }))}
                  className={`p-2 rounded transition-all ${
                    boardState.viewMode === 'list' 
                      ? 'bg-white shadow-sm text-primary' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="Vista Lista"
                >
                  <List className="w-4 h-4" />
                </button> */}
              </div>
              {/* Búsqueda mejorada */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tareas... (Ctrl+F)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                className={`p-2 rounded-md transition-colors ${
                  showFilters || Object.keys(activeFilters).length > 0
                    ? 'bg-pink-100 text-primary'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Filtros"
              >
                <Filter className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowColumnManager(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                title="Gestionar Columnas"
              >
                <Settings className="w-4 h-4" />
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

{/*               <button
                onClick={() => setShowAddColumn(true)}
                className="flex items-center space-x-1 px-3 py-2 text-primary hover:text-primary hover:bg-pink-50 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Agregar Estado</span>
              </button> */}
            </div>
          </div>
        </div>

        {/* Barra de columnas eliminadas */}
        {showDeletedColumns && boardState.deletedColumns.length > 0 && (
          <div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-amber-800">
                Columnas Eliminadas
              </h3>
              <div className="flex items-center space-x-2">
                {boardState.deletedColumns.map(column => (
                  <button
                    key={column.id}
                    onClick={() => handleRestoreColumn(column)}
                    className="inline-flex items-center space-x-2 px-3 py-1 bg-white border border-amber-300 rounded-md text-sm hover:bg-amber-50 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{column.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
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
                    onTaskClick={setSelectTask}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDelete={onTaskDelete}
                    onTaskCreate={handleTaskCreate}
                    onToggleCollapse={() => toggleColumnCollapse(columnId)}
                    onCreateSubTask={(taskId) => 
                      setShowSubTaskModal({ show: true, parentTaskId: taskId })
                    }
                    selectedTask={selectTask}
                    itinerario={itinerario}
                    onDeleteColumn={() => handleDeleteColumn(columnId)}
                    onToggleVisibility={() => handleToggleColumnVisibility(columnId)}
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
                onTaskClick={() => {}}
                onTaskUpdate={() => {}}
                onTaskDelete={() => {}}
                onCreateSubTask={() => {}}
                isSelected={false}
                isDragging={true}
                itinerario={itinerario}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modales */}
      {showAddColumn && (
        <AddColumnModal
          onSave={handleAddColumn}
          onClose={() => setShowAddColumn(false)}
        />
      )}

      {showSubTaskModal.show && (
        <SubTaskModal
          parentTaskId={showSubTaskModal.parentTaskId!}
          onSave={handleCreateSubTask}
          onClose={() => setShowSubTaskModal({ show: false })}
          itinerario={itinerario}
        />
      )}

      {/* Modal de gestión de columnas */}
      {showColumnManager && (
        <ColumnManagerModal
          columns={boardState.columns}
          columnOrder={boardState.columnOrder}
          deletedColumns={boardState.deletedColumns}
          onToggleVisibility={handleToggleColumnVisibility}
          onRestore={handleRestoreColumn}
          onDelete={handleDeleteColumn}
          onClose={() => setShowColumnManager(false)}
        />
      )}

      {/* Modal de atajos de teclado */}
      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
};

// Modal de gestión de columnas
function ColumnManagerModal({ 
  columns, 
  columnOrder, 
  deletedColumns,
  onToggleVisibility, 
  onRestore, 
  onDelete,
  onClose 
}: any) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            {t('Gestionar Columnas')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Columnas activas */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {t('Columnas Activas')}
            </h4>
            <div className="space-y-2">
              {columnOrder.map((id: string) => {
                const column = columns[id];
                if (!column) return null;
                
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {column.icon && (
                        <div className={column.colorConfig?.text || 'text-gray-600'}>
                          {column.icon}
                        </div>
                      )}
                      <span className="font-medium">{column.title}</span>
                      <span className="text-sm text-gray-500">
                        ({column.tasks.length} tareas)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onToggleVisibility(id)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title={column.isHidden ? 'Mostrar' : 'Ocultar'}
                      >
                        {column.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onDelete(id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columnas eliminadas */}
          {deletedColumns.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {t('Columnas Eliminadas')}
              </h4>
              <div className="space-y-2">
                {deletedColumns.map((column: BoardColumn) => (
                  <div
                    key={column.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {column.icon && (
                        <div className={column.colorConfig?.text || 'text-gray-600'}>
                          {column.icon}
                        </div>
                      )}
                      <span className="font-medium text-gray-600">
                        {column.title}
                      </span>
                    </div>
                    <button
                      onClick={() => onRestore(column)}
                      className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{t('Restaurar')}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal de atajos de teclado
function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  
  const shortcuts = [
    { keys: 'Ctrl + F', description: t('Buscar tareas') },
    { keys: 'Ctrl + E', description: t('Expandir/Contraer todo') },
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