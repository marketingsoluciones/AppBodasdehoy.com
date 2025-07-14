import React, { useCallback, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import * as XLSX from 'xlsx';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Download,
  Upload,
} from 'lucide-react';
import { Task, Itinerary } from '../../../utils/Interfaces';
import { TaskCard } from '../VistaTarjeta/TaskCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BoardColumn as IBoardColumn } from '../types';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

interface BoardColumnProps {
  column: IBoardColumn;
  onTaskClick: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (task: Partial<Task>) => void;
  onToggleCollapse: () => void;
  onCreateSubTask: (taskId: string) => void;
  selectedTask: string;
  itinerario: Itinerary;
  onDeleteColumn?: () => void;
  onToggleVisibility?: () => void;
  viewMode?: 'board' | 'compact' | 'list';
}

export const BoardColumn: React.FC<BoardColumnProps> = ({
  column,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate,
  onToggleCollapse,
  onCreateSubTask,
  selectedTask,
  itinerario,
  onDeleteColumn,
  onToggleVisibility,
  viewMode = 'board',
}) => {
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const { t } = useTranslation();

  // Configurar sortable para la columna (para mover columnas)
  const {
    attributes,
    listeners,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  // Configurar droppable para recibir tareas
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: 'column',
      columnId: column.id,
    },
  });

  // Combinar refs
  const setNodeRef = (node: HTMLElement | null) => {
    setSortableNodeRef(node);
    setDroppableNodeRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Crear nueva tarea con validación
  const handleCreateTask = useCallback(() => {
    if (newTaskTitle.trim()) {
      const newTask: Partial<Task> = {
        descripcion: newTaskTitle.trim(),
        fecha: new Date(),
        duracion: 30,
        responsable: [],
        tags: [],
        attachments: [],
        tips: '',
        spectatorView: true,
        estatus: false,
        estado: column.id,
        prioridad: 'media',
        icon: '',
        comments: [],
        commentsViewers: []
      };

      onTaskCreate(newTask);
      setNewTaskTitle('');
      setIsCreatingTask(false);
    }
  }, [newTaskTitle, onTaskCreate, column.id]);

  // Cancelar creación de tarea
  const handleCancelCreate = useCallback(() => {
    setNewTaskTitle('');
    setIsCreatingTask(false);
  }, []);

  // Manejar Enter y Escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateTask();
    } else if (e.key === 'Escape') {
      handleCancelCreate();
    }
  }, [handleCreateTask, handleCancelCreate]);

  // Exportar tareas de la columna
  const handleExportColumn = useCallback(() => {
    const rows: any[] = column.tasks.map(task => ({
      Título: task.descripcion,
      Responsable: Array.isArray(task.responsable) ? task.responsable.join(', ') : '',
      Prioridad: task.prioridad,
      Estado: task.estatus ? 'Completado' : 'Pendiente',
      Fecha: task.fecha ? new Date(task.fecha).toLocaleString() : '',
      Tags: Array.isArray(task.tags) ? task.tags.join(', ') : '',
      Duración: `${task.duracion || 0} min`,
      Comentarios: task.comments?.length || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, column.title);
    XLSX.writeFile(workbook, `columna-${column.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success(t('Columna exportada'));
    setShowColumnMenu(false);
  }, [column, t]);

  // Obtener el color de la columna
  const columnColors = column.colorConfig || {
    bg: column.color?.split(' ')[0] || 'bg-gray-50',
    border: column.color?.split(' ')[1] || 'border-gray-300',
    text: 'text-gray-700'
  };

  const isCompact = viewMode === 'compact';
  const isList = viewMode === 'list';

  // Manejar el clic en agregar tarea desde el header
  const handleAddTaskClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCreatingTask(true);
  }, []);

  // Determinar el color del ícono basado en el bgColor de la columna
  const getIconColorClass = () => {
    if (column.bgColor) {
      return column.bgColor;
    }
    // Fallback basado en el ID de la columna - Solo las 4 permitidas
    switch (column.id) {
      case 'pending':
        return 'bg-gray-700';
      case 'in_progress':
        return 'bg-primary';
      case 'completed':
        return 'bg-[#00b341]';
      case 'blocked':
        return 'bg-[#ff2525]';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex flex-col bg-white rounded-lg shadow-sm border-2 transition-all duration-200
        ${columnColors.border} ${columnColors.bg}
        ${isDragging ? 'shadow-lg rotate-1' : ''}
        ${isCompact ? 'w-64' : 'w-80'}
        ${isList ? 'w-full max-w-4xl' : ''}
        ${column.isCollapsed ? 'h-16' : ''}
        ${isOver ? 'ring-2 ring-primary ring-opacity-50' : ''}
      `}
      {...attributes}
    >
      {/* Header de la columna */}
      <div
        {...listeners}
        className={`
          flex items-center justify-between p-3 border-b cursor-grab active:cursor-grabbing
          ${columnColors.bg} ${columnColors.border}
        `}
      >
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-gray-100 hover:bg-opacity-50 rounded transition-colors"
          >
            {column.isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {/* Título y Ícono de la columna */}
          <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${getIconColorClass()}`}>
            {/* Ícono de la columna */}
            {column.icon && (
              <div className="text-white">
                {column.icon}
              </div>
            )}
            {/* Título de la columna */}
            <h3 className="font-medium select-none text-white">
              {column.title}
            </h3>
          </div>
          
          <span className="bg-white bg-opacity-60 text-gray-600 text-xs px-2 py-1 rounded-full select-none">
            {column.tasks.length}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {!column.isCollapsed && (
            <button
              onClick={handleAddTaskClick}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 hover:bg-opacity-50 rounded transition-colors"
              title={t("Agregar tarea")}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 hover:bg-opacity-50 rounded transition-colors"
              title={t("Opciones de columna")}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {showColumnMenu && (
              <div className="absolute right-0 top-8 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="py-1">
                  <button
                    onClick={handleExportColumn}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Download className="w-4 h-4 mr-3" />
                    {t("Exportar columna")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido de la columna */}
      {!column.isCollapsed && (
        <div 
          className={`
            flex-1 w-full p-3 space-y-3 overflow-y-auto
            ${isCompact ? 'max-h-72' : 'max-h-96'}
            ${isList ? 'max-h-full' : ''}
            ${column.tasks.length === 0 ? 'min-h-[200px]' : 'min-h-[100px]'}
          `}
          style={{ height: '100%' }}
        >
          {/* Formulario para crear nueva tarea */}
          {isCreatingTask && (
            <div className="bg-white bg-opacity-80 border border-gray-200 rounded-md p-3 shadow-sm">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("Título de la tarea...")}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                autoFocus
              />
              <div className="flex items-center justify-end space-x-2 mt-2">
                <button
                  onClick={handleCancelCreate}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {t("Cancelar")}
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim()}
                  className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t("Crear")}
                </button>
              </div>
            </div>
          )}

          {/* Lista de tareas */}
          {column.tasks.length > 0 && (
            <SortableContext
              items={column.tasks.filter(task => task && task._id).map(task => task._id)}
              strategy={verticalListSortingStrategy}
            >
              {column.tasks
                .filter(task => task && task._id)
                .map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    column={column}
                    onTaskClick={onTaskClick}
                    onTaskUpdate={onTaskUpdate}
                    onTaskDelete={onTaskDelete}
                    onCreateSubTask={onCreateSubTask}
                    onTaskCreate={onTaskCreate}
                    isSelected={selectedTask === task._id}
                    isDragging={false}
                    itinerario={itinerario}
                  />
                ))}
            </SortableContext>
          )}

          {/* Área de drop cuando no hay tareas */}
          {column.tasks.length === 0 && !isCreatingTask && (
            <div className="flex items-center justify-center h-auto">
              <button
                onClick={() => setIsCreatingTask(true)}
                className="flex w-full h-full min-h-[150px] flex-col items-center justify-center space-y-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors group"
              >
                <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-sm">{t("Agregar una tarea")}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pie de columna con botón de agregar cuando hay tareas */}
      {!column.isCollapsed && column.tasks.length > 0 && !isCreatingTask && (
        <div className={`p-3 border-t ${columnColors.border}`}>
          <button
            onClick={() => setIsCreatingTask(true)}
            className="flex items-center justify-center space-x-2 w-full py-2 px-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:bg-opacity-50 rounded-md transition-colors group"
          >
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-sm">{t("Agregar tarea")}</span>
          </button>
        </div>
      )}
    </div>
  );
};