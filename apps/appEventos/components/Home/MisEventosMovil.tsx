import { FC, useMemo, useState } from "react";
import { AuthContextProvider, EventsGroupContextProvider } from "../../context";
import { useTranslation } from "react-i18next";
import Card from "./Card";
import MobileBottomNav from "../DefaultLayout/MobileBottomNav";

// Igual que desktop: fecha puede venir ms ("1830297600000") o ISO ("2028-01-01").
const fechaMs = (f: any) => {
  if (f == null) return NaN;
  const s = String(f);
  const d = (!s.includes("T") && !s.includes("-")) ? new Date(parseInt(s)) : new Date(s);
  return d.getTime();
};

const MisEventosMovil: FC<{ onCreate: () => void }> = ({ onCreate }) => {
  const { t } = useTranslation();
  const { eventsGroup } = EventsGroupContextProvider();
  const { user } = AuthContextProvider();
  const [tab, setTab] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const groups = useMemo(() => {
    const uid = user?.uid;
    const all = (eventsGroup ?? []).filter(Boolean);
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const bucketOf = (e: any) => {
      if (String(e?.estatus ?? "").toLowerCase().includes("archiv")) return "archivado";
      const ms = fechaMs(e?.fecha);
      return (!Number.isNaN(ms) && ms < todayStart) ? "realizado" : "activo";
    };
    const mine = all.filter((e: any) => e?.usuario_id === uid);
    const shared = all.filter((e: any) => e?.usuario_id && uid && e.usuario_id !== uid);
    return [
      { label: "Activos", status: "activo", data: mine.filter((e: any) => bucketOf(e) === "activo") },
      { label: "Realizados", status: "realizado", data: mine.filter((e: any) => bucketOf(e) === "realizado") },
      { label: "Archivados", status: "archivado", data: mine.filter((e: any) => bucketOf(e) === "archivado") },
      { label: "Compartidos", status: "compartido", data: shared },
    ];
  }, [eventsGroup, user]);

  const g = groups[tab] || groups[0];
  const filtered = g.data;
  const visible = showAll ? filtered : filtered.slice(0, 3);
  const restantes = filtered.length - visible.length;

  return (
    <div className="md:hidden flex flex-col" style={{ position: "fixed", inset: 0, zIndex: 50, background: "#F6F5F7", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: ".mev-scroll,.mev-tabs{scrollbar-width:none;-ms-overflow-style:none;}.mev-scroll::-webkit-scrollbar,.mev-tabs::-webkit-scrollbar{display:none;width:0;height:0;}" }} />

      {/* Spacer = alto del header fijo (barra superior studio 78px). La cabecera visible
          (logo + Copilot estrellita + campana + avatar) la pinta el header global por encima. */}
      <div style={{ height: 78, flex: "none" }} />

      {/* Scroll */}
      <div className="mev-scroll" style={{ flex: 1, overflowY: "auto" }}>
        {/* Hero */}
        <div style={{ padding: "34px 20px 10px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", border: "1px solid #FCE7F0", boxShadow: "0 3px 10px rgba(239,91,148,.1)", color: "#D83E7C", font: "600 10px Poppins", padding: "5px 12px", borderRadius: 16, marginBottom: 16, whiteSpace: "nowrap" }}><svg width="11" height="11" viewBox="0 0 24 24" fill="#EF5B94"><path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3z" /></svg>{t("Para wedding planners y parejas")}</div>
          <h1 style={{ font: "600 27px/1.25 Poppins", color: "#3A3A42", letterSpacing: "-.5px", marginBottom: 12 }}>{t("Todos tus eventos, gestionados")} <span style={{ background: "linear-gradient(100deg,#EF5B94,#D83E7C)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } as any}>{t("sin estrés")}</span></h1>
          <p style={{ font: "400 13px/1.65 Poppins", color: "#6b6b72", marginBottom: 22 }}>{t("Invitados, mesas, presupuesto e invitaciones, cada evento en un solo lugar.")}</p>
          <button onClick={onCreate} style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", padding: "12px 22px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", border: "none", boxShadow: "0 6px 16px rgba(239,91,148,.3)", cursor: "pointer" }}>{t("Empieza a organizar")}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
        </div>

        {/* Contenedor tarjetas */}
        <div style={{ padding: "0 26px 130px" }}>
          {/* Pestañas slider */}
          <div className="mev-tabs" style={{ display: "flex", gap: 6, overflowX: "auto", padding: "22px 2px 4px" }}>
            {groups.map((gr, i) => {
              const on = tab === i;
              return (
                <div key={i} onClick={() => { setTab(i); setShowAll(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", borderRadius: 22, background: on ? "#FCE7F0" : "#fff", border: on ? "1.5px solid #F3B6CE" : "1.5px solid #E7E7EA", color: on ? "#D83E7C" : "#8a8a90", font: "600 11.5px Poppins", cursor: "pointer", whiteSpace: "nowrap", flex: "none" }}>
                  {t(gr.label)}<span style={{ minWidth: 17, height: 17, borderRadius: 9, background: on ? "#fff" : "#ececef", color: on ? "#D83E7C" : "#8a8a90", font: "600 9.5px Poppins", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{gr.data.length}</span>
                </div>
              );
            })}
          </div>

          {/* Tarjetas o empty state */}
          {filtered.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "50px 20px" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", marginBottom: 16 }}><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M9 2C6.2 2 4 4.4 4 7.4c0 2.9 2 5.3 4.4 5.6l-.6 1.5h2.4L9.6 13C12 12.7 14 10.3 14 7.4 14 4.4 11.8 2 9 2z" /><path d="M16.5 5c-1.9 0-3.5 1.7-3.5 3.9 0 2 1.3 3.7 3 4l-.4 1.1h1.8L17 12.9c1.7-.3 3-2 3-4C20 6.7 18.4 5 16.5 5z" opacity=".55" /></svg></div>
              <div style={{ font: "600 15px Poppins", color: "#3A3A42", marginBottom: 6 }}>{t("Crea tu primer evento")}</div>
              {g.status === "activo" && <button onClick={onCreate} style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", border: "none", boxShadow: "0 6px 16px rgba(239,91,148,.3)", cursor: "pointer" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>{t("Empezar")}</button>}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
              {visible.map((ev: any, i: number) => (<Card key={ev?._id || i} mobile data={visible} grupoStatus={g.status} idx={i} />))}
              {restantes > 0 && !showAll && (
                <button onClick={() => setShowAll(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 9, border: "none", background: "transparent", color: "#8a8a90", font: "500 12px Poppins", cursor: "pointer" }}>{t("Ver")} {restantes} {t("más")}<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M6 9l6 6 6-6" /></svg></button>
              )}
              {showAll && filtered.length > 3 && (
                <button onClick={() => setShowAll(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 9, border: "none", background: "transparent", color: "#8a8a90", font: "500 12px Poppins", cursor: "pointer" }}>{t("Ver menos")}<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} style={{ transform: "rotate(180deg)" }}><path d="M6 9l6 6 6-6" /></svg></button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Barra inferior fija — mismo menú compartido en todas las pantallas móviles */}
      <MobileBottomNav />
    </div>
  );
};

export default MisEventosMovil;
