import { FC, HTMLAttributes, useEffect, useRef, useState, useCallback, memo } from "react";
import { SelectIcon, GruposResponsablesArry } from ".";
import { Formik, Form, Field } from 'formik';
import { EventContextProvider } from "../../../context/EventContext";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { AuthContextProvider } from "../../../context";
import { useTranslation } from 'react-i18next';
import { Comment, Itinerary, OptionsSelect, Task } from "../../../utils/Interfaces";
import { ViewItinerary } from "../../../pages/invitados";
import { CgSoftwareDownload } from "react-icons/cg";
import { getStorage } from "firebase/storage";
import { Interweave } from "interweave";
import { HashtagMatcher, UrlMatcher } from "interweave-autolink";
import 'react-quill/dist/quill.snow.css'
import { ImageAvatar } from "../../Utils/ImageAvatar";
import { InputComments } from "./InputComments"
import { ListComments } from "./ListComments"
import ClickAwayListener from "react-click-away-listener";
import { CopiarLink } from "../../Utils/Compartir";
import { useRouter } from "next/router";
import { TempPastedAndDropFile } from "./ItineraryPanel";
import { downloadFile } from "../../Utils/storages";
import { useToast } from "../../../hooks/useToast";
import InputField from "../../Forms/InputField";
import { NewAttachmentsEditor } from "./NewAttachmentsEditor";
import { InputTags } from "../../Forms/InputTags";
import { MyEditor } from "./QuillText";
import { Modal } from "../../Utils/ModalServicios";
import { TASK_STATUSES, TASK_PRIORITIES } from './NewTypes';
import { ClickUpResponsableSelector } from './NewResponsableSelector';
import { NewSelectIcon } from './NewSelectIcon';
import {
  X, MessageSquare, Paperclip, Tag, Calendar, Clock, User, Flag, ChevronDown, Copy, Link, MoreHorizontal, Trash2, Archive, Bell, Plus, Eye, EyeOff, GitBranch, Lock, Unlock
} from 'lucide-react';

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
  view: ViewItinerary;
  optionsItineraryButtonBox?: OptionsSelect[];
  isSelect?: boolean;
  showModalCompartir?: any;
  setShowModalCompartir?: any;
  tempPastedAndDropFiles?: TempPastedAndDropFile[];
  setTempPastedAndDropFiles?: any;
  isTaskPublic?: boolean;
}

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

// Función para formatear texto con límite de línea
const formatTextWithLineLimit = (text: string, charsPerLine: number = 60, maxLines: number = 6): string => {
  if (!text) return "";
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= charsPerLine) {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
    
    // Si ya tenemos el máximo de líneas, detener
    if (lines.length >= maxLines - 1 && currentLine) {
      lines.push(currentLine + '...');
      return lines.join('\n');
    }
  }
  
  if (currentLine) lines.push(currentLine);
  
  return lines.slice(0, maxLines).join('\n');
};

