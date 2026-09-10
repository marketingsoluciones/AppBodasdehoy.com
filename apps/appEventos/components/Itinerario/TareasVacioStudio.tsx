import { FC, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from "react-i18next";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { eventDateAtHourZ, getTimeZoneCity } from "../../utils/FormatTime";

/**
 * TareasVacioStudio — estado vacío del módulo Tareas (/servicios, gate ?studio),
 * fiel a tareasvaciodesktop_1.html + tareasvaciomovil.html. Solo visual + creación
 * de la PRIMERA lista reusando el MISMO backend (createItinerario tipo="servicios"
 * + createTask). En DESKTOP la cabecera la pinta <BlockTitle> de la página (no se
 * duplica); en MÓVIL (BlockTitle oculto) esta vista trae su propia cabecera "Tareas".
 */

interface Props {
  event: any;
  setEvent: (updater: any) => void;
  config: any;
  isOwner: boolean;
  pathSlice: string; // "servicios"
}

const TareasVacioStudio: FC<Props> = ({ event, setEvent, config, isOwner, pathSlice }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const tzCity = getTimeZoneCity(event?.timeZone) || "Madrid";

  // Mismo backend que ItinerarioVacioStudio, rama servicios (tipo=pathSlice).
  const handleCreate = async () => {
    if (creating || !event?._id) return;
    setCreating(true);
    try {
      const fechaParsed = event?.fecha ? parseInt(String(event.fecha)) : NaN;
      const f = !isNaN(fechaParsed) && fechaParsed > 0 ? new Date(fechaParsed) : new Date();
      const baseDate = isNaN(f.getTime()) ? new Date() : f;
      const y = baseDate.getUTCFullYear(), m = baseDate.getUTCMonth(), d = baseDate.getUTCDate();

      const r: any = await fetchApiEventos({
        query: queries.createItinerario,
        variables: { evento_id: event._id, itinerario: { title: t("unnamed"), dateTime: new Date(y, m, d, 8, 0), tipo: pathSlice } },
        domain: config.domain,
      });
      const result: any = r?.itinerario || r;
      if (!result || !result._id) {
        toast("error", t("Error al crear itinerario"));
        console.warn("[TareasVacioStudio] createItinerario devolvió null/sin _id", r);
        return;
      }

      const safeList = Array.isArray(event?.listIdentifiers) ? [...event.listIdentifiers] : [];
      const fList = safeList.findIndex((el: any) => el?.table === pathSlice);
      const nextList = fList < 0
        ? [...safeList, { start_Id: result._id, end_Id: result._id, table: pathSlice }]
        : safeList.map((li: any, i: number) => (i === fList ? { ...li, start_Id: result._id, end_Id: result._id } : li));

      let initialTasks: any[] = Array.isArray(result.tasks) ? [...result.tasks] : [];
      try {
        const fecha6 = eventDateAtHourZ(event?.fecha, 6, 0);
        const cr: any = await fetchApiEventos({
          query: queries.createTask,
          variables: {
            evento_id: event._id,
            development: config.development || "bodasdehoy",
            task: { itinerario_id: result._id, descripcion: "Servicio nuevo" },
          },
          domain: config.domain,
        });
        const ct: any = cr?.task || cr;
        if (ct?._id) {
          initialTasks = [...initialTasks, { ...ct, fecha: ct.fecha ? new Date(ct.fecha) : fecha6, estatus: true }];
          fetchApiEventos({
            query: queries.editTask,
            variables: { evento_id: event._id, itinerario_id: result._id, task_id: ct._id, development: config.development || "bodasdehoy", updates: { estatus: true } },
          }).catch((e: any) => console.warn("[TareasVacioStudio] editTask estatus falló:", e?.message ?? e));
        }
      } catch (taskErr: any) {
        console.warn("[TareasVacioStudio] createTask inicial falló:", taskErr?.message ?? taskErr);
      }

      const newItinerario = { ...result, tasks: initialTasks, viewers: result.viewers ?? [] };
      setEvent((prev: any) => ({
        ...prev,
        listIdentifiers: nextList,
        itinerarios_array: [...(Array.isArray(prev?.itinerarios_array) ? prev.itinerarios_array : []), newItinerario],
      }));
      try { localStorage.setItem(`E_${event._id}_${pathSlice}`, result._id); } catch { }
    } catch (error: any) {
      console.warn("[TareasVacioStudio] handleCreate error:", error?.message ?? error);
      toast("error", t("Error al crear itinerario"));
    } finally {
      setCreating(false);
    }
  };

  const plus = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
  );
  // Icono de lista/checklist (fiel al HTML)
  const listIcon = (size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 5.5l1 1 2-2M4 11.5l1 1 2-2M4 17.5l1 1 2-2" /></svg>
  );
  const spinner = <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,.4)", borderTopColor: "#fff", animation: "tv-spin .8s linear infinite", display: "inline-block" }} />;

  return (
    <div style={{ width: "100%", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes tv-spin{to{transform:rotate(360deg);}}
        .tv-desk{display:none;}
        .tv-mob{display:flex;}
        @media(min-width:768px){.tv-desk{display:flex;}.tv-mob{display:none;}}
        .tv-nuevo:hover:not(:disabled){filter:brightness(.97);}
        .tv-view:hover{border-color:#EF5B94 !important;}
        .tv-cta:hover:not(:disabled){background:#D83E7C !important;}
      ` }} />

      {/* ───────── DESKTOP (la cabecera la pinta BlockTitle de la página) ───────── */}
      <div className="tv-desk" style={{ maxWidth: 1180, width: "100%", margin: "0 auto", padding: "14px 0 40px", flexDirection: "column", gap: 14 }}>
        {/* Toolbar */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "12px 22px", display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 4px 14px rgba(0,0,0,.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f5f5f7", paddingBottom: 10 }}>
            {isOwner && (
              <button type="button" className="tv-nuevo" onClick={handleCreate} disabled={creating}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 10, border: "1.5px solid #F3B6CE", background: "#fff", color: "#EF5B94", font: "600 13px Poppins", cursor: creating ? "default" : "pointer", opacity: creating ? 0.7 : 1 }}>
                {plus}{t("new", { defaultValue: "Nuevo" })}
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, font: "400 12px Poppins", color: "#a0a0a8", padding: "8px 6px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" /></svg>
                {t("timezone", { defaultValue: "Zona horaria" })} · {tzCity}
              </div>
              <div className="tv-view" style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 12, background: "#fff", border: "1.5px solid #E7E7EA", color: "#EF5B94", font: "600 13px Poppins" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M4 9h16M9 9v11" /></svg>
                {t("Tarjeta", { defaultValue: "Tarjeta" })}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={2.2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta de estado vacío */}
        <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, padding: "52px 24px 46px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}>{listIcon(28)}</div>
          <div style={{ font: "700 17px Poppins", color: "#3A3A42" }}>{t("noTaskListsTitle", { defaultValue: "Aún no tienes listas de tareas" })}</div>
          <div style={{ font: "400 12.5px/1.65 Poppins", color: "#8a8a90", textAlign: "center", maxWidth: 380 }}>{t("noTaskListsDesc", { defaultValue: "Crea una lista para organizar las tareas de tu evento: por día, por proveedor o como prefieras." })}</div>
          {isOwner ? (
            <button type="button" className="tv-cta" onClick={handleCreate} disabled={creating}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 26px", borderRadius: 12, background: "#EF5B94", color: "#fff", font: "600 13.5px Poppins", border: "none", cursor: creating ? "default" : "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)", marginTop: 6, opacity: creating ? 0.85 : 1 }}>
              {creating ? spinner : plus}{creating ? t("creating", { defaultValue: "Creando…" }) : t("createFirstTaskList", { defaultValue: "Crear mi primera lista" })}
            </button>
          ) : (
            <div style={{ font: "500 13px Poppins", color: "#a0a0a8", marginTop: 6 }}>{t("waitOwner2", { defaultValue: "Espera a que el propietario cree la lista." })}</div>
          )}
        </div>
      </div>

      {/* ───────── MÓVIL (BlockTitle oculto → cabecera propia "Tareas") ───────── */}
      <div className="tv-mob" style={{ flexDirection: "column", width: "100%" }}>
        {/* Cabecera sticky */}
        <div style={{ background: "#fff", padding: "18px 16px 12px", boxShadow: "0 2px 10px rgba(0,0,0,.04)", flex: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ font: "700 17px Poppins", color: "#3A3A42" }}>{t("Lista de tareas", { defaultValue: "Lista de tareas" })}</div>
              <div style={{ font: "500 10px Poppins", color: "#a0a0a8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <span style={{ color: "#EF5B94", fontWeight: 600 }}>{(event?.tipo || "BODA").toUpperCase()}</span> · {event?.nombre || ""}
              </div>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#F7F6F8", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3A3A42" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#F7F6F8", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", color: "#EF5B94" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="12" r="2.6" /><circle cx="17.5" cy="5.5" r="2.6" /><circle cx="17.5" cy="18.5" r="2.6" /><path d="M8.3 10.8l6.9-4M8.3 13.2l6.9 4" /></svg>
            </div>
          </div>
        </div>

        {/* Botón nueva lista */}
        {isOwner && (
          <div style={{ margin: "12px 16px 0" }}>
            <button type="button" className="tv-nuevo" onClick={handleCreate} disabled={creating}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "11px 16px", borderRadius: 12, border: "1.5px solid #F3B6CE", background: "#fff", color: "#EF5B94", cursor: creating ? "default" : "pointer", font: "600 12px Poppins", boxShadow: "0 3px 10px rgba(0,0,0,.04)", opacity: creating ? 0.7 : 1 }}>
              {plus}{t("newList", { defaultValue: "Nueva lista" })}
            </button>
          </div>
        )}

        {/* Estado vacío centrado */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 30px 60px", gap: 12 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}>{listIcon(26)}</div>
          <div style={{ font: "700 15.5px Poppins", color: "#3A3A42", textAlign: "center" }}>{t("noTaskListsTitle", { defaultValue: "Aún no tienes listas de tareas" })}</div>
          <div style={{ font: "400 11.5px/1.65 Poppins", color: "#8a8a90", textAlign: "center", maxWidth: 260 }}>{t("noTaskListsDesc", { defaultValue: "Crea una lista para organizar las tareas de tu evento: por día, por proveedor o como prefieras." })}</div>
          {isOwner ? (
            <button type="button" className="tv-cta" onClick={handleCreate} disabled={creating}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "13px 26px", borderRadius: 13, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", border: "none", cursor: creating ? "default" : "pointer", boxShadow: "0 8px 20px rgba(239,91,148,.35)", marginTop: 6, opacity: creating ? 0.85 : 1 }}>
              {creating ? spinner : plus}{creating ? t("creating", { defaultValue: "Creando…" }) : t("createFirstTaskList", { defaultValue: "Crear mi primera lista" })}
            </button>
          ) : (
            <div style={{ font: "500 12px Poppins", color: "#a0a0a8", marginTop: 6, textAlign: "center" }}>{t("waitOwner2", { defaultValue: "Espera a que el propietario cree la lista." })}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TareasVacioStudio;
