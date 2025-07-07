import { FC, HTMLAttributes, useEffect, useRef, useState, useCallback, memo } from "react";
import { SelectIcon, GruposResponsablesArry } from ".";
import { Formik, Form, Field } from 'formik';
import { EventContextProvider } from "../../../context/EventContext";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { AuthContextProvider } from "../../../context";
import { useTranslation } from 'react-i18next';
import { Comment, Itinerary, OptionsSelect, Task } from "../../../utils/Interfaces";
import { ViewItinerary } from "../../../pages/invitados";
import { getStorage, ref, listAll, deleteObject } from "firebase/storage";
import { ImageAvatar } from "../../Utils/ImageAvatar";
import { InputComments } from "./InputComments"
import { ListComments } from "./ListComments"
import ClickAwayListener from "react-click-away-listener";
import { useRouter } from "next/router";
import { TempPastedAndDropFile } from "./ItineraryPanel";
import { useToast } from "../../../hooks/useToast";
import { NewAttachmentsEditor } from "./NewAttachmentsEditor";
import { InputTags } from "../../Forms/InputTags";
import { MyEditor } from "./QuillText";
import { TASK_STATUSES, TASK_PRIORITIES } from './NewTypes';
import { ClickUpResponsableSelector } from './NewResponsableSelector';
import { NewSelectIcon } from './NewSelectIcon';
import { useAllowed } from '../../../hooks/useAllowed';
import {
  X, MessageSquare, Tag, Calendar, Clock, User, Flag, ChevronDown, Copy, Link, MoreHorizontal, Trash2, Archive, Bell, Plus, Eye, EyeOff, Lock, Unlock, AlertCircle, PlayCircle, StopCircle
} from 'lucide-react';
import { Interweave } from "interweave";
import { HashtagMatcher, UrlMatcher } from "interweave-autolink";

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

const stripHtml = (html: string): string => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

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

// Componente de Tooltip para mostrar información de permisos
const PermissionTooltip: FC<{ message: string; children: React.ReactNode }> = ({ message, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          {message}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2" />
        </div>
      )}
    </div>
  );
};

// Componente wrapper para elementos con permisos
const PermissionWrapper: FC<{
  hasPermission: boolean;
  showTooltip?: boolean;
  tooltipMessage?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ hasPermission, showTooltip = true, tooltipMessage, children, className = "" }) => {
  const { t } = useTranslation();
  const defaultMessage = t("No tienes permisos para editar");
  if (!hasPermission) {
    return (
      <div className={`relative ${className}`}>
        <div className="opacity-60 pointer-events-none">
          {children}
        </div>
        {showTooltip && (
          <PermissionTooltip message={tooltipMessage || defaultMessage}>
            <div className="absolute inset-0 cursor-not-allowed flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-gray-500" />
            </div>
          </PermissionTooltip>
        )}
      </div>
    );
  }
  return <div className={className}>{children}</div>;
};

// Conversor de minutos a formato legible
const minutesToReadableFormat = (minutes: number): string => {
  if (!minutes || minutes === 0) return "0 min";
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
};

// Conversor de formato legible a minutos
const readableFormatToMinutes = (value: string): number => {
  const hoursMatch = value.match(/(\d+)\s*h/);
  const minsMatch = value.match(/(\d+)\s*min/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const mins = minsMatch ? parseInt(minsMatch[1]) : 0;
  
  return hours * 60 + mins;
};

// Función para formatear fecha
const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString();
};

// Función para formatear hora
const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// NUEVA FUNCIÓN: Calcular hora de finalización
const calculateEndTime = (startDate: string | Date, durationMinutes: number): string => {
  if (!startDate || !durationMinutes) return '';
  const start = new Date(startDate);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return formatTime(end);
};

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
    _id: task._id,
    icon: task.icon || '',
    fecha: task.fecha || new Date(),
    hora: '',
    duracion: task.duracion || 30,
    tags: task.tags || [],
    descripcion: task.descripcion || '',
    responsable: task.responsable || [],
    tips: task.tips || '',
    attachments: task.attachments || [],
    spectatorView: task.spectatorView ?? true,
    comments: task.comments || [],
    commentsViewers: task.commentsViewers || [],
    estatus: task.estatus ?? false,
    estado: task.estado || 'pending',
    prioridad: task.prioridad || 'media'
  });

  // Estados para dropdowns y selectores
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [editingResponsable, setEditingResponsable] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationInput, setDurationInput] = useState('');

  // Estados para descripción personalizada
  const [customDescription, setCustomDescription] = useState(task?.tips || '');
  const [tempIcon, setTempIcon] = useState(task?.icon || '');
  const [comments, setComments] = useState<Comment[]>([]);
  const [tempResponsable, setTempResponsable] = useState<string[]>([]);

  // Verificar permisos
  const hasEditPermission = isAllowed();
  const canEdit = hasEditPermission || task.responsable?.includes(user?.uid);

  // Función para formatear texto con límite de líneas
  const formatTextWithLineLimit = (text: string, maxChars: number, maxLines: number) => {
    if (!text) return '';
    const lines = text.split('\n');
    const limitedLines = lines.slice(0, maxLines);
    return limitedLines.map(line => 
      line.length > maxChars ? line.substring(0, maxChars) + '...' : line
    ).join('\n');
  };

  // Estados y efectos mantenidos del código original
  const currentStatus = TASK_STATUSES.find(s => s.value === localTask.estado) || TASK_STATUSES[0];
  const currentPriority = TASK_PRIORITIES.find(p => p.value === localTask.prioridad) || TASK_PRIORITIES[1];

  // Efecto para sincronizar con la tarea
  useEffect(() => {
    setLocalTask({
      _id: task._id,
      icon: task.icon || '',
      fecha: task.fecha || new Date(),
      hora: '',
      duracion: task.duracion || 30,
      tags: Array.isArray(task.tags) ? task.tags : [],
      descripcion: task.descripcion || '',
      responsable: Array.isArray(task.responsable) ? task.responsable : [],
      tips: task.tips || '',
      attachments: Array.isArray(task.attachments) ? task.attachments : [],
      spectatorView: task.spectatorView ?? true,
      comments: Array.isArray(task.comments) ? task.comments : [],
      commentsViewers: Array.isArray(task.commentsViewers) ? task.commentsViewers : [],
      estatus: task.estatus ?? false,
      estado: task.estado || 'pending',
      prioridad: task.prioridad || 'media'
    });
    setCustomDescription(task.tips || '');
    setTempIcon(task.icon || '');
    // CORREGIDO: Inicializar tempResponsable correctamente
    setTempResponsable(Array.isArray(task.responsable) ? task.responsable : []);
  }, [task]);

  // Efecto para ordenar comentarios
