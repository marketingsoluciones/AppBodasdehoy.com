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
import { useSearchParams } from "next/navigation";
import { ImageAvatar } from "../../Utils/ImageAvatar";
import { GruposResponsablesArry } from "../Utils/ResponsableSelector";
import { cleanResponsables } from "./TaskNewUtils";

interface TaskMinimalViewProps {
  task: Task;
  itinerario: Itinerary;
  canEdit: boolean;
  handleUpdate: (field: string, value: any) => Promise<void>;
  optionsItineraryButtonBox?: OptionsSelect[];
  isSelect: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onDuplicate?: () => void;
  gripDraggable?: boolean;
  onGripDragStart?: (e: React.DragEvent) => void;
}

export const TaskMinimalView: FC<TaskMinimalViewProps> = ({
  task,
  itinerario,
  canEdit,
  handleUpdate,
  optionsItineraryButtonBox,
  isSelect,
  isExpanded,
  onToggleExpand,
  onDuplicate,
  gripDraggable,
  onGripDragStart,
  ...props
}) => {
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const { user } = AuthContextProvider()
  const [isAllowed, ht] = useAllowed()
  const owner = user?.uid === event?.usuario_id
  const [showAttachments, setShowAttachments] = useState(false);

  // Resumen de horario para la cabecera colapsada (mismo criterio de pared-en-Z
  // que usa el resto del itinerario: dígitos UTC).
  const pad = (n: number) => String(n).padStart(2, "0");
  const startD = task?.fecha ? new Date(task.fecha) : null;
  const hasTime = !!startD && !isNaN(startD.getTime()) && task?.horaActiva !== false;
  const startStr = hasTime ? `${pad(startD!.getUTCHours())}:${pad(startD!.getUTCMinutes())}` : null;
  const durMin = Number(task?.duracion) || 0;
  const endD = hasTime ? new Date(startD!.getTime() + durMin * 60000) : null;
  const endStr = endD ? `${pad(endD.getUTCHours())}:${pad(endD.getUTCMinutes())}` : null;
  const durStr = durMin ? [Math.floor(durMin / 60) ? `${Math.floor(durMin / 60)}h` : "", durMin % 60 ? `${durMin % 60}m` : ""].filter(Boolean).join(" ") : null;
  const horarioResumen = hasTime ? `${startStr}${endStr ? ` – ${endStr}` : ""}${durStr ? ` · ${durStr}` : ""}` : null;
  const resolveUserInfo = (resp: string) =>
    GruposResponsablesArry.find((el) => el.title?.toLowerCase() === resp?.toLowerCase())
    || [user, event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])].find((el) => {
      const displayName = el?.displayName || el?.email || 'Sin nombre';
      return displayName.toLowerCase() === resp?.toLowerCase();
    });

  // Rediseño studio (gate ?studio, default ON): tarjeta completa fiel a
  // tarjetatareaitinerario.html (.tarea). Solo /itinerario; los campos internos
  // ya usan `primary` (rosa) y layout en caja. Rollback ?studio=legacy.
  const searchParams = useSearchParams()
  const isStudio = searchParams.get("studio") !== "legacy"
    && (typeof window !== "undefined" && window.location.pathname === "/itinerario")

  // Acciones visibles en la cabecera (ojo · borrar · candado): mismo filtro que
  // legacy. Precalculado para poder marcar la última (sin borde derecho).
  const headerActions = (optionsItineraryButtonBox || [])
    .filter(option => option.value !== 'link' && option.value !== 'flow' && option.value !== 'share' && option.value !== 'flujo')

  // Resumen para la cabecera (horario + asignados), fiel a tarjetatareaitinerario_2.html (.t-resumen).
  const responsables: string[] = cleanResponsables(task?.responsable);
  const resumenText = [horarioResumen, responsables.length ? responsables.join(", ") : null].filter(Boolean).join(" · ");
  // Etiquetas ya usadas en el itinerario, para el autocompletar (datalist).
  const tagSuggestions = Array.from(new Set(
    (Array.isArray(itinerario?.tasks) ? itinerario.tasks : [])
      .flatMap((tk: any) => Array.isArray(tk?.tags) ? tk.tags : [])
      .filter(Boolean)
  )) as string[];

  const runHeaderOption = (option: OptionsSelect) => {
    if (owner) { if (typeof option.onClick === "function") option.onClick(task, itinerario); }
    else if (task.estatus || task.estatus == null) { if (typeof option.onClick === "function") option.onClick(task, itinerario); }
  };
  const optOjo = headerActions.find(o => o.value === "status");
  const optBorrar = headerActions.find(o => o.value === "delete");
  const optCandado = headerActions.find(o => o.value === "estatus");
  const tBtn = (extra = "") => `w-[34px] h-8 flex items-center justify-center hover:bg-[#FCE7F0] hover:text-[#EF5B94] transition-colors ${extra}`;

  // ── Rediseño studio: tarjeta con cabecera unificada (colapsada/expandida) ──
  if (isStudio) {
    return (
      <div {...props} className={`w-full bg-white rounded-2xl border-[1.5px] px-[26px] py-[22px] ${isSelect ? "border-[#EF5B94]" : "border-[#F3B6CE]"}`}>
        {/* CABECERA (ambos estados) */}
        <div className="flex items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* asa de arrastre (visual; reordenar pendiente de backend) */}
            <span title={t("Arrastra para reordenar")} draggable={gripDraggable} onDragStart={onGripDragStart} className="hidden md:flex items-center text-[#c4c4cc] cursor-grab active:cursor-grabbing flex-none -ml-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" /></svg>
            </span>
            <TitleTask
              canEdit={canEdit}
              handleUpdate={handleUpdate}
              task={task}
              owner={owner}
              subtitle={resumenText || null}
            />
          </div>
          {/* grupo de acciones: cerrada = solo flecha limpia (fiel al HTML); abierta = acciones */}
          <div className={`flex items-center rounded-[10px] overflow-hidden flex-none ${isExpanded ? "bg-white border-[1.5px] border-[#E7E7EA]" : ""}`}>
            {isExpanded && <>
            {optOjo && (
              <button onClick={() => runHeaderOption(optOjo)} title={t("Visible para invitados · clic para ocultar")} className={tBtn("border-r border-[#f0f0f2] text-[#8a8a90]")}>
                <span className="flex" style={{ transform: "scale(0.85)" }}>{optOjo.getIcon ? optOjo.getIcon(task.spectatorView) : optOjo.icon}</span>
              </button>
            )}
            {optBorrar && (
              <button onClick={() => runHeaderOption(optBorrar)} title={t("Eliminar tarea (pide confirmación)")} className={tBtn("border-r border-[#f0f0f2] text-[#8a8a90]")}>
                <span className="flex" style={{ transform: "scale(0.85)" }}>{optBorrar.icon}</span>
              </button>
            )}
            {onDuplicate && (
              <button onClick={() => { if (owner || task.estatus || task.estatus == null) onDuplicate(); }} title={t("Duplicar tarea")} className={tBtn("border-r border-[#f0f0f2] text-[#8a8a90]")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
              </button>
            )}
            {optCandado && (
              <button onClick={() => runHeaderOption(optCandado)} title={t("Bloquear tarea (impide editarla)")} className={tBtn("border-r border-[#f0f0f2] text-[#8a8a90]")}>
                <span className="flex" style={{ transform: "scale(0.85)" }}>{optCandado.getIcon ? optCandado.getIcon(task.estatus) : optCandado.icon}</span>
              </button>
            )}
            </>}
            <button onClick={onToggleExpand} title={isExpanded ? t("Contraer tarea") : t("Expandir tarea")} className={tBtn("text-[#EF5B94]")}>
              {isExpanded
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 15l-6-6-6 6" /></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>}
            </button>
          </div>
        </div>

        {/* DETALLE (solo expandido) */}
        {isExpanded && (
          <div className="mt-4 flex flex-col gap-3.5">
            <AssignedTask canEdit={canEdit} task={task} handleUpdate={handleUpdate} owner={owner} />
            <TimeDurationContainer task={task} canEdit={canEdit} handleUpdate={handleUpdate} owner={owner} />
            <TagsTask canEdit={canEdit} task={task} handleUpdate={handleUpdate} owner={owner} suggestions={tagSuggestions} />
            <DescriptionTask canEdit={canEdit} task={task} handleUpdate={handleUpdate} owner={owner} />
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
        )}
      </div>
    );
  }

  return (
    <div {...props} className={`w-full cursor-default ${isStudio
      ? `bg-white rounded-2xl px-[26px] py-[22px] border-[1.5px] ${isSelect ? "border-[#EF5B94]" : "border-[#F3B6CE]"}`
      : `bg-white shadow-lg px-6 py-3 space-y-2 rounded-xl outline ${isSelect ? "outline-2 outline-primary" : "outline-[1px] outline-gray-200"}`}`}>
      {/* Header reducido con botones de optionsItineraryButtonBox (excepto 'link' y 'flow') */}
      <div className={isStudio ? "flex items-center gap-2 mb-4" : "flex items-center justify-between mb-4"}>
        <TitleTask
          canEdit={canEdit}
          handleUpdate={handleUpdate}
          task={task}
          owner={owner}
        />
        {/* Botones de optionsItineraryButtonBox (excepto 'link' y 'flow') */}
        {optionsItineraryButtonBox && optionsItineraryButtonBox.length > 0 && (
          <div className={isStudio ? "flex items-center bg-white border-[1.5px] border-[#E7E7EA] rounded-[10px] overflow-hidden ml-4" : "flex items-center bg-gray-50 rounded-lg p-0.5 ml-4"}>
            {headerActions
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
                /* let isActive = false;
                let activeColorClass = '';
                let hoverColorClass = ''; */
                /* switch (option.value) {
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
                } */
                return (
                  <div key={idx} className="h-full">
                    <button
                      onClick={() => {
                        if (owner) {
                          if (typeof option.onClick === 'function') {
                            option.onClick(task, itinerario);
                          }
                        } else {
                          if (task.estatus || task.estatus == null) {
                            if (typeof option.onClick === 'function') {
                              option.onClick(task, itinerario);
                            }
                          }
                        }
                      }}
                      className={isStudio
                        ? `relative w-[34px] h-8 flex items-center justify-center text-[#8a8a90] hover:bg-[#FCE7F0] hover:text-[#EF5B94] transition-colors ${idx < headerActions.length - 1 ? 'border-r border-[#f0f0f2]' : ''}`
                        : `relative p-1.5 rounded-md transition-all duration-200 text-gray-400  ${option.value === 'delete' ? 'border-x rounded-none' : ''}`}
                      title={t(option.title || option.value || '')}
                      disabled={option.idDisabled}
                    >
                      <span className="flex items-center justify-center" style={{ transform: 'scale(0.8)' }}>{icon}</span>
                    </button>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                      {t(option.title || option.value || '')}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
        {isStudio && (
          <button onClick={onToggleExpand} title={t('Contraer')} className="ml-1 flex-none text-[#8a8a90] hover:text-[#EF5B94] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 15l-6-6-6 6" /></svg>
          </button>
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
        owner={owner}
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
        {isStudio
          ? <div className="flex items-center gap-[7px] font-semibold text-[12.5px] text-[#a0a0a8] mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.5l-8.5 8.5a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8" /></svg>
              {t('Adjuntos')}
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#f2f2f4] text-[#8a8a90] text-[10.5px] font-bold">{task.attachments?.length || 0}</span>
            </div>
          : <h4 className="text-xs font-medium text-gray-700">{t('Adjuntos')}</h4>}
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