export const TaskNew: FC<Props> = memo(({
  itinerario,
  task,
  view,
  optionsItineraryButtonBox,
  isSelect,
  showModalCompartir,
  setShowModalCompartir,
  tempPastedAndDropFiles,
  setTempPastedAndDropFiles,
  ...props
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const { config, geoInfo, user } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const { t } = useTranslation();
  const storage = getStorage();
  const router = useRouter();
  const toast = useToast();

  const link = `${window.location.origin}/services/servicios-${event?._id}-${itinerario?._id}-${task?._id}`;

  // Estados básicos
  const [comments, setComments] = useState<Comment[]>([]);
  const [previousCountComments, setPreviousCountComments] = useState<number>(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<any>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [customDescription, setCustomDescription] = useState(stripHtml(task.tips || ''));
  const [editingResponsable, setEditingResponsable] = useState(false);
  const [tempResponsable, setTempResponsable] = useState<string[]>([]);
  const [editingAttachments, setEditingAttachments] = useState(false);
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationInput, setDurationInput] = useState('');
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [tempIcon, setTempIcon] = useState(task.icon || '');

  // Estado local de la tarea
  const [localTask, setLocalTask] = useState<TaskFormValues>({
    _id: task?._id || "",
    icon: task?.icon || "",
    fecha: task?.fecha || "",
    hora: "",
    duracion: task?.duracion || 0,
    tags: Array.isArray(task?.tags) ? task.tags : [],
    descripcion: task?.descripcion || "",
    responsable: Array.isArray(task?.responsable) ? task.responsable : [],
    tips: task?.tips || "",
    attachments: Array.isArray(task?.attachments) ? task.attachments : [],
    spectatorView: task?.spectatorView ?? true,
    comments: Array.isArray(task?.comments) ? task.comments : [],
    commentsViewers: Array.isArray(task?.commentsViewers) ? task.commentsViewers : [],
    estatus: task?.estatus ?? false,
    estado: task?.estado || 'pending',
    prioridad: task?.prioridad || 'media'
  });

  useEffect(() => {
    setLocalTask({
      _id: task?._id || "",
      icon: task?.icon || "",
      fecha: task?.fecha || "",
      hora: "",
      duracion: task?.duracion || 0,
      tags: Array.isArray(task?.tags) ? task.tags : [],
      descripcion: task?.descripcion || "",
      responsable: Array.isArray(task?.responsable) ? task.responsable : [],
      tips: task?.tips || "",
      attachments: Array.isArray(task?.attachments) ? task.attachments : [],
      spectatorView: task?.spectatorView ?? true,
      comments: Array.isArray(task?.comments) ? task.comments : [],
      commentsViewers: Array.isArray(task?.commentsViewers) ? task.commentsViewers : [],
      estatus: task?.estatus ?? false,
      estado: task?.estado || 'pending',
      prioridad: task?.prioridad || 'media'
    });
    setCustomDescription(task?.tips || '');
    setTempIcon(task?.icon || '');
  }, [task]);

  // Función para manejar actualización de campos
  const handleUpdate = async (fieldName: string, value: any) => {
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

      // Actualizar estado global
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

      // Actualizar estado local
      setLocalTask(prev => ({ ...prev, [fieldName]: value }));

      toast("success", t("Campo actualizado"));
    } catch (error) {
      console.error('Error al actualizar:', error);
      toast("error", t("Error al actualizar"));
    }
  };

  // Manejadores de edición de campos
  const handleFieldClick = (fieldName: string, currentValue: any) => {
    if (editingField !== fieldName) {
      setEditingField(fieldName);
      setTempValue(currentValue);
    }
  };

  const handleFieldSave = async (fieldName: string) => {
    await handleUpdate(fieldName, tempValue);
    setEditingField(null);
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setTempValue(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, fieldName: string) => {
    if (e.key === 'Enter') {
      handleFieldSave(fieldName);
    } else if (e.key === 'Escape') {
      handleFieldCancel();
    }
  };

  // Manejadores específicos
  const handleIconChange = (value: string) => {
    setTempIcon(value);
    handleUpdate('icon', value);
    setShowIconSelector(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await fetchApiEventos({
        query: queries.deleteComment,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: task._id,
          commentID: commentId
        },
        domain: config.domain
      });

      // Actualizar estado global
      setEvent((oldEvent) => {
        const newEvent = { ...oldEvent };
        const itineraryIndex = newEvent.itinerarios_array.findIndex(it => it._id === itinerario._id);
        
        if (itineraryIndex > -1) {
          const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks.findIndex(t => t._id === task._id);
          
          if (taskIndex > -1) {
            newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex].comments = 
              newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex].comments.filter(c => c._id !== commentId);
          }
        }
        
        return newEvent;
      });

      // Actualizar estado local
      setComments(prev => prev.filter(c => c._id !== commentId));
      
      toast("success", t("Comentario eliminado"));
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      toast("error", t("Error al eliminar comentario"));
    }
  };

  const handleDuplicate = async () => {
    try {
      const newDate = new Date();
      const response = await fetchApiEventos({
        query: queries.createTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          descripcion: `${task.descripcion} (copia)`,
          fecha: newDate.toISOString(),
          duracion: task.duracion || 30,
          estado: 'pending'
        },
        domain: config.domain
      }) as Task;

      if (response && response._id) {
        // Actualizar el estado global
        setEvent((oldEvent) => {
          const newEvent = { ...oldEvent };
          const itineraryIndex = newEvent.itinerarios_array.findIndex(it => it._id === itinerario._id);
          
          if (itineraryIndex > -1) {
            newEvent.itinerarios_array[itineraryIndex].tasks.push(response);
          }
          
          return newEvent;
        });

        toast('success', t('Tarea duplicada'));
      }
    } catch (error) {
      console.error('Error al duplicar tarea:', error);
      toast('error', t('Error al duplicar tarea'));
    }
  };

  const handleAddTag = (newTag: string) => {
    if (newTag && !localTask.tags?.includes(newTag)) {
      const newTags = [...(localTask.tags || []), newTag];
      handleUpdate('tags', newTags);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = localTask.tags?.filter(tag => tag !== tagToRemove) || [];
    handleUpdate('tags', newTags);
  };

  const handleSaveResponsable = async () => {
    await handleUpdate('responsable', tempResponsable);
    setEditingResponsable(false);
  };

  const formatDate = (date: string | Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date: string | Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Estados y prioridades
  const currentStatus = TASK_STATUSES.find(s => s.value === localTask.estado) || TASK_STATUSES[0];
  const currentPriority = TASK_PRIORITIES.find(p => p.value === localTask.prioridad) || TASK_PRIORITIES[1];

  // Manejo de comentarios - ordenados de más antiguo a más reciente (abajo hacia arriba)
  useEffect(() => {
    const sortedComments = (task?.comments || [])
      .sort((a, b) => {
        const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB; // Orden ascendente (más antiguos primero)
      });
    setComments(sortedComments);
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

  return (
    <div {...props} className="w-full bg-white rounded-lg shadow-lg">
      <div className="flex min-h-[600px]">
        {/* Panel principal */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4 flex-1">
              {/* Icono de la tarea - Mejorado con NewSelectIcon */}
              <div className="flex items-center justify-center">
                {showIconSelector ? (
                  <NewSelectIcon
                    value={tempIcon}
                    onChange={handleIconChange}
                    onClose={() => setShowIconSelector(false)}
                  />
                ) : (
                  <button
                    onClick={() => setShowIconSelector(true)}
                    className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
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
                  className="text-2xl font-semibold cursor-pointer hover:text-gray-700 flex-1"
                  onClick={() => handleFieldClick('descripcion', localTask.descripcion)}
                >
                  {localTask.descripcion || t('Sin título')}
                </h2>
              )}
            </div>

            {/* Botones de acción integrados - Diseño mejorado con iconos sin labels y tamaño reducido */}
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
                <div className="relative group">
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
                    {/* Indicador de estado con animación pulsante roja */}
                    {localTask.estatus && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef4444] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef4444]"></span>
                      </span>
                    )}
                  </button>
                  {/* Tooltip informativo */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                    {t(localTask.estatus ? 'Bloqueada' : 'Desbloqueada')}
                  </div>
                </div>

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
                      navigator.clipboard.writeText(link);
                      toast('success', t('Enlace copiado'));
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

              {/* Botones de ItineraryButtonBox - Con estados y colores personalizados */}
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

              {/* Menú de más opciones - Para acciones menos frecuentes */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    showMoreMenu ? 'bg-gray-100 text-gray-700' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMoreMenu && (
                  <ClickAwayListener onClickAway={() => setShowMoreMenu(false)}>
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
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className={`px-3 py-1 rounded text-white text-sm flex items-center space-x-1 ${currentStatus.color}`}
                    >
                      <span>{currentStatus.label}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showStatusDropdown && (
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
                      onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                      className={`px-3 py-1 rounded text-white text-sm flex items-center space-x-1 ${currentPriority.color}`}
                    >
                      <Flag className="w-3 h-3" />
                      <span>{currentPriority.label}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showPriorityDropdown && (
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
                <div className="flex items-center flex-wrap gap-2">
                  {editingResponsable ? (
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
                  ) : (
                    <>
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
                      </div>
                      <button
                        onClick={() => {
                          setEditingResponsable(true);
                          setTempResponsable(localTask.responsable || []);
                        }}
                        className="text-gray-500 hover:text-gray-700 border border-gray-300 rounded-full px-3 py-1 text-sm"
                      >
                        {localTask.responsable?.length > 0 ? t('Editar') : t('Asignar')}
                      </button>
                    </>
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
                      className="text-sm cursor-pointer hover:text-primary"
                      onClick={() => handleFieldClick('fecha', localTask.fecha)}
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
                        className="text-sm cursor-pointer hover:text-primary"
                        onClick={() => handleFieldClick('hora', localTask.fecha ? formatTime(localTask.fecha) : '')}
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
                      className="text-sm cursor-pointer hover:text-primary"
                      onClick={() => {
                        setEditingDuration(true);
                        setDurationInput(minutesToReadableFormat(localTask.duracion as number));
                      }}
                    >
                      {minutesToReadableFormat(localTask.duracion as number)}
                    </span>
                  )}
                </div>
              </div>

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
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
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
                    <button
                      onClick={() => handleFieldClick('tags', '')}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
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
                      {customDescription && !editingDescription && (
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
    className="border border-gray-200 rounded-lg p-4 min-h-[100px] cursor-pointer hover:border-gray-300"
    onClick={() => {
      setCustomDescription(stripHtml(localTask.tips || '')); // Limpiar HTML antes de editar
      setEditingDescription(true);
    }}
  >
    {customDescription ? (
      <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
        {formatTextWithLineLimit(stripHtml(customDescription), 70, 6).split('\n').map((line, idx) => (
          <div key={idx} className="mb-1">{line}</div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-400">{t('Haz clic para agregar una descripción...')}</p>
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
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded shadow-sm hover:bg-gray-100"
                      title={t('Eliminar comentario')}
                    >
                      <Trash2 className="w-4 h-4 text-gray-500 hover:text-[#ef4444]" />
                    </button>
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
            />
          </div>
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
  );
});

TaskNew.displayName = 'TaskNew';