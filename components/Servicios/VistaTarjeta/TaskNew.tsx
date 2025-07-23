import { FC, HTMLAttributes, useEffect, useRef, useState, useCallback, memo } from "react";
import { EventContextProvider } from "../../../context/EventContext";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { AuthContextProvider } from "../../../context";
import { useTranslation } from 'react-i18next';
import { Comment, Itinerary, OptionsSelect, Task } from "../../../utils/Interfaces";
import { ViewItinerary } from "../../../pages/invitados";
import { useRouter } from "next/router";
import { TempPastedAndDropFile } from "../../Itinerario/MicroComponente/ItineraryPanel";
import { useToast } from "../../../hooks/useToast";
import { useAllowed } from '../../../hooks/useAllowed';

// Importar funciones utilitarias
import {
  formatTime,
  sortCommentsByDate,
  haveCommentsChanged
} from './TaskNewUtils';

// Importar componentes
import { TaskSchemaView } from './TaskSchemaView';
import { TaskMinimalView } from './TaskMinimalView';
import { TaskFullView } from './TaskFullView';

// Tipos mejorados
interface TaskFormValues {
  _id: string;
  icon: string;
  fecha: string | Date;
  hora: string;
  duracion: string | number;
  tags: string[];
  descripcion: string;
  responsable: string[];
  tips: string;
  attachments: any[];
  spectatorView: boolean;
  comments: Comment[];
  commentsViewers: any[];
  estatus: boolean;
  estado: string;
  prioridad: string;
}

interface Props extends HTMLAttributes<HTMLDivElement> {
  itinerario: Itinerary;
  task: Task;
  view?: ViewItinerary;
  optionsItineraryButtonBox?: OptionsSelect[];
  isSelect?: boolean;
  showModalCompartir?: any;
  setShowModalCompartir?: any;
  tempPastedAndDropFiles?: TempPastedAndDropFile[];
  setTempPastedAndDropFiles?: any;
  isTaskPublic?: boolean;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onUpdateComments?: (taskId: string, newComments: Comment[]) => void;
  onDeleteComment?: (commentId: string) => void;
  minimalView?: boolean;
}

