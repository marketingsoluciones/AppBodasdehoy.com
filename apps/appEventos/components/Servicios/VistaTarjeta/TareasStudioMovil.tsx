import { FC, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Task, Itinerary } from "../../../utils/Interfaces";
import { useDateTime } from "../../../hooks/useDateTime";
import { TASK_STATUSES, TASK_PRIORITIES } from "../VistaTabla/NewTypes";
import { cleanResponsables } from "./TaskNewUtils";
import { ClickUpResponsableSelector } from "../VistaTabla/NewResponsableSelector";

/**
 * TareasStudioMovil — vista MÓVIL de Tareas fiel a tareasmovil.html (md:hidden).
 * SOLO vista de tarjetas: en el teléfono no hay Tabla ni Tablero. Escritorio intacto.
 *
 * MISMO BACKEND: recibe las tareas y los callbacks de ItineraryPanel (event/api-mcp),
 * no monta su propia carga. Cambiar estado/prioridad/descripción va por handleTaskUpdate,
 * completar por handleUpdate, crear por handleTaskCreate y borrar por deleteTask — los
 * mismos que usa el escritorio.
 *
 * NOTA de color: el HTML móvil usa una paleta propia por estado (Pendiente ámbar,
 * En curso AZUL), distinta a la del escritorio. Se respeta tal cual.
 */

interface Props {
  itinerario: Itinerary;
  tasks: Task[];
  expandedTasks?: Set<string>;
  toggleTaskExpand?: (id: string) => void;
  handleUpdate: (field: string, value: any, taskId?: string) => Promise<void>;
  handleTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  handleTaskCreate: (task: Partial<Task>) => void;
  deleteTask: (task: Task, itinerario: Itinerary) => void;
  title: string;
  event: any;
  itineraries?: Itinerary[];
  onSelectItinerario?: (it: Itinerary) => void;
  onCreateItinerario?: () => void;
}

// Paleta de estados del HTML móvil: [texto, fondo].
const EST_MOV: Record<string, [string, string]> = {
  pending: ["#E0A32B", "#FBF0DA"],
  in_progress: ["#3B82C4", "#E3EFF9"],
  completed: ["#2FB37E", "#E4F5EE"],
  blocked: ["#D83E7C", "#FBE3ED"],
};
const PRIO_MOV: Record<string, string> = { alta: "#D83E7C", media: "#8F6E14", baja: "#2FB37E" };

