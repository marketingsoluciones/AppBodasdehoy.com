import React, { FC, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import { Task, Itinerary, OptionsSelect } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { EventContextProvider } from "../../../context/EventContext";
import { AuthContextProvider } from "../../../context";
import { ImageAvatar } from "../../Utils/ImageAvatar";
import { NewAttachmentsEditor } from "./NewAttachmentsEditor";
import { ClickUpResponsableSelector } from './NewResponsableSelector';
import { NewSelectIcon } from './NewSelectIcon';
import { PermissionWrapper } from './TaskNewComponents';
import { formatTime, calculateEndTime, minutesToReadableFormat, readableFormatToMinutes, stripHtml, formatTextWithLineLimit } from './TaskNewUtils';
import ClickAwayListener from "react-click-away-listener";
import {
  X, Tag, Clock, User, Plus, Eye, EyeOff, PlayCircle, StopCircle
} from 'lucide-react';
import { SelectIcon } from './SelectIcon';
import { GruposResponsablesArry } from './ResponsableSelector';

interface TaskMinimalViewProps {
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
  ht: () => void;
  editingField: string | null;
  tempValue: string;
  setTempValue: (value: string) => void;
  editingResponsable: boolean;
  setEditingResponsable: (editing: boolean) => void;
  tempResponsable: string[];
  setTempResponsable: (value: string[]) => void;
  editingDescription: boolean;
  setEditingDescription: (editing: boolean) => void;
  customDescription: string;
  setCustomDescription: (value: string) => void;
  optionsItineraryButtonBox?: OptionsSelect[];
}

export const TaskMinimalView: FC<TaskMinimalViewProps> = ({
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
  ht,
  editingField,
  tempValue,
  setTempValue,
  editingResponsable,
  setEditingResponsable,
  tempResponsable,
  setTempResponsable,
  editingDescription,
  setEditingDescription,
  customDescription,
  setCustomDescription,
  optionsItineraryButtonBox,
  ...props
}) => {
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const { user } = AuthContextProvider();
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationInput, setDurationInput] = useState('');

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
                switch (option.value) {
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
};