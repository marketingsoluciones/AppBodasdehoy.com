import React, { FC, useState } from 'react';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { TASK_STATUSES, TASK_PRIORITIES } from '../VistaTabla/NewTypes';
import { Flag, ChevronDown } from 'lucide-react';
import ClickAwayListener from "react-click-away-listener";

interface StatusPriorityTaskProps {
  task: Task;
  canEdit: boolean;
  handleUpdate: (field: string, value: any) => Promise<void>;
  ht: () => void;
}

export const StatusPriorityTask: FC<StatusPriorityTaskProps> = ({
  task,
  canEdit,
  handleUpdate,
  ht
}) => {
  const { t } = useTranslation();

  // Estados locales para los dropdowns
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  // Obtener el estado y prioridad actual
  const currentStatus = TASK_STATUSES.find(s => s.value === task.estado) || TASK_STATUSES[0];
  const currentPriority = TASK_PRIORITIES.find(p => p.value === task.prioridad) || TASK_PRIORITIES[1];

  return (
    <div className="flex items-center space-x-4">
      {/* Estado */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-600">{t('Estado')}</span>
        <div className="relative">
          <button
            onClick={() => canEdit ? setShowStatusDropdown(!showStatusDropdown) : ht()}
            className={`px-3 py-1 rounded text-white text-sm flex items-center space-x-1 ${currentStatus.color} ${canEdit ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
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
            className={`px-3 py-1 rounded text-white text-sm flex items-center space-x-1 ${currentPriority.color} ${canEdit ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
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
  );
}; 