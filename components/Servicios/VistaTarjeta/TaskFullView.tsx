import React, { FC, useState, useRef, useEffect } from 'react';
import { Task, Itinerary, OptionsSelect, Comment } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { EventContextProvider } from "../../../context/EventContext";
import { AuthContextProvider } from "../../../context";
import { InputComments } from "../Utils/InputComments"
import { ListComments } from "../Utils/ListComments"
import { NewAttachmentsEditor } from "../VistaTabla/NewAttachmentsEditor";
import { TASK_STATUSES, TASK_PRIORITIES } from '../VistaTabla/NewTypes';
import { formatTime, formatDate, minutesToReadableFormat, readableFormatToMinutes } from './TaskNewUtils';
import ClickAwayListener from "react-click-away-listener";
import { useToast } from "../../../hooks/useToast";
import { TempPastedAndDropFile } from "../../Itinerario/MicroComponente/ItineraryPanel";
import { MessageSquare, Calendar, Clock, Flag, ChevronDown, Copy, Link, Trash2, Bell, Eye, EyeOff } from 'lucide-react';
import { TitleTask } from './TitleTask';
import { AssignedTask } from './AssignedTask';
import { TagsTask } from './TagsTask';
import { DescriptionTask } from './DescriptionTask';

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
  isSelect: boolean;
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
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationInput, setDurationInput] = useState('');

  const currentStatus = TASK_STATUSES.find(s => s.value === localTask.estado) || TASK_STATUSES[0];
  const currentPriority = TASK_PRIORITIES.find(p => p.value === localTask.prioridad) || TASK_PRIORITIES[1];

  // Auto-scroll al agregar nuevos comentarios
  useEffect(() => {
    if (comments.length > previousCountComments) {
      setTimeout(() => {
        const commentsContainer = document.getElementById('comments-container');
        if (commentsContainer) {
          commentsContainer.scrollTo({
            top: commentsContainer.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
    setPreviousCountComments(comments.length);
  }, [comments, previousCountComments]);

  return (
    <div {...props} className="w-full bg-white rounded-lg shadow-lg">
      <div id="task-container" className={`flex min-h-[600px] h-full rounded-xl outline ${props.isSelect ? "outline-2 outline-primary" : "outline-[1px] outline-gray-200"}`}>
        {/* Panel principal */}
        <div id='container-left' className="flex md:w-[75%] flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-1 border-b border-gray-200">
            <TitleTask
              canEdit={canEdit}
              showIconSelector={showIconSelector}
              setShowIconSelector={setShowIconSelector}
              handleIconChange={handleIconChange}
              ht={ht}
              setTempValue={setTempValue}
              handleFieldSave={handleFieldSave}
              handleKeyPress={handleKeyPress}
              handleFieldClick={handleFieldClick}
              editingField={editingField}
              tempValue={tempValue}
              tempIcon={tempIcon}
              localTask={localTask}
            />
            {/* Botones de acción integrados - OCULTOS sin permisos */}
            {canEdit &&
              <div className="flex items-center">
                <div className="flex items-center bg-gray-50 rounded-lg p-0.5 mr-2">
                  <div className="relative group">
                    <button
                      onClick={() => {
                        const newValue = !localTask.spectatorView;
                        handleUpdate('spectatorView', newValue);
                        toast('success', t(newValue ? 'Tarea visible' : 'Tarea oculta'));
                      }}
                      className={`relative p-1.5 rounded-md transition-all duration-200 ${localTask.spectatorView
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
                      {localTask.spectatorView &&
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                      }
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
                {(optionsItineraryButtonBox && optionsItineraryButtonBox.length > 0) &&
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
                                className={`relative p-1.5 rounded-md transition-all duration-200 ${isActive
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
                                {isActive &&
                                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${option.value === 'status' ? 'bg-primary' :
                                      option.value === 'flujo' ? 'bg-purple-500' :
                                        'bg-blue-500'
                                      } opacity-75`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${option.value === 'status' ? 'bg-primary' :
                                      option.value === 'flujo' ? 'bg-purple-500' :
                                        'bg-blue-500'
                                      }`}></span>
                                  </span>
                                }
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
                }
                {/* Menú de más opciones - OCULTO sin permisos */}
                {/*                 <div className="relative">
                  <button
                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${showMoreOptions ? 'bg-gray-100 text-gray-700' : 'hover:bg-gray-100 text-gray-500'
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
                </div> */}
              </div>
            }
          </div>
          {/* Contenido principal */}
          <div className="flex-1 px-6 py-2 space-y-2">
            {/* Fila de Estado y Prioridad */}
            <div className="flex items-center space-x-4">
              {/* Estado */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600">{t('Estado')}</span>
                <div className="relative">
                  <button
                    onClick={() => canEdit ? setShowStatusDropdown(!showStatusDropdown) : ht()}
                    className={`px-3 py-1 rounded text-white text-sm flex items-center space-x-1 ${currentStatus.color} ${canEdit ? 'hover:opacity-80 cursor-pointer' : 'opacity-70 cursor-not-allowed'
                      }`}
                    title={canEdit ? "Cambiar estado" : "No tienes permisos para editar"}
                  >
                    <span>{currentStatus.label}</span>
                    {canEdit && <ChevronDown className="w-3 h-3" />}
                  </button>
                  {(showStatusDropdown && canEdit) &&
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
                  }
                </div>
              </div>
              {/* Prioridad */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600">{t('Prioridad')}</span>
                <div className="relative">
                  <button
                    onClick={() => canEdit ? setShowPriorityDropdown(!showPriorityDropdown) : ht()}
                    className={`px-3 py-1 rounded text-white text-sm flex items-center space-x-1 ${currentPriority.color} ${canEdit ? 'hover:opacity-80 cursor-pointer' : 'opacity-70 cursor-not-allowed'
                      }`}
                    title={canEdit ? "Cambiar prioridad" : "No tienes permisos para editar"}
                  >
                    <Flag className="w-3 h-3" />
                    <span>{currentPriority.label}</span>
                    {canEdit && <ChevronDown className="w-3 h-3" />}
                  </button>
                  {(showPriorityDropdown && canEdit) &&
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
                            <Flag className={`w-4 h-4 mr-3 ${priority.value === 'alta' ? 'text-[#ef4444]' :
                              priority.value === 'media' ? 'text-yellow-500' :
                                'text-gray-400'
                              }`} />
                            <span>{priority.label}</span>
                          </button>
                        ))}
                      </div>
                    </ClickAwayListener>
                  }
                </div>
              </div>
            </div>
            {/* Asignados con NewResponsableSelector */}
            <AssignedTask
              canEdit={canEdit}
              editingResponsable={editingResponsable}
              setEditingResponsable={setEditingResponsable}
              tempResponsable={tempResponsable}
              setTempResponsable={setTempResponsable}
              localTask={localTask}
              handleUpdate={handleUpdate}
            />
            {/* Fechas con duración y hora */}
            <div className="bg-red flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{t('Fecha y hora')}</span>
              </div>
              <div className="flex items-center space-x-4">
                {editingField === 'fecha'
                  ? <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={tempValue ? tempValue : ''}
                      onChange={(e) => setTempValue(e.target.value)}
                      onBlur={() => handleFieldSave('fecha')}
                      onKeyDown={(e) => handleKeyPress(e, 'fecha')}
                      className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                  : <span
                    className={`text-sm ${canEdit ? 'cursor-pointer hover:text-primary' : 'cursor-default opacity-60'}`}
                    onClick={() => {
                      if (canEdit) {
                        // Formatear la fecha correctamente para el input tipo date
                        if (localTask.fecha) {
                          const date = new Date(localTask.fecha);
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          handleFieldClick('fecha', `${year}-${month}-${day}`);
                        } else {
                          handleFieldClick('fecha', '');
                        }
                      } else {
                        ht();
                      }
                    }}
                    title={canEdit ? "Haz clic para editar fecha" : "No tienes permisos para editar"}
                  >
                    {localTask.fecha ? formatDate(localTask.fecha) : t('Sin fecha')}
                  </span>
                }
                {editingField === 'hora'
                  ? <input
                    type="time"
                    value={tempValue || ''}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => {
                      if (localTask.fecha && tempValue) {
                        const fecha = new Date(localTask.fecha);
                        const [hours, minutes] = tempValue.split(':');
                        fecha.setHours(parseInt(hours), parseInt(minutes));
                        // Convertir a ISO string o al formato que espere tu backend
                        handleUpdate('fecha', fecha.toISOString());
                      }
                      setEditingField(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (localTask.fecha && tempValue) {
                          const fecha = new Date(localTask.fecha);
                          const [hours, minutes] = tempValue.split(':');
                          fecha.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                          handleUpdate('fecha', fecha.toISOString());
                          setEditingField(null);
                        }
                      } else {
                        handleKeyPress(e, 'hora');
                      }
                    }}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                  : <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span
                      className={`text-sm ${canEdit ? 'cursor-pointer hover:text-primary' : 'cursor-default opacity-60'}`}
                      onClick={() => canEdit ? handleFieldClick('hora', localTask.fecha ? formatTime(localTask.fecha) : '') : ht()}
                      title={canEdit ? "Haz clic para editar hora" : "No tienes permisos para editar"}
                    >
                      {localTask.fecha ? formatTime(localTask.fecha) : t('Sin hora')}
                    </span>
                  </div>
                }
                {/* Duración mejorada con conversor */}
                {editingDuration
                  ? <div className="flex items-center space-x-1">
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
                  : <span
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
                }
              </div>
            </div>
            {/* NUEVA SECCIÓN: Indicadores de hora inicio y fin (SOLO VISUALES) */}
            {/*               {(localTask.fecha && localTask.duracion) && 
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
              } */}
            {/* Etiquetas */}
            <TagsTask
              canEdit={canEdit}
              localTask={localTask}
              handleRemoveTag={handleRemoveTag}
              handleAddTag={handleAddTag}
              handleFieldCancel={handleFieldCancel}
              handleFieldClick={handleFieldClick}
              editingField={editingField}
            />
            {/* Sección de Detalles */}

            {/* Descripción larga con Editor */}
            <DescriptionTask
              canEdit={canEdit}
              localTask={localTask}
              editingDescription={editingDescription}
              setEditingDescription={setEditingDescription}
              customDescription={customDescription}
              setCustomDescription={setCustomDescription}
              handleUpdate={handleUpdate}
              ht={ht}
            />
            {/* Adjuntos mejorados */}
            <NewAttachmentsEditor
              attachments={localTask.attachments || []}
              onUpdate={(files) => handleUpdate('attachments', files)}
              taskId={task?._id}
              eventId={event?._id}
              itinerarioId={itinerario?._id}
              readOnly={!canEdit}
            />

          </div>
        </div>
        {/* Panel lateral - Chat/Comentarios */}
        <div id="container-right" className="w-96 flex flex-col bg-gray-50 h-full max-h-[750px] overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{t('Actividad')}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{comments.length} {t('comentarios')}</span>
                <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
            </div>
          </div>

          <div
            id="comments-container"
            ref={commentsContainerRef}
            className="flex-1 overflow-y-auto min-h-0"
          >
            {comments.length === 0
              ? <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t('No hay comentarios aún')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('Sé el primero en comentar')}</p>
                </div>
              </div>
              : <div className="flex flex-col h-full">
                {/* Spacer para empujar los comentarios hacia abajo cuando hay pocos */}
                <div className="flex-1 min-h-0" />

                {/* Lista de comentarios */}
                <div className="space-y-2 p-4 flex-shrink-0">
                  {comments.map((comment) => (
                    <div key={comment._id} className="relative group">
                      <ListComments
                        id={comment._id}
                        itinerario={itinerario}
                        task={task}
                        item={comment}
                        tempPastedAndDropFiles={tempPastedAndDropFiles}
                      />
                      {canEdit &&
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded shadow-sm hover:bg-gray-100"
                          title={t('Eliminar comentario')}
                        >
                          <Trash2 className="w-4 h-4 text-gray-500 hover:text-[#ef4444]" />
                        </button>
                      }
                    </div>
                  ))}
                </div>
              </div>
            }
          </div>

          <div className="border-t border-gray-200 bg-white flex-shrink-0">
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
      </div>
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
        `}
      </style>
    </div>
  );
};