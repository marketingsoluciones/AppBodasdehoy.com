import React, { useCallback, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { TaskCard } from './TaskCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BoardColumn as IBoardColumn } from './BoardView';
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

  const {
    attributes,
    listeners,
    setNodeRef,
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Crear nueva tarea
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
        estado: column.id, // Importante: usar el ID de la columna actual
        prioridad: 'media',
        icon: '',
        comments: [],
        commentsViewers: []
      };

      console.log('Creando tarea en columna:', column.id, newTask);
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
      handleCreateTask();
    } else if (e.key === 'Escape') {
      handleCancelCreate();
    }
  }, [handleCreateTask, handleCancelCreate]);

  // Exportar tareas de la columna
  const handleExportColumn = useCallback(() => {
    const exportData = {
      columna: column.title,
      fecha: new Date().toISOString(),
      tareas: column.tasks.map(task => ({
        titulo: task.descripcion,
        responsable: task.responsable,
        prioridad: task.prioridad,
        estado: task.estatus ? 'Completado' : 'Pendiente',
        fecha: task.fecha,
        tags: task.tags
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `columna-${column.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(t('Columna exportada'));
    setShowColumnMenu(false);
  }, [column, t]);

  // Duplicar columna
  const handleDuplicateColumn = useCallback(() => {
    toast.info(t('Función de duplicar columna en desarrollo'));
    setShowColumnMenu(false);
  }, [t]);

  // Obtener el color de la columna
  const columnColors = column.colorConfig || {
    bg: column.color?.split(' ')[0] || 'bg-gray-50',
    border: column.color?.split(' ')[1] || 'border-gray-300',
    text: 'text-gray-700'
  };

  const isCompact = viewMode === 'compact';
  const isList = viewMode === 'list';

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
        h-full min-h-0
      `}
      {...attributes}
    >
      {/* Header de la columna mejorado */}
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
          
        {/* titulo y Ícono de la columna */}
          <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${column.bgColor}`}>
          {/* Ícono de la columna */}
          {column.icon && (
            <div className={columnColors.text}>
              {column.icon}
            </div>
          )}
          {/* titulo de la columna */}
          <h3 className={`font-medium select-none ${columnColors.text}`}>
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
              onClick={() => {
                console.log('Iniciando creación de tarea en columna:', column.id);
                setIsCreatingTask(true);
              }}
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
{/*                   <button
                    onClick={() => {
                      // Implementar configuración de columna
                      setShowColumnMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    {t("Configurar columna")}
                  </button> */}
                  
                  {onToggleVisibility && (
                    <button
                      onClick={() => {
                        onToggleVisibility();
                        setShowColumnMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <EyeOff className="w-4 h-4 mr-3" />
                      {t("Ocultar columna")}
                    </button>
                  )}
                  
{/*                   <button
                    onClick={handleDuplicateColumn}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4 mr-3" />
                    {t("Duplicar columna")}
                  </button> */}
                  
                  <button
                    onClick={handleExportColumn}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Download className="w-4 h-4 mr-3" />
                    {t("Exportar columna")}
                  </button>
                  
                  <div className="border-t border-gray-200 my-1"></div>
                  
                  {onDeleteColumn && (
                    <button
                      onClick={() => {
                        if (window.confirm(t('¿Estás seguro de eliminar esta columna?'))) {
                          onDeleteColumn();
                          setShowColumnMenu(false);
                        }
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-[#ff2525] hover:bg-[#fff0f0]"
                    >
                      <Trash2 className="w-4 h-4 mr-3" />
                      {t("Eliminar columna")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido de la columna */}
      {!column.isCollapsed && (
        <div           className={`
            flex-1 w-full max-h-full min-h-0 p-3 space-y-3 overflow-y-auto
            ${isCompact ? 'max-h-72' : 'max-h-96'}
            ${isList ? 'max-h-full' : ''}
          `}
          style={{ height: '100%' }} // <-- Fuerza el alto máximo
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
                  className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t("Crear")}
                </button>
              </div>
            </div>
          )}

          {/* Lista de tareas */}
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
                  onTaskClick={onTaskClick}
                  onTaskUpdate={onTaskUpdate}
                  onTaskDelete={onTaskDelete}
                  onCreateSubTask={onCreateSubTask}
                  isSelected={selectedTask === task._id}
                  isDragging={false}
                  itinerario={itinerario}
                />
              ))}
          </SortableContext>



          {/* Botón para agregar tarea (cuando no está colapsada y no hay tareas) */}
          {column.tasks.length === 0 && !isCreatingTask && (
            <button
              onClick={() => setIsCreatingTask(true)}
              className="flex w-full flex-col items-center space-y-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors group px-6 py-4 mx-auto"
            >
              <div className="flex flex-col items-center space-y-2">
                <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-sm">{t("Agregar una tarea")}</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Pie de columna con botón de agregar cuando no está colapsada */}
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