export const TaskNew: FC<Props> = memo(({
  itinerario,
  task,
  view,
  optionsItineraryButtonBox,
  isSelect = false,
  showModalCompartir,
  setShowModalCompartir,
  tempPastedAndDropFiles,
  setTempPastedAndDropFiles,
  isTaskPublic = false,
  minimalView = false,
  ...props
}) => {
  const { t } = useTranslation();
  const { config, user, geoInfo } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const [isAllowed, ht] = useAllowed();
  const toast = useToast();
  const router = useRouter();
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const [previousCountComments, setPreviousCountComments] = useState(0);

  // Estados para la edición
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [localTask, setLocalTask] = useState<TaskFormValues>({
    _id: task?._id,
    icon: task?.icon || '',
    fecha: task?.fecha || new Date(),
    hora: '',
    duracion: task?.duracion || 30,
    tags: task?.tags || [],
    descripcion: task?.descripcion || '',
    responsable: task?.responsable || [],
    tips: task?.tips || '',
    attachments: task?.attachments || [],
    spectatorView: task?.spectatorView !== undefined ? task?.spectatorView : false,
    comments: task?.comments || [],
    commentsViewers: task?.commentsViewers || [],
    estatus: task?.estatus ?? false,
    estado: task?.estado || 'pending',
    prioridad: task?.prioridad || 'media'
  });

  // Estados para dropdowns y selectores
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [editingResponsable, setEditingResponsable] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  // Estados para descripción personalizada
  const [customDescription, setCustomDescription] = useState(task?.tips || '');
  const [tempIcon, setTempIcon] = useState(task?.icon || '');
  const [comments, setComments] = useState<Comment[]>([]);
  const [tempResponsable, setTempResponsable] = useState<string[]>([]);
  // Verificar permisos
  const hasEditPermission = isAllowed();
  const canEdit = hasEditPermission || task.responsable?.includes(user?.uid);

  // Efecto para sincronizar con la tarea
  useEffect(() => {
    setLocalTask({
      _id: task?._id,
      icon: task?.icon || '',
      fecha: task?.fecha || new Date(),
      hora: '',
      duracion: task?.duracion || 30,
      tags: Array.isArray(task?.tags) ? task?.tags : [],
      descripcion: task?.descripcion || '',
      responsable: Array.isArray(task?.responsable) ? task?.responsable : [],
      tips: task?.tips || '',
      attachments: Array.isArray(task?.attachments) ? task.attachments : [],
      spectatorView: task?.spectatorView ?? true,
      comments: Array.isArray(task?.comments) ? task?.comments : [],
      commentsViewers: Array.isArray(task?.commentsViewers) ? task.commentsViewers : [],
      estatus: task?.estatus ?? false,
      estado: task?.estado || 'pending',
      prioridad: task?.prioridad || 'media'
    });
    setCustomDescription(task?.tips || '');
    setTempIcon(task?.icon || '');
    setTempResponsable(Array.isArray(task?.responsable) ? task.responsable : []);
  }, [task]);

  // Efecto para ordenar comentarios
  useEffect(() => {
    if (task?.comments && Array.isArray(task?.comments)) {
      const sortedComments = sortCommentsByDate(task?.comments);
      
      setComments(prevComments => {
        if (haveCommentsChanged(prevComments, sortedComments)) {
          return sortedComments;
        }
        return prevComments;
      });
    }
  }, [task?.comments]);

  // Auto-scroll al agregar nuevos comentarios
  useEffect(() => {
    if (comments.length > previousCountComments && commentsContainerRef.current) {
      setTimeout(() => {
        commentsContainerRef.current?.scrollTo({
          top: commentsContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
    setPreviousCountComments(comments.length);
  }, [comments, previousCountComments]);

  // Efecto para sincronizar comentarios desde el evento global
  useEffect(() => {
    if (event?.itinerarios_array) {
      const currentItinerary = event.itinerarios_array.find(it => it._id === itinerario._id);
      if (currentItinerary) {
        const currentTask = currentItinerary.tasks.find(t => t._id === task._id);
        if (currentTask && currentTask.comments) {
          const sortedComments = sortCommentsByDate(currentTask.comments);
          
          setComments(prevComments => {
            if (haveCommentsChanged(prevComments, sortedComments)) {
              return sortedComments;
            }
            return prevComments;
          });
        }
      }
    }
  }, [event?.itinerarios_array, itinerario?._id, task?._id]);

  // Detectar cuando la pestaña se vuelve activa para actualizar
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const currentItinerary = event?.itinerarios_array?.find(it => it._id === itinerario._id);
        if (currentItinerary) {
          const currentTask = currentItinerary.tasks.find(t => t._id === task._id);
          if (currentTask?.comments) {
            setComments(sortCommentsByDate(currentTask.comments));
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [event, itinerario?._id, task?._id]);

  // Efecto para sincronizar adjuntos desde el evento global
  useEffect(() => {
    if (event?.itinerarios_array) {
      const currentItinerary = event.itinerarios_array.find(it => it._id === itinerario._id);
      if (currentItinerary) {
        const currentTask = currentItinerary.tasks.find(t => t._id === task._id);
        if (currentTask) {
          setLocalTask(prev => {
            const prevAttachmentIds = (prev.attachments || []).map(a => a._id).sort().join(',');
            const newAttachmentIds = (currentTask.attachments || []).map(a => a._id).sort().join(',');

            if (prevAttachmentIds !== newAttachmentIds ||
              prev.attachments?.length !== currentTask.attachments?.length) {
              return {
                ...prev,
                attachments: currentTask.attachments || []
              };
            }

            const hasChanges = (currentTask.attachments || []).some((newAttachment, index) => {
              const oldAttachment = prev.attachments?.[index];
              return !oldAttachment ||
                oldAttachment._id !== newAttachment._id ||
                oldAttachment.name !== newAttachment.name ||
                oldAttachment.size !== newAttachment.size;
            });

            if (hasChanges) {
              return {
                ...prev,
                attachments: currentTask.attachments || []
              };
            }

            return prev;
          });
        }
      }
    }
  }, [event?.itinerarios_array, itinerario?._id, task?._id]);

  // Función para manejar actualización de campos
const handleUpdate = async (fieldName: string, value: any) => {
  if (!canEdit) {
    ht();
    return;
  }
  try {
    let apiValue: string;

    if (['responsable', 'tags', 'attachments'].includes(fieldName)) {
      apiValue = JSON.stringify(value || []);
    } else if (fieldName === 'duracion') {
      apiValue = String(value || "0");
    } else if (fieldName === 'fecha' && value) {
      // Manejar fecha para evitar problemas de zona horaria
      if (value instanceof Date) {
        apiValue = value.toISOString();
      } else if (typeof value === 'string' && value.includes('-')) {
        // Si viene en formato YYYY-MM-DD
        const [year, month, day] = value.split('-');
        const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
        apiValue = localDate.toISOString();
      } else {
        apiValue = new Date(value).toISOString();
      }
    } else if (fieldName === 'spectatorView') {
      apiValue = `${value}`;
    } else {
      apiValue = String(value || "");
    }

    await fetchApiEventos({
      query: queries.editTask,
      variables: {
        eventID: event._id,
        itinerarioID: itinerario._id,
        taskID: task._id,
        variable: fieldName,
        valor: apiValue,
      },
      domain: config.domain,
    }).then((result) => {
      const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id);
      const f2 = event.itinerarios_array[f1].tasks.findIndex(elem => elem._id === task._id);
      if (fieldName === 'spectatorView') {
        event.itinerarios_array[f1].tasks[f2].spectatorView = value;
        setEvent({ ...event });
      } else {
        event.itinerarios_array[f1].tasks[f2][fieldName] = value;
        setEvent({ ...event });
      }
    });
    
    setLocalTask(prev => ({ ...prev, [fieldName]: value }));
    toast("success", t("Campo actualizado"));
  } catch (error) {
    console.error('Error al actualizar:', error);
    toast("error", t("Error al actualizar"));
  }
};

  // Manejadores de edición de campos
  const handleFieldClick = (fieldName: string, currentValue: any) => {
    if (!canEdit) {
      ht();
      return;
    }
    setEditingField(fieldName);
    setTempValue(String(currentValue || ''));
  };

const handleFieldSave = async (fieldName: string) => {
  if (fieldName === 'fecha' && tempValue) {
    // Para fechas, crear un Date object que preserve la fecha local
    const [year, month, day] = tempValue.split('-');
    const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    await handleUpdate(fieldName, localDate);
  } else if (tempValue !== String(localTask[fieldName] || '')) {
    await handleUpdate(fieldName, tempValue);
  }
  setEditingField(null);
  setTempValue('');
};

  const handleKeyPress = (e: React.KeyboardEvent, fieldName: string) => {
    if (e.key === 'Enter') {
      handleFieldSave(fieldName);
    } else if (e.key === 'Escape') {
      setEditingField(null);
      setTempValue('');
    }
  };

  // Manejador de cambio de ícono
  const handleIconChange = (newIcon: string) => {
    if (!canEdit) {
      ht();
      return;
    }
    setTempIcon(newIcon);
    handleUpdate('icon', newIcon);
    setShowIconSelector(false);
  };

  // Función para cancelar edición
  const handleFieldCancel = () => {
    setEditingField(null);
    setTempValue('');
  };

  // Función para agregar etiqueta
  const handleAddTag = (newTag: string) => {
    if (!canEdit) {
      ht();
      return;
    }
    const updatedTags = [...(localTask.tags || []), newTag];
    handleUpdate('tags', updatedTags);
    setEditingField(null);
  };

  // Función para eliminar etiqueta
  const handleRemoveTag = (tagToRemove: string) => {
    if (!canEdit) {
      ht();
      return;
    }
    const updatedTags = (localTask.tags || []).filter(tag => tag !== tagToRemove);
    handleUpdate('tags', updatedTags);
  };

  // Función para duplicar tarea
  const handleDuplicate = async () => {
    if (!canEdit) {
      ht();
      return;
    }

    try {
      const fecha = new Date();
      const response = await fetchApiEventos({
        query: queries.createTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          descripcion: `${localTask.descripcion} (copia)`,
          fecha: fecha.toISOString(),
          hora: formatTime(fecha),
          duracion: localTask.duracion || 30,
          tags: JSON.stringify(localTask.tags || []),
          responsable: JSON.stringify(localTask.responsable || []),
          tips: localTask.tips || '',
          estado: localTask.estado || 'pending',
          prioridad: localTask.prioridad || 'media'
        },
        domain: config.domain
      });

      if (response && typeof response === 'object' && '_id' in response) {
        toast('success', t('Tarea duplicada correctamente'));
        setEvent((oldEvent) => {
          const newEvent = { ...oldEvent };
          const itineraryIndex = newEvent.itinerarios_array.findIndex(it => it._id === itinerario._id);
          if (itineraryIndex !== -1) {
            newEvent.itinerarios_array[itineraryIndex].tasks.push(response as Task);
          }
          return newEvent;
        });
      }
    } catch (error) {
      console.error('Error al duplicar tarea:', error);
      toast('error', t('Error al duplicar la tarea'));
    }
  };

  // Función para copiar enlace
  const handleCopyLink = (task: Task) => {
    const link = `${window.location.origin}/servicios?event=${event?._id}&itinerary=${itinerario?._id}&task=${task?._id}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        toast('success', t('Enlace copiado al portapapeles'));
      }).catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast('success', t('Enlace copiado al portapapeles'));
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast('success', t('Enlace copiado al portapapeles'));
    }
  };

  // Función para manejar la eliminación de comentarios
  const handleDeleteComment = async (commentId: string) => {
    if (!canEdit) {
      ht();
      return;
    }

    try {
      await fetchApiEventos({
        query: queries.deleteComment,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: task._id,
          commentID: commentId,
        },
        domain: config.domain,
      });

      const updatedComments = comments.filter(comment => comment._id !== commentId);
      setComments(updatedComments);

      setEvent((oldEvent) => {
        const newEvent = { ...oldEvent };
        const itineraryIndex = newEvent.itinerarios_array.findIndex(it => it._id === itinerario._id);
        if (itineraryIndex > -1) {
          const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks.findIndex(t => t._id === task._id);
          if (taskIndex > -1) {
            newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex].comments = updatedComments;
          }
        }
        return newEvent;
      });

      await fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: task._id,
          variable: "comments",
          valor: JSON.stringify(updatedComments),
        },
        domain: config.domain,
      });

      toast("success", t("Comentario eliminado"));
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      toast("error", t("Error al eliminar comentario"));
    }
  };

  // Función para manejar la actualización de comentarios
  const handleUpdateComments = useCallback((taskId: string, newComments: Comment[]) => {
    setEvent((oldEvent) => {
      const newEvent = { ...oldEvent };
      const itineraryIndex = newEvent.itinerarios_array.findIndex(it => it._id === itinerario._id);
      if (itineraryIndex > -1) {
        const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks.findIndex(t => t._id === taskId);
        if (taskIndex > -1) {
          newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex].comments = newComments;
        }
      }
      return newEvent;
    });
  }, [itinerario?._id, setEvent]);

  const handleCommentAdded = useCallback((newComment: Comment) => {
    setComments(prevComments => {
      const exists = prevComments.some(c => c._id === newComment._id);
      if (exists) return prevComments;

      const updatedComments = sortCommentsByDate([...prevComments, newComment]);
      return updatedComments;
    });

    setLocalTask(prev => ({
      ...prev,
      comments: [...(prev.comments || []), newComment]
    }));
  }, []);

  // Vista schema
  if (view === "schema" && localTask.spectatorView) {
    return (
      <TaskSchemaView
        {...props}
        task={task}
        localTask={localTask}
        tempIcon={tempIcon}
        canEdit={canEdit}
        showIconSelector={showIconSelector}
        setShowIconSelector={setShowIconSelector}
        handleIconChange={handleIconChange}
        ht={ht}
      />
    );
  }

  // Vista minimal
  if (minimalView) {
    return (
      <TaskMinimalView
        {...props}
        task={task}
        itinerario={itinerario}
        localTask={localTask}
        tempIcon={tempIcon}
        canEdit={canEdit}
        showIconSelector={showIconSelector}
        setShowIconSelector={setShowIconSelector}
        handleIconChange={handleIconChange}
        handleUpdate={handleUpdate}
        handleFieldClick={handleFieldClick}
        handleFieldSave={handleFieldSave}
        handleKeyPress={handleKeyPress}
        handleFieldCancel={handleFieldCancel}
        handleAddTag={handleAddTag}
        handleRemoveTag={handleRemoveTag}
        ht={ht}
        editingField={editingField}
        tempValue={tempValue}
        setTempValue={setTempValue}
        editingResponsable={editingResponsable}
        setEditingResponsable={setEditingResponsable}
        tempResponsable={tempResponsable}
        setTempResponsable={setTempResponsable}
        editingDescription={editingDescription}
        setEditingDescription={setEditingDescription}
        customDescription={customDescription}
        setCustomDescription={setCustomDescription}
        optionsItineraryButtonBox={optionsItineraryButtonBox}
      />
    );
  }

  // Vista completa (por defecto)
  return (
    <TaskFullView
      {...props}
      task={task}
      itinerario={itinerario}
      localTask={localTask}
      tempIcon={tempIcon}
      canEdit={canEdit}
      showIconSelector={showIconSelector}
      setShowIconSelector={setShowIconSelector}
      handleIconChange={handleIconChange}
      handleUpdate={handleUpdate}
      handleFieldClick={handleFieldClick}
      handleFieldSave={handleFieldSave}
      handleKeyPress={handleKeyPress}
      handleFieldCancel={handleFieldCancel}
      handleAddTag={handleAddTag}
      handleRemoveTag={handleRemoveTag}
      handleDuplicate={handleDuplicate}
      handleCopyLink={handleCopyLink}
      handleDeleteComment={handleDeleteComment}
      handleCommentAdded={handleCommentAdded}
      ht={ht}
      editingField={editingField}
      tempValue={tempValue}
      setTempValue={setTempValue}
      setEditingField={setEditingField}
      editingResponsable={editingResponsable}
      setEditingResponsable={setEditingResponsable}
      tempResponsable={tempResponsable}
      setTempResponsable={setTempResponsable}
      editingDescription={editingDescription}
      setEditingDescription={setEditingDescription}
      customDescription={customDescription}
      setCustomDescription={setCustomDescription}
      comments={comments}
      setComments={setComments}
      optionsItineraryButtonBox={optionsItineraryButtonBox}
      tempPastedAndDropFiles={tempPastedAndDropFiles}
      setTempPastedAndDropFiles={setTempPastedAndDropFiles}
    />
  );
});

TaskNew.displayName = 'TaskNew';

export default TaskNew;