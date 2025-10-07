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
}

export const TaskNew: FC<Props> = ({ itinerario, task, view, optionsItineraryButtonBox, showModalCompartir, setShowModalCompartir, tempPastedAndDropFiles, setTempPastedAndDropFiles, isTaskPublic = false, minimalView = false, setSelectTask, selectTask, handleUpdate, ...props }) => {
  const { t } = useTranslation();
  const { config, user } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const [isAllowed, ht] = useAllowed();
  const toast = useToast();
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const [previousCountComments, setPreviousCountComments] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);

  const canEdit = !user?.uid ? false : isAllowed() || task.responsable?.includes(user?.uid);

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
    spectatorView: task?.spectatorView !== undefined ? task?.spectatorView : false,
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
      spectatorView: task?.spectatorView ?? true,
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
      const response = await fetchApiEventos({
        query: queries.createTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          descripcion: `${localTask.descripcion} (copia)`,
          fecha: fecha.toISOString(),
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
        if (setSelectTask && response._id && typeof response._id === 'string') {
          setSelectTask(response._id);
        }
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
          />
          : null
  )
};

TaskNew.displayName = 'TaskNew';

export default TaskNew;