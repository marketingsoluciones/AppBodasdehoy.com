import { FC, HTMLAttributes, useEffect, useRef, useState, useCallback, memo, Dispatch, SetStateAction } from "react";
import { EventContextProvider } from "../../../context/EventContext";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { AuthContextProvider } from "../../../context";
import { useTranslation } from 'react-i18next';
import { Comment, Itinerary, OptionsSelect, Task } from "../../../utils/Interfaces";
import { ViewItinerary } from "../../../pages/invitados";
import { TempPastedAndDropFile } from "../../Itinerario/MicroComponente/ItineraryPanel";
import { useToast } from "../../../hooks/useToast";
import { useAllowed } from '../../../hooks/useAllowed';
import { useServicePermissions } from '../../../hooks/useServicePermissions';
// Importar funciones utilitarias
import { sortCommentsByDate, haveCommentsChanged, } from './TaskNewUtils';
// Importar componentes
import { TaskSchemaView } from './TaskSchemaView';
import { TaskMinimalView } from './TaskMinimalView';
import { TaskFullView } from './TaskFullView';

// Tipos mejorados
interface TaskFormValues {
  _id: string;
  icon: string;
  fecha: string | Date;
  horaActiva: boolean;
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
  view: ViewItinerary;
  optionsItineraryButtonBox?: OptionsSelect[];
  showModalCompartir?: any;
  setShowModalCompartir?: any;
  tempPastedAndDropFiles?: TempPastedAndDropFile[];
  setTempPastedAndDropFiles?: any;
  isTaskPublic?: boolean;
  onUpdateComments?: (taskId: string, newComments: Comment[]) => void;
  onDeleteComment?: (commentId: string) => void;
  minimalView?: boolean;
  setSelectTask?: (taskId: string) => void;
  selectTask?: string;
  handleUpdate?: (field: string, value: any) => Promise<void>;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  gripDraggable?: boolean;
  onGripDragStart?: (e: React.DragEvent) => void;
}

