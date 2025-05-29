import React, { useState, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// En TaskCard.tsx, verifica la importación
import { TaskEditModal } from './TaskEditModal';
import {
  Check,
  PlusCircle,
  Edit3,
  MoreHorizontal,
  Calendar,
  Clock,
  User,
  Tag,
  Paperclip,
  AlertCircle,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { Task, Itinerary } from '../../../utils/Interfaces';
import { ImageAvatar } from '../../Utils/ImageAvatar';
import { GruposResponsablesArry } from '../MicroComponente/ResponsableSelector';
import { PriorityBadge, Priority } from './PriorityBadge'


interface TaskCardProps {
  task: Task;
  onTaskClick: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onCreateSubTask: (taskId: string) => void;
  isSelected: boolean;
  isDragging: boolean;
  itinerario: Itinerary;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
  onCreateSubTask,
  isSelected,
  isDragging,
  itinerario,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  // Agregar el estado para el modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);



  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  // Determinar el estado de completado
  const isCompleted = task.estatus === true;
  const isBlocked = task.estatus === true;

// Función para alternar completado
const handleToggleComplete = useCallback((e: React.MouseEvent) => {
  e.stopPropagation();
  onTaskUpdate(task._id, {
    estatus: !task.estatus
  });
}, [task._id, task.estatus, onTaskUpdate]);

  // Función para crear sub-tarea
  const handleCreateSubTask = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateSubTask(task._id);
    setShowActions(false);
  }, [task._id, onCreateSubTask]);

  // Modificar el handleEdit
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
    setShowActions(false);
  }, []);

  // Función para mostrar más opciones
  const handleMoreOptions = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoreMenu(!showMoreMenu);
    setShowActions(false);
  }, [showMoreMenu]);

  // Obtener información del responsable
  const getResponsableInfo = useCallback((responsableTitle: string) => {
    return GruposResponsablesArry.find(group =>
      group.title.toLowerCase() === responsableTitle.toLowerCase()
    ) || null;
  }, []);

  // Formatear fecha
  const formatDate = useCallback((dateString: string | Date) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  }, []);

  // Calcular días restantes
  const getDaysRemaining = useCallback(() => {
    if (!task.fecha) return null;
    const today = new Date();
    const taskDate = new Date(task.fecha);
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [task.fecha]);

  const daysRemaining = getDaysRemaining();
  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const isDueSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3;

  // Agregar funciones auxiliares para manejar prioridades
const getPriorityTag = (tags: string[]): string | undefined => {
  return tags.find(tag => tag.startsWith('prioridad:'));
};

const updatePriority = (taskId: string, priority: string) => {
  const newTags = [...task.tags.filter(tag => !tag.startsWith('prioridad:')), `prioridad:${priority}`];
  onTaskUpdate(taskId, { tags: newTags });
};


// Funciones auxiliares para manejar subtareas
const getSubtaskInfo = (tags: string[]) => {
  const subtaskTags = tags.filter(tag => tag.startsWith('subtask:'));
  const total = subtaskTags.length;
  const completed = subtaskTags.filter(tag => tag.includes(':completed')).length;
  
  return {
    hasSubtasks: total > 0,
    total,
    completed
  };
};

// Función para asegurar que la prioridad sea válida
const getValidPriority = (priority: string | undefined): Priority => {
  if (priority === 'alta' || priority === 'media' || priority === 'baja') {
    return priority;
  }
  return 'media'; // valor por defecto
};

  return (
    <>
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative group cursor-grab active:cursor-grabbing rounded-lg border transition-all duration-200
        ${isSelected 
          ? 'border-primary shadow-md ring-2 ring-pink-200' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
        ${isCompleted ? 'bg-green-50' : 'bg-white'}
        ${isBlocked ? 'bg-red-50' : ''}
        ${isDragging || isSortableDragging ? 'rotate-2 shadow-lg' : ''}
      `}
      onClick={() => onTaskClick(task._id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowMoreMenu(false);
      }}
    >
      {/* Botones de acción en hover */}
      {showActions && !isDragging && !isSortableDragging && (
        <div className="absolute top-2 right-2 flex items-center space-x-1 z-10">
          {/* Botón de completar */}
          <button
            onClick={handleToggleComplete}
            className={`
              p-1 rounded-md transition-colors
              ${isCompleted 
                ? 'text-green-600 hover:bg-green-100' 
                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
              }
            `}
            title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>

          {/* Botón de sub-tarea */}
          <button
            onClick={handleCreateSubTask}
            className="p-1 text-gray-400 hover:text-primary hover:bg-pink-50 rounded-md transition-colors"
            title="Crear sub-tarea"
          >
            <PlusCircle className="w-4 h-4" />
          </button>

          {/* Botón de editar */}
          <button
            onClick={handleEdit}
            className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
            title="Editar tarea"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Botón de más opciones */}
          <div className="relative">
            <button
              onClick={handleMoreOptions}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Más opciones"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

             {/* Modificar el menú de opciones */}
            {showMoreMenu && (
              <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                <div className="py-1">
                  {/* <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updatePriority(task._id, 'alta');
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Prioridad alta
                  </button> */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Implementar duplicar tarea
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Duplicar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskDelete(task._id);
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Contenido principal de la tarjeta */}
      <div className="p-3">
        {/* Título de la tarea */}
        <h4 className={`
          font-medium text-sm mb-2 pr-8
          ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}
        `}>
          {task.descripcion || 'Sin título'}
        </h4>

        {/* Indicadores de estado */}
        <div className="flex items-center space-x-2 mb-2">
          {/* Prioridad */}
          <PriorityBadge 
            priority={getValidPriority(task.prioridad)}
            onClick={() => {
              setShowPriorityMenu(!showPriorityMenu);
            }}
          />
          
          {showPriorityMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
              {(['baja', 'media', 'alta'] as Priority[]).map((priority) => (
                <button
                  key={priority}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskUpdate(task._id, { prioridad: priority });
                    setShowPriorityMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <PriorityBadge priority={priority} className="w-full" />
                </button>
              ))}
            </div>
          )}

          {/* Indicador de bloqueo */}
          {isBlocked && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              Bloqueado
            </span>
          )}

{/* Indicador de prioridad */}
{getPriorityTag(task.tags)?.split(':')[1] === 'alta' && (
  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
    Alta
  </span>
)}

          {/* Indicador de fecha */}
          {daysRemaining !== null && (
            <span className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs
              ${isOverdue 
                ? 'bg-red-100 text-red-800' 
                : isDueSoon 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600'
              }
            `}>
              <Calendar className="w-3 h-3 mr-1" />
              {isOverdue 
                ? `${Math.abs(daysRemaining)} días atrasado`
                : daysRemaining === 0
                  ? 'Hoy'
                  : `${daysRemaining} días`
              }
            </span>
          )}
        </div>

        {/* Información adicional */}
        <div className="space-y-2">
          {/* Responsables */}
          {task.responsable && task.responsable.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.responsable.map((resp, index) => (
                <div
                  key={index}
                  className="flex items-center bg-gray-100 rounded-full px-2 py-1"
                >
                  <div className="w-4 h-4 rounded-full overflow-hidden mr-1">
                    {getResponsableInfo(resp)?.icon ? (
                      <img
                        src={getResponsableInfo(resp).icon}
                        alt={resp}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center text-[10px] text-gray-600">
                        {resp.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">{resp}</span>
                </div>
              ))}
            </div>
          )}

          {/* Duración */}
          {task.duracion && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{task.duracion} min</span>
            </div>
          )}

          {/* Etiquetas */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              <Tag className="w-3 h-3 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {task.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-pink-100 text-primary rounded"
                  >
                    {tag}
                  </span>
                ))}
                {task.tags.length > 2 && (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    +{task.tags.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Adjuntos */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Paperclip className="w-3 h-3" />
              <span>{task.attachments.length} archivo{task.attachments.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

{/* Sub-tareas (usando tags) */}
{(() => {
  const subtaskInfo = getSubtaskInfo(task.tags);
  return subtaskInfo.hasSubtasks && (
    <div className="mt-2 pt-2 border-t border-gray-100">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Sub-tareas</span>
        <span>
          {subtaskInfo.completed}/{subtaskInfo.total}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-300"
          style={{
            width: `${(subtaskInfo.completed / subtaskInfo.total) * 100}%`
          }}
        />
      </div>
    </div>
  );
})()}
      </div>
    </div>

    {showEditModal && (
      <TaskEditModal
        task={task}
        onSave={onTaskUpdate}
        onClose={() => setShowEditModal(false)}
        itinerario={itinerario}
      />
    )}
    </>
  );
};