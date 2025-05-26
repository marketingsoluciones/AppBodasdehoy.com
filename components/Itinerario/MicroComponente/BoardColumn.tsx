import React, { useCallback, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Settings,
} from 'lucide-react';
import { Task, Itinerary } from '../../../utils/Interfaces';
import { TaskCard } from './TaskCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BoardColumn as IBoardColumn } from './BoardView';

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
}) => {
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

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

// Crear un estado separado para el seguimiento de columnas
const [taskColumnMap, setTaskColumnMap] = useState<Record<string, string>>({});

// Modificar la función handleCreateTask
const handleCreateTask = useCallback(() => {
  if (newTaskTitle.trim()) {
    const newTask = {
      descripcion: newTaskTitle.trim(),
      fecha: new Date(),
      duracion: 30,
      responsable: [],
      tags: [],
      attachments: [],
      tips: '',
      spectatorView: true,
      estatus: false,
      estado: column.id, // Asignar el ID de la columna como estado
      prioridad: 'media',
      icon: '',
      comments: [],
      commentsViewers: [],
      _id: ''
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
      handleCreateTask();
    } else if (e.key === 'Escape') {
      handleCancelCreate();
    }
  }, [handleCreateTask, handleCancelCreate]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col w-80 bg-white rounded-lg shadow-sm border ${
        column.color || 'border-gray-200'
      } ${isDragging ? 'shadow-lg' : ''}`}
      {...attributes}
    >
      {/* Header de la columna */}
      <div
        {...listeners}
        className="flex items-center justify-between p-3 border-b border-gray-200 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {column.isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          <h3 className="font-semibold text-gray-800 select-none">
            {column.title}
          </h3>
          
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full select-none">
            {column.tasks.length}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsCreatingTask(true)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Agregar tarea"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Opciones de columna"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {showColumnMenu && (
              <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      // Implementar edición de columna
                      setShowColumnMenu(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar columna
                  </button>
                  <button
                    onClick={() => {
                      // Implementar eliminación de columna
                      setShowColumnMenu(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Eliminar columna
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido de la columna */}
      {!column.isCollapsed && (
        <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-96">
          {/* Formulario para crear nueva tarea */}
          {isCreatingTask && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Título de la tarea..."
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <div className="flex items-center justify-end space-x-2 mt-2">
                <button
                  onClick={handleCancelCreate}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim()}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear
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
              className="w-full py-8 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
            >
              <div className="flex flex-col items-center space-y-2">
                <Plus className="w-6 h-6" />
                <span className="text-sm">Agregar una tarea</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Pie de columna con botón de agregar cuando no está colapsada */}
      {!column.isCollapsed && column.tasks.length > 0 && !isCreatingTask && (
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setIsCreatingTask(true)}
            className="flex items-center space-x-2 w-full py-2 px-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Agregar tarea</span>
          </button>
        </div>
      )}
    </div>
  );
};