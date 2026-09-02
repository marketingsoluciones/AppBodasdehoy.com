import React, { FC, useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Task, Itinerary, OptionsSelect, Comment } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { EventContextProvider } from "../../../context/EventContext";
import { ListComments } from "../Utils/ListComments"
import { NewAttachmentsEditor } from "../VistaTabla/NewAttachmentsEditor";
import { TempPastedAndDropFile } from "../../Itinerario/MicroComponente/ItineraryPanel";
import { MessageSquare, Calendar, Trash2, Bell, } from 'lucide-react';
import { TitleTask } from './TitleTask';
import { AssignedTask } from './AssignedTask';
import { TagsTask } from './TagsTask';
import { DescriptionTask } from './DescriptionTask';
import { DateTask } from './DateTask';
import { TimeTask } from './TimeTask';
import { DurationTask } from './DurationTask';
import { IntegrateButtonsBox } from './IntegrateButtonsBox';
import { ItineraryButtonBox } from './ItineraryButtonBox';
import { StatusPriorityTask } from './StatusPriorityTask';
import { TASK_STATUSES } from '../VistaTabla/NewTypes';
import { AuthContextProvider } from '../../../context';
import { InputCommentsOld } from '../Utils/InputCommentsOld';
import { useDateTime } from '../../../hooks/useDateTime';
import { IoIosArrowRoundBack } from "react-icons/io";
import { isStudioPathname } from "../../../utils/studioPaths";

interface TaskFullViewProps {
  task: Task;
  itinerario: Itinerary;
  canEdit: boolean;
  handleUpdate: (field: string, value: any) => Promise<void>;
  handleDuplicate: () => Promise<void>;
  handleDeleteComment: (commentId: string) => Promise<void>;
  ht: () => void;
  optionsItineraryButtonBox?: OptionsSelect[];
  tempPastedAndDropFiles?: TempPastedAndDropFile[];
  setTempPastedAndDropFiles?: any;
  selectTask: string;
  /** Tareas: la tarjeta se pliega a una fila (fiel a tareastarjetacerradaabierta.html).
   *  Antes TaskFullView SIEMPRE pintaba la tarjeta completa —solo Itinerario tenía
   *  colapsado, vía TaskMinimalView—, así que el botón de expandir/contraer de la fila
   *  no tenía sobre qué actuar en este módulo. */
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

/** Pastilla blanca con icono y etiqueta (fiel al HTML). Con on=false no envuelve nada,
 *  así la vista anterior queda exactamente igual. */
const PillCampo: FC<{ on: boolean; icono: React.ReactNode; etiqueta: string; children: React.ReactNode }> = ({ on, icono, etiqueta, children }) => {
  if (!on) return <>{children}</>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#fff", border: "1px solid #ececef", borderRadius: 9, padding: "5px 10px", flex: "none" }}>
      {icono}
      <span style={{ font: "500 12px Poppins", color: "#8a8a90", whiteSpace: "nowrap" }}>{etiqueta}</span>
      {children}
    </div>
  );
};

