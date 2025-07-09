import React, { FC, useState, useRef, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import { Task, Itinerary, OptionsSelect, Comment } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { EventContextProvider } from "../../../context/EventContext";
import { AuthContextProvider } from "../../../context";
import { ImageAvatar } from "../../Utils/ImageAvatar";
import { InputComments } from "./InputComments"
import { ListComments } from "./ListComments"
import { NewAttachmentsEditor } from "./NewAttachmentsEditor";
import { ClickUpResponsableSelector } from './NewResponsableSelector';
import { NewSelectIcon } from './NewSelectIcon';
import { PermissionWrapper } from './TaskNewComponents';
import { TASK_STATUSES, TASK_PRIORITIES } from './NewTypes';
import { 
  formatTime, 
  formatDate, 
  calculateEndTime, 
  minutesToReadableFormat, 
  readableFormatToMinutes, 
  stripHtml, 
  formatTextWithLineLimit 
} from './TaskNewUtils';
import ClickAwayListener from "react-click-away-listener";
import { useToast } from "../../../hooks/useToast";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { TempPastedAndDropFile } from "./ItineraryPanel";
import {
  X, MessageSquare, Tag, Calendar, Clock, User, Flag, ChevronDown, Copy, Link, 
  MoreHorizontal, Trash2, Archive, Bell, Plus, Eye, EyeOff, AlertCircle, 
  PlayCircle, StopCircle
} from 'lucide-react';
import { SelectIcon } from './SelectIcon';
import { GruposResponsablesArry } from './ResponsableSelector';

interface TaskFullViewProps {
  task: Task;
  itinerario: Itinerary;
  localTask: any;
  tempIcon: string;
  canEdit: boolean;
  showIconSelector: boolean;
  setShowIconSelector: (show: boolean) => void;
  handleIconChange: (icon: string) => void;
  handleUpdate: (field: string, value: any) => Promise<void>;
  handleFieldClick: (field: string, value: any) => void;
  handleFieldSave: (field: string) => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent, field: string) => void;
  handleFieldCancel: () => void;
  handleAddTag: (tag: string) => void;
  handleRemoveTag: (tag: string) => void;
  handleDuplicate: () => Promise<void>;
  handleCopyLink: (task: Task) => void;
  handleDeleteComment: (commentId: string) => Promise<void>;
  handleCommentAdded: (comment: Comment) => void;
  ht: () => void;
  editingField: string | null;
  tempValue: string;
  setTempValue: (value: string) => void;
  setEditingField: (field: string | null) => void;
  editingResponsable: boolean;
  setEditingResponsable: (editing: boolean) => void;
  tempResponsable: string[];
  setTempResponsable: (value: string[]) => void;
  editingDescription: boolean;
  setEditingDescription: (editing: boolean) => void;
  customDescription: string;
  setCustomDescription: (value: string) => void;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  optionsItineraryButtonBox?: OptionsSelect[];
  tempPastedAndDropFiles?: TempPastedAndDropFile[];
  setTempPastedAndDropFiles?: any;
}

export const TaskFullView: FC<TaskFullViewProps> = ({
  task,
  itinerario,
  localTask,
  tempIcon,
  canEdit,
  showIconSelector,
  setShowIconSelector,
  handleIconChange,
  handleUpdate,
  handleFieldClick,
  handleFieldSave,
  handleKeyPress,
  handleFieldCancel,
  handleAddTag,
  handleRemoveTag,
  handleDuplicate,
  handleCopyLink,
  handleDeleteComment,
  handleCommentAdded,
  ht,
  editingField,
  tempValue,
  setTempValue,
  setEditingField,
  editingResponsable,
  setEditingResponsable,
  tempResponsable,
  setTempResponsable,
  editingDescription,
  setEditingDescription,
  customDescription,
  setCustomDescription,
  comments,
  setComments,
  optionsItineraryButtonBox,
  tempPastedAndDropFiles,
  setTempPastedAndDropFiles,
  ...props
}) => {
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const { user } = AuthContextProvider();
  const toast = useToast();
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const [previousCountComments, setPreviousCountComments] = useState(0);
  
  // Estados locales para la vista completa
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationInput, setDurationInput] = useState('');

  const currentStatus = TASK_STATUSES.find(s => s.value === localTask.estado) || TASK_STATUSES[0];
  const currentPriority = TASK_PRIORITIES.find(p => p.value === localTask.prioridad) || TASK_PRIORITIES[1];

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
                <div className="flex items-center bg-gray-50 rounded-lg p-0.5 mr-2">
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
                      {localTask.spectatorView === true ? (
                        <Eye className="w-4 h-4 transition-transform duration-200" />
                      ) : (
                        <EyeOff className="w-4 h-4 transition-transform duration-200" />
                      )}
                      {localTask.spectatorView && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                      )}
                    </button>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                      {t(localTask.spectatorView ? 'Visible' : 'Oculta')}
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
                      onClick={() => handleCopyLink(task)}
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

                          switch (option.value) {
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
                      className={`text-sm ${canEdit ? 'cursor-pointer hover:text-primary' : 'cursor-default opacity-60'}`}
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
                        className={`text-sm ${canEdit ? 'cursor-pointer hover:text-primary' : 'cursor-default opacity-60'}`}
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
              </div>

              {/* NUEVA SECCIÓN: Indicadores de hora inicio y fin (SOLO VISUALES) */}
              {localTask.fecha && localTask.duracion && (
                <div className="flex items-center space-x-6 bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <PlayCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <span className="text-xs text-gray-500 block">{t('Inicio')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatTime(localTask.fecha)}
                      </span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="flex items-center space-x-2">
                    <StopCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <span className="text-xs text-gray-500 block">{t('Final')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {calculateEndTime(localTask.fecha, localTask.duracion as number)}
                      </span>
                    </div>
                  </div>
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
                        className={`border border-gray-200 rounded-lg p-4 min-h-[100px] ${
                          canEdit ? 'cursor-pointer hover:border-gray-300' : 'cursor-default opacity-60'
                        }`}
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
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{t('Actividad')}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{comments.length} {t('comentarios')}</span>
                <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
            </div>
          </div>

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
};