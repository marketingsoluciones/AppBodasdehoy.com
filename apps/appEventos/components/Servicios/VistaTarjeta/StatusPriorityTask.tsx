import React, { FC, useState } from 'react';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { TASK_STATUSES, TASK_PRIORITIES } from '../VistaTabla/NewTypes';
import { Flag, ChevronDown } from 'lucide-react';
import ClickAwayListener from "react-click-away-listener";
import { isStudioPathname } from '../../../utils/studioPaths';

interface StatusPriorityTaskProps {
  task: Task;
  canEdit: boolean;
  handleUpdate: (field: string, value: any) => Promise<void>;
  ht: () => void;
  isMobile?: boolean;
}

export const StatusPriorityTask: FC<StatusPriorityTaskProps> = ({
  task,
  canEdit,
  handleUpdate,
  ht,
  isMobile
}) => {
  const { t } = useTranslation();

  // Estados locales para los dropdowns
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  // Obtener el estado y prioridad actual
  const currentStatus = TASK_STATUSES.find(s => s.value === task.estado) || TASK_STATUSES[0];
  const currentPriority = TASK_PRIORITIES.find(p => p.value === task.prioridad) || TASK_PRIORITIES[1];

  // Píldoras de tareastarjetacerradaabierta.html: Estado sobre #3A3A42 en blanco y
  // Prioridad con la paleta de su nivel, ambas radio 9 y 600/12. La clase de color de
  // TASK_STATUSES/PRIORITIES es Tailwind, así que aquí se mapea a los hex del diseño.
  const isStudio = typeof window !== "undefined"
    && isStudioPathname(window.location.pathname)
    && new URLSearchParams(window.location.search).get("studio") !== "legacy";
  const PRIO_HEX: Record<string, [string, string]> = {
    alta: ["#D83E7C", "#FBE3ED"], media: ["#8F6E14", "#FDF6DE"], baja: ["#2FB37E", "#E4F5EE"],
  };
  const [prioFg, prioBg] = PRIO_HEX[String(currentPriority.value)] ?? PRIO_HEX.media;
  const labelStudio: React.CSSProperties = { font: "500 12px Poppins", color: "#8a8a90" };
  const pillStudio = (bg: string, fg: string): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 9,
    cursor: canEdit ? "pointer" : "default", background: bg, color: fg, font: "600 12px Poppins",
    border: "none",
  });

  return (
    <div className="flex items-center justify-between md:justify-start space-x-4 ">
      {/* Estado */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-600" style={isStudio ? labelStudio : undefined}>{t('Estado')}</span>
        <div className="relative">
          <button
            onClick={() => canEdit ? setShowStatusDropdown(!showStatusDropdown) : ht()}
            style={isStudio ? pillStudio("#3A3A42", "#fff") : undefined}
            className={isStudio ? "" : `px-3  rounded text-white ${isMobile ? "text-[13px]" : "text-sm py-1"} flex items-center space-x-1 ${currentStatus.color} ${canEdit ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
              }`}
            title={canEdit ? "Cambiar estado" : "No tienes permisos para editar"}
          >
            <span>{t(currentStatus.label)}</span>
            {canEdit && (isStudio
              ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
              : <ChevronDown className="w-3 h-3" />)}
          </button>
          {(showStatusDropdown && canEdit) &&
            <ClickAwayListener onClickAway={() => setShowStatusDropdown(false)}>
              <div className={`absolute mt-2 ${isMobile ? "" : "w-48"} bg-white border border-gray-200 rounded-lg shadow-lg z-50`}>
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
        <span className="text-xs text-gray-600" style={isStudio ? labelStudio : undefined}>{t('Prioridad')}</span>
        <div className="relative">
          <button
            onClick={() => canEdit ? setShowPriorityDropdown(!showPriorityDropdown) : ht()}
            style={isStudio ? pillStudio(prioBg, prioFg) : undefined}
            className={isStudio ? "" : `px-3  rounded text-white ${isMobile ? "text-[13px]" : "text-sm py-1"} flex items-center space-x-1 ${currentPriority.color} ${canEdit ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
              }`}
            title={canEdit ? "Cambiar prioridad" : "No tienes permisos para editar"}
          >
            {isStudio
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4M5 4h12l-2.5 4L17 12H5" /></svg>
              : <Flag className="w-3 h-3" />}
            <span>{t(currentPriority.label)}</span>
            {canEdit && (isStudio
              ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
              : <ChevronDown className="w-3 h-3" />)}
          </button>
          {(showPriorityDropdown && canEdit) &&
            <ClickAwayListener onClickAway={() => setShowPriorityDropdown(false)}>
              <div className={`absolute mt-2 ${isMobile ? "w-32 right-0" : " w-48"} bg-white border border-gray-200 rounded-lg shadow-lg z-50 `}>
                {TASK_PRIORITIES.map(priority => (
                  <button
                    key={priority.value}
                    onClick={() => {
                      handleUpdate('prioridad', priority.value);
                      setShowPriorityDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    <Flag className={`w-4 h-4 mr-3 ${priority.value === 'alta' ? 'text-red-500' :
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
