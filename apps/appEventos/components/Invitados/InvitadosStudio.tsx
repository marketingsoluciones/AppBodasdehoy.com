import { FC, ReactNode, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { EventContextProvider } from "../../context";
import BlockTitle from "../Utils/BlockTitle";

/**
 * InvitadosStudio — rediseño de la tabla de Invitados fiel al HTML "Prototipo tablas v2".
 * MISMO backend: todo del objeto `event` (invitados_array, grupos_array, planSpace,
 * allFilterGuests, menus_array). Gated tras ?studio=1.
 * FASE 1: cabecera + stats + botones + buscador + tabla agrupada (lectura, datos reales).
 */
export const InvitadosStudio: FC = () => {
  const router = useRouter();
  const { event, allFilterGuests } = EventContextProvider() as any;
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const all: any[] = event?.invitados_array || [];
  const fathers = all.filter((inv) => !inv?.father);
  const grupos: string[] = event?.grupos_array || [];

  // Stats reales (como BlockCabecera)
  const total = all.length;
  const adultos = all.filter((x) => x?.grupo_edad === "adulto").length;
  const ninos = all.filter((x) => x?.grupo_edad === "niño").length;
  const conf = all.filter((x) => x?.asistencia === "confirmado").length;
  const pend = all.filter((x) => x?.asistencia === "pendiente").length;
  const canc = all.filter((x) => x?.asistencia === "cancelado").length;

  // Asientos recepción/ceremonia (mismo derivado que BlockTableroInvitados)
  const tablesRec = event?.planSpace?.find((e: any) => e?.title === "recepción")?.tables;
  const tablesCer = event?.planSpace?.find((e: any) => e?.title === "ceremonia")?.tables;
  const seatOf = (id: string, idx: 0 | 1) => {
    const g = allFilterGuests?.[idx]?.sentados?.find((e: any) => e._id === id);
    const tables = idx === 0 ? tablesRec : tablesCer;
    const table = tables?.find((t: any) => t._id === g?.tableID);
    return table?.title || "no asignado";
  };

  // Estado (asistencia) → color/soft/icono
  const stMap: Record<string, [string, string]> = {
    confirmado: ["#2FB37E", "#E4F5EE"], pendiente: ["#E0A32B", "#FBF0DA"], cancelado: ["#D83E7C", "#FBE4EF"],
  };
  const stIcon = (st: string): ReactNode => {
    if (st === "confirmado") return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>;
    if (st === "cancelado") return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>;
    return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 1.5" /></svg>;
  };
  const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "Pendiente");

  const q = search.trim().toLowerCase();
  // Agrupar padres por rol (grupo), como BlockTableroInvitados
  const groups = [...grupos, "no asignado"].map((name) => {
    const guests = fathers.filter((g) => {
      const rol = (g?.rol || "").toLowerCase();
      const inGroup = name === "no asignado" ? !grupos.some((gr) => gr.toLowerCase() === rol) : rol === name.toLowerCase();
      return inGroup && (!q || (g?.nombre || "").toLowerCase().includes(q));
    });
    return { name, guests };
  }).filter((gr) => gr.guests.length > 0 || (!q && gr.name !== "no asignado"));

  const GRID = "2.4fr 1.1fr 1fr 1.2fr 1.2fr 1.2fr 40px";
  const th: React.CSSProperties = { font: "700 10.5px Poppins", color: "#5a5a62", letterSpacing: ".5px", textTransform: "uppercase" };
  const btnGhost: React.CSSProperties = { display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 11, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12.5px Poppins", cursor: "pointer" };
  const plusW = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
  const plusG = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b6b72" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;

  return (
    <div style={{ background: "#f1f1f4", minHeight: "100%", fontFamily: "'Poppins',sans-serif" }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}` }} />

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "22px 20px 60px", animation: "fadein .2s ease" }}>
        {/* Cabecera estándar */}
        <div style={{ marginBottom: 16 }}><BlockTitle title={"Mis invitados"} /></div>

        {/* STATS */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
          <div style={{ font: "800 22px Poppins", color: "#EF5B94" }}>{total} <span style={{ font: "600 14px Poppins", color: "#3A3A42" }}>Invitados</span></div>
          <span style={{ font: "500 12px Poppins", color: "#a0a0a8" }}>{adultos} adultos · {ninos} niños</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#FBF0DA", color: "#E0A32B", font: "600 12px Poppins", padding: "8px 14px", borderRadius: 20 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E0A32B" }} />{pend} por confirmar</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#E4F5EE", color: "#2FB37E", font: "600 12px Poppins", padding: "8px 14px", borderRadius: 20 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2FB37E" }} />{conf} confirmados</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#FBE4EF", color: "#D83E7C", font: "600 12px Poppins", padding: "8px 14px", borderRadius: 20 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D83E7C" }} />{canc} cancelados</div>
          <button onClick={() => router.push("/mesas")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", border: "none", cursor: "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M6 12v6M18 12v6" /></svg>Sentar invitados</button>
        </div>

        {/* divisor rosa */}
        <div style={{ height: 3, borderRadius: 3, background: "linear-gradient(90deg,#EF5B94,#f9b6d1)", marginBottom: 18 }} />

        {/* ACTION BUTTONS */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 11, background: "#EF5B94", color: "#fff", font: "600 12.5px Poppins", boxShadow: "0 6px 16px rgba(239,91,148,.3)", border: "none", cursor: "pointer" }}>{plusW}Invitados</button>
          <button style={btnGhost}>{plusG}Grupo</button>
          <button style={btnGhost}>{plusG}Menú</button>
          <button style={btnGhost}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b6b72" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>Importar</button>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#fff", border: "1.5px solid #E7E7EA", borderRadius: 11, padding: "9px 14px" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b3b3ba" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Buscar invitado" style={{ border: "none", outline: "none", background: "transparent", font: "500 12.5px Poppins", color: "#3A3A42", width: 150 }} />
          </div>
        </div>

        {/* TABLE */}
        <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, boxShadow: "0 6px 20px rgba(0,0,0,.05)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", gap: 10, padding: "15px 24px", background: "#f7f7f9", borderBottom: "1px solid #f0f0f2" }}>
            <div style={th}>Invitado</div>
            <div style={{ ...th, textAlign: "center" }}>Asistencia</div>
            <div style={th}>Menú</div>
            <div style={{ ...th, lineHeight: 1.35 }}>Asientos<br />recepción</div>
            <div style={{ ...th, lineHeight: 1.35 }}>Asientos<br />ceremonia</div>
            <div style={th}>Acompañantes</div>
            <div />
          </div>

          {groups.length === 0 && (
            <div style={{ padding: "40px 24px", textAlign: "center", font: "500 12.5px Poppins", color: "#a0a0a8" }}>{total === 0 ? "Aún no tienes invitados." : "No hay invitados que coincidan."}</div>
          )}

          {groups.map((gr) => {
            const open = q ? true : !closed[gr.name];
            return (
              <div key={gr.name}>
                <div onClick={() => setClosed((c) => ({ ...c, [gr.name]: !c[gr.name] }))} style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 24px", background: "#fbfbfc", borderBottom: "1px solid #f2f2f4", cursor: "pointer" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c4c4cc" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform .18s", transform: `rotate(${open ? 90 : 0}deg)` }}><path d="M9 6l6 6-6 6" /></svg>
                  <span style={{ font: "500 14px Poppins", color: "#6b6b72", textTransform: "capitalize" }}>{gr.name}</span>
                  <span style={{ font: "600 10px Poppins", color: "#c4c4cc", background: "#f2f2f4", padding: "2px 8px", borderRadius: 10 }}>{gr.guests.length}</span>
                </div>
                {open && (
                  <div style={{ animation: "fadein .18s ease" }}>
                    {gr.guests.length === 0 && <div style={{ padding: "20px 24px", font: "500 12.5px Poppins", color: "#c4c4cc", textAlign: "center" }}>No hay invitados</div>}
                    {gr.guests.map((r) => {
                      const st = (r?.asistencia || "pendiente").toLowerCase();
                      const c = stMap[st] || stMap.pendiente;
                      const acomp = all.filter((x) => x?.father === r._id).length;
                      const initial = (r?.nombre || "?").trim().charAt(0).toUpperCase() || "?";
                      return (
                        <div key={r._id} style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", gap: 10, padding: "16px 24px", borderBottom: "1px solid #f5f5f7" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", flex: "none", background: "#EFEFF2", color: "#8a8a90", display: "flex", alignItems: "center", justifyContent: "center", font: "700 12px Poppins" }}>{initial}</div>
                            <span style={{ font: "500 13px Poppins", color: "#6b6b72", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r?.nombre}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ width: 18, height: 18, borderRadius: "50%", background: c[0], display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{stIcon(st)}</span><span style={{ font: "600 12px Poppins", color: c[0] }}>{cap(st)}</span></div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ font: "500 12px Poppins", color: "#6b6b72" }}>{r?.nombre_menu || "—"}</span></div>
                          <div style={{ font: "600 11px Poppins", color: "#6b6b72", letterSpacing: ".4px", textTransform: "uppercase" }}>{seatOf(r._id, 0)}</div>
                          <div style={{ font: "600 11px Poppins", color: "#6b6b72", letterSpacing: ".4px", textTransform: "uppercase" }}>{seatOf(r._id, 1)}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, font: "600 12px Poppins", color: "#6b6b72" }}>{acomp}</div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 9, color: "#c4c4cc" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
