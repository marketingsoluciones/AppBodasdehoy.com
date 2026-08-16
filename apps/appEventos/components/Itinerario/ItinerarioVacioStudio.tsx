import { FC, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from "react-i18next";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { eventDateAtHourZ, getTimeZoneCity } from "../../utils/FormatTime";

/**
 * ItinerarioVacioStudio — estado vacío del módulo Itinerario (gate ?studio),
 * fiel a itinerariovacio.html. Solo visual + creación del PRIMER itinerario
 * reusando el MISMO backend (createItinerario + createTask + editTask), rama
 * simple del estado vacío (no hay next_id/cadena que mantener cuando no existe
 * ningún itinerario del tipo). No toca ItineraryTabs.
 */

interface Props {
  event: any;
  setEvent: (updater: any) => void;
  config: any;
  isOwner: boolean;
  pathSlice: string;
}

const ItinerarioVacioStudio: FC<Props> = ({ event, setEvent, config, isOwner, pathSlice }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [creating, setCreating] = useState(false);

  const isItinerario = pathSlice === "itinerario";
  const imgUrl = event?.imgEvento?.i320
    ? `/api/proxy-image?url=${encodeURIComponent(`https://api-mcp.eventosorganizador.com/${event.imgEvento.i320}`)}`
    : null;
  const tzCity = getTimeZoneCity(event?.timeZone) || "Madrid";

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
        console.warn("[ItinerarioVacioStudio] createItinerario devolvió null/sin _id", r);
        return;
      }

      // listIdentifiers: estado vacío → rama simple (no hay cadena que mantener).
      const safeList = Array.isArray(event?.listIdentifiers) ? [...event.listIdentifiers] : [];
      const fList = safeList.findIndex((el: any) => el?.table === pathSlice);
      const nextList = fList < 0
        ? [...safeList, { start_Id: result._id, end_Id: result._id, table: pathSlice }]
        : safeList.map((li: any, i: number) => (i === fList ? { ...li, start_Id: result._id, end_Id: result._id } : li));

      // Tarea inicial (misma convención que ItineraryTabs.handleCreateItinerario).
      let initialTasks: any[] = Array.isArray(result.tasks) ? [...result.tasks] : [];
      try {
        const fecha6 = eventDateAtHourZ(event?.fecha, 6, 0);
        const cr: any = await fetchApiEventos({
          query: queries.createTask,
          variables: {
            evento_id: event._id,
            development: config.development || "bodasdehoy",
            task: {
              itinerario_id: result._id,
              descripcion: isItinerario ? "Tarea nueva" : "Servicio nuevo",
              ...(isItinerario && { fecha: fecha6.toISOString(), hora: "06:00", horaActiva: true, duracion: 30, spectatorView: true }),
            },
          },
          domain: config.domain,
        });
        const ct: any = cr?.task || cr;
        if (ct?._id) {
          initialTasks = [...initialTasks, {
            ...ct,
            fecha: ct.fecha ? new Date(ct.fecha) : fecha6,
            ...(isItinerario ? { horaActiva: true, spectatorView: true, duracion: ct.duracion ?? 30 } : {}),
            estatus: true,
          }];
          fetchApiEventos({
            query: queries.editTask,
            variables: { evento_id: event._id, itinerario_id: result._id, task_id: ct._id, development: config.development || "bodasdehoy", updates: { estatus: true } },
          }).catch((e: any) => console.warn("[ItinerarioVacioStudio] editTask estatus falló:", e?.message ?? e));
        }
      } catch (taskErr: any) {
        console.warn("[ItinerarioVacioStudio] createTask inicial falló:", taskErr?.message ?? taskErr);
      }

      const newItinerario = { ...result, tasks: initialTasks, viewers: result.viewers ?? [] };
      setEvent((prev: any) => ({
        ...prev,
        listIdentifiers: nextList,
        itinerarios_array: [...(Array.isArray(prev?.itinerarios_array) ? prev.itinerarios_array : []), newItinerario],
      }));
      try { localStorage.setItem(`E_${event._id}_${pathSlice}`, result._id); } catch { }
      // BoddyIter (useEffect sobre event) detectará el nuevo itinerario y renderiza el panel.
    } catch (error: any) {
      console.warn("[ItinerarioVacioStudio] handleCreate error:", error?.message ?? error);
      toast("error", t("Error al crear itinerario"));
    } finally {
      setCreating(false);
    }
  };

  const plus = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
  );

  return (
    <div style={{ maxWidth: 1120, width: "100%", margin: "0 auto", padding: "6px 8px 40px", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes iv-spin{to{transform:rotate(360deg);}}
        .iv-share:hover{background:#FCE7F0 !important;}
        .iv-tz:hover{background:#f5f5f7 !important;}
        .iv-cta:hover:not(:disabled){background:#D83E7C !important;}
        .iv-nuevo:hover:not(:disabled){filter:brightness(.97);}
      ` }} />

      {/* HEADER */}
      <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 6px 20px rgba(0,0,0,.06)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ font: "700 21px Poppins", color: "#4a4a52" }}>{t("itinerary", { defaultValue: "Itinerario" })}</div>
          {isOwner && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, background: "#FEF6D8", color: "#B8860B", font: "600 12px Poppins", padding: "6px 13px", borderRadius: 20 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#B8860B"><path d="M3 8l4 4 5-6 5 6 4-4v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" /></svg>
              {t("owner", { defaultValue: "Propietario" })}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ lineHeight: 1.3, textAlign: "right" }}>
            <div style={{ font: "600 10px Poppins", color: "#EF5B94", letterSpacing: ".6px", textTransform: "uppercase" }}>{event?.tipo || ""}</div>
            <div style={{ font: "700 14px Poppins", color: "#3A3A42" }}>{event?.nombre || ""}</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", background: "#f2f2f4", flex: "none" }}>
            {imgUrl && <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <button type="button" className="iv-share" title={t("share", { defaultValue: "Compartir" }) as string}
            onClick={() => toast("warning", t("Crea un itinerario para poder compartirlo", { defaultValue: "Crea un itinerario para poder compartirlo" }))}
            style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", background: "none", border: "none", cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="6" cy="12" r="2.4" /><circle cx="17" cy="6" r="2.4" /><circle cx="17" cy="18" r="2.4" /><path d="M8.2 10.9l6.6-3.8M8.2 13.1l6.6 3.8" /></svg>
          </button>
        </div>
      </div>

      {/* PANEL */}
      <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 6px 20px rgba(0,0,0,.06)", overflow: "hidden" }}>
        {/* toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", borderBottom: "1px solid #f0f0f2", flexWrap: "wrap" }}>
          {isOwner && (
            <button type="button" className="iv-nuevo" onClick={handleCreate} disabled={creating}
              style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 13px", borderRadius: 9, border: "none", background: "#FCE7F0", color: "#D83E7C", cursor: creating ? "default" : "pointer", font: "600 12px Poppins", opacity: creating ? 0.7 : 1 }}>
              {plus}{t("new", { defaultValue: "Nuevo" })}
            </button>
          )}
          <div className="iv-tz" style={{ display: "flex", alignItems: "center", gap: 7, font: "500 12px Poppins", color: "#8a8a90", padding: "7px 10px", borderRadius: 9, marginLeft: "auto" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
            {t("timezone", { defaultValue: "Zona horaria" })} · <b style={{ color: "#3A3A42", fontWeight: 600 }}>{tzCity}</b>
          </div>
        </div>

        {/* estado vacío */}
        <div style={{ padding: "80px 40px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: "#EF5B94" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          </div>
          <div style={{ font: "700 19px Poppins", color: "#3A3A42", marginBottom: 8 }}>{t("noItineraryTitle", { defaultValue: "Aún no has creado ningún itinerario" })}</div>
          <div style={{ font: "400 13px/1.65 Poppins", color: "#8a8a90", maxWidth: 400, marginBottom: 26 }}>{t("noItineraryDesc", { defaultValue: "Organiza el día del evento hora a hora: crea tareas con horario, asígnalas a tu equipo y compártelas." })}</div>
          {isOwner ? (
            <button type="button" className="iv-cta" onClick={handleCreate} disabled={creating}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 11, background: "#EF5B94", color: "#fff", font: "600 13.5px Poppins", border: "none", cursor: creating ? "default" : "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)", opacity: creating ? 0.85 : 1 }}>
              {creating ? <span style={{ width: 15, height: 15, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,.4)", borderTopColor: "#fff", animation: "iv-spin .8s linear infinite", display: "inline-block" }} /> : plus}
              {creating ? t("creating", { defaultValue: "Creando…" }) : t("createFirstItinerary", { defaultValue: "Crear mi primer itinerario" })}
            </button>
          ) : (
            <div style={{ font: "500 13px Poppins", color: "#a0a0a8" }}>{t("waitOwner2", { defaultValue: "Espera a que el propietario cree el itinerario." })}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItinerarioVacioStudio;