export const TaskFullView: FC<TaskFullViewProps> = ({
  task,
  itinerario,
  canEdit,
  handleUpdate,
  handleDuplicate,
  handleDeleteComment,
  ht,
  optionsItineraryButtonBox,
  isExpanded = true,
  onToggleExpand,
  tempPastedAndDropFiles,
  setTempPastedAndDropFiles,
  selectTask,
  ...props
}) => {
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const [previousCountComments, setPreviousCountComments] = useState(0);
  const { user } = AuthContextProvider();
  const owner = user?.uid === event?.usuario_id;
  const [showAttachments, setShowAttachments] = useState(false);
  const { dateTimeFormated, timeFormated } = useDateTime();
  const [editingDate, setEditingDate] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showChat, setShowChat] = useState(false);
  const ruta = usePathname();

  const ValidationEdit = useMemo(() => {
    if (["/itinerario"].includes(ruta)) {
      if (owner) {
        return true;
      } else {
        if (task.estatus || task.estatus === null) {
          if (canEdit) {
            return true;
          } else {
            return false;
          }
        }
        return false;
      }
    } else {
      return true;
    }
  }, [ruta, owner, task.estatus, canEdit]);


  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)

    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Auto-scroll al agregar nuevos comentarios
  useEffect(() => {
    if (task.comments.length > previousCountComments) {
      setTimeout(() => {
        const commentsContainer = document.getElementById(`comments-container-${task._id}`);
        if (commentsContainer) {
          commentsContainer.scrollTo({
            top: commentsContainer.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
    setPreviousCountComments(task.comments.length);
  }, [task.comments.length, previousCountComments, task._id]);

  // Rediseño studio (fiel a tareasvistatarjeta.html): Estado, Prioridad y Responsables
  // comparten fila, y Fecha/Hora/Duración van dentro de una caja gris.
  const isStudio = typeof window !== "undefined"
    && isStudioPathname(window.location.pathname)
    && new URLSearchParams(window.location.search).get("studio") !== "legacy";

  // ── TARJETA CERRADA (fiel a tareastarjetacerradaabierta.html) ──
  if (isStudio && !isExpanded) {
    const st = TASK_STATUSES.find((x: any) => x.value === task.estado) || TASK_STATUSES[0];
    const DOT: Record<string, string> = {
      pending: "#3A3A42", in_progress: "#EF5B94", completed: "#2FB37E", blocked: "#D83E7C",
    };
    // El chip toma el color de SU estado; antes iba siempre en rosa, así que una tarea
    // completada mostraba un chip "Completado" rosa en vez de verde.
    const CHIP: Record<string, [string, string]> = {
      pending: ["#f0f0f2", "#3A3A42"], in_progress: ["#FCE7F0", "#D83E7C"],
      completed: ["#E4F5EE", "#2FB37E"], blocked: ["#FBE3ED", "#D83E7C"],
    };
    const dot = DOT[st.value] ?? "#8a8a90";
    const [chipBg, chipFg] = CHIP[st.value] ?? CHIP.pending;
    const done = st.value === "completed";
    const tz = (event as any)?.timeZone;
    const meta = [
      task.fecha ? new Date(task.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
      task.fecha && task.horaActiva ? timeFormated(task.fecha, tz) : null,
      task.duracion ? (task.duracion >= 60 ? `${Math.round(task.duracion / 60)} h` : `${task.duracion} min`) : null,
    ].filter(Boolean).join(" · ");

    return (
      <div {...props} style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, fontFamily: "'Poppins',sans-serif" }} className="w-full">
        <div
          onClick={() => onToggleExpand?.()}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 22px", cursor: "pointer", borderRadius: 16 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span
              title={t("Marcar completada", { defaultValue: "Marcar completada" })}
              onClick={(e) => { e.stopPropagation(); if (!canEdit) { ht(); return; } handleUpdate("estado", done ? "pending" : "completed"); }}
              style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${done ? "#2FB37E" : "#d8d8dd"}`, background: done ? "#2FB37E" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", cursor: "pointer" }}
            >
              {done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
            </span>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: dot, flex: "none" }} />
            <span style={{ font: "600 14px Poppins", color: done ? "#a0a0a8" : "#3A3A42", textDecoration: done ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {task.descripcion || t("Sin título", { defaultValue: "Sin título" })}
            </span>
            {!!meta && <span style={{ font: "400 12px Poppins", color: "#a0a0a8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: 12, background: chipBg, color: chipFg, font: "600 11px Poppins", whiteSpace: "nowrap" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor" }} />
              {t(st.label)}
            </span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      {...props}
      style={isStudio ? { background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, fontFamily: "'Poppins',sans-serif" } : undefined}
      className={`w-full cursor-default ${isStudio ? "" : "bg-white rounded-lg shadow-lg"}  ${isMobile ? "scale-90" : ""}`}>
      <div id="task-container" className={`flex ${isStudio ? "rounded-2xl" : "h-[553px] rounded-xl outline"} ${isStudio ? "" : (selectTask === task._id ? "outline-2 outline-primary" : "outline-[1px] outline-gray-200")}`}>
        {/* Panel principal */}
        {(!isMobile || !showChat) &&
          <div id='container-left' className="flex-1 flex flex-col h-full relative">
            <div className={isStudio
              ? "w-full flex items-center justify-between gap-3 px-7 pt-6"
              : "w-full flex items-center justify-between py-0.5 border-b border-gray-200"}>
              <TitleTask
                canEdit={canEdit}
                handleUpdate={handleUpdate}
                task={task}
                owner={owner}
              />
              <div className="flex items-center space-x-2 mr-2 md:mr-0">
                {isMobile && (
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className={`absolute -bottom-4 -right-1 p-2 rounded-full transition-all duration-200 ${showChat
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    title={showChat ? t('Ocultar comentarios') : t('Ver comentarios')}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {task.comments.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {task.comments.length}
                      </span>
                    )}
                  </button>
                )}
                {canEdit &&
                  <div
                    className="flex items-center"
                    style={isStudio ? { background: "#fff", border: "1.5px solid #E7E7EA", borderRadius: 10, overflow: "hidden", flex: "none", marginRight: 0 } : undefined}
                  >
                    <IntegrateButtonsBox
                      task={task}
                      handleUpdate={handleUpdate}
                      handleDuplicate={handleDuplicate}
                      itinerario={itinerario}
                    />
                    {(optionsItineraryButtonBox && optionsItineraryButtonBox.length > 0) &&
                      <ItineraryButtonBox
                        optionsItineraryButtonBox={optionsItineraryButtonBox}
                        task={task}
                        itinerario={itinerario}
                      />
                    }
                  </div>}
              </div>
            </div>
            <div className={isStudio ? "flex flex-col flex-1 px-7 pt-4 pb-6 gap-4" : "flex flex-col flex-1 px-6 py-2 space-y-2  "}>
              <div style={isStudio ? { display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" } : undefined}>
                <StatusPriorityTask
                  isMobile={isMobile}
                  task={task}
                  canEdit={canEdit}
                  handleUpdate={handleUpdate}
                  ht={ht}
                />
                <AssignedTask
                  canEdit={canEdit}
                  task={task}
                  handleUpdate={handleUpdate}
                  owner={owner}
                  inline={isStudio}
                />
              </div>
              <div
                className={isStudio ? "" : "flex items-center space-x-4 group relative"}
                style={isStudio ? { background: "#fafafa", borderRadius: 12, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, overflowX: "auto" } : undefined}
              >
                {!isStudio && <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                </div>}
                <div className={isStudio ? "flex items-center gap-2 flex-wrap" : "h-5 flex items-center space-x-4"}>
                  {/* Pastillas de tareastarjetacerradaabierta.html: cada campo en su caja blanca
                      con etiqueta. Se ENVUELVEN los componentes existentes en vez de
                      reescribirlos, para no tocar su edición ni sus selectores. */}
                  <PillCampo
                    on={isStudio}
                    icono={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>}
                    etiqueta={t('Fecha', { defaultValue: 'Fecha' })}
                  >
                    <DateTask
                      handleUpdate={handleUpdate}
                      canEdit={canEdit}
                      task={task}
                      setEditing={setEditingDate}
                      editing={editingDate}
                      ValidationEdit={ValidationEdit}
                    />
                  </PillCampo>
                  <PillCampo
                    on={isStudio}
                    icono={<span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2FB37E", flex: "none" }} />}
                    etiqueta={t('Hora', { defaultValue: 'Hora' })}
                  >
                    <TimeTask
                      handleUpdate={handleUpdate}
                      canEdit={canEdit}
                      task={task}
                      setEditing={setEditingTime}
                      editing={editingTime}
                      ValidationEdit={ValidationEdit}
                    />
                  </PillCampo>
                  <PillCampo
                    on={isStudio}
                    icono={<span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8a8a90", flex: "none" }} />}
                    etiqueta={t('Duración', { defaultValue: 'Duración' })}
                  >
                    <DurationTask
                      handleUpdate={handleUpdate}
                      canEdit={canEdit}
                      task={task}
                      ValidationEdit={ValidationEdit}
                    />
                  </PillCampo>
                </div>
                {task.fecha && <div className={`hidden absolute bottom-full left-6 transform -translate-y-1/4 mb-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:delay-300 whitespace-nowrap z-10 md:flex flex-col ${editingDate || editingTime ? "hidden" : ""}`}>
                  <span className='font-bold text-yellow-500'>{dateTimeFormated(task.fecha, event?.timeZone)}</span>
                  <span className='text-gray-100'>{dateTimeFormated(task.fecha, "UTC")}</span>
                  <span className='text-gray-100'>{dateTimeFormated(task.fecha, Intl.DateTimeFormat().resolvedOptions().timeZone)} {`(${t("hora local")})`}</span>
                </div>}
              </div>
              {/* Etiquetas: tareasvistatarjeta.html no las contempla. Se ocultan en studio
                  (no se borran: ?studio=legacy las devuelve, y los datos siguen intactos). */}
              {!isStudio && <TagsTask
                canEdit={canEdit}
                task={task}
                handleUpdate={handleUpdate}
                owner={owner}
              />}
              <DescriptionTask
                canEdit={canEdit}
                task={task}
                handleUpdate={handleUpdate}
                owner={owner}
                showAttachments={showAttachments}
              />
              <NewAttachmentsEditor
                handleUpdate={(files) => handleUpdate('attachments', files)}
                task={task}
                itinerarioId={itinerario?._id}
                canEdit={canEdit}
                owner={owner}
                showAttachments={showAttachments}
                setShowAttachments={setShowAttachments}
              />
            </div>
          </div>
        }
        {/* Panel lateral - Chat/Comentarios */}
        {(!isMobile || showChat) && (
          <div id="container-right" className={`${isMobile && showChat ? "w-full" : (isStudio ? "w-[300px]" : "w-[350px]")} flex flex-col ${isStudio ? "bg-white border-l-[1px] border-[#f0f0f2]" : "bg-gray-50 border-l-[1px] border-gray-200"} ${isStudio ? "" : "h-full max-h-[554px]"} pb-2`}>
            <div className="h-[49px] px-2 border-b border-gray-200 bg-white flex items-center">
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isMobile && <button
                    onClick={() => setShowChat(!showChat)}
                  >
                    <IoIosArrowRoundBack className="w-9 h-9 " />
                  </button>}
                  <div className={isStudio ? "" : "text-xl font-semibold"} style={isStudio ? { font: "700 15px Poppins", color: "#3A3A42" } : undefined}>{t('Actividad')}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={isStudio ? "" : "text-sm text-gray-500"} style={isStudio ? { font: "400 11.5px Poppins", color: "#a0a0a8" } : undefined}>{task.comments.length} {t('comentarios')}</span>
                  <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                </div>
              </div>
            </div>
            <div id={`comments-container-${task._id}`} className="flex-1 overflow-y-auto min-h-0">
              {task.comments.length === 0
                ? <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className={isStudio ? "w-10 h-10 mx-auto mb-2.5" : "w-12 h-12 text-gray-300 mx-auto mb-2"} style={isStudio ? { color: "#c4c4cc", strokeWidth: 1.5 } : undefined} />
                    <p className={isStudio ? "" : "text-sm text-gray-500"} style={isStudio ? { font: "400 12px Poppins", color: "#a0a0a8" } : undefined}>{t('No hay comentarios')}</p>
                  </div>
                </div>
                : <div className="flex flex-col h-full">
                  <div className="space-y-2 flex-shrink-0">
                    {task.comments.map((comment) => (
                      <div key={comment._id} className="relative group">
                        <ListComments
                          id={comment._id}
                          itinerario={itinerario}
                          task={task}
                          item={comment}
                          tempPastedAndDropFiles={tempPastedAndDropFiles}
                        />
                        {comment.uid === user?.uid &&
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded shadow-sm hover:bg-gray-100"
                            title={t('Eliminar comentario')}
                          >
                            <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                          </button>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              }
            </div>
            <div className="border-t border-gray-200 bg-white flex-shrink-0">
              <InputCommentsOld
                itinerario={itinerario}
                task={task}
                tempPastedAndDropFiles={tempPastedAndDropFiles || []}
                setTempPastedAndDropFiles={setTempPastedAndDropFiles}
                disabled={false}
              />
            </div>
          </div>
        )}
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
