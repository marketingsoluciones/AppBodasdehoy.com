import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Paperclip,
  Tag,
  Calendar,
  Clock,
  User,
  Flag,
  ChevronDown,
  Copy,
  Link,
  MoreHorizontal,
  Trash2,
  Archive,
  Bell,
  Plus,
  Eye,
  EyeOff,
  GitBranch,
  Lock,
  Unlock
} from 'lucide-react';
import { Task, Comment, Itinerary } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { AuthContextProvider, EventContextProvider } from '../../../context';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { useToast } from '../../../hooks/useToast';
import { InputComments } from './InputComments';
import { ListComments } from './ListComments';
import { GruposResponsablesArry, ResponsableSelector, SelectIcon } from '../MicroComponente';
import { ImageAvatar } from '../../Utils/ImageAvatar';
import ClickAwayListener from 'react-click-away-listener';
import { CgSoftwareDownload } from "react-icons/cg";
import { getStorage } from "firebase/storage";
import { downloadFile } from "../../Utils/storages";
import { Interweave } from "interweave";
import { HashtagMatcher, UrlMatcher } from "interweave-autolink";
import InputAttachments from '../../Forms/InputAttachments';
import { Formik, Form } from 'formik';

interface TaskDetailModalProps {
  task: Task;
  itinerario: Itinerary;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onTaskCreate: (task: Partial<Task>) => void;
  tempPastedAndDropFiles?: any[];
  setTempPastedAndDropFiles?: any;
}

