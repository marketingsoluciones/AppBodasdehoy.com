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
  X
} from 'lucide-react';
import { Task, Itinerary, Event as EventInterface } from '../../../utils/Interfaces';
import { BoardColumn } from './BoardColumn';
import { TaskCard } from './TaskCard';
import { BoardFilters } from './BoardFilters';
import { AddColumnModal } from './AddColumnModal';
import { SubTaskModal } from './SubTaskModal';
// Añadir esta importación junto con las demás importaciones al inicio del archivo
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { toast } from "react-toastify";
// Agregar esta importación al inicio del archivo junto con las demás
import { useTranslation } from 'react-i18next';

// Tipos para el tablero
export interface BoardColumn {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  isCollapsed: boolean;
  order: number;
}

export interface BoardState {
  columns: Record<string, BoardColumn>;
  columnOrder: string[];
  isGlobalCollapsed: boolean;
}

export interface DragItem {
  id: string;
  type: 'task' | 'column';
  data: Task | BoardColumn;
}

// En las props del componente BoardView
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

// Estados por defecto
const DEFAULT_COLUMNS: Record<string, Omit<BoardColumn, 'tasks'>> = {
  pending: {
    id: 'pending',
    title: 'Pendiente',
    color: 'bg-gray-100 border-gray-300',
    isCollapsed: false,
    order: 0,
  },
  in_progress: {
    id: 'in_progress',
    title: 'En Progreso',
    color: 'bg-blue-50 border-blue-300',
    isCollapsed: false,
    order: 1,
  },
  completed: {
    id: 'completed',
    title: 'Completado',
    color: 'bg-green-50 border-green-300',
    isCollapsed: false,
    order: 2,
  },
  blocked: {
    id: 'blocked',
    title: 'Bloqueado',
    color: 'bg-red-50 border-red-300',
    isCollapsed: false,
    order: 3,
  },
};

export const BoardView: React.FC<BoardViewProps> = ({
  data,
  itinerario,
  event, // Asegurarse de recibir event como prop
  selectTask,
  setSelectTask,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate,
  setEvent,
}) => {
  // Estados
  const [boardState, setBoardState] = useState<BoardState>({
    columns: {},
    columnOrder: [],
    isGlobalCollapsed: false,
  });
  


  
  
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const { t } = useTranslation();

  // En BoardView.tsx, modificar handleTaskUpdate

  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      // Primero actualizar en la API
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
        // Llamar a onTaskUpdate para mantener la sincronización con el componente padre
        onTaskUpdate(taskId, updates);
        
        // Actualizar el estado local del tablero si es necesario
        setBoardState(prev => {
          const newColumns = { ...prev.columns };
          
          // Buscar y actualizar la tarea en la columna correcta
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
        distance: 8, // Evita activación accidental
      },
    })
  );

// Memoizar getTaskStatus
const getTaskStatus = useCallback((task: Task): string => {
  if (!task) return 'pending';
  if (task.estado) return task.estado;
  if (task.estatus === true) return 'blocked';
  if (task.spectatorView === false) return 'completed';
  if (task.responsable?.length > 0 && task.fecha) return 'in_progress';
  return 'pending';
}, []); // Sin dependencias ya que no usa nada externo

// Modifica el useEffect para que sea más simple y tenga las dependencias correctas
useEffect(() => {
  if (!data) return; // Si no hay datos, no hacer nada

  const columns: Record<string, BoardColumn> = {};
  const hiddenColumns: string[] = [];

  // Crear columnas por defecto
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
    }
  });

  // Identificar columnas vacías
  Object.entries(columns).forEach(([id, column]) => {
    if (column.tasks.length === 0) {
      hiddenColumns.push(id);
    }
  });

  const columnOrder = Object.keys(columns).sort((a, b) => 
    columns[a].order - columns[b].order
  );

  // Actualizar el estado una sola vez
  setBoardState({
    columns,
    columnOrder,
    isGlobalCollapsed: false
  });

  setHiddenEmptyColumns(hiddenColumns);
}, [data, getTaskStatus]); // Solo dependemos de data y getTaskStatus



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
  
        // Eliminar la comprobación de prioridad que causaba el error
        return true;
      });
  
      filtered[id] = {
        ...column,
        tasks: filteredTasks,
      };
    });
  
    return filtered;
  }, [boardState.columns, searchTerm, activeFilters]);
  

  // Filtrar tareas según los filtros activos
  const filteredTasks = useMemo(() => {
    return data.filter(task => {
      // Filtrar por texto
      if (activeFilters.text) {
        const searchText = activeFilters.text.toLowerCase();
        if (!task.descripcion.toLowerCase().includes(searchText)) {
          return false;
        }
      }

      // Filtrar por responsables
      if (activeFilters.responsable && activeFilters.responsable.length > 0) {
        if (!task.responsable.some(r => activeFilters.responsable.includes(r))) {
          return false;
        }
      }

      // Filtrar por etiquetas
      if (activeFilters.tags && activeFilters.tags.length > 0) {
        if (!task.tags.some(t => activeFilters.tags.includes(t))) {
          return false;
        }
      }

      // Filtrar por estado
      if (activeFilters.status) {
        const taskStatus = task.estatus ? 'completed' : 'pending';
        if (taskStatus !== activeFilters.status) {
          return false;
        }
      }

      return true;
    });
  }, [data, activeFilters]);

  // Manejar inicio de arrastre
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    
    // Buscar la tarea o columna que se está arrastrando
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
    
    // Si no es una tarea, debe ser una columna
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
      // Encontrar en qué columna está la tarea actualmente
      let sourceColumnId = '';
      for (const [columnId, column] of Object.entries(boardState.columns)) {
        if (column.tasks.some(t => t._id === activeId)) {
          sourceColumnId = columnId;
          break;
        }
      }

      // Determinar la columna destino
      let targetColumnId = overId;
      
      // Si se suelta sobre una tarea, obtener su columna
      for (const [columnId, column] of Object.entries(boardState.columns)) {
        if (column.tasks.some(t => t._id === overId)) {
          targetColumnId = columnId;
          break;
        }
      }

      // Si se mueve entre columnas diferentes, actualizar status
      if (sourceColumnId !== targetColumnId) {
        const newEstatus = getStatusFromColumnId(targetColumnId);
        onTaskUpdate(activeId, { estatus: newEstatus });
        
        // Actualizar estado local
        setBoardState(prev => {
          const newColumns = { ...prev.columns };
          const task = newColumns[sourceColumnId].tasks.find(t => t._id === activeId);
          
          if (task) {
            // Actualizar el estatus de la tarea
            const updatedTask = {
              ...task,
              estatus: newEstatus
            };
            
            // Remover de columna origen
            newColumns[sourceColumnId] = {
              ...newColumns[sourceColumnId],
              tasks: newColumns[sourceColumnId].tasks.filter(t => t._id !== activeId),
            };
            
            // Agregar a columna destino
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
      // Reordenar columnas
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
    // Convertir el columnId a un valor booleano según la lógica de negocio
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
  }, []);

  // Primero, definamos una interfaz para la respuesta de la API
interface ApiResponse {
  data: Task;
  _id: string;
  success: boolean;
}

// Modificar la función handleTaskCreate
const handleTaskCreate = async (taskData: Partial<Task>) => {
  try {
    const eventID = (event as EventInterface)._id;
    if (!eventID) throw new Error("No se pudo obtener el ID del evento");

    const response = await fetchApiEventos({
      query: queries.createTask,
      variables: {
        eventID: eventID,
        itinerarioID: itinerario._id,
        descripcion: taskData.descripcion || "Nueva tarea",
        fecha: taskData.fecha || new Date(),
        duracion: taskData.duracion || 30,
        responsable: taskData.responsable || [],
        tags: taskData.tags || [],
        attachments: taskData.attachments || [],
        tips: taskData.tips || "",
        spectatorView: taskData.spectatorView !== undefined ? taskData.spectatorView : true,
        estatus: taskData.estatus !== undefined ? taskData.estatus : false,
        estado: taskData.estado,
        prioridad: taskData.prioridad,
      },
      domain: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    }) as ApiResponse;

    if (!response) throw new Error("No se recibió respuesta del servidor");

    // Actualizar el estado global
    setEvent((prevEvent: EventInterface) => {
      const newEvent = { ...prevEvent };
      const itineraryIndex = newEvent.itinerarios_array.findIndex(
        it => it._id === itinerario._id
      );
      if (itineraryIndex !== -1) {
        const newTask = response.data;
        newEvent.itinerarios_array[itineraryIndex].tasks.push(newTask);
      }
      return newEvent;
    });

    // Actualizar el estado local del board inmediatamente
setBoardState(prev => {
  const columns = { ...prev.columns };
  const status = getTaskStatus(response.data);
  if (columns[status]) {
    columns[status] = {
      ...columns[status],
      tasks: [...columns[status].tasks, response.data],
    };
  }
  return {
    ...prev,
    columns,
  };
});

    // Seleccionar la nueva tarea
    if (response._id) {
      setSelectTask(response._id);
    }

    toast.success(t("Tarea creada con éxito"));
  } catch (error) {
    console.error("Error al crear la tarea:", error);
    toast.error(t("Error al crear la tarea"));
  }
};

// Crear sub-tarea usando tags para la relación
const handleCreateSubTask = useCallback((parentTaskId: string, subTask: Partial<Task>) => {
    onTaskCreate({
      ...subTask,
      // Agregar un tag especial para marcar la relación padre-hijo
      tags: [
        ...(subTask.tags || []),
        `subtask-of:${parentTaskId}` // Usar un tag para marcar la relación
      ]
    });
    
    setShowSubTaskModal({ show: false });
  }, [onTaskCreate]);

  // Funciones auxiliares para manejar subtareas
  const isSubtask = (task: Task): boolean => {
    return task.tags.some(tag => tag.startsWith('subtask-of:'));
  };

  const getParentTaskId = (task: Task): string | null => {
    const parentTag = task.tags.find(tag => tag.startsWith('subtask-of:'));
    return parentTag ? parentTag.split(':')[1] : null;
  };

  const getSubtasks = (parentId: string, tasks: Task[]): Task[] => {
    return tasks.filter(task => 
      task.tags.includes(`subtask-of:${parentId}`)
    );
  };
  

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header del tablero */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {itinerario.title} - Vista Tablero
          </h2>
          
          {/* Controles de colapso global */}
          <div className="flex items-center space-x-2">
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
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-md transition-colors ${
              showFilters || Object.keys(activeFilters).length > 0
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Agregar columna */}
{/*           <button
            onClick={() => setShowAddColumn(true)}
            className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Agregar Estado</span>
          </button> */}
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
        >
          <div className="flex h-full p-4 space-x-4" style={{ minWidth: 'fit-content' }}>
            <SortableContext
              items={boardState.columnOrder}
              strategy={horizontalListSortingStrategy}
            >
              {boardState.columnOrder
                .filter(columnId => !hiddenEmptyColumns.includes(columnId))
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
    </div>
  );
};