import React, { FC, useState } from 'react';
import { Task, Itinerary, OptionsSelect } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { EventContextProvider } from "../../../context/EventContext";
import { AuthContextProvider } from "../../../context";
import { NewAttachmentsEditor } from "../VistaTabla/NewAttachmentsEditor";
import { TitleTask } from './TitleTask';
import { AssignedTask } from './AssignedTask';
import { TagsTask } from './TagsTask';
import { DescriptionTask } from './DescriptionTask';
import { TimeDurationContainer } from './TimeDurationContainer';
import { useAllowed } from "../../../hooks/useAllowed";

interface TaskMinimalViewProps {
  task: Task;
  itinerario: Itinerary;
  canEdit: boolean;
  handleUpdate: (field: string, value: any) => Promise<void>;
  optionsItineraryButtonBox?: OptionsSelect[];
  isSelect: boolean;
}

export const TaskMinimalView: FC<TaskMinimalViewProps> = ({
  task,
  itinerario,
  canEdit,
  handleUpdate,
  optionsItineraryButtonBox,
  isSelect,
  ...props
}) => {
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const { user } = AuthContextProvider()
  const [isAllowed, ht] = useAllowed()
  const owner = user?.uid === event?.usuario_id
  const [showAttachments, setShowAttachments] = useState(false);

  return (
    <div {...props} className={`w-full bg-white shadow-lg px-6 py-3 space-y-2  rounded-xl outline cursor-default ${isSelect ? "outline-2 outline-primary" : "outline-[1px] outline-gray-200"}`}>
      {/* Header reducido con botones de optionsItineraryButtonBox (excepto 'link' y 'flow') */}
      <div className="flex items-center justify-between mb-4">
        <TitleTask
          canEdit={canEdit}
          handleUpdate={handleUpdate}
          task={task}
          owner={owner}
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
                  if (option.value === 'estatus') {
                    icon = option.getIcon(task.estatus);
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
                  case 'estatus':
                    isActive = task.estatus;
                    activeColorClass = 'text-primary bg-primary/10';
                    break;
                  default:
                    hoverColorClass = 'hover:text-gray-600 hover:bg-gray-100';
                }
                return (
                  <div key={idx} className="relative group">
                    <button
                      onClick={() => {
                        if (owner) {
                          if (typeof option.onClick === 'function') {
                            option.onClick(task, itinerario);
                          }
                        } else {
                          if (task.estatus) {
                            if (typeof option.onClick === 'function') {
                              option.onClick(task, itinerario);
                            }
                          }
                        }
                      }}
                      className={`relative p-1.5 rounded-md transition-all duration-200 ${isActive ? `${activeColorClass} shadow-sm` : `text-gray-400 ${hoverColorClass}`}`}
                      title={t(option.title || option.value || '')}
                      disabled={option.idDisabled}
                    >
                      <span className="w-4 h-4 flex items-center justify-center" style={{ transform: 'scale(0.8)' }}>{icon}</span>
                      {isActive && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${option.value === 'status' || option.value === 'estatus' ? 'bg-primary' : 'bg-primary'} opacity-75`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${option.value === 'status' || option.value === 'estatus' ? 'bg-primary' : 'bg-primary'}`}></span>
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
        task={task}
        handleUpdate={handleUpdate}
        owner={owner}
      />
      {/* Contenedor integrado de Duración e Indicadores de Hora */}
      <TimeDurationContainer
        task={task}
        canEdit={canEdit}
        handleUpdate={handleUpdate}
      />
      {/* Etiquetas */}
      <TagsTask
        canEdit={canEdit}
        task={task}
        handleUpdate={handleUpdate}
        owner={owner}
      />
      {/* Descripción larga con Editor Rico */}
      <DescriptionTask
        canEdit={canEdit}
        task={task}
        handleUpdate={handleUpdate}
        owner={owner}
      />
      {/* Adjuntos */}
      <div>
        <h4 className="text-xs font-medium text-gray-700">{t('Adjuntos')}</h4>
        <NewAttachmentsEditor
          handleUpdate={(files) => handleUpdate('attachments', files)}
          task={task}
          itinerarioId={itinerario._id}
          canEdit={canEdit}
          owner={owner}
          showAttachments={showAttachments}
          setShowAttachments={setShowAttachments}
        />
      </div>
    </div>
  );
};