useEffect(() => {
  if (task?.comments && Array.isArray(task.comments)) {
    const sortedComments = [...task.comments].sort((a, b) => {
      const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
    
    // Solo actualizar si hay cambios reales
    setComments(prevComments => {
      const prevIds = prevComments.map(c => c._id).sort().join(',');
      const newIds = sortedComments.map(c => c._id).sort().join(',');
      
      if (prevIds !== newIds) {
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



  // Función para manejar actualización de campos
  const handleUpdate = async (fieldName: string, value: any) => {
    if (!canEdit) {
      ht();
      return;
    }

    // En la función handleUpdate, agregar lógica especial para spectatorView
    if (fieldName === 'spectatorView') {
      // Si se está ocultando la tarea, notificar a otros usuarios
      if (!value) {
        // La tarea se está ocultando
        setEvent((oldEvent) => {
          const newEvent = { ...oldEvent };
          const itineraryIndex = newEvent.itinerarios_array.findIndex(it => it._id === itinerario._id);
          if (itineraryIndex > -1) {
            const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks.findIndex(t => t._id === task._id);
            if (taskIndex > -1) {
              newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex].spectatorView = false;
            }
          }
          return newEvent;
        });
      }
    }

    try {
      let apiValue: string;

      if (['responsable', 'tags', 'attachments'].includes(fieldName)) {
        apiValue = JSON.stringify(value || []);
      } else if (fieldName === 'duracion') {
        apiValue = String(value || "0");
      } else if (fieldName === 'fecha' && value) {
        const dateObj = new Date(value);
        apiValue = dateObj.toISOString();
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
      });

      setEvent((oldEvent) => {
        const newEvent = { ...oldEvent };
        const itineraryIndex = newEvent.itinerarios_array.findIndex(it => it._id === itinerario._id);
        if (itineraryIndex > -1) {
          const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks.findIndex(t => t._id === task._id);
          if (taskIndex > -1) {
            newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex][fieldName] = value;
          }
        }
        return newEvent;
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
    if (tempValue !== String(localTask[fieldName] || '')) {
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
      // Actualizar el evento global
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
  const link = `${window.location.origin}/services/servicios-${event?._id}-${itinerario?._id}-${task?._id}`;
  
  // Usar la API moderna del portapapeles con fallback
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(() => {
      toast('success', t('Enlace copiado al portapapeles'));
    }).catch(() => {
      // Fallback para navegadores antiguos
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast('success', t('Enlace copiado al portapapeles'));
    });
  } else {
    // Fallback directo
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
    // 1. Llama a la API para eliminar el comentario en el backend
    await fetchApiEventos({
      query: queries.deleteComment, // Asegúrate de tener esta query en tu backend
      variables: {
        eventID: event._id,
        itinerarioID: itinerario._id,
        taskID: task._id,
        commentID: commentId,
      },
      domain: config.domain,
    });

    // 2. Actualiza el estado local de comentarios
    const updatedComments = comments.filter(comment => comment._id !== commentId);
    setComments(updatedComments);

    // 3. Actualiza el estado global del evento
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

    // 4. (Opcional) Actualiza el backend con el nuevo array de comentarios si tu API lo requiere
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
  }, [itinerario._id, setEvent]);

  const handleCommentAdded = useCallback((newComment: Comment) => {
  // Actualizar el estado local de comentarios inmediatamente
  setComments(prevComments => {
    // Evitar duplicados
    const exists = prevComments.some(c => c._id === newComment._id);
    if (exists) return prevComments;
    
    // Agregar el nuevo comentario y ordenar por fecha
    const updatedComments = [...prevComments, newComment].sort((a, b) => {
      const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
    
    return updatedComments;
  });
  
  // También actualizar localTask
  setLocalTask(prev => ({
    ...prev,
    comments: [...(prev.comments || []), newComment]
  }));
}, []);

  // Vista schema
  if (view === "schema" && localTask.spectatorView) {
    return (
      <div {...props} className="w-full flex">
        <div className="flex w-[55%] md:w-[45%] lg:w-[40%] p-2 items-start justify-start border-t-[1px] border-r-[1px] border-primary border-dotted relative">
          <div className="w-12 h-12 md:w-16 md:h-16 md:min-w-16 flex items-center justify-center">
            {showIconSelector ? (
              <NewSelectIcon
                value={tempIcon}
                onChange={handleIconChange}
                onClose={() => setShowIconSelector(false)}
              />
            ) : (
              <button
                onClick={() => canEdit ? setShowIconSelector(true) : ht()}
                className={`w-full h-full flex items-center justify-center rounded-full transition-colors ${
                  canEdit ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                }`}
                title={canEdit ? "Cambiar ícono" : "No tienes permisos para editar"}
              >
                <Formik
                      initialValues={{ icon: tempIcon }}
                      onSubmit={(values) => {
                        handleIconChange(values.icon);
                      }}
                    >
                      {({ setFieldValue }) => (
                        <Form>
                          <Field name="icon">
                            {({ field }) => (
                              <SelectIcon
                                {...field}
                                name="icon"
                                value={field.value || tempIcon}
                                className="w-8 h-8"
                                handleChange={(value) => {
                                  setFieldValue('icon', value);
                                  handleIconChange(value);
                                }}
                                data={localTask}
                              />
                            )}
                          </Field>
                        </Form>
                      )}
                    </Formik>
              </button>
            )}
          </div>
          <div className="flex-1">
            <div className="inline-flex flex-col justify-start items-start">
              <span className="text-xl md:text-2xl text-gray-900">
                {localTask.fecha ? formatTime(localTask.fecha) : '00:00'}
              </span>
              <div className="w-full flex justify-end items-end text-xs -mt-1">
                <span>{t("duration")}</span>
                <span className="text-[12px] md:text-[14px] lg:text-[16px] text-center bg-transparent px-1">
                  {localTask.duracion}
                </span>
                <span>min</span>
              </div>
            </div>
            <div className="flex items-start space-x-2 font-title text-primary text-2xl">
              <div className="min-w-2 h-2 bg-primary rounded-full translate-y-2.5" />
              <strong className="leading-[1] mt-1">{localTask.descripcion}</strong>
            </div>
            <div className="grid grid-flow-dense w-full space-x-2 text-[12px] mt-2">
              <p>
                {t("responsible")}: {localTask.responsable.join(", ")}
              </p>
            </div>
          </div>
          <div className="bg-white w-3 h-3 rounded-full border-[1px] border-primary border-dotted absolute right-0 top-0 translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="flex-1 flex flex-col px-4 md:px-0 border-primary border-dotted w-[10%] md:w-[50%] border-t-[1px]">
          {!!localTask.tips && (
            <Interweave
              className="md:text-xs text-sm text-justify transition-all m-1 p-1 break-words"
              content={localTask.tips}
              matchers={[new UrlMatcher('url'), new HashtagMatcher('hashtag')]}
            />
          )}
        </div>
      </div>
    );
  }

  if (minimalView) {
    return (
      <div {...props} className="w-full bg-white rounded-lg shadow-lg p-6 space-y-6">
        {/* Header reducido con botones de optionsItineraryButtonBox (excepto 'link' y 'flow') */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            {/* Icono y título */}
            <PermissionWrapper hasPermission={canEdit}>
              <div className="flex items-center justify-center">
                {showIconSelector ? (
                  <NewSelectIcon
                    value={tempIcon}
                    onChange={handleIconChange}
                    onClose={() => setShowIconSelector(false)}
                  />
                ) : (
                  <button
                    onClick={() => canEdit ? setShowIconSelector(true) : ht()}
                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${canEdit ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                    title={canEdit ? "Cambiar ícono" : "No tienes permisos para editar"}
                  >
                    <Formik
                      initialValues={{ icon: tempIcon }}
                      onSubmit={(values) => {
                        handleIconChange(values.icon);
                      }}
                    >
                      {({ setFieldValue }) => (
                        <Form>
                          <Field name="icon">
                            {({ field }) => (
                              <SelectIcon
                                {...field}
                                name="icon"
                                value={field.value || tempIcon}
                                className="w-8 h-8"
                                handleChange={(value) => {
                                  setFieldValue('icon', value);
                                  handleIconChange(value);
                                }}
                                data={localTask}
                              />
                            )}
                          </Field>
                        </Form>
                      )}
                    </Formik>
                  </button> 
                )}
              </div>
            </PermissionWrapper>

            {editingField === 'descripcion' ? (
              <input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => handleFieldSave('descripcion')}
                onKeyDown={(e) => handleKeyPress(e, 'descripcion')}
                className="text-2xl font-semibold px-2 py-1 border-b-2 border-primary focus:outline-none flex-1"
                autoFocus
              />
            ) : (
              <h2
                className={`text-2xl font-semibold flex-1 ${canEdit ? 'cursor-pointer hover:text-gray-700' : 'cursor-default opacity-80'}`}
                onClick={() => canEdit ? handleFieldClick('descripcion', localTask.descripcion) : ht()}
                title={canEdit ? "Haz clic para editar" : "No tienes permisos para editar"}
              >
                {localTask.descripcion || t('Sin título')}
              </h2>
            )}
          </div>
          {/* Botones de optionsItineraryButtonBox (excepto 'link' y 'flow') */}
          {optionsItineraryButtonBox && optionsItineraryButtonBox.length > 0 && (
            <div className="flex items-center bg-gray-50 rounded-lg p-0.5 ml-4">
              {optionsItineraryButtonBox
                .filter(option => option.value !== 'link' && option.value !== 'flow' && option.value !== 'share' && option.value !== 'flujo')
                .map((option, idx) => {
                  let icon = option.icon;
                  if (option.getIcon && typeof option.getIcon === 'function') {
                    if (option.value === 'status') {
                      icon = option.getIcon(localTask.spectatorView);
                    }
                  }
                  let isActive = false;
                  let activeColorClass = '';
                  let hoverColorClass = '';
                  switch(option.value) {
                    case 'status':
                      isActive = localTask.spectatorView;
                      activeColorClass = 'text-primary bg-primary/10';
                      break;
                    case 'delete':
                      hoverColorClass = 'hover:text-[#ef4444] hover:bg-[#ef4444]/10';
                      break;
                    default:
                      hoverColorClass = 'hover:text-gray-600 hover:bg-gray-100';
                  }
                  return (
                    <div key={idx} className="relative group">
                      <button
                        onClick={() => {
                          if (typeof option.onClick === 'function') {
                            option.onClick(task, itinerario);
                          }
                        }}
                        className={`relative p-1.5 rounded-md transition-all duration-200 ${isActive ? `${activeColorClass} shadow-sm` : `text-gray-400 ${hoverColorClass}`}`}
                        title={t(option.title || option.value || '')}
                        disabled={option.idDisabled}
                      >
                        <span className="w-4 h-4 flex items-center justify-center" style={{ transform: 'scale(0.8)' }}>{icon}</span>
                        {isActive && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${option.value === 'status' ? 'bg-primary' : 'bg-blue-500'} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${option.value === 'status' ? 'bg-primary' : 'bg-blue-500'}`}></span>
                          </span>
                        )}
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                        {t(option.title || option.value || '')}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
        
        {/* Asignados (ClickUpResponsableSelector) */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{t('Asignados')}</span>
          </div>
          <div className="flex items-center flex-wrap gap-2 relative">
            {editingResponsable && canEdit ? (
              <div className="relative">
                <ClickUpResponsableSelector
                  value={tempResponsable}
                  onChange={(newValue) => {
                    setTempResponsable(newValue);
                    handleUpdate('responsable', newValue);
                    setEditingResponsable(false);
                  }}
                  onClose={() => {
                    setEditingResponsable(false);
                    setTempResponsable(localTask.responsable || []);
                  }}
                />
              </div>
            ) : (
              <PermissionWrapper hasPermission={canEdit}>
                <div className="flex items-center flex-wrap gap-2">
                  {(localTask.responsable || []).map((resp, idx) => {
                    const userInfo = GruposResponsablesArry.find(
                      (el) => el.title?.toLowerCase() === resp?.toLowerCase()
                    ) || [user, event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])].find(
                      (el) => {
                        const displayName = el?.displayName || el?.email || 'Sin nombre';
                        return displayName.toLowerCase() === resp?.toLowerCase();
                      }
                    );
                    return (
                      <div key={idx} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                        <div className="w-6 h-6 rounded-full mr-2 overflow-hidden">
                          <ImageAvatar user={userInfo} />
                        </div>
                        <span className="text-sm">{resp}</span>
                      </div>
                    );
                  })}
                  {canEdit && (
                    <button
                      onClick={() => {
                        setEditingResponsable(true);
                        setTempResponsable(localTask.responsable || []);
                      }}
                      className="text-gray-500 hover:text-gray-700 border border-gray-300 rounded-full px-3 py-1 text-sm"
                    >
                      {localTask.responsable?.length > 0 ? t('Editar') : t('Asignar')}
                    </button>
                  )}
                </div>
              </PermissionWrapper>
            )}
          </div>
        </div>

        {/* Indicadores de hora inicio y fin (solo visuales) */}
        {localTask.fecha && localTask.duracion && (
          <div className="flex items-center space-x-6 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <PlayCircle className="w-5 h-5 text-green-600" />
              <div>
                <span className="text-xs text-gray-500 block">{t('Inicio')}</span>
                <span className="text-sm font-medium text-gray-900">{formatTime(localTask.fecha)}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <StopCircle className="w-5 h-5 text-red-600" />
              <div>
                <span className="text-xs text-gray-500 block">{t('Final')}</span>
                <span className="text-sm font-medium text-gray-900">{calculateEndTime(localTask.fecha, localTask.duracion as number)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Duración */}
        <div className="flex items-center space-x-4">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-gray-500 block">{t('Duración')}</span>
          {editingDuration ? (
            <input
              type="text"
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
              onBlur={() => {
                const minutes = readableFormatToMinutes(durationInput);
                handleUpdate('duracion', minutes);
                setEditingDuration(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const minutes = readableFormatToMinutes(durationInput);
                  handleUpdate('duracion', minutes);
                  setEditingDuration(false);
                } else if (e.key === 'Escape') {
                  setEditingDuration(false);
                }
              }}
              placeholder="Ej: 1h 30min"
              className="w-24 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          ) : (
            <span
              className={`text-sm ${canEdit ? 'cursor-pointer hover:text-primary' : 'cursor-default opacity-60'}`}
              onClick={() => {
                if (canEdit) {
                  setEditingDuration(true);
                  setDurationInput(minutesToReadableFormat(localTask.duracion as number));
                } else {
                  ht();
                }
              }}
              title={canEdit ? "Haz clic para editar duración" : "No tienes permisos para editar"}
            >
              {minutesToReadableFormat(localTask.duracion as number)}
            </span>
          )}
        </div>

        {/* Etiquetas */}
        <div className="flex items-center space-x-4">
          <Tag className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">{t('Etiquetas')}</span>
          <div className="flex items-center flex-wrap gap-2">
            {(localTask.tags || []).map((tag, idx) => (
              <div key={idx} className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 group">
                <span className="text-sm">{tag}</span>
                {canEdit && (
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {editingField === 'tags' ? (
              <ClickAwayListener onClickAway={handleFieldCancel}>
                <input
                  type="text"
                  placeholder={t('Agregar etiqueta...')}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        handleAddTag(input.value.trim());
                        input.value = '';
                      }
                    }
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </ClickAwayListener>
            ) : (
              canEdit && (
                <button
                  onClick={() => handleFieldClick('tags', '')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        </div>

        {/* Descripción larga */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              {t('Descripción detallada')}
            </label>
            {customDescription && !editingDescription && canEdit && (
              <button
                onClick={() => setEditingDescription(true)}
                className="text-sm text-primary hover:text-primary/80"
              >
                {t('Editar')}
              </button>
            )}
          </div>
          {editingDescription ? (
            <div className="border border-gray-300 rounded-lg p-4">
              <textarea
                value={stripHtml(customDescription)}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="w-full min-h-[200px] resize-none border-0 focus:ring-0 focus:outline-none"
                placeholder={t('Escribe una descripción detallada...')}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => {
                    setCustomDescription(localTask.tips || '');
                    setEditingDescription(false);
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  {t('Cancelar')}
                </button>
                <button
                  onClick={() => {
                    handleUpdate('tips', customDescription);
                    setEditingDescription(false);
                  }}
                  className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
                >
                  {t('Guardar')}
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`border border-gray-200 rounded-lg p-4 min-h-[100px] ${canEdit ? 'cursor-pointer hover:border-gray-300' : 'cursor-default opacity-60'}`}
              onClick={() => {
                if (canEdit) {
                  setCustomDescription(stripHtml(localTask.tips || ''));
                  setEditingDescription(true);
                } else {
                  ht();
                }
              }}
              title={canEdit ? "Haz clic para editar descripción" : "No tienes permisos para editar"}
            >
              {customDescription ? (
                <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {formatTextWithLineLimit(stripHtml(customDescription), 70, 6).split('\n').map((line, idx) => (
                    <div key={idx} className="mb-1">{line}</div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  {canEdit ? t('Haz clic para agregar una descripción...') : t('Sin descripción')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Adjuntos */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">{t('Adjuntos')}</h4>
          <NewAttachmentsEditor
            attachments={localTask.attachments || []}
            onUpdate={(files) => handleUpdate('attachments', files)}
            taskId={task._id}
            eventId={event._id}
            itinerarioId={itinerario._id}
            readOnly={!canEdit}
          />
        </div>
      </div>
    );
  }

  return (
    <div {...props} className="w-full bg-white rounded-lg shadow-lg">
      <div className="flex min-h-[600px]">
        {/* Panel principal */}
        <div className="flex md:w-[75%] flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4 flex-1">
              {/* Icono de la tarea - Mejorado con NewSelectIcon */}
              <PermissionWrapper hasPermission={canEdit}>
                <div className="flex items-center justify-center">
                  {showIconSelector ? (
                    <NewSelectIcon
                      value={tempIcon}
                      onChange={handleIconChange}
                      onClose={() => setShowIconSelector(false)}
                    />
                  ) : (
                    <button
                      onClick={() => canEdit ? setShowIconSelector(true) : ht()}
                      className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
                        canEdit ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                      }`}
                      title={canEdit ? "Cambiar ícono" : "No tienes permisos para editar"}
                    >
                      <Formik
                        initialValues={{ icon: tempIcon }}
                        onSubmit={(values) => {
                          handleIconChange(values.icon);
                        }}
                      >
                        {({ setFieldValue }) => (
                          <Form>
                            <Field name="icon">
                              {({ field }) => (
                                <SelectIcon
                                  {...field}
                                  name="icon"
                                  value={field.value || tempIcon}
                                  className="w-8 h-8"
                                  handleChange={(value) => {
                                    setFieldValue('icon', value);
                                    handleIconChange(value);
                                  }}
                                  data={localTask}
                                />
                              )}
                            </Field>
                          </Form>
                        )}
                      </Formik>
                    </button>
                  )}
                </div>
              </PermissionWrapper>

              {/* Título con borde primary */}
              {editingField === 'descripcion' ? (
                <input
                  type="text"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={() => handleFieldSave('descripcion')}
                  onKeyDown={(e) => handleKeyPress(e, 'descripcion')}
                  className="text-2xl font-semibold px-2 py-1 border-b-2 border-primary focus:outline-none flex-1"
                  autoFocus
                />
              ) : (
                <h2
                  className={`text-2xl font-semibold flex-1 ${
                    canEdit ? 'cursor-pointer hover:text-gray-700' : 'cursor-default opacity-80'
                  }`}
                  onClick={() => canEdit ? handleFieldClick('descripcion', localTask.descripcion) : ht()}
                  title={canEdit ? "Haz clic para editar" : "No tienes permisos para editar"}
                >
                  {localTask.descripcion || t('Sin título')}
                </h2>
              )}
            </div>

            {/* Botones de acción integrados - OCULTOS sin permisos */}
            {canEdit && (
              <div className="flex items-center">
                {/* Grupo de botones principales con indicadores visuales de estado */}
                <div className="flex items-center bg-gray-50 rounded-lg p-0.5 mr-2">
                  {/* Visibilidad - Con animación de estado activo */}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        const newValue = !localTask.spectatorView;
                        handleUpdate('spectatorView', newValue);
                        toast('success', t(newValue ? 'Tarea visible' : 'Tarea oculta'));
                      }}
                      className={`relative p-1.5 rounded-md transition-all duration-200 ${
                        localTask.spectatorView 
                          ? 'text-primary bg-primary/10 shadow-sm' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                      title={t(localTask.spectatorView ? 'Tarea visible' : 'Tarea oculta')}
                    >
                      {localTask.spectatorView ? (
                        <Eye className="w-4 h-4 transition-transform duration-200" />
                      ) : (
                        <EyeOff className="w-4 h-4 transition-transform duration-200" />
                      )}
                      {/* Indicador de estado con animación pulsante */}
                      {localTask.spectatorView && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                      )}
                    </button>
                    {/* Tooltip informativo */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                      {t(localTask.spectatorView ? 'Visible' : 'Oculta')}
                    </div>
                  </div>

                  {/* Bloqueo - Con color rojo cuando está activo */}
{/*                   <div className="relative group">
                    <button
                      onClick={() => {
                        const newValue = !localTask.estatus;
                        handleUpdate('estatus', newValue);
                        toast('success', t(newValue ? 'Tarea bloqueada' : 'Tarea desbloqueada'));
                      }}
                      className={`relative p-1.5 rounded-md transition-all duration-200 ${
                        localTask.estatus 
                          ? 'text-[#ef4444] bg-[#ef4444]/10 shadow-sm' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                      title={t(localTask.estatus ? 'Tarea bloqueada' : 'Tarea desbloqueada')}
                    >
                      {localTask.estatus ? (
                        <Lock className="w-4 h-4 transition-transform duration-200" />
                      ) : (
                        <Unlock className="w-4 h-4 transition-transform duration-200" />
                      )}
                      
                      {localTask.estatus && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef4444] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef4444]"></span>
                        </span>
                      )}
                    </button>
                    
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                      {t(localTask.estatus ? 'Bloqueada' : 'Desbloqueada')}
                    </div>
                  </div> */}

                  {/* Separador visual sutil */}
                  <div className="w-px h-4 bg-gray-300 mx-1 opacity-50"></div>

                  {/* Duplicar - Acción rápida con hover primary */}
                  <div className="relative group">
                    <button
                      onClick={handleDuplicate}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-all duration-200"
                      title={t('Duplicar tarea')}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {/* Tooltip informativo */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                      {t('Duplicar')}
                    </div>
                  </div>

                  {/* Compartir enlace - Con feedback visual al copiar */}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        handleCopyLink(task);
                      }}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-all duration-200"
                      title={t('Copiar enlace')}
                    >
                      <Link className="w-4 h-4" />
                    </button>
                    {/* Tooltip informativo */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                      {t('Compartir')}
                    </div>
                  </div>
                </div>

                {/* Botones de ItineraryButtonBox - OCULTOS sin permisos */}
                {optionsItineraryButtonBox && optionsItineraryButtonBox.length > 0 && (
                  <>
                    <div className="flex items-center bg-gray-50 rounded-lg p-0.5 mr-2">
                      {optionsItineraryButtonBox
                        .filter(option => option.value !== 'estatus' && option.value !== 'status')
                        .map((option, idx) => {
                          // Obtener el icono correcto basado en el estado
                          let icon = option.icon;
                          if (option.getIcon && typeof option.getIcon === 'function') {
                            // Para opciones con getIcon dinámico
                            if (option.value === 'status') {
                              icon = option.getIcon(localTask.spectatorView);
                            }
                          }

                          // Determinar estado activo y colores según el tipo de acción
                          let isActive = false;
                          let activeColorClass = '';
                          let hoverColorClass = '';
                          
                          switch(option.value) {
                            case 'status':
                              isActive = localTask.spectatorView;
                              activeColorClass = 'text-primary bg-primary/10';
                              break;
                            case 'flujo':
                              // Lógica personalizada para flujo de trabajo
                              isActive = false;
                              activeColorClass = 'text-purple-500 bg-purple-500/10';
                              hoverColorClass = 'hover:text-purple-600 hover:bg-purple-100';
                              break;
                            case 'share':
                              // Estado para compartir
                              isActive = false;
                              activeColorClass = 'text-blue-500 bg-blue-500/10';
                              hoverColorClass = 'hover:text-blue-600 hover:bg-blue-100';
                              break;
                            case 'delete':
                              // Delete con hover rojo destructivo
                              isActive = false;
                              activeColorClass = '';
                              hoverColorClass = 'hover:text-[#ef4444] hover:bg-[#ef4444]/10';
                              break;
                            default:
                              hoverColorClass = 'hover:text-gray-600 hover:bg-gray-100';
                          }

                          return (
                            <div key={idx} className="relative group">
                              <button
                                onClick={() => {
                                  if (typeof option.onClick === 'function') {
                                    option.onClick(task, itinerario);
                                  }
                                }}
                                className={`relative p-1.5 rounded-md transition-all duration-200 ${
                                  isActive
                                    ? `${activeColorClass} shadow-sm`
                                    : `text-gray-400 ${hoverColorClass}`
                                }`}
                                title={t(option.title || option.value || '')}
                                disabled={option.idDisabled}
                              >
                                <span className="w-4 h-4 flex items-center justify-center"
                                  style={{ transform: 'scale(0.8)' }}>
                                  {icon}
                                </span>
                                {/* Indicador de estado con colores específicos por tipo */}
                                {isActive && (
                                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                                      option.value === 'status' ? 'bg-primary' : 
                                      option.value === 'flujo' ? 'bg-purple-500' : 
                                      'bg-blue-500'
                                    } opacity-75`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                      option.value === 'status' ? 'bg-primary' : 
                                      option.value === 'flujo' ? 'bg-purple-500' : 
                                      'bg-blue-500'
                                    }`}></span>
                                  </span>
                                )}
                              </button>
                              {/* Tooltip informativo dinámico */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                                {t(option.title || option.value || '')}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}

                {/* Menú de más opciones - OCULTO sin permisos */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      showMoreOptions ? 'bg-gray-100 text-gray-700' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {showMoreOptions && (
                    <ClickAwayListener onClickAway={() => setShowMoreOptions(false)}>
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                        <div className="py-1">
                          <button
                            className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Archive className="w-4 h-4 mr-3" />
                            {t('Archivar')}
                          </button>
                          <button
                            className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Bell className="w-4 h-4 mr-3" />
                            {t('Notificaciones')}
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            className="flex items-center w-full px-4 py-2.5 text-sm text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-3" />
                            {t('Eliminar')}
                          </button>
                        </div>
                      </div>
                    </ClickAwayListener>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contenido principal */}
          <div className="flex-1 overflow-y-auto">
            {/* Información principal de la tarea */}
            <div className="px-6 py-4 space-y-4">
              {/* Fila de Estado y Prioridad */}
              <div className="flex items-center space-x-4">
                {/* Estado */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{t('Estado')}</span>
                  <div className="relative">
                    <button
                      onClick={() => canEdit ? setShowStatusDropdown(!showStatusDropdown) : ht()}
                      className={`px-3 py-1 rounded text-white text-sm flex items-center space-x-1 ${currentStatus.color} ${
                        canEdit ? 'hover:opacity-80 cursor-pointer' : 'opacity-70 cursor-not-allowed'
                      }`}
                      title={canEdit ? "Cambiar estado" : "No tienes permisos para editar"}
                    >
                      <span>{currentStatus.label}</span>
                      {canEdit && <ChevronDown className="w-3 h-3" />}
                    </button>
                    {showStatusDropdown && canEdit && (
                      <ClickAwayListener onClickAway={() => setShowStatusDropdown(false)}>
                        <div className="absolute mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          {TASK_STATUSES.map(status => (
                            <button
                              key={status.value}
                              onClick={() => {
                                handleUpdate('estado', status.value);
                                setShowStatusDropdown(false);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                            >
                              <div className={`w-3 h-3 rounded-full ${status.color} mr-3`}></div>
                              <span>{status.label}</span>
                            </button>
                          ))}
                        </div>
                      </ClickAwayListener>
                    )}
                  </div>
                </div>

                {/* Prioridad */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{t('Prioridad')}</span>
                  <div className="relative">
                    <button
                      onClick={() => canEdit ? setShowPriorityDropdown(!showPriorityDropdown) : ht()}
                      className={`px-3 py-1 rounded text-white text-sm flex items-center space-x-1 ${currentPriority.color} ${
                        canEdit ? 'hover:opacity-80 cursor-pointer' : 'opacity-70 cursor-not-allowed'
                      }`}
                      title={canEdit ? "Cambiar prioridad" : "No tienes permisos para editar"}
                    >
                      <Flag className="w-3 h-3" />
                      <span>{currentPriority.label}</span>
                      {canEdit && <ChevronDown className="w-3 h-3" />}
                    </button>
                    {showPriorityDropdown && canEdit && (
                      <ClickAwayListener onClickAway={() => setShowPriorityDropdown(false)}>
                        <div className="absolute mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          {TASK_PRIORITIES.map(priority => (
                            <button
                              key={priority.value}
                              onClick={() => {
                                handleUpdate('prioridad', priority.value);
                                setShowPriorityDropdown(false);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                            >
                              <Flag className={`w-4 h-4 mr-3 ${
                                priority.value === 'alta' ? 'text-[#ef4444]' :
                                priority.value === 'media' ? 'text-yellow-500' :
                                'text-gray-400'
                              }`} />
                              <span>{priority.label}</span>
                            </button>
                          ))}
                        </div>
                      </ClickAwayListener>
                    )}
                  </div>
                </div>
              </div>

              {/* Asignados con NewResponsableSelector */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{t('Asignados')}</span>
                </div>
                <div className="flex items-center flex-wrap gap-2 relative">
                  {editingResponsable && canEdit ? (
                    <div className="relative">
                      <ClickUpResponsableSelector
                        value={tempResponsable}
                        onChange={(newValue) => {
                          setTempResponsable(newValue);
                          handleUpdate('responsable', newValue);
                          setEditingResponsable(false);
                        }}
                        onClose={() => {
                          setEditingResponsable(false);
                          setTempResponsable(localTask.responsable || []);
                        }}
                      />
                    </div>
                  ) : (
                    <PermissionWrapper hasPermission={canEdit}>
                      <div className="flex items-center flex-wrap gap-2">
                        {(localTask.responsable || []).map((resp, idx) => {
                          const userInfo = GruposResponsablesArry.find(
                            (el) => el.title?.toLowerCase() === resp?.toLowerCase()
                          ) || [user, event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])].find(
                            (el) => {
                              const displayName = el?.displayName || el?.email || 'Sin nombre';
                              return displayName.toLowerCase() === resp?.toLowerCase();
                            }
                          );

                          return (
                            <div
                              key={idx}
                              className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                            >
                              <div className="w-6 h-6 rounded-full mr-2 overflow-hidden">
                                <ImageAvatar user={userInfo} />
                              </div>
                              <span className="text-sm">{resp}</span>
                            </div>
                          );
                        })}
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditingResponsable(true);
                              setTempResponsable(localTask.responsable || []);
                            }}
                            className="text-gray-500 hover:text-gray-700 border border-gray-300 rounded-full px-3 py-1 text-sm"
                          >
                            {localTask.responsable?.length > 0 ? t('Editar') : t('Asignar')}
                          </button>
                        )}
                      </div>
                    </PermissionWrapper>
                  )}
                </div>
              </div>

              {/* Fechas con duración y hora */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{t('Fecha y hora')}</span>
                </div>
                <div className="flex items-center space-x-4">
                  {editingField === 'fecha' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={tempValue ? new Date(tempValue).toISOString().split('T')[0] : ''}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => handleFieldSave('fecha')}
                        onKeyDown={(e) => handleKeyPress(e, 'fecha')}
                        className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span
                      className={`text-sm ${
                        canEdit ? 'cursor-pointer hover:text-primary' : 'cursor-default opacity-60'
                      }`}
                      onClick={() => canEdit ? handleFieldClick('fecha', localTask.fecha) : ht()}
                      title={canEdit ? "Haz clic para editar fecha" : "No tienes permisos para editar"}
                    >
                      {localTask.fecha ? formatDate(localTask.fecha) : t('Sin fecha')}
                    </span>
                  )}

                  {/* Hora */}
                  {editingField === 'hora' ? (
                    <input
                      type="time"
                      value={tempValue || ''}
                      onChange={(e) => setTempValue(e.target.value)}
                      onBlur={() => {
                        if (localTask.fecha && tempValue) {
                          const fecha = new Date(localTask.fecha);
                          const [hours, minutes] = tempValue.split(':');
                          fecha.setHours(parseInt(hours), parseInt(minutes));
                          handleUpdate('fecha', fecha);
                        }
                        setEditingField(null);
                      }}
                      onKeyDown={(e) => handleKeyPress(e, 'hora')}
                      className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span
                        className={`text-sm ${
                          canEdit ? 'cursor-pointer hover:text-primary' : 'cursor-default opacity-60'
                        }`}
                        onClick={() => canEdit ? handleFieldClick('hora', localTask.fecha ? formatTime(localTask.fecha) : '') : ht()}
                        title={canEdit ? "Haz clic para editar hora" : "No tienes permisos para editar"}
                      >
                        {localTask.fecha ? formatTime(localTask.fecha) : t('Sin hora')}
                      </span>
                    </div>
                  )}

                  {/* Duración mejorada con conversor */}
                  {editingDuration ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={durationInput}
                        onChange={(e) => setDurationInput(e.target.value)}
                        onBlur={() => {
                          const minutes = readableFormatToMinutes(durationInput);
                          handleUpdate('duracion', minutes);
                          setEditingDuration(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const minutes = readableFormatToMinutes(durationInput);
                            handleUpdate('duracion', minutes);
                            setEditingDuration(false);
                          } else if (e.key === 'Escape') {
                            setEditingDuration(false);
                          }
                        }}
                        placeholder="Ej: 1h 30min"
                        className="w-24 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span
                      className={`text-sm ${
                        canEdit ? 'cursor-pointer hover:text-primary' : 'cursor-default opacity-60'
                      }`}
                      onClick={() => {
                        if (canEdit) {
                          setEditingDuration(true);
                          setDurationInput(minutesToReadableFormat(localTask.duracion as number));
                        } else {
                          ht();
                        }
                      }}
                      title={canEdit ? "Haz clic para editar duración" : "No tienes permisos para editar"}
                    >
                      {minutesToReadableFormat(localTask.duracion as number)}
                    </span>
                  )}
                </div>
              </div>

              {/* NUEVA SECCIÓN: Indicadores de hora inicio y fin (SOLO VISUALES) */}
              {localTask.fecha && localTask.duracion && (
                <div className="flex items-center space-x-6 bg-gray-50 rounded-lg p-3">
                  {/* Hora de inicio */}
                  <div className="flex items-center space-x-2">
                    <PlayCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <span className="text-xs text-gray-500 block">{t('Inicio')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatTime(localTask.fecha)}
                      </span>
                    </div>
                  </div>
                  {/* Separador */}
                  <div className="w-px h-8 bg-gray-300"></div>
                  {/* Hora de finalización */}
                  <div className="flex items-center space-x-2">
                    <StopCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <span className="text-xs text-gray-500 block">{t('Final')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {calculateEndTime(localTask.fecha, localTask.duracion as number)}
                      </span>
                    </div>
                  </div>
                  {/* Duración total */}
{/*                   <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="text-xs text-gray-500 block">{t('Duración')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {minutesToReadableFormat(localTask.duracion as number)}
                      </span>
                    </div>
                  </div> */}
                </div>
              )}

              {/* Etiquetas */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{t('Etiquetas')}</span>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  {(localTask.tags || []).map((tag, idx) => (
                    <div
                      key={idx}
                      className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 group"
                    >
                      <span className="text-sm">{tag}</span>
                      {canEdit && (
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {editingField === 'tags' ? (
                    <ClickAwayListener onClickAway={handleFieldCancel}>
                      <input
                        type="text"
                        placeholder={t('Agregar etiqueta...')}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim()) {
                              handleAddTag(input.value.trim());
                              input.value = '';
                            }
                          }
                        }}
                        className="px-3 py-1 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                    </ClickAwayListener>
                  ) : (
                    canEdit && (
                      <button
                        onClick={() => handleFieldClick('tags', '')}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Sección de Detalles */}
            <div className="border-t border-gray-200">
              <div className="px-6 py-4">
                <h3 className="text-lg font-semibold mb-4">{t('Detalles')}</h3>

                {/* Campos personalizados */}
                <div className="space-y-6">
                  {/* Descripción larga formateada */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        {t('Descripción detallada')}
                      </label>
                      {customDescription && !editingDescription && canEdit && (
                        <button
                          onClick={() => setEditingDescription(true)}
                          className="text-sm text-primary hover:text-primary/80"
                        >
                          {t('Editar')}
                        </button>
                      )}
                    </div>

                    {editingDescription ? (
                      <div className="border border-gray-300 rounded-lg p-4">
                        <textarea
                          value={stripHtml(customDescription)} // IMPORTANTE: Aplicar stripHtml aquí
                          onChange={(e) => setCustomDescription(e.target.value)}
                          className="w-full min-h-[200px] resize-none border-0 focus:ring-0 focus:outline-none"
                          placeholder={t('Escribe una descripción detallada...')}
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <button
                            onClick={() => {
                              setCustomDescription(localTask.tips || '');
                              setEditingDescription(false);
                            }}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                          >
                            {t('Cancelar')}
                          </button>
                          <button
                            onClick={() => {
                              handleUpdate('tips', customDescription);
                              setEditingDescription(false);
                            }}
                            className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
                          >
                            {t('Guardar')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`border border-gray-200 rounded-lg p-4 min-h-[100px] ${
                          canEdit ? 'cursor-pointer hover:border-gray-300' : 'cursor-default opacity-60'
                        }`}
                        onClick={() => {
                          if (canEdit) {
                            setCustomDescription(stripHtml(localTask.tips || '')); // Limpiar HTML antes de editar
                            setEditingDescription(true);
                          } else {
                            ht();
                          }
                        }}
                        title={canEdit ? "Haz clic para editar descripción" : "No tienes permisos para editar"}
                      >
                        {customDescription ? (
                          <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                            {formatTextWithLineLimit(stripHtml(customDescription), 70, 6).split('\n').map((line, idx) => (
                              <div key={idx} className="mb-1">{line}</div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">
                            {canEdit ? t('Haz clic para agregar una descripción...') : t('Sin descripción')}
                          </p>
                        )}
                      </div>
                                       )}  
                  </div>

                  {/* Adjuntos mejorados */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">{t('Adjuntos')}</h4>
                    <NewAttachmentsEditor
                      attachments={localTask.attachments || []}
                      onUpdate={(files) => handleUpdate('attachments', files)}
                      taskId={task._id}
                      eventId={event._id}
                      itinerarioId={itinerario._id}
                      readOnly={!canEdit}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Panel lateral - Chat/Comentarios */}
          <div className="w-96 border-l border-gray-200 flex flex-col bg-gray-50">
            {/* Header del chat */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{t('Actividad')}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{comments.length} {t('comentarios')}</span>
                  <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                </div>
              </div>
            </div>

            {/* Lista de comentarios - scroll desde abajo hacia arriba */}
            <div 
              ref={commentsContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col-reverse"
            >
              {comments.length === 0 ? (
                <div className="text-center py-8 flex-1 flex items-center justify-center">
                  <div>
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{t('No hay comentarios aún')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('Sé el primero en comentar')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {comments.map((comment) => (
                    <div key={comment._id} className="relative group">
                      <ListComments
                        id={comment._id}
                        itinerario={itinerario}
                        task={task}
                        item={comment}
                        tempPastedAndDropFiles={tempPastedAndDropFiles}
                      />
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded shadow-sm hover:bg-gray-100"
                          title={t('Eliminar comentario')}
                        >
                          <Trash2 className="w-4 h-4 text-gray-500 hover:text-[#ef4444]" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input de comentarios */}
            <div className="border-t border-gray-200 bg-white min-h-[105px] px-4 py-2">
              <InputComments
                itinerario={itinerario}
                task={task}
                tempPastedAndDropFiles={tempPastedAndDropFiles || []}
                setTempPastedAndDropFiles={setTempPastedAndDropFiles}
                disabled={false}
                onCommentAdded={handleCommentAdded}
              />
            </div>
          </div>

        {/* Estilos CSS para animaciones */}
        <style jsx>{`
          @keyframes ping {
            75%, 100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          
          .animate-ping {
            animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
        `}</style>
    </div>
    </div>
  );
});

TaskNew.displayName = 'TaskNew';

export default TaskNew;