const TASK_STATUSES = [
  { value: 'pending', label: 'Pendiente', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'En Curso', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completado', color: 'bg-green' },
  { value: 'blocked', label: 'Bloqueado', color: 'bg-red' }
];

const TASK_PRIORITIES = [
  { value: 'alta', label: 'Alta', color: 'bg-red' },
  { value: 'media', label: 'Media', color: 'bg-yellow-500' },
  { value: 'baja', label: 'Baja', color: 'bg-gray-400' }
];

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  itinerario,
  onClose,
  onUpdate,
  onDelete,
  onTaskCreate,
  tempPastedAndDropFiles,
  setTempPastedAndDropFiles
}) => {
  const { t } = useTranslation();
  const { config, user, geoInfo } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast();
  const storage = getStorage();

  const [localTask, setLocalTask] = useState(task);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>(task.comments || []);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [customDescription, setCustomDescription] = useState(task.tips || '');
  const [editingDescription, setEditingDescription] = useState(false);
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [editingResponsable, setEditingResponsable] = useState(false);
  const [tempResponsable, setTempResponsable] = useState<string[]>([]);
  const [editingAttachments, setEditingAttachments] = useState(false);

  // Lista de iconos disponibles
  const availableIcons = ['📄', '📌', '🔔', '💡', '⚡', '🎯', '🚀', '💼', '📊', '📈', '🔧', '🛠️', '📝', '✅', '❌', '⭐', '🔥', '💎', '🎨', '🎪'];

  useEffect(() => {
    setComments(task.comments || []);
  }, [task.comments]);

  const handleIconChange = (name: string, value: any) => {
    onUpdate(task._id, { icon: value });
    setLocalTask({ ...localTask, icon: value });
  };

  const handleFieldClick = (fieldName: string, currentValue: any) => {
    if (editingField !== fieldName) {
      setEditingField(fieldName);
      setTempValue(currentValue);
    }
  };

  const handleFieldSave = async (fieldName: string) => {
    try {
      let valueToSave = tempValue;
      
      if (fieldName === 'fecha' && tempValue) {
        valueToSave = new Date(tempValue);
      }
      
      const updates = { [fieldName]: valueToSave };
      await onUpdate(task._id, updates);
      setLocalTask({ ...localTask, ...updates });
      setEditingField(null);
      toast('success', t('Campo actualizado'));
    } catch (error) {
      toast('error', t('Error al actualizar'));
    }
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

  const handleStatusChange = async (newStatus: string) => {
    await onUpdate(task._id, { estado: newStatus });
    setLocalTask({ ...localTask, estado: newStatus });
    setShowStatusDropdown(false);
  };

  const handlePriorityChange = async (newPriority: string) => {
    await onUpdate(task._id, { prioridad: newPriority });
    setLocalTask({ ...localTask, prioridad: newPriority });
    setShowPriorityDropdown(false);
  };

  const handleDuplicate = () => {
    const duplicatedTask = {
      ...task,
      descripcion: `${task.descripcion} (copia)`,
      fecha: new Date(),
      _id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      comments: [],
      commentsViewers: []
    };
    
    delete duplicatedTask._id;
    delete duplicatedTask.createdAt;
    delete duplicatedTask.updatedAt;
    
    onTaskCreate(duplicatedTask);
    toast('success', t('Tarea duplicada'));
    onClose();
  };

  const handleAddTag = (newTag: string) => {
    if (newTag && !localTask.tags?.includes(newTag)) {
      const newTags = [...(localTask.tags || []), newTag];
      onUpdate(task._id, { tags: newTags });
      setLocalTask({ ...localTask, tags: newTags });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = localTask.tags?.filter(tag => tag !== tagToRemove) || [];
    onUpdate(task._id, { tags: newTags });
    setLocalTask({ ...localTask, tags: newTags });
  };

  const handleResponsableChange = (fieldName: string, newValue: string[]) => {
    setTempResponsable(newValue);
  };

  const handleSaveResponsable = async () => {
    await onUpdate(task._id, { responsable: tempResponsable });
    setLocalTask({ ...localTask, responsable: tempResponsable });
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

  const currentStatus = TASK_STATUSES.find(s => s.value === localTask.estado) || TASK_STATUSES[0];
  const currentPriority = TASK_PRIORITIES.find(p => p.value === localTask.prioridad) || TASK_PRIORITIES[1];

  const stripHtml = (html: string): string => {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] mx-4 flex overflow-hidden">
        {/* Panel principal */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4 flex-1">
              {/* Icono de la tarea con Formik para SelectIcon */}
              <Formik
                initialValues={{ icon: localTask.icon || '' }}
                onSubmit={() => {}}
                enableReinitialize
              >
                <Form>
                  <div className="flex items-center justify-center">
                    <SelectIcon 
                      name="icon" 
                      className="scale-125"
                      handleChange={handleIconChange}
                      data={localTask}
                    />
                  </div>
                </Form>
              </Formik>

              {/* Título */}
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

            <div className="flex items-center space-x-2">
              {/* Botón de opciones */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {showMoreMenu && (
                  <ClickAwayListener onClickAway={() => setShowMoreMenu(false)}>
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => {
                          const newValue = !localTask.spectatorView;
                          onUpdate(task._id, { spectatorView: newValue });
                          setLocalTask({ ...localTask, spectatorView: newValue });
                          toast('success', t(newValue ? 'Tarea visible' : 'Tarea oculta'));
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {localTask.spectatorView ? <EyeOff className="w-4 h-4 mr-3" /> : <Eye className="w-4 h-4 mr-3" />}
                        {localTask.spectatorView ? t('Ocultar') : t('Mostrar')}
                      </button>
                      <button
                        onClick={() => toast('warning', t('Flujo de trabajo en desarrollo'))}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <GitBranch className="w-4 h-4 mr-3" />
                        {t('Flujo de trabajo')}
                      </button>
                      <button
                        onClick={handleDuplicate}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Copy className="w-4 h-4 mr-3" />
                        {t('Duplicar')}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast('success', t('Enlace copiado'));
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Link className="w-4 h-4 mr-3" />
                        {t('Copiar enlace')}
                      </button>
                      <button
                        onClick={() => {
                          const newValue = !localTask.estatus;
                          onUpdate(task._id, { estatus: newValue });
                          setLocalTask({ ...localTask, estatus: newValue });
                          toast('success', t(newValue ? 'Tarea bloqueada' : 'Tarea desbloqueada'));
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {localTask.estatus ? <Unlock className="w-4 h-4 mr-3" /> : <Lock className="w-4 h-4 mr-3" />}
                        {localTask.estatus ? t('Desbloquear') : t('Bloquear')}
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          if (window.confirm(t('¿Estás seguro de eliminar esta tarea?'))) {
                            onDelete(task._id);
                            onClose();
                          }
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-3" />
                        {t('Eliminar')}
                      </button>
                    </div>
                  </ClickAwayListener>
                )}
              </div>

              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
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
                              onClick={() => handleStatusChange(status.value)}
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
                              onClick={() => handlePriorityChange(priority.value)}
                              className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                            >
                              <Flag className={`w-4 h-4 mr-3 ${priority.color.replace('bg-', 'text-')}`} />
                              <span>{priority.label}</span>
                            </button>
                          ))}
                        </div>
                      </ClickAwayListener>
                    )}
                  </div>
                </div>
              </div>

            {/* Asignados */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{t('Asignados')}</span>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  {editingResponsable ? (
                    <div className="flex items-center space-x-2">
                    <Formik
                    initialValues={{ responsable: tempResponsable }}
                    enableReinitialize
                    onSubmit={() => {}}
                    >
                    <Form>
                      <ResponsableSelector
                        name="responsable"
                        value={tempResponsable}
                        handleChange={handleResponsableChange}
                        disable={false}
                      />
                    </Form>
                    </Formik>
                      <button
                        onClick={handleSaveResponsable}
                        className="px-3 py-1 bg-primary text-white rounded text-sm"
                      >
                        {t('Guardar')}
                      </button>
                      <button
                        onClick={() => {
                          setEditingResponsable(false);
                          setTempResponsable(localTask.responsable || []);
                        }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm"
                      >
                        {t('Cancelar')}
                      </button>
                    </div>
                  ) : (
                    <>
<div className="flex items-center flex-wrap gap-2">
  {(localTask.responsable || []).map((resp, idx) => {
    // Busca información del usuario o grupo, si aplica
    const userInfo = GruposResponsablesArry.find(
      (el) => el.title?.toLowerCase() === resp?.toLowerCase()
    ) || [user, event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])].find(
      (el) => el?.displayName?.toLowerCase() === resp?.toLowerCase()
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
                          onUpdate(task._id, { fecha });
                          setLocalTask({ ...localTask, fecha });
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

                  {/* Duración */}
                  {editingField === 'duracion' ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        value={tempValue || ''}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => handleFieldSave('duracion')}
                        onKeyDown={(e) => handleKeyPress(e, 'duracion')}
                        className="w-20 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                      <span className="text-sm text-gray-600">min</span>
                    </div>
                  ) : (
                    <span
                      className="text-sm cursor-pointer hover:text-primary"
                      onClick={() => handleFieldClick('duracion', localTask.duracion)}
                    >
                      {localTask.duracion ? `${localTask.duracion} min` : t('Sin duración')}
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
                        className="ml-2 hover:text-red opacity-0 group-hover:opacity-100 transition-opacity"
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
                  {/* Descripción Tarea larga */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        {t('Descripción Tarea larga')}
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
                          value={customDescription}
                          onChange={(e) => setCustomDescription(e.target.value)}
                          className="w-full min-h-[200px] resize-none border-0 focus:ring-0 focus:outline-none"
                          placeholder={t('Escribe una descripción detallada...')}
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <button
                            onClick={() => {
                              setCustomDescription(task.tips || '');
                              setEditingDescription(false);
                            }}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                          >
                            {t('Cancelar')}
                          </button>
                          <button
                            onClick={() => {
                              onUpdate(task._id, { tips: customDescription });
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
                        onClick={() => setEditingDescription(true)}
                      >
                        {customDescription ? (
                          <Interweave
                            className="text-sm text-gray-700"
                            content={customDescription}
                            matchers={[new UrlMatcher('url'), new HashtagMatcher('hashtag')]}
                          />
                        ) : (
                          <p className="text-sm text-gray-400">{t('Haz clic para agregar una descripción...')}</p>
                        )}
                      </div>
                    )}
                    
                    {customDescription && !editingDescription && (
                      <button
                        onClick={() => setEditingDescription(!editingDescription)}
                        className="text-sm text-primary hover:text-primary/80 mt-2"
                      >
                        {editingDescription ? t('Cerrar') : t('Mostrar 11 más')}
                      </button>
                    )}
                  </div>

                {/* Adjuntos */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">{t('Adjuntos')}</h4>
                    
                    {editingAttachments ? (
                      <div>
                        <Formik
                        initialValues={{ attachments: localTask.attachments || [] }}
                        onSubmit={() => {}}
                        >
                        <Form>
                        <InputAttachments
                          name="attachments"
                          itinerarioID={itinerario._id}
                          task={task}
                          onChange={(e) => {
                            // Si e.target.files existe, conviértelo a array de FileData
                            const files = Array.from(e.target.files || []).map(file => ({
                              name: file.name,
                              size: file.size,
                              type: file.type,
                              // ...otros campos que uses en FileData
                              file,
                            }));
                            onUpdate(task._id, { attachments: files });
                            setLocalTask({ ...localTask, attachments: files });
                          }}
                        />
                          </Form>
                    </Formik>
                        <button
                          onClick={() => setEditingAttachments(false)}
                          className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                          {t('Cerrar')}
                        </button>
                      </div>
                    ) : (
                      <>
                        {(localTask.attachments || []).length > 0 ? (
                          <div className="space-y-2 mb-4">
                            {localTask.attachments.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 group cursor-pointer"
                                onClick={() => {
                                  downloadFile(storage, `${task._id}//${file.name}`)
                                    .catch(() => toast("error", t("Error al descargar")));
                                }}
                              >
                                <div className="flex items-center space-x-3">
                                  <Paperclip className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">{file.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {Math.round(file.size / 1024)} KB
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <CgSoftwareDownload className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div 
                            className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-300"
                            onClick={() => setEditingAttachments(true)}
                          >
                            <p className="text-sm text-gray-500 mb-2">
                              {t('Suelta los archivos aquí para')} <span className="text-primary">{t('subir')}</span>
                            </p>
                          </div>
                        )}
                        
                        {(localTask.attachments || []).length > 0 && (
                          <button
                            onClick={() => setEditingAttachments(true)}
                            className="text-sm text-primary hover:text-primary/80"
                          >
                            {t('Gestionar archivos')}
                          </button>
                        )}
                      </>
                    )}
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
              <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>
          </div>

          {/* Lista de comentarios */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {comments.map((comment, idx) => (
              <ListComments
                key={comment._id}
                id={comment._id}
                itinerario={itinerario}
                task={task}
                item={comment}
                tempPastedAndDropFiles={tempPastedAndDropFiles}
              />
            ))}
            
            {comments.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t('No hay comentarios aún')}</p>
              </div>
            )}
          </div>

          {/* Input de comentarios */}
            <div className="border-t border-gray-200 bg-white w-full min-h-[105px] max-h-70 overflow-visible px-4 py-2">
            <InputComments
              itinerario={itinerario}
              task={task}
              tempPastedAndDropFiles={tempPastedAndDropFiles || []}
              setTempPastedAndDropFiles={setTempPastedAndDropFiles}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;