export const TareasStudioMovil: FC<Props> = ({ itinerario, tasks, expandedTasks, toggleTaskExpand, handleUpdate, handleTaskUpdate, handleTaskCreate, deleteTask, title, event, itineraries, onSelectItinerario, onCreateItinerario }) => {
  const { t } = useTranslation();
  const { utcDateFormated2Digits, timeFormated, utcDateTime, utcTime } = useDateTime();
  const [q, setQ] = useState("");
  const [listMenu, setListMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [respEdit, setRespEdit] = useState<string | null>(null); // _id de la tarea cuyos responsables se editan
  const [prioEdit, setPrioEdit] = useState<string | null>(null); // _id de la tarea cuya prioridad se edita
  const listas = Array.isArray(itineraries) ? itineraries : [];

  // Editar un campo de UNA tarea concreta: local (instantáneo) + API (persiste).
  const editField = (taskId: string, field: string, value: any) => {
    handleTaskUpdate(taskId, { [field]: value } as Partial<Task>);
    handleUpdate(field, value, taskId);
  };

  // Compartir: acción real y autocontenida (Web Share API en móvil, o copiar enlace).
  const compartir = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      const nav: any = typeof navigator !== "undefined" ? navigator : null;
      if (nav?.share) {
        await nav.share({ title: `${t("Tareas")} · ${event?.nombre ?? ""}`.trim(), url });
        return;
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(url);
      }
    } catch {
      /* usuario canceló el diálogo de compartir: sin acción */
    }
  };

  const lista = Array.isArray(tasks) ? tasks : [];
  const term = q.trim().toLowerCase();
  const visibles = lista.filter((tk) => !term || String(tk?.descripcion ?? "").toLowerCase().includes(term));
  const total = lista.length;
  const completadas = lista.filter((tk) => tk.estado === "completed").length;
  const pct = total > 0 ? Math.round((completadas / total) * 100) : 0;

  const estOf = (v?: string) => TASK_STATUSES.find((s: any) => s.value === (v || "pending")) || TASK_STATUSES[0];
  const prioOf = (v?: string) => TASK_PRIORITIES.find((p: any) => p.value === (v || "media")) || TASK_PRIORITIES[0];

  const nuevaTarea = () => handleTaskCreate({ descripcion: t("Nueva tarea"), estado: "pending", prioridad: "media" } as any);

  const fmtFecha = (tk: Task) => tk.fecha ? utcDateFormated2Digits(tk.fecha as any, event?.timeZone) : "";
  const iniciales = (resp: string) => (resp || "?").charAt(0).toUpperCase();

  return (
    <div className="md:hidden" style={{ width: "100%", background: "#F6F5F7", minHeight: "100%", fontFamily: "'Poppins',sans-serif", position: "relative", paddingBottom: 96, overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: ".tm-hs{scrollbar-width:none;-ms-overflow-style:none;}.tm-hs::-webkit-scrollbar{display:none;height:0;}.tm-resp-sheet .w-80{width:100%!important;border:none!important;box-shadow:none!important;border-radius:0!important;}" }} />

      {/* HEADER MÓDULO — borde a borde, unificado (título 19px + TIPO · nombre + borde inferior). */}
      <div style={{ background: "#fff", padding: "13px 16px 12px", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #f0f0f2" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ font: "700 19px Poppins", color: "#3A3A42" }}>{t("Tareas", { defaultValue: "Tareas" })}</div>
            <div style={{ marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              <span style={{ font: "700 10px Poppins", color: "#EF5B94", letterSpacing: ".5px", textTransform: "uppercase" }}>{event?.tipo || "Boda"}</span>
              <span style={{ font: "500 11px Poppins", color: "#8a8a90", marginLeft: 5 }}>· {event?.nombre}</span>
            </div>
          </div>
          <span
            title={t("Buscar")}
            onClick={() => setSearchOpen((v) => { const nv = !v; if (!nv) setQ(""); return nv; })}
            style={{ width: 34, height: 34, borderRadius: "50%", background: searchOpen ? "#FCE7F0" : "#F7F6F8", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", cursor: "pointer", transition: "background .15s" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={searchOpen ? "#EF5B94" : "#3A3A42"} strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          </span>
          <span title={t("Compartir", { defaultValue: "Compartir" })} onClick={compartir} style={{ width: 34, height: 34, borderRadius: "50%", background: "#F7F6F8", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", cursor: "pointer", color: "#EF5B94" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="12" r="2.6" /><circle cx="17.5" cy="5.5" r="2.6" /><circle cx="17.5" cy="18.5" r="2.6" /><path d="M8.3 10.8l6.9-4M8.3 13.2l6.9 4" /></svg>
          </span>
        </div>
        {searchOpen && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #EF5B94", borderRadius: 12, padding: "0 12px", height: 40, marginTop: 12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input id="tm-q" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar tarea", { defaultValue: "Buscar tarea" })} style={{ border: "none", outline: "none", font: "400 12.5px Poppins", color: "#3A3A42", width: "100%", background: "transparent" }} />
            <span onClick={() => { setQ(""); setSearchOpen(false); }} style={{ flex: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={2.2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </span>
          </div>
        )}
      </div>

      {/* SELECTOR DE LISTA + NUEVA (misma lógica que el escritorio, vía props) */}
      {(onSelectItinerario || onCreateItinerario) && (
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "12px 16px 0", zIndex: 15 }}>
          <div onClick={() => setListMenu((v) => !v)} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "#fff", border: "1px solid #f0f0f2", boxShadow: "0 3px 10px rgba(0,0,0,.04)", borderRadius: 12, padding: "11px 14px", cursor: "pointer" }}>
            <span style={{ font: "600 13px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{itinerario?.title || t("Seleccionar lista", { defaultValue: "Seleccionar lista" })}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2.2} strokeLinecap="round" style={{ flex: "none", transform: listMenu ? "rotate(180deg)" : "none", transition: "transform .18s" }}><path d="M6 9l6 6 6-6" /></svg>
          </div>
          {onCreateItinerario && (
            <button onClick={() => { setListMenu(false); onCreateItinerario(); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "11px 14px", borderRadius: 12, border: "1px solid #f0f0f2", boxShadow: "0 3px 10px rgba(0,0,0,.04)", background: "#fff", color: "#EF5B94", cursor: "pointer", font: "600 12px Poppins", flex: "none" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>{t("Nueva", { defaultValue: "Nueva" })}
            </button>
          )}
          {listMenu && (
            <>
              <div onClick={() => setListMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 18 }} />
              <div style={{ position: "absolute", left: 16, right: 16, top: "calc(100% + 6px)", background: "#fff", borderRadius: 13, border: "1px solid #f0f0f2", boxShadow: "0 14px 40px rgba(0,0,0,.14)", padding: 6, zIndex: 20, maxHeight: 280, overflowY: "auto" }}>
                {listas.length === 0 && <div style={{ padding: "11px 13px", font: "500 12px Poppins", color: "#a0a0a8" }}>{t("Sin listas", { defaultValue: "Sin listas" })}</div>}
                {listas.map((item, idx) => (
                  <div key={item?._id || idx} onClick={() => { setListMenu(false); onSelectItinerario?.(item); }} style={{ padding: "11px 13px", borderRadius: 9, font: "600 12.5px Poppins", color: itinerario?._id === item?._id ? "#D83E7C" : "#3A3A42", background: itinerario?._id === item?._id ? "#FCE7F0" : "transparent", cursor: "pointer" }}>{item?.title}</div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TÍTULO + PROGRESO */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 16px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ font: "700 18px Poppins", color: "#3A3A42" }}>{title || itinerario?.title}</div>
        </div>
        <div style={{ width: 44, height: 3, borderRadius: 3, background: "#EF5B94", marginTop: 8 }} />
        <div style={{ font: "500 11px Poppins", color: "#a0a0a8", marginTop: 10 }}>{completadas} {t("de")} {total} {t("completadas", { defaultValue: "completadas" })}</div>
        <div style={{ width: 170, height: 5, borderRadius: 5, background: "#e9e9ec", overflow: "hidden", marginTop: 6 }}>
          <div style={{ height: "100%", borderRadius: 5, background: "#2FB37E", width: `${pct}%`, transition: "width .4s ease" }} />
        </div>
      </div>

      {/* TAREAS */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {visibles.map((tk) => {
          const abierta = expandedTasks ? expandedTasks.has(tk._id) : false;
          const st = estOf(tk.estado);
          const [fg, bg] = EST_MOV[String(st.value)] ?? EST_MOV.pending;
          const done = st.value === "completed";
          const resp = cleanResponsables(tk.responsable)[0];
          const fecha = fmtFecha(tk);

          // Cabecera de la tarjeta (cerrada o abierta comparten la fila superior)
          const cabecera = (
            <div style={{ background: "#fff", border: abierta ? "1px solid #F3B6CE" : "1px solid #f0f0f2", borderRadius: abierta ? "15px 15px 0 0" : 15, boxShadow: abierta ? "none" : "0 3px 10px rgba(0,0,0,.03)", padding: "13px 15px", display: "flex", alignItems: "center", gap: 11, opacity: done && !abierta ? 0.62 : 1, position: "relative", zIndex: 2 }}>
              <span
                onClick={(e) => { e.stopPropagation(); editField(tk._id, "estado", done ? "pending" : "completed"); }}
                style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${done ? "#2FB37E" : "#d8d8dd"}`, background: done ? "#2FB37E" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", cursor: "pointer" }}
              >
                {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg>}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {abierta ? (
                  <input
                    defaultValue={tk.descripcion || ""}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== tk.descripcion) editField(tk._id, "descripcion", v); }}
                    placeholder={t("Título de la tarea", { defaultValue: "Título de la tarea" })}
                    style={{ width: "100%", border: "none", outline: "none", background: "transparent", font: "600 13px Poppins", color: "#3A3A42", padding: 0 }}
                  />
                ) : (
                  <div style={{ font: "600 13px Poppins", color: done ? "#a0a0a8" : "#3A3A42", textDecoration: done ? "line-through" : "none" }}>{tk.descripcion || t("Sin título", { defaultValue: "Sin título" })}</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "600 10px Poppins", color: fg, background: bg, padding: "3px 9px", borderRadius: 11, whiteSpace: "nowrap" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />{t(st.label)}
                  </span>
                  {!!fecha && <span style={{ font: "500 10px Poppins", color: "#8a8a90" }}>{fecha}</span>}
                  {!!resp && <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#EF5B94", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", font: "700 9px Poppins" }}>{iniciales(resp)}</span>}
                </div>
              </div>
              <svg onClick={() => toggleTaskExpand?.(tk._id)} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2.2} strokeLinecap="round" style={{ flex: "none", cursor: "pointer", transform: abierta ? "rotate(180deg)" : "none" }}><path d="M6 9l6 6 6-6" /></svg>
            </div>
          );

          if (!abierta) return <div key={tk._id} onClick={() => toggleTaskExpand?.(tk._id)} style={{ cursor: "pointer" }}>{cabecera}</div>;

          const pr = prioOf(tk.prioridad);
          return (
            <div key={tk._id}>
              {cabecera}
              <div style={{ background: "#fff", border: "1px solid #F3B6CE", borderTop: "none", borderRadius: "0 0 15px 15px", marginTop: -1, padding: "14px 15px 15px", minWidth: 0, overflow: "hidden" }}>
                {/* slider de estados */}
                <div style={{ font: "600 10.5px Poppins", color: "#a0a0a8", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>{t("Estado")}</div>
                <div className="tm-hs" style={{ display: "flex", gap: 7, marginBottom: 13, overflowX: "auto", padding: "2px 0", maxWidth: "100%" }}>
                  {TASK_STATUSES.map((s: any) => {
                    const on = s.value === st.value;
                    const [f, b] = EST_MOV[String(s.value)] ?? EST_MOV.pending;
                    return (
                      <span key={s.value} onClick={() => editField(tk._id, "estado", s.value)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 16, background: on ? b : "#fff", border: `1.5px solid ${on ? f : "#E7E7EA"}`, font: "600 10.5px Poppins", color: on ? f : "#8a8a90", whiteSpace: "nowrap", flex: "none", cursor: "pointer" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />{t(s.label)}
                      </span>
                    );
                  })}
                </div>
                {/* fecha + prioridad (editables) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 13 }}>
                  <div style={{ background: "#faf9fb", borderRadius: 11, padding: "9px 12px" }}>
                    <div style={{ font: "600 9px Poppins", color: "#a0a0a8", letterSpacing: ".5px", textTransform: "uppercase" }}>{t("Fecha")}</div>
                    <input
                      type="date"
                      value={tk.fecha ? utcDateTime(tk.fecha) : ""}
                      onChange={(e) => {
                        const ds = e.target.value;
                        if (!ds) { editField(tk._id, "fecha", null); return; }
                        const time = (tk.fecha && tk.horaActiva !== false) ? utcTime(tk.fecha) : "00:00";
                        editField(tk._id, "fecha", `${ds}T${time}:00.000Z`);
                      }}
                      style={{ width: "100%", border: "none", outline: "none", background: "transparent", font: "600 11.5px Poppins", color: "#3A3A42", padding: 0, marginTop: 2 }}
                    />
                  </div>
                  <div style={{ position: "relative", background: "#faf9fb", borderRadius: 11, padding: "9px 12px" }}>
                    <div style={{ font: "600 9px Poppins", color: "#a0a0a8", letterSpacing: ".5px", textTransform: "uppercase" }}>{t("Prioridad")}</div>
                    <div onClick={() => setPrioEdit(prioEdit === tk._id ? null : tk._id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginTop: 2, cursor: "pointer" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, font: "600 11.5px Poppins", color: PRIO_MOV[String(pr.value)] ?? "#8F6E14" }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor" }} />{t(pr.label)}
                      </span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2.2} strokeLinecap="round" style={{ flex: "none", transform: prioEdit === tk._id ? "rotate(180deg)" : "none", transition: "transform .15s" }}><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                    {prioEdit === tk._id && (
                      <>
                        <div onClick={() => setPrioEdit(null)} style={{ position: "fixed", inset: 0, zIndex: 24 }} />
                        <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)", background: "#fff", borderRadius: 12, border: "1px solid #f0f0f2", boxShadow: "0 14px 40px rgba(0,0,0,.16)", padding: 5, zIndex: 25 }}>
                          {TASK_PRIORITIES.map((p: any) => {
                            const on = p.value === pr.value;
                            const c = PRIO_MOV[String(p.value)] ?? "#8F6E14";
                            return (
                              <div key={p.value} onClick={() => { editField(tk._id, "prioridad", p.value); setPrioEdit(null); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 9, font: "600 12px Poppins", color: c, background: on ? "#FCE7F0" : "transparent", cursor: "pointer" }}>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor" }} />{t(p.label)}
                                {on && <svg style={{ marginLeft: "auto" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2FB37E" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {/* responsables (editable) */}
                <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 7, marginBottom: 13, flexWrap: "wrap" }}>
                  <span style={{ font: "600 10.5px Poppins", color: "#a0a0a8", letterSpacing: ".5px", textTransform: "uppercase" }}>{t("Responsables")}</span>
                  {cleanResponsables(tk.responsable).map((r, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f5f5f7", borderRadius: 14, padding: "3px 11px 3px 3px", font: "500 11px Poppins", color: "#3A3A42" }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#EF5B94", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "700 9px Poppins" }}>{iniciales(r)}</span>{r}
                    </span>
                  ))}
                  <button
                    onClick={() => setRespEdit(respEdit === tk._id ? null : tk._id)}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 11px", borderRadius: 14, background: "#FCE7F0", color: "#D83E7C", font: "600 11px Poppins", border: "none", cursor: "pointer" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    {cleanResponsables(tk.responsable).length > 0 ? t("Editar") : t("Asignar")}
                  </button>
                  {respEdit === tk._id && typeof document !== "undefined" && createPortal(
                    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(30,25,35,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setRespEdit(null)}>
                      <div className="tm-resp-sheet" style={{ width: "100%", maxWidth: 430, background: "#fff", borderRadius: "18px 18px 0 0", padding: "10px 12px 20px", maxHeight: "82vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ width: 38, height: 4, borderRadius: 4, background: "#e2e2e6", margin: "2px auto 8px" }} />
                        <ClickUpResponsableSelector
                          value={Array.isArray(tk.responsable) ? tk.responsable : []}
                          onChange={(newValue) => { editField(tk._id, "responsable", newValue); setRespEdit(null); }}
                          onClose={() => setRespEdit(null)}
                        />
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
                {/* descripción (editable) */}
                <div style={{ font: "600 10.5px Poppins", color: "#a0a0a8", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>{t("Descripción")}</div>
                <textarea
                  defaultValue={tk.tips || ""}
                  onBlur={(e) => { const v = e.target.value; if (v !== (tk.tips || "")) editField(tk._id, "tips", v); }}
                  placeholder={t("Haz clic para agregar una descripción…", { defaultValue: "Haz clic para agregar una descripción…" })}
                  rows={3}
                  style={{ width: "100%", minHeight: 42, border: "1.5px solid #E7E7EA", borderRadius: 11, padding: "10px 13px", font: "400 11.5px/1.6 Poppins", color: "#3A3A42", marginBottom: 13, resize: "vertical", outline: "none", background: "#fff", boxSizing: "border-box" }}
                />
                {/* acciones */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleTaskCreate({ ...tk, _id: undefined, descripcion: `${tk.descripcion} (copia)` } as any)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 10, borderRadius: 11, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 11.5px Poppins", cursor: "pointer" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>{t("Duplicar")}
                  </button>
                  <button onClick={() => deleteTask(tk, itinerario)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 10, borderRadius: 11, background: "#FBE3ED", border: "none", color: "#D83E7C", font: "600 11.5px Poppins", cursor: "pointer" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg>{t("Borrar")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <div style={{ position: "fixed", right: 18, bottom: 24, zIndex: 20 }}>
        <button onClick={nuevaTarea} style={{ display: "flex", alignItems: "center", gap: 7, padding: "13px 18px", borderRadius: 26, background: "#EF5B94", color: "#fff", font: "600 12.5px Poppins", border: "none", cursor: "pointer", boxShadow: "0 10px 26px rgba(239,91,148,.45)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {t("Añadir tarea", { defaultValue: "Añadir tarea" })}
        </button>
      </div>
    </div>
  );
};

export default TareasStudioMovil;
