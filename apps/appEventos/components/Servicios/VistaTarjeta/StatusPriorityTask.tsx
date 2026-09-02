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
  // La píldora de Estado también toma el color de SU estado: el HTML muestra "Pendiente"
  // en oscuro, pero completado va en verde y en curso en rosa, como los chips.
  const EST_HEX: Record<string, [string, string]> = {
    pending: ["#fff", "#3A3A42"], in_progress: ["#D83E7C", "#FCE7F0"],
    completed: ["#2FB37E", "#E4F5EE"], blocked: ["#D83E7C", "#FBE3ED"],
  };
  const [estFg, estBg] = EST_HEX[String(currentStatus.value)] ?? EST_HEX.pending;
  const EST_DOT: Record<string, string> = {
    pending: "#3A3A42", in_progress: "#EF5B94", completed: "#2FB37E", blocked: "#D83E7C",
  };
  const menuStudio: React.CSSProperties = {
    position: "absolute", marginTop: 8, zIndex: 50, background: "#fff", borderRadius: 14,
    border: "1px solid #f0f0f2", boxShadow: "0 14px 40px rgba(0,0,0,.14)", padding: 6, minWidth: 176,
  };
  // Compactado respecto al HTML (12px / padding 6-14) para que Estado + Prioridad +
  // Responsables entren en UNA línea con contenido real, sin recortes.
  const labelStudio: React.CSSProperties = { font: "500 11.5px Poppins", color: "#8a8a90", whiteSpace: "nowrap" };
  const pillStudio = (bg: string, fg: string): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 9,
    cursor: canEdit ? "pointer" : "default", background: bg, color: fg, font: "600 11.5px Poppins",
    border: "none", whiteSpace: "nowrap", flex: "none",
  });

  return (
    <div
      style={isStudio ? { display: "flex", alignItems: "center", gap: 14, flex: "none" } : undefined}
      className={isStudio ? "" : "flex items-center justify-between md:justify-start space-x-4 "}>
      {/* Estado */}
      <div className="flex items-center" style={isStudio ? { gap: 7, flex: "none" } : undefined}>
        <span className="text-xs text-gray-600" style={isStudio ? labelStudio : undefined}>{t('Estado')}</span>
        <div className="relative">
          <button
            onClick={() => canEdit ? setShowStatusDropdown(!showStatusDropdown) : ht()}
            style={isStudio ? pillStudio(estBg, estFg) : undefined}
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
              <div
                style={isStudio ? menuStudio : undefined}
                className={isStudio ? "" : `absolute mt-2 ${isMobile ? "" : "w-48"} bg-white border border-gray-200 rounded-lg shadow-lg z-50`}>
                {TASK_STATUSES.map(status => {
                  const on = status.value === currentStatus.value;
                  return (
                  <button
                    key={status.value}
                    onClick={() => {
                      handleUpdate('estado', status.value);
                      setShowStatusDropdown(false);
                    }}
                    style={isStudio ? { display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "9px 13px", borderRadius: 9, font: "500 13px Poppins", color: on ? EST_DOT[String(status.value)] ?? "#3A3A42" : "#3A3A42", background: on ? (EST_HEX[String(status.value)]?.[1] ?? "transparent") : "transparent", border: "none", cursor: "pointer" } : undefined}
                    className={isStudio ? "" : "flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"}
                  >
                    {isStudio
                      ? <span style={{ width: 9, height: 9, borderRadius: "50%", background: EST_DOT[String(status.value)] ?? "#8a8a90", flex: "none" }} />
                      : <div className={`w-3 h-3 rounded-full ${status.color} mr-3`}></div>}
                    <span>{t(status.label)}</span>
                  </button>
                  );
                })}
              </div>
            </ClickAwayListener>
          }
        </div>
      </div>

      {/* Prioridad */}
      <div className="flex items-center" style={isStudio ? { gap: 7, flex: "none" } : undefined}>
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
              <div
                style={isStudio ? menuStudio : undefined}
                className={isStudio ? "" : `absolute mt-2 ${isMobile ? "w-32 right-0" : " w-48"} bg-white border border-gray-200 rounded-lg shadow-lg z-50 `}>
                {TASK_PRIORITIES.map(priority => (
                  <button
                    key={priority.value}
                    onClick={() => {
                      handleUpdate('prioridad', priority.value);
                      setShowPriorityDropdown(false);
                    }}
                    style={isStudio ? { display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "9px 13px", borderRadius: 9, font: "500 13px Poppins", color: (PRIO_HEX[String(priority.value)] ?? PRIO_HEX.media)[0], background: priority.value === currentPriority.value ? (PRIO_HEX[String(priority.value)] ?? PRIO_HEX.media)[1] : "transparent", border: "none", cursor: "pointer" } : undefined}
                    className={isStudio ? "" : "flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"}
                  >
                    {isStudio
                      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d="M5 21V4M5 4h12l-2.5 4L17 12H5" /></svg>
                      : <Flag className={`w-4 h-4 mr-3 ${priority.value === 'alta' ? 'text-red-500' :
                      priority.value === 'media' ? 'text-yellow-500' :
                        'text-gray-400'
                      }`} />}
                    <span>{t(priority.label)}</span>
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
