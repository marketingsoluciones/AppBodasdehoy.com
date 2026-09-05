import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Task, Itinerary } from "../../../utils/Interfaces";
import { useDateTime } from "../../../hooks/useDateTime";
import { TASK_STATUSES, TASK_PRIORITIES } from "../VistaTabla/NewTypes";
import { cleanResponsables } from "./TaskNewUtils";

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
  handleUpdate: (field: string, value: any) => Promise<void>;
  handleTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  handleTaskCreate: (task: Partial<Task>) => void;
  deleteTask: (task: Task, itinerario: Itinerary) => void;
  title: string;
  event: any;
}

// Paleta de estados del HTML móvil: [texto, fondo].
const EST_MOV: Record<string, [string, string]> = {
  pending: ["#E0A32B", "#FBF0DA"],
  in_progress: ["#3B82C4", "#E3EFF9"],
  completed: ["#2FB37E", "#E4F5EE"],
  blocked: ["#D83E7C", "#FBE3ED"],
};
const PRIO_MOV: Record<string, string> = { alta: "#D83E7C", media: "#8F6E14", baja: "#2FB37E" };

export const TareasStudioMovil: FC<Props> = ({ itinerario, tasks, expandedTasks, toggleTaskExpand, handleUpdate, handleTaskUpdate, handleTaskCreate, deleteTask, title, event }) => {
  const { t } = useTranslation();
  const { utcDateFormated2Digits, timeFormated } = useDateTime();
  const [q, setQ] = useState("");
  const [openMenu, setOpenMenu] = useState(false);

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
    <div className="md:hidden" style={{ background: "#F6F5F7", minHeight: "100%", fontFamily: "'Poppins',sans-serif", position: "relative", paddingBottom: 96 }}>
      <style dangerouslySetInnerHTML={{ __html: ".tm-hs{scrollbar-width:none;-ms-overflow-style:none;}.tm-hs::-webkit-scrollbar{display:none;height:0;}" }} />

      {/* HEADER MÓDULO */}
      <div style={{ background: "#fff", padding: "13px 16px 10px", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 10px rgba(0,0,0,.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ font: "700 17px Poppins", color: "#3A3A42" }}>{t("Tareas", { defaultValue: "Tareas" })}</div>
            <div style={{ font: "500 10px Poppins", color: "#a0a0a8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              <span style={{ color: "#EF5B94", fontWeight: 600 }}>{(event?.tipo || "EVENTO").toUpperCase()}</span> · {event?.nombre}
            </div>
          </div>
          <span title={t("Buscar")} onClick={() => { const el = document.getElementById("tm-q"); el?.focus(); }} style={{ width: 34, height: 34, borderRadius: "50%", background: "#F7F6F8", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3A3A42" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #E7E7EA", borderRadius: 12, padding: "0 12px", height: 36, marginTop: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input id="tm-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar tareas…", { defaultValue: "Buscar tareas…" })} style={{ border: "none", outline: "none", font: "400 12.5px Poppins", color: "#3A3A42", width: "100%", background: "transparent" }} />
        </div>
      </div>

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
                onClick={(e) => { e.stopPropagation(); handleUpdate("estado", done ? "pending" : "completed"); }}
                style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${done ? "#2FB37E" : "#d8d8dd"}`, background: done ? "#2FB37E" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", cursor: "pointer" }}
              >
                {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg>}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "600 13px Poppins", color: done ? "#a0a0a8" : "#3A3A42", textDecoration: done ? "line-through" : "none" }}>{tk.descripcion || t("Sin título", { defaultValue: "Sin título" })}</div>
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
              <div style={{ background: "#fff", border: "1px solid #F3B6CE", borderTop: "none", borderRadius: "0 0 15px 15px", marginTop: -1, padding: "14px 15px 15px" }}>
                {/* slider de estados */}
                <div style={{ font: "600 10.5px Poppins", color: "#a0a0a8", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>{t("Estado")}</div>
                <div className="tm-hs" style={{ display: "flex", gap: 7, margin: "0 -15px 13px", overflowX: "auto", padding: "2px 15px" }}>
                  {TASK_STATUSES.map((s: any) => {
                    const on = s.value === st.value;
                    const [f, b] = EST_MOV[String(s.value)] ?? EST_MOV.pending;
                    return (
                      <span key={s.value} onClick={() => handleUpdate("estado", s.value)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 16, background: on ? b : "#fff", border: `1.5px solid ${on ? f : "#E7E7EA"}`, font: "600 10.5px Poppins", color: on ? f : "#8a8a90", whiteSpace: "nowrap", flex: "none", cursor: "pointer" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />{t(s.label)}
                      </span>
                    );
                  })}
                </div>
                {/* fecha + prioridad */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 13 }}>
                  <div style={{ background: "#faf9fb", borderRadius: 11, padding: "9px 12px" }}>
                    <div style={{ font: "600 9px Poppins", color: "#a0a0a8", letterSpacing: ".5px", textTransform: "uppercase" }}>{t("Fecha")}</div>
                    <div style={{ font: "600 11.5px Poppins", color: "#3A3A42" }}>{fecha || t("Sin fecha")}</div>
                  </div>
                  <div style={{ background: "#faf9fb", borderRadius: 11, padding: "9px 12px" }}>
                    <div style={{ font: "600 9px Poppins", color: "#a0a0a8", letterSpacing: ".5px", textTransform: "uppercase" }}>{t("Prioridad")}</div>
                    <div style={{ font: "600 11.5px Poppins", color: PRIO_MOV[String(pr.value)] ?? "#8F6E14" }}>{t(pr.label)}</div>
                  </div>
                </div>
                {/* responsables */}
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 13, flexWrap: "wrap" }}>
                  <span style={{ font: "600 10.5px Poppins", color: "#a0a0a8", letterSpacing: ".5px", textTransform: "uppercase" }}>{t("Responsables")}</span>
                  {cleanResponsables(tk.responsable).map((r, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f5f5f7", borderRadius: 14, padding: "3px 11px 3px 3px", font: "500 11px Poppins", color: "#3A3A42" }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#EF5B94", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "700 9px Poppins" }}>{iniciales(r)}</span>{r}
                    </span>
                  ))}
                </div>
                {/* descripción */}
                <div style={{ font: "600 10.5px Poppins", color: "#a0a0a8", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 7 }}>{t("Descripción")}</div>
                <div style={{ minHeight: 42, border: "1.5px solid #E7E7EA", borderRadius: 11, padding: "10px 13px", font: "400 11.5px/1.6 Poppins", color: tk.tips ? "#3A3A42" : "#b3b3ba", marginBottom: 13 }}>
                  {tk.tips || t("Haz clic para agregar una descripción…", { defaultValue: "Haz clic para agregar una descripción…" })}
                </div>
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
