import { FC, ReactElement, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthContextProvider, EventsGroupContextProvider } from "../../context";
import { useTranslation } from "react-i18next";
import Card from "./Card";
import { Notifications } from "../Notifications";
import { ImageAvatar } from "../Utils/ImageAvatar";

// Igual que desktop: fecha puede venir ms ("1830297600000") o ISO ("2028-01-01").
const fechaMs = (f: any) => {
  if (f == null) return NaN;
  const s = String(f);
  const d = (!s.includes("T") && !s.includes("-")) ? new Date(parseInt(s)) : new Date(s);
  return d.getTime();
};

// Iconos barra inferior + "Más" (mismos SVG del HTML)
const ICONS: Record<string, ReactElement> = {
  "Mis eventos": (<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M9 2C6.2 2 4 4.4 4 7.4c0 2.9 2 5.3 4.4 5.6l-.6 1.5h2.4L9.6 13C12 12.7 14 10.3 14 7.4 14 4.4 11.8 2 9 2z" /><path d="M16.5 5c-1.9 0-3.5 1.7-3.5 3.9 0 2 1.3 3.7 3 4l-.4 1.1h1.8L17 12.9c1.7-.3 3-2 3-4C20 6.7 18.4 5 16.5 5z" opacity=".55" /></svg>),
  "Resumen": (<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M5.5 3A2.5 2.5 0 0 0 3 5.5v4A2.5 2.5 0 0 0 5.5 12h4A2.5 2.5 0 0 0 12 9.5v-4A2.5 2.5 0 0 0 9.5 3h-4z" /><path d="M15.5 3A2.5 2.5 0 0 0 13 5.5v2A2.5 2.5 0 0 0 15.5 10h3A2.5 2.5 0 0 0 21 7.5v-2A2.5 2.5 0 0 0 18.5 3h-3z" opacity=".55" /><path d="M15.5 11A2.5 2.5 0 0 0 13 13.5v5a2.5 2.5 0 0 0 2.5 2.5h3a2.5 2.5 0 0 0 2.5-2.5v-5a2.5 2.5 0 0 0-2.5-2.5h-3z" /><path d="M5.5 13A2.5 2.5 0 0 0 3 15.5v3A2.5 2.5 0 0 0 5.5 21h4a2.5 2.5 0 0 0 2.5-2.5v-3A2.5 2.5 0 0 0 9.5 13h-4z" opacity=".55" /></svg>),
  "Invitados": (<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="3.6" /><path d="M3 19.2c0-3.3 2.7-5.7 6-5.7s6 2.4 6 5.7c0 .4-.3.8-.8.8H3.8a.8.8 0 0 1-.8-.8z" /><circle cx="16.8" cy="9" r="2.8" opacity=".55" /><path d="M16.4 13.4c2.7.2 4.6 2.3 4.6 5 0 .3-.3.6-.6.6h-3.2c.2-.5.3-1 .3-1.6 0-1.5-.5-2.9-1.1-4z" opacity=".55" /></svg>),
  "Mesas": (<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4.2" /><circle cx="12" cy="4.5" r="1.7" opacity=".55" /><circle cx="12" cy="19.5" r="1.7" opacity=".55" /><circle cx="4.5" cy="12" r="1.7" opacity=".55" /><circle cx="19.5" cy="12" r="1.7" opacity=".55" /><circle cx="6.7" cy="6.7" r="1.5" opacity=".55" /><circle cx="17.3" cy="6.7" r="1.5" opacity=".55" /><circle cx="6.7" cy="17.3" r="1.5" opacity=".55" /><circle cx="17.3" cy="17.3" r="1.5" opacity=".55" /></svg>),
  "Presupuesto": (<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 2A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 2h-11zM7 5.5h10a1 1 0 0 1 1 1V8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1zM7.5 12a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm-9 4.5a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z" /></svg>),
  "Invitaciones": (<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8.8l8.4-5.2a1.2 1.2 0 0 1 1.2 0L21 8.8V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.8z" /><path d="M12 13.4c-.9-1-2.4-1.6-2.4-3 0-1 .7-1.7 1.5-1.7.4 0 .7.2.9.5.2-.3.5-.5.9-.5.8 0 1.5.7 1.5 1.7 0 1.4-1.5 2-2.4 3z" fill="#fff" /></svg>),
  "Itinerario": (<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2.5a1 1 0 0 1 1 1V5h8V3.5a1 1 0 1 1 2 0V5h.5A2.5 2.5 0 0 1 21 7.5v11A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5v-11A2.5 2.5 0 0 1 5.5 5H6V3.5a1 1 0 0 1 1-1z" /><path d="M12 17.2c-1.4-1.4-3.6-2.4-3.6-4.4 0-1.4 1-2.4 2.2-2.4.6 0 1.1.3 1.4.8.3-.5.8-.8 1.4-.8 1.2 0 2.2 1 2.2 2.4 0 2-2.2 3-3.6 4.4z" fill="#fff" /></svg>),
  "Lista de regalos": (<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 8A1.5 1.5 0 0 1 5 6.5h14A1.5 1.5 0 0 1 20.5 8v2a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V8z" /><path d="M5 12.5h6V21H6.5A1.5 1.5 0 0 1 5 19.5v-7zM13 12.5h6v7a1.5 1.5 0 0 1-1.5 1.5H13v-8.5z" /><path d="M12 6.5c-1.2-2.2-3-3.6-4.6-2.7C6 4.6 6.3 6.5 8 6.5h4zm0 0c1.2-2.2 3-3.6 4.6-2.7 1.4.8 1.1 2.7-.6 2.7H12z" opacity=".55" /></svg>),
  "Momentos": (<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 6.5A2.5 2.5 0 0 1 9.5 4h9A2.5 2.5 0 0 1 21 6.5v7A2.5 2.5 0 0 1 18.5 16h-9A2.5 2.5 0 0 1 7 13.5v-7z" /><path d="M4.5 7.5c-.8.3-1.5 1.2-1.5 2.2V18a3 3 0 0 0 3 3h8.3c1 0 1.9-.6 2.2-1.5H6.5a2 2 0 0 1-2-2V7.5z" opacity=".55" /><circle cx="11" cy="8" r="1.3" fill="#fff" /><path d="M8.5 14.5l2.6-3 1.9 2 1.6-1.6 3.4 2.6H8.5z" fill="#fff" /></svg>),
};

const MisEventosMovil: FC<{ onCreate: () => void }> = ({ onCreate }) => {
  const { t } = useTranslation();
  const { eventsGroup } = EventsGroupContextProvider();
  const { user, config } = AuthContextProvider();
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [q, setQ] = useState("");
  const [masOpen, setMasOpen] = useState(false);

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
  const filtered = q.trim() ? g.data.filter((e: any) => String(e?.nombre || "").toLowerCase().includes(q.toLowerCase())) : g.data;
  const visible = showAll ? filtered : filtered.slice(0, 3);
  const restantes = filtered.length - visible.length;

  const isActive = (r: string) => r === "/" ? pathname === "/" : (pathname === r || pathname?.startsWith(r + "/"));
  const nav = [
    { label: "Mis eventos", route: "/" },
    { label: "Resumen", route: "/resumen-evento" },
    { label: "Invitados", route: "/invitados" },
    { label: "Mesas", route: "/mesas" },
  ];
  const mas = [
    { label: "Presupuesto", route: "/presupuesto" },
    { label: "Invitaciones", route: "/invitaciones" },
    { label: "Itinerario", route: "/itinerario" },
    { label: "Lista de regalos", route: "/lista-regalos" },
    { label: "Momentos", route: "/momentos" },
  ];

  return (
    <div className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 50, background: "#F6F5F7", display: "flex", flexDirection: "column", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: ".mev-scroll,.mev-tabs{scrollbar-width:none;-ms-overflow-style:none;}.mev-scroll::-webkit-scrollbar,.mev-tabs::-webkit-scrollbar{display:none;width:0;height:0;}" }} />

      {/* Cabecera */}
      <div style={{ background: "#fff", padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", flex: "none" }}>
        <div style={{ font: "700 17px Poppins", color: "#EF5B94" }}>Bodasdehoy<span style={{ color: "#3A3A42", fontSize: 11 }}>.com</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <button onClick={() => setShowSearch(v => !v)} style={{ width: 34, height: 34, borderRadius: "50%", background: "#F7F6F8", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", color: "#6b6b72" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg></button>
          <Notifications studio />
          <div onClick={() => router.push(config?.pathPerfil || "/configuracion")} style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", background: "#EF5B94", cursor: "pointer", flex: "none" }}><ImageAvatar user={user} disabledTooltip /></div>
        </div>
      </div>

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
          {showSearch && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#fff", border: "1.5px solid #F3B6CE", borderRadius: 11, padding: "10px 14px", marginTop: 20 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar evento") as string} style={{ flex: 1, border: "none", outline: "none", background: "transparent", font: "500 13px Poppins", color: "#3A3A42" }} />
            </div>
          )}

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

      {/* Barra inferior fija */}
      <nav style={{ background: "#fff", borderTop: "1px solid #f0f0f2", boxShadow: "0 -6px 20px rgba(0,0,0,.06)", flex: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 8px 26px" }}>
          {nav.map((it, i) => {
            const on = isActive(it.route);
            return (
              <button key={i} onClick={() => router.push(it.route)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1, minWidth: 0, cursor: "pointer", padding: "2px 4px", color: on ? "#EF5B94" : "#9aa0a6", background: "none", border: "none" }}>{ICONS[it.label]}<span style={{ font: "500 9px Poppins", whiteSpace: "nowrap" }}>{t(it.label)}</span></button>
            );
          })}
          <button onClick={() => setMasOpen(true)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1, color: "#9aa0a6", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg><span style={{ font: "500 9px Poppins" }}>{t("Más")}</span></button>
        </div>
      </nav>

      {/* Sheet "Más" */}
      {masOpen && (
        <>
          <div onClick={() => setMasOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 52, background: "rgba(43,43,48,.4)" }} />
          <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 53, background: "#fff", borderRadius: "18px 18px 0 0", boxShadow: "0 -10px 30px rgba(0,0,0,.16)", padding: "16px 16px 34px", maxWidth: 430, margin: "0 auto" }}>
            <div style={{ width: 38, height: 4, borderRadius: 3, background: "#e5e5e9", margin: "0 auto 12px" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {mas.map((it, i) => (
                <div key={i} onClick={() => { setMasOpen(false); router.push(it.route); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", padding: "10px 4px", borderRadius: 12, background: "#f7f6f8", color: "#6b6b72" }}>{ICONS[it.label]}<span style={{ font: "500 9.5px Poppins", whiteSpace: "nowrap", textAlign: "center" }}>{t(it.label)}</span></div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MisEventosMovil;