export const TaskNew: FC<Props> = ({ itinerario, task, view, optionsItineraryButtonBox, showModalCompartir, setShowModalCompartir, tempPastedAndDropFiles, setTempPastedAndDropFiles, isTaskPublic = false, minimalView = false, setSelectTask, selectTask, handleUpdate, isExpanded, onToggleExpand, gripDraggable, onGripDragStart, ...props }) => {
  const { t } = useTranslation();
  const { config, user } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const [isAllowed, ht] = useAllowed();
  const { canEditTask } = useServicePermissions(itinerario?.viewers ?? [])
  const toast = useToast();
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const [previousCountComments, setPreviousCountComments] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);

  const canEdit = !user?.uid ? false : canEditTask()

  const [localTask, setLocalTask] = useState<TaskFormValues>({
    _id: task?._id,
    icon: task?.icon || '',
    fecha: task?.fecha || new Date(),
    horaActiva: task?.horaActiva || false,
    duracion: task?.duracion || 30,
    tags: task?.tags || [],
    descripcion: task?.descripcion || '',
    responsable: task?.responsable || [],
    tips: task?.tips || '',
    attachments: task?.attachments || [],
    spectatorView: task?.spectatorView ?? false,
    comments: task?.comments || [],
    commentsViewers: task?.commentsViewers || [],
    estatus: task?.estatus ?? false,
    estado: task?.estado || 'pending',
    prioridad: task?.prioridad || 'media'
  });

  useEffect(() => {
    setLocalTask({
      _id: task?._id,
      icon: task?.icon || '',
      fecha: task?.fecha || new Date(),
      duracion: task?.duracion || 30,
      horaActiva: task?.horaActiva || false,
      tags: Array.isArray(task?.tags) ? task?.tags : [],
      descripcion: task?.descripcion || '',
      responsable: Array.isArray(task?.responsable) ? task?.responsable : [],
      tips: task?.tips || '',
      attachments: Array.isArray(task?.attachments) ? task.attachments : [],
      spectatorView: task?.spectatorView ?? false,
      comments: Array.isArray(task?.comments) ? task?.comments : [],
      commentsViewers: Array.isArray(task?.commentsViewers) ? task.commentsViewers : [],
      estatus: task?.estatus ?? false,
      estado: task?.estado || 'pending',
      prioridad: task?.prioridad || 'media'
    });
  }, [task]);

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

  const handleDuplicate = async () => {
    if (!canEdit) {
      ht();
      return;
    }
    try {
      const fecha = new Date();
      // Forma CANÓNICA del adapter: { evento_id, development, task:{ itinerario_id, ...TareaInput } }.
      // (Antes usaba eventID + campos planos → mapVariables devolvía null → "adapter no pudo mapear".)
      // TareaInput NO tiene estado/prioridad, así que no se envían (el backend los rechazaría).
      const res: any = await fetchApiEventos({
        query: queries.createTask,
        variables: {
          evento_id: event._id,
          development: config.development || "bodasdehoy",
          task: {
            itinerario_id: itinerario._id,
            descripcion: `${localTask.descripcion || ''} (copia)`,
            fecha: fecha.toISOString(),
            duracion: localTask.duracion || 30,
            tags: Array.isArray(localTask.tags) ? localTask.tags.filter((x: any) => typeof x === 'string') : [],
            responsable: Array.isArray(localTask.responsable) ? localTask.responsable.filter((x: any) => typeof x === 'string') : [],
            tips: localTask.tips || '',
            ...(localTask.icon ? { icon: localTask.icon } : {}),
            ...((localTask as any).hora ? { hora: (localTask as any).hora, horaActiva: !!(localTask as any).horaActiva } : {}),
            ...(typeof localTask.spectatorView === 'boolean' ? { spectatorView: localTask.spectatorView } : {}),
          },
        },
        domain: config.domain
      });
      // El adapter devuelve { success, errors, task } (la última tarea creada).
      const created: any = res?.task || res;
      if (created && created._id) {
        toast('success', t('Tarea duplicada correctamente'));
        setEvent((oldEvent) => {
          const newEvent = { ...oldEvent };
          const itineraryIndex = newEvent.itinerarios_array.findIndex(it => it._id === itinerario._id);
          if (itineraryIndex !== -1) {
            newEvent.itinerarios_array[itineraryIndex] = {
              ...newEvent.itinerarios_array[itineraryIndex],
              tasks: [...(newEvent.itinerarios_array[itineraryIndex].tasks || []), created as Task],
            };
          }
          return newEvent;
        });
        if (setSelectTask && typeof created._id === 'string') {
          setSelectTask(created._id);
        }
      } else {
        toast('error', t('Error al duplicar la tarea'));
      }
    } catch (error) {
      console.error('Error al duplicar tarea:', error);
      toast('error', t('Error al duplicar la tarea'));
    }
  };

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

  return (
    view === "schema"
      ? <TaskSchemaView
        {...props}
        task={task}
        canEdit={canEdit}
        ht={ht}
        handleUpdate={handleUpdate}
      />
      : minimalView
        ? <TaskMinimalView
          {...props}
          task={task}
          itinerario={itinerario}
          canEdit={canEdit}
          handleUpdate={handleUpdate}
          optionsItineraryButtonBox={optionsItineraryButtonBox}
          isSelect={selectTask === task._id}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onDuplicate={handleDuplicate}
          gripDraggable={gripDraggable}
          onGripDragStart={onGripDragStart}
        />
        : view === "cards" || view === "kanban"
          ? <TaskFullView
            {...props}
            task={task}
            itinerario={itinerario}
            canEdit={canEdit}
            handleUpdate={handleUpdate}
            handleDuplicate={handleDuplicate}
            handleDeleteComment={handleDeleteComment}
            ht={ht}
            optionsItineraryButtonBox={optionsItineraryButtonBox}
            tempPastedAndDropFiles={tempPastedAndDropFiles}
            setTempPastedAndDropFiles={setTempPastedAndDropFiles}
            selectTask={selectTask}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
          />
          : null
  )
};

TaskNew.displayName = 'TaskNew';

export default TaskNew;