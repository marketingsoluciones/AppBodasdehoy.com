import React, { FC, useState } from 'react';
import { Task, Itinerary, OptionsSelect } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { EventContextProvider } from "../../../context/EventContext";
import { AuthContextProvider } from "../../../context";
import { NewAttachmentsEditor } from "../VistaTabla/NewAttachmentsEditor";
import { formatTime, calculateEndTime, minutesToReadableFormat, readableFormatToMinutes } from './TaskNewUtils';
import { Clock, PlayCircle, StopCircle } from 'lucide-react';
import { TitleTask } from './TitleTask';
import { AssignedTask } from './AssignedTask';
import { TagsTask } from './TagsTask';
import { DescriptionTask } from './DescriptionTask';

interface TaskMinimalViewProps {
  task: Task;
  itinerario: Itinerary;
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
  isSelect: boolean;
}

export const TaskMinimalView: FC<TaskMinimalViewProps> = ({
  task,
  itinerario,
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
  isSelect,
  ...props
}) => {
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationInput, setDurationInput] = useState('');

  return (
    <div {...props} className={`w-full bg-white shadow-lg px-6 py-3 space-y-2  rounded-xl outline ${isSelect ? "outline-2 outline-primary" : "outline-[1px] outline-gray-200"}`}>
      {/* Header reducido con botones de optionsItineraryButtonBox (excepto 'link' y 'flow') */}
      <div className="flex items-center justify-between mb-4">
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
          task={task}
        />
        {/* Botones de optionsItineraryButtonBox (excepto 'link' y 'flow') */}
        {optionsItineraryButtonBox && optionsItineraryButtonBox.length > 0 && (
          <div className="flex items-center bg-gray-50 rounded-lg p-0.5 ml-4">
            {optionsItineraryButtonBox
              .filter(option => option.value !== 'link' && option.value !== 'flow' && option.value !== 'share' && option.value !== 'flujo')
              .map((option, idx) => {
                let icon = option.icon;
                if (option.getIcon && typeof option.getIcon === 'function') {
                  if (option.value === 'status') {
                    icon = option.getIcon(task.spectatorView);
                  }
                }
                let isActive = false;
                let activeColorClass = '';
                let hoverColorClass = '';
                switch (option.value) {
                  case 'status':
                    isActive = task.spectatorView;
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
      <AssignedTask
        canEdit={canEdit}
        editingResponsable={editingResponsable}
        setEditingResponsable={setEditingResponsable}
        tempResponsable={tempResponsable}
        setTempResponsable={setTempResponsable}
        task={task}
        handleUpdate={handleUpdate}
      />
      {/* Indicadores de hora inicio y fin (solo visuales) */}
      {task.fecha && task.duracion && (
        <div className="flex items-center space-x-6 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <PlayCircle className="w-5 h-5 text-green-600" />
            <div>
              <span className="text-xs text-gray-500 block">{t('Inicio')}</span>
              <span className="text-sm font-medium text-gray-900">{formatTime(task.fecha)}</span>
            </div>
          </div>
          <div className="w-px h-8 bg-gray-300"></div>
          <div className="flex items-center space-x-2">
            <StopCircle className="w-5 h-5 text-red-600" />
            <div>
              <span className="text-xs text-gray-500 block">{t('Final')}</span>
              <span className="text-sm font-medium text-gray-900">{calculateEndTime(task.fecha, task.duracion as number)}</span>
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
            className={`text-sm ${canEdit ? 'cursor-pointer text-gray-700 hover:text-gray-900' : 'cursor-default text-gray-600'}`}
            onClick={() => {
              if (canEdit) {
                setEditingDuration(true);
                setDurationInput(minutesToReadableFormat(task.duracion as number));
              } else {
                ht();
              }
            }}
            title={canEdit ? "Haz clic para editar duración" : "No tienes permisos para editar"}
          >
            {minutesToReadableFormat(task.duracion as number)}
          </span>
        )}
      </div>
      {/* Etiquetas */}
      <TagsTask
        canEdit={canEdit}
        task={task}
        handleRemoveTag={handleRemoveTag}
        handleAddTag={handleAddTag}
        handleFieldCancel={handleFieldCancel}
        handleFieldClick={handleFieldClick}
        editingField={editingField}
      />
      {/* Descripción larga con Editor Rico */}
      <DescriptionTask
        canEdit={canEdit}
        task={task}
        editingDescription={editingDescription}
        setEditingDescription={setEditingDescription}
        customDescription={customDescription}
        setCustomDescription={setCustomDescription}
        handleUpdate={handleUpdate}
        ht={ht}
      />
      {/* Adjuntos */}
      <div>
        <h4 className="text-xs font-medium text-gray-700">{t('Adjuntos')}</h4>
        <NewAttachmentsEditor
          attachments={task.attachments || []}
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