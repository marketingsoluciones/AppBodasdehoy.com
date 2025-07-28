import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCorners, } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, } from '@dnd-kit/sortable';
import { Task, Itinerary, Event as EventInterface } from '../../../utils/Interfaces';
import { BoardFilters } from './BoardFilters';
import { SubTaskModal } from '../Utils/SubTaskModal';
import { toast } from "react-toastify";
import { useTranslation } from 'react-i18next';
import TaskDetailModal from './TaskDetailModal';
import { AuthContextProvider } from '../../../context';
import { BoardState, DragItem, BoardColumn as IBoardColumn } from '../types';
import { DEFAULT_COLUMNS } from '../constants';
import { useDebounce, getTaskStatus, exportBoardData, saveColumnOrderToAPI, filterTasks } from './boardViewUtils';
import { createHandleDragStart, createHandleDragEnd, createHandleDragOver } from './dragDropHandlers';
import { createHandleTaskCreate, createHandleTaskUpdate, createHandleCreateSubTask } from '../VistaTarjeta/taskHandlers';
import { BoardHeader } from './BoardHeader';
import { ShortcutsModal } from '../Utils/ShortcutsModal';
import { BoardDragOverlay } from './BoardDragOverlay';
import { BoardColumn } from './BoardColumn';

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

export const BoardView: React.FC<BoardViewProps> = ({ data, itinerario, event, selectTask, setSelectTask, onTaskUpdate, onTaskDelete, onTaskCreate, setEvent, tempPastedAndDropFiles, setTempPastedAndDropFiles, }) => {

  const { config } = AuthContextProvider();
  const { t } = useTranslation();
  const [boardState, setBoardState] = useState<BoardState>({ columns: {}, columnOrder: [], deletedColumns: [], isGlobalCollapsed: false, viewMode: 'board' });
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState<{ show: boolean; task?: Task }>({ show: false });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSubTaskModal, setShowSubTaskModal] = useState<{ show: boolean; parentTaskId?: string; }>({ show: false });
  

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getTaskStatusCallback = useCallback((task: Task) =>
    getTaskStatus(task, DEFAULT_COLUMNS), []);

  const saveOrderToAPI = useCallback(async () => {
    if (!hasUnsavedChanges) return;
    setIsSaving(true);
    try {
      await saveColumnOrderToAPI(boardState, event, itinerario, config, setEvent);
      setHasUnsavedChanges(false);
      toast.success(t('Cambios guardados correctamente'));
    } catch (error) {
      toast.error(t('Error al guardar los cambios'));
    } finally {
      setIsSaving(false);
    }
  }, [boardState, hasUnsavedChanges, event, itinerario, config, setEvent, t]);

  const debouncedSave = useDebounce(saveOrderToAPI, 2000);

  useEffect(() => {
    if (hasUnsavedChanges && !isSaving) {
      debouncedSave();
    }
  }, [hasUnsavedChanges, debouncedSave, isSaving]);



  useEffect(() => {
    const columns: Record<string, IBoardColumn> = {};
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
        .filter(id => columns[id]);
    }

    // Distribuir tareas por estado
    if (data && data.length > 0) {
      data.forEach(task => {
        const status = task.estado || getTaskStatusCallback(task);

        if (columns[status]) {
          columns[status].tasks.push({
            ...task,
            estado: status,
            order: task.order ?? columns[status].tasks.length
          });
        } else {
          columns.pending.tasks.push({
            ...task,
            estado: 'pending',
            order: task.order ?? columns.pending.tasks.length
          });
        }
      });

      // Ordenar las tareas dentro de cada columna
      Object.keys(columns).forEach(columnId => {
        columns[columnId].tasks.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
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
  }, [data, getTaskStatusCallback, itinerario.columnsOrder]);

  useEffect(() => {
    // Solo actualizar si ya tenemos un boardState inicializado
    if (!boardState.columnOrder.length) return;

    // Sincronizar cambios del evento global con el boardState local
    const columns: Record<string, IBoardColumn> = {};

    // Copiar la estructura de columnas existente
    Object.entries(boardState.columns).forEach(([id, column]) => {
      columns[id] = {
        ...column,
        tasks: [] // Limpiar tareas, las vamos a repoblar
      };
    });

    // Distribuir tareas actualizadas del evento global
    if (data && data.length > 0) {
      data.forEach(task => {
        const status = task.estado || getTaskStatusCallback(task);

        if (columns[status]) {
          columns[status].tasks.push({
            ...task,
            estado: status,
            order: task.order ?? columns[status].tasks.length
          });
        } else if (columns.pending) {
          columns.pending.tasks.push({
            ...task,
            estado: 'pending',
            order: task.order ?? columns.pending.tasks.length
          });
        }
      });

      // Ordenar las tareas dentro de cada columna
      Object.keys(columns).forEach(columnId => {
        columns[columnId].tasks.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        });
      });
    }

    // Actualizar solo si hay cambios reales
    setBoardState(prev => {
      // Comparar si realmente cambió algo
      const hasChanges = JSON.stringify(prev.columns) !== JSON.stringify(columns);

      if (hasChanges) {
        return {
          ...prev,
          columns
        };
      }
      return prev;
    });
  }, [data]); // Dependencia en 'data' que viene de props y se actualiza cuando cambia el evento

  // Manejadores usando las funciones importadas
  const handleDragStart = useMemo(() =>
    createHandleDragStart(boardState, setDraggedItem),
    [boardState]
  );

  const handleDragEnd = useMemo(() =>
    createHandleDragEnd(
      draggedItem,
      boardState,
      setBoardState,
      setDraggedItem,
      event,
      itinerario,
      config,
      setEvent,
      t
    ),
    [draggedItem, boardState, event, itinerario, config, setEvent, t]
  );

  const handleDragOver = useMemo(() =>
    createHandleDragOver(draggedItem, boardState),
    [draggedItem, boardState]
  );

  const handleTaskCreate = useMemo(() =>
    createHandleTaskCreate(
      event,
      itinerario,
      config,
      setEvent,
      setSelectTask,
      t,
      data,
      boardState,
      setBoardState
    ),
    [event, itinerario, config, setEvent, setSelectTask, t, data, boardState]
  );

  const handleTaskUpdate = useMemo(() =>
    createHandleTaskUpdate(
      event,
      itinerario,
      config,
      setBoardState,
      onTaskUpdate,
      t
    ),
    [event, itinerario, config, onTaskUpdate, t]
  );

  const handleCreateSubTask = useMemo(() =>
    createHandleCreateSubTask(onTaskCreate, setShowSubTaskModal),
    [onTaskCreate]
  );

  // Otras funciones
  const handleManualSave = useCallback(() => {
    if (hasUnsavedChanges && !isSaving) {
      saveOrderToAPI();
    }
  }, [hasUnsavedChanges, isSaving, saveOrderToAPI]);

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

  const exportData = useCallback(() => {
    exportBoardData(boardState, itinerario, t);
    toast.success(t('Datos exportados correctamente'));
  }, [boardState, itinerario, t]);

  // Memos
  const visibleColumns = useMemo(() => {
    return boardState.columnOrder
      .filter(id => !boardState.columns[id]?.isHidden)
      .map(id => boardState.columns[id])
      .filter(Boolean);
  }, [boardState]);

  const filteredColumns = useMemo(() =>
    filterTasks(boardState.columns, searchTerm, activeFilters),
    [boardState.columns, searchTerm, activeFilters]
  );

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

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header del tablero */}
      <BoardHeader
        itinerario={itinerario}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        draggedItem={draggedItem}
        visibleColumns={visibleColumns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        activeFilters={activeFilters}
        isGlobalCollapsed={boardState.isGlobalCollapsed}
        onToggleGlobalCollapse={toggleGlobalCollapse}
        onManualSave={handleManualSave}
        onExport={exportData}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

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
          <BoardDragOverlay
            draggedItem={draggedItem}
            boardState={boardState}
            itinerario={itinerario}
          />
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