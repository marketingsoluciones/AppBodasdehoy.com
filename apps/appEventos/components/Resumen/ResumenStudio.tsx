import { FC, ReactNode, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { EventContextProvider, AuthContextProvider } from "../../context";
import ModalCompartirEventoStudio from "../Utils/ModalCompartirEventoStudio";
import { defaultImagenes } from "../Home/Card";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { EntityNotesSection } from "../Notes/EntityNotesSection";
import FormCrearEvento from "../Forms/FormCrearEvento";
import ModalLeft from "../Utils/ModalLeft";
import { useDelayUnmount } from "../../utils/Funciones";

/**
 * ResumenStudio — rediseño de la hoja de Resumen fiel al HTML "Resumen.dc.html".
 * MISMO backend: todo se deriva del objeto `event` (api-mcp). Gated tras ?studio=1.
 * FASE 1: Hero + estado + métricas + checklist (derivado) + necesita atención + Presupuesto/Invitados.
 */
export const ResumenStudio: FC = () => {
  const router = useRouter();
  const { event, setEvent } = EventContextProvider() as any;
  const { user } = AuthContextProvider() as any;
  const toast = useToast();
  const [openShare, setOpenShare] = useState(false);
  const [picker, setPicker] = useState<null | "color" | "temporada" | "estilo" | "tematica">(null);
  const [tematicaDraft, setTematicaDraft] = useState("");
  const [isMounted, setIsMounted] = useState(false);       // drawer FormCrearEvento (editar)
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  // Checklist "Toca para completar" — arranca reflejando el estado real del evento;
  // al tocar alterna (mueve la barra de progreso). Toggle local (no persiste).
  const [stepsDone, setStepsDone] = useState<boolean[]>(() => {
    const iv: any[] = event?.invitados_array || [];
    const seatedN = iv.filter((x) => x?.nombre_mesa && String(x.nombre_mesa).toLowerCase() !== "no asignado").length;
    const est = Number(event?.presupuesto_objeto?.coste_estimado || 0);
    const gas = Number(event?.presupuesto_objeto?.coste_final || 0);
    const sent = iv.filter((x) => !!x?.invitacion).length;
    return [
      !!(event?.nombre && event?.fecha),
      iv.length > 0,
      est > 0 || gas > 0,
      seatedN > 0,
      sent > 0,
      (event?.itinerarios_array?.length || 0) > 0,
    ];
  });

  // Persistencia de aspectos/evento — mismo patrón que BlockSobreMiEvento (eventUpdate)
  const saveField = async (patch: Record<string, any>) => {
    try {
      const r: any = await fetchApiBodas({ query: queries.eventUpdate, variables: { idEvento: event._id, input: patch }, token: null });
      if (r?.errors?.length) throw new Error();
      setEvent({ ...event, ...patch });
      toast("success", "Guardado con éxito");
    } catch {
      toast("error", "Ha ocurrido un error");
    }
  };

  const inv: any[] = event?.invitados_array || [];
  const total = inv.length;
  const pendientes = inv.filter((x) => x?.asistencia === "pendiente").length;
  const confirmados = inv.filter((x) => x?.asistencia === "confirmado").length;
  const cancelados = inv.filter((x) => x?.asistencia === "cancelado").length;
  const seated = inv.filter((x) => x?.nombre_mesa && String(x.nombre_mesa).toLowerCase() !== "no asignado").length;
  const enviadas = inv.filter((x) => !!x?.invitacion).length;
  const sinEnviar = total - enviadas;

  const estimado = Number(event?.presupuesto_objeto?.coste_estimado || 0);
  const gastado = Number(event?.presupuesto_objeto?.coste_final || 0);
  const curSym = (c?: string) => {
    const m: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", MXN: "$", ARS: "$", COP: "$", CLP: "$", PEN: "S/", BRL: "R$", USB: "$" };
    if (!c) return "€";
    return m[c.toUpperCase()] || (c.length <= 2 ? c : "€");
  };
  const cur = curSym(event?.presupuesto_objeto?.currency);
  const over = gastado > estimado && estimado > 0;
  const fmt = (n: number) => `${Math.round(n).toLocaleString("es-ES")} ${cur}`;
  const presupPct = estimado > 0 ? Math.min((gastado / estimado) * 100, 100) : 0;
  const presupColor = over ? "#E0A32B" : "#EF5B94";

  const isOwner = event?.usuario_id === user?.uid;

  const fechaObj = event?.fecha ? new Date(event.fecha) : null;
  const fechaValida = !!fechaObj && !isNaN(fechaObj.getTime());
  const fechaTxt = fechaValida ? fechaObj!.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "Fecha por definir";
  const dias = fechaValida ? Math.max(0, Math.ceil((fechaObj!.getTime() - Date.now()) / 86400000)) : null;
  const tipoTxt = event?.tipo ? event.tipo.charAt(0).toUpperCase() + event.tipo.slice(1).toLowerCase() : "Evento";

  // Checklist "Toca para completar" — usa el estado toggleable stepsDone (mueve la barra)
  const stepTitles = ["Datos del evento", "Lista de invitados", "Presupuesto", "Plano de mesas", "Enviar invitaciones", "Crear itinerario"];
  const steps = stepTitles.map((title, i) => ({ title, done: !!stepsDone[i] }));
  const doneN = stepsDone.filter(Boolean).length;
  const totalSteps = stepTitles.length;
  const pct = Math.round((doneN / totalSteps) * 100);
  const firstPending = stepsDone.findIndex((v) => !v);
  const estadoMsg = pct === 0 ? "¡Empieza tu evento!" : pct < 50 ? "¡Vamos comenzando!" : pct < 100 ? "¡Vas por buen camino!" : "¡A celebrar!";
  const ticks = [1, 2, 3, 4, 5].map((k) => ({ left: `${((k / totalSteps) * 100).toFixed(1)}%`, on: (k / totalSteps) * 100 <= pct }));

  const metricas = [
    { big: `${doneN} de ${totalSteps}`, label: "Pasos para completar tu evento" },
    { big: String(total), label: "Invitados" },
    { big: `${seated} de ${total}`, label: "Invitados sentados" },
  ];

  // Alertas reales (solo las que aplican)
  type Alert = { icon: ReactNode; wrap: string; color: string; title: string; desc: string; cta: string; ctaColor: string; to: string };
  const alerts: Alert[] = [];
  if (over) alerts.push({ icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h0" /></svg>, wrap: "#FBF0DA", color: "#B4801F", title: "Presupuesto excedido", desc: `Superas el estimado en ${fmt(gastado - estimado)}.`, cta: "Revisar", ctaColor: "#B4801F", to: "/presupuesto" });
  if (sinEnviar > 0) alerts.push({ icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>, wrap: "#FCE7F0", color: "#EF5B94", title: "Invitaciones sin enviar", desc: `${enviadas} de ${total} enviadas.`, cta: "Enviar", ctaColor: "#EF5B94", to: "/invitaciones" });
  if (pendientes > 0) alerts.push({ icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M17 11l2 2 4-4" /></svg>, wrap: "#FCE7F0", color: "#EF5B94", title: "Invitados sin confirmar", desc: `${confirmados} de ${total} confirmados.`, cta: "Gestionar", ctaColor: "#EF5B94", to: "/invitados" });

  const heroSrc = (event?.imgEvento?.i640 || event?.imgEvento?.i800 || event?.imgEvento?.i320)
    ? `/api/proxy-image?url=${encodeURIComponent(`https://api-mcp.eventosorganizador.com/${event.imgEvento.i640 || event.imgEvento.i800 || event.imgEvento.i320}`)}`
    : (defaultImagenes[event?.tipo?.toLowerCase()] || defaultImagenes["otro"]);

  // Invitados (3 stats)
  const invStats = [
    { count: `${pendientes} de ${total}`, label: "por confirmar", soft: "#FBF0DA", fg: "#E0A32B", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 1.5" /></svg> },
    { count: `${confirmados} de ${total}`, label: "confirmadas", soft: "#E4F5EE", fg: "#2FB37E", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg> },
    { count: `${cancelados} de ${total}`, label: "canceladas", soft: "#FBE4EF", fg: "#D83E7C", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg> },
  ];

  // Mesas por espacio (planSpace → tables; sentados por coincidencia de nombre_mesa)
  const spaces: any[] = event?.planSpace || [];
  const mesasList = spaces.map((sp: any) => {
    const tables: any[] = sp?.tables || [];
    const names = new Set(tables.map((t: any) => t?.title));
    const capacity = tables.reduce((s: number, t: any) => s + (Number(t?.numberChair) || 0), 0);
    const seatedHere = inv.filter((g) => g?.nombre_mesa && names.has(g.nombre_mesa)).length;
    return { name: sp?.title || "Espacio", total: tables.length, seated: seatedHere, capacity };
  });

  // Lista de regalos (misma lógica que BlockListaRegalos)
  const lista: any = event?.listaRegalos ?? null;
  const regItems: any[] = Array.isArray(lista?.items) ? lista.items : Array.isArray(lista?.regalos) ? lista.regalos : Array.isArray(lista) ? lista : [];
  const raised = regItems.reduce((s: number, it: any) => {
    const c = Array.isArray(it?.contribuciones) ? it.contribuciones : [];
    const cs = c.reduce((a: number, x: any) => a + (Number(x?.monto ?? x?.importe ?? 0) || 0), 0);
    return s + (cs || (Number(it?.conseguido ?? 0) || 0));
  }, 0);
  const participantes = regItems.reduce((s: number, it: any) => s + (Array.isArray(it?.contribuciones) ? it.contribuciones.length : 0), 0);
  const listaActiva = regItems.length > 0;

  // Momentos
  const albumes = Number((event as any)?.memoriesAlbumCount || 0);

  // Sobre mi evento (aspectos) — mismos campos/valores que BlockSobreMiEvento
  const colorVal = Array.isArray(event?.color) ? event.color[0] : event?.color;
  const colorOpts = [
    { name: "Amarillo", hex: "#F2C230" }, { name: "Celeste", hex: "#29C2E0" }, { name: "Rosado", hex: "#EF5B94" },
    { name: "Rojo", hex: "#E23B2E" }, { name: "Morado", hex: "#8B3FD6" }, { name: "Beige", hex: "#E4D3A6" },
    { name: "Dorado", hex: "#E0A32B" }, { name: "Plata", hex: "#A9B0BC" }, { name: "Naranja", hex: "#F07B29" }, { name: "verde", hex: "#4CA83D" },
  ];
  const colorHex = colorOpts.find((c) => c.name === colorVal)?.hex;
  const seasonOpts: { name: string; color: string; paths: ReactNode }[] = [
    { name: "Invierno", color: "#29C2E0", paths: <><path d="M12 2v20M3.34 7l17.32 10M3.34 17L20.66 7" /><path d="M12 5.6l-2.2-2.2M12 5.6l2.2-2.2M12 18.4l-2.2 2.2M12 18.4l2.2 2.2M6.8 9l-2.9-.2M6.8 9l-.2-2.9M17.2 15l2.9 .2M17.2 15l.2 2.9M6.8 15l-.2 2.9M6.8 15l-2.9 .2M17.2 9l.2-2.9M17.2 9l2.9-.2" /></> },
    { name: "Primavera", color: "#4CA83D", paths: <><circle cx="12" cy="12" r="2.4" /><ellipse cx="12" cy="6" rx="2.5" ry="3.4" /><ellipse cx="12" cy="6" rx="2.5" ry="3.4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="6" rx="2.5" ry="3.4" transform="rotate(120 12 12)" /><ellipse cx="12" cy="6" rx="2.5" ry="3.4" transform="rotate(180 12 12)" /><ellipse cx="12" cy="6" rx="2.5" ry="3.4" transform="rotate(240 12 12)" /><ellipse cx="12" cy="6" rx="2.5" ry="3.4" transform="rotate(300 12 12)" /></> },
    { name: "Verano", color: "#F2A81E", paths: <><circle cx="12" cy="12" r="4.2" /><path d="M12 2.4v2.3M12 19.3v2.3M2.4 12h2.3M19.3 12h2.3M5.1 5.1l1.7 1.7M17.2 17.2l1.7 1.7M18.9 5.1l-1.7 1.7M6.8 17.2l-1.7 1.7" /></> },
    { name: "Otoño", color: "#C77A2E", paths: <><path d="M12 2 L13.3 5.6 L16.6 4.5 L15.3 7.9 L19.2 7.6 L16.4 10.4 L20.2 11.9 L16 12.7 L17.9 16 L14.1 14.7 L13.8 18.6 L12 15.6 L10.2 18.6 L9.9 14.7 L6.1 16 L8 12.7 L3.8 11.9 L7.6 10.4 L4.8 7.6 L8.7 7.9 L7.4 4.5 L10.7 5.6 Z" /><path d="M12 15.6V22" /></> },
  ];
  const estiloOpts: { name: string; paths: ReactNode }[] = [
    { name: "Aire libre", paths: <><circle cx="9" cy="8" r="4" /><path d="M9 12v9M3 21h18M15 21v-5h5v5" /></> },
    { name: "Salón", paths: <><circle cx="12" cy="12" r="7" /><path d="M5 12h14M12 5v14M6.5 7.5c3.5 2.5 7.5 2.5 11 0M6.5 16.5c3.5-2.5 7.5-2.5 11 0" /></> },
    { name: "Piscina", paths: <><path d="M12 4a7 7 0 0 1 7 7H5a7 7 0 0 1 7-7Z" /><path d="M12 4v9" /><path d="M4 21l5-5h8" /></> },
    { name: "En casa", paths: <><path d="M6 21V4h12v17" /><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" /></> },
    { name: "Salon historico", paths: <><path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M3 10h18L12 3 3 10Z" /></> },
  ];
  const seasonIcon = (name?: string, size = 30) => { const s = seasonOpts.find((o) => o.name === name); return s ? <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">{s.paths}</svg> : null; };
  const estiloIcon = (name?: string, size = 30) => { const s = estiloOpts.find((o) => o.name === name); return s ? <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#7A7A82" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">{s.paths}</svg> : null; };
  const aspectVisual = (key: string) => {
    if (key === "color") return <div style={{ width: 30, height: 30, borderRadius: "50%", background: colorHex || "#e6e6ea", border: "2px solid #fff", boxShadow: "0 0 0 1.5px #e6e6ea" }} />;
    if (key === "temporada") return event?.temporada ? seasonIcon(event.temporada, 30) : <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#b3b3ba" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>;
    if (key === "estilo") return event?.estilo ? estiloIcon(event.estilo, 30) : <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#b3b3ba" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V9l7-5 7 5v12" /></svg>;
    return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={event?.tematica ? "#EF5B94" : "#b3b3ba"} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.4 5.3 5.6.5-4.2 3.8 1.3 5.6L12 17l-5.1 2.5 1.3-5.6L4 10.3l5.6-.5z" /></svg>;
  };
  const aspects = [
    { key: "color", name: "Color", value: colorVal || "Sin definir", has: !!colorVal },
    { key: "temporada", name: "Temporada", value: event?.temporada || "Sin definir", has: !!event?.temporada },
    { key: "estilo", name: "Estilo", value: event?.estilo || "Sin definir", has: !!event?.estilo },
    { key: "tematica", name: "Temática", value: event?.tematica || "Sin definir", has: !!event?.tematica },
  ];
  const popover: React.CSSProperties = { background: "#fff", borderRadius: 14, boxShadow: "0 6px 22px rgba(0,0,0,.09)", padding: "24px 30px", marginBottom: 14, position: "relative", display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: "20px 30px", animation: "fadein .18s ease" };
  const closeX = <button onClick={() => setPicker(null)} style={{ position: "absolute", top: 12, right: 16, width: 26, height: 26, color: "#8a8a90", fontSize: 16, background: "none", border: "none", cursor: "pointer" }}>✕</button>;

  const dashBtn: React.CSSProperties = { alignSelf: "center", marginTop: "auto", height: 42, width: 160, padding: "0 18px", borderRadius: 11, background: "transparent", border: "1.5px dashed #F4A9C8", color: "#EF5B94", font: "600 12.5px Poppins", cursor: "pointer" };

  return (
    <div style={{ background: "#F2F2F2", minHeight: "100%", fontFamily: "'Poppins',sans-serif" }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @media (max-width:820px){.rs-hero{grid-template-columns:1fr !important}.rs-2col{grid-template-columns:1fr !important}.rs-3col{grid-template-columns:1fr !important}.rs-check{grid-template-columns:repeat(2,1fr) !important}}
      ` }} />
      {isOwner && openShare && <ModalCompartirEventoStudio event={event} onClose={() => setOpenShare(false)} />}

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 20px 48px", animation: "fadein .2s ease" }}>

        {/* HERO EVENTO */}
        <div className="rs-hero" style={{ display: "grid", gridTemplateColumns: "44% 1fr", background: "#fff", border: "1px solid #f0f0f2", borderRadius: 18, overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,.06)", marginBottom: 16 }}>
          <div style={{ position: "relative", minHeight: 230, background: "#f2f2f4" }}>
            <img src={heroSrc} alt={event?.nombre} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).src = defaultImagenes[event?.tipo?.toLowerCase()] || defaultImagenes["otro"]; }} />
          </div>
          <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "flex-end", gap: 8 }}>
              <div onClick={() => isOwner && setOpenShare(true)} title="Personas con acceso" style={{ position: "relative", width: 34, height: 34, borderRadius: "50%", background: "#7a7a7a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "700 14px Poppins", cursor: isOwner ? "pointer" : "default" }}>
                {(user?.displayName || event?.nombre || "?").charAt(0).toUpperCase()}
                <span style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: "#37c46b", border: "1.5px solid #fff" }} />
              </div>
              <div onClick={() => isOwner && setOpenShare(true)} title="Compartir" style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", cursor: isOwner ? "pointer" : "default" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></svg>
              </div>
              <div onClick={() => isOwner && setIsMounted(true)} title="Editar evento" style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", opacity: isOwner ? 1 : .5, cursor: isOwner ? "pointer" : "default" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 2 }}>
              <div style={{ font: "700 24px Poppins", color: "#4a4a52", letterSpacing: ".3px" }}>{event?.nombre}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, font: "600 13px Poppins", color: "#8a8a90" }}>
                {fechaTxt}<span style={{ background: "#FCE7F0", color: "#EF5B94", font: "600 11.5px Poppins", padding: "3px 11px", borderRadius: 20 }}>{tipoTxt}</span>
              </div>
              {dias !== null && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 9, background: "linear-gradient(135deg,#EF5B94,#f588b3)", color: "#fff", font: "500 13px Poppins", padding: "6px 15px", borderRadius: 22, boxShadow: "0 6px 16px rgba(239,91,148,.28)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h12M6 22h12M6 2c0 5 4 6 4 10s-4 5-4 10M18 2c0 5-4 6-4 10s4 5 4 10" /></svg>
                  {dias === 0 ? "¡Es hoy!" : `Faltan ${dias.toLocaleString("es-ES")} días`}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 18 }}>
              <div style={{ font: "600 11.5px Poppins", color: "#8a8a90" }}>Estado <span style={{ color: "#3A3A42" }}>· {pct}%</span></div>
              <div style={{ font: "600 11.5px Poppins", color: "#EF5B94", whiteSpace: "nowrap" }}>{estadoMsg}</div>
            </div>
            <div style={{ position: "relative", height: 8, borderRadius: 8, background: "#f0f0f2", marginTop: 8 }}>
              <div style={{ position: "absolute", inset: 0, height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#EF5B94,#f588b3)", borderRadius: 8, transition: "width .9s cubic-bezier(.2,.7,.2,1)" }} />
              {ticks.map((t, i) => (<div key={i} style={{ position: "absolute", top: "50%", left: t.left, transform: "translate(-50%,-50%)", width: 5, height: 5, borderRadius: "50%", background: t.on ? "#fff" : "#d8d8de" }} />))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 16 }}>
              {metricas.map((m, i) => (
                <div key={i} style={{ textAlign: "center", padding: "4px 2px" }}>
                  <div style={{ font: "600 16px Poppins", color: "#3A3A42" }}>{m.big}</div>
                  <div style={{ font: "500 10.5px Poppins", color: "#a0a0a8", marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHECKLIST: PASOS PARA COMPLETAR */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2px 0", marginBottom: 16 }}>
          <div style={{ font: "500 11px Poppins", color: "#a0a0a8", whiteSpace: "nowrap", flex: "none" }}>Marca lo completado</div>
          <div className="rs-check" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, flex: 1 }}>
            {steps.map((s, i) => {
              const active = i === firstPending;
              const dotBg = s.done ? "#EF5B94" : active ? "#EF5B94" : "#f0f0f2";
              const dotFg = s.done || active ? "#fff" : "#b3b3ba";
              const bg = s.done ? "#f4f4f6" : active ? "#FDEEF4" : "#faf9fb";
              const border = s.done ? "#e4e4e8" : active ? "#EF5B94" : "#f0f0f2";
              return (
                <div key={i} onClick={() => setStepsDone((prev) => prev.map((v, idx) => (idx === i ? !v : v)))} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 10, background: bg, border: `1.5px ${active ? "dashed" : "solid"} ${border}`, boxShadow: active ? "0 3px 12px rgba(239,91,148,.22)" : "none", cursor: "pointer" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: dotBg, display: "flex", alignItems: "center", justifyContent: "center", color: dotFg, font: "700 10px Poppins", flex: "none" }}>
                    {s.done ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg> : i + 1}
                  </div>
                  <div style={{ font: "500 10.5px Poppins", color: s.done ? "#a0a0a8" : active ? "#3A3A42" : "#a0a0a8", lineHeight: 1.2 }}>{s.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NECESITA TU ATENCIÓN */}
        {alerts.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11 }}>
              <span style={{ font: "600 16px Poppins", color: "#6b6b72" }}>Necesita tu atención</span>
            </div>
            <div className="rs-3col" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(alerts.length, 3)},1fr)`, gap: 14, marginBottom: 22 }}>
              {alerts.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 14, padding: "14px 16px", boxShadow: "0 4px 14px rgba(0,0,0,.05)" }}>
                  <div style={{ width: 38, height: 38, flex: "none", borderRadius: 11, background: a.wrap, display: "flex", alignItems: "center", justifyContent: "center", color: a.color }}>{a.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "600 13px Poppins", color: "#3A3A42" }}>{a.title}</div>
                    <div style={{ font: "500 11.5px Poppins", color: "#a0a0a8", marginTop: 2 }}>{a.desc}</div>
                  </div>
                  <span onClick={() => router.push(a.to)} style={{ font: "600 12px Poppins", color: a.ctaColor, whiteSpace: "nowrap", cursor: "pointer" }}>{a.cta}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PRESUPUESTO + INVITADOS */}
        <div className="rs-2col" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 18, marginBottom: 18, alignItems: "stretch" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ font: "600 16px Poppins", color: "#6b6b72", marginBottom: 10 }}>Presupuesto</div>
            <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, padding: "20px 18px", display: "flex", flexDirection: "column", flex: 1, gap: 16, boxShadow: "0 4px 14px rgba(0,0,0,.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flex: "none", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}>
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" /><path d="M2 9v1c0 1.1.9 2 2 2h1" /><path d="M16 11h0" /></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: "500 11px Poppins", color: "#a0a0a8" }}>Estimado</div>
                  <div style={{ font: "600 16px Poppins", color: "#3A3A42" }}>{fmt(estimado)}</div>
                </div>
              </div>
              <div>
                <div style={{ height: 8, borderRadius: 6, background: "#f2f2f4", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${presupPct.toFixed(0)}%`, borderRadius: 6, background: presupColor, transition: "width .9s cubic-bezier(.2,.7,.2,1)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
                  <span style={{ font: "500 11px Poppins", color: "#a0a0a8" }}>Gastado</span>
                  <span style={{ font: "600 16px Poppins", color: presupColor }}>{fmt(gastado)}</span>
                </div>
              </div>
              <div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 6, background: over ? "#FDF6E7" : "#EAF7F0", border: `1px solid ${over ? "#F2E2B8" : "#C3E8D5"}`, borderRadius: 999, padding: "5px 12px" }}>
                {over
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B4801F" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h0" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E8F63" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                <span style={{ font: "600 11.5px Poppins", color: over ? "#B4801F" : "#1E8F63", whiteSpace: "nowrap" }}>{over ? `Superas el presupuesto en ${fmt(gastado - estimado)}` : `Te quedan ${fmt(Math.max(0, estimado - gastado))}`}</span>
              </div>
              <button onClick={() => router.push("/presupuesto")} style={dashBtn}>Añadir gastos</button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ font: "600 16px Poppins", color: "#6b6b72", marginBottom: 10 }}>Invitados</div>
            <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, padding: "22px 18px", display: "flex", flexDirection: "column", flex: 1, boxShadow: "0 4px 14px rgba(0,0,0,.06)" }}>
              <div style={{ display: "flex", alignItems: "stretch", justifyContent: "center", gap: 10, flex: 1 }}>
                {invStats.map((g, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10 }}>
                    <div style={{ position: "relative", width: 46, height: 46, flex: "none" }}>
                      <div style={{ width: 46, height: 46, borderRadius: 14, background: g.soft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={g.fg} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3.2" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.5a4 4 0 0 1 0 7" /></svg>
                      </div>
                      <div style={{ position: "absolute", right: -4, bottom: -4, width: 20, height: 20, borderRadius: "50%", background: g.fg, display: "flex", alignItems: "center", justifyContent: "center", border: "2.5px solid #fff" }}>{g.icon}</div>
                    </div>
                    <div style={{ font: "600 16px Poppins", color: "#3A3A42", lineHeight: 1 }}>{g.count}</div>
                    <div style={{ font: "500 11.5px Poppins", color: "#8a8a90" }}>{g.label}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push("/invitados")} style={dashBtn}>Añadir Invitados</button>
            </div>
          </div>
        </div>

        {/* BANNER INVITACIONES */}
        <div style={{ borderRadius: 16, padding: "18px 24px", background: "linear-gradient(135deg,#EF5B94,#f588b3)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, boxShadow: "0 10px 24px rgba(239,91,148,.28)", flexWrap: "wrap", gap: 12 }}>
          <div style={{ font: "600 16px Poppins", color: "#fff" }}>Invitaciones</div>
          <div style={{ display: "flex", alignItems: "center", gap: 26, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}><span style={{ font: "600 13px Poppins", color: "#fff", opacity: .9 }}>enviadas </span><span style={{ font: "600 16px Poppins", color: "#fff" }}>{enviadas}</span></div>
            <div style={{ textAlign: "center" }}><span style={{ font: "600 13px Poppins", color: "#fff", opacity: .9 }}>por enviar </span><span style={{ font: "600 16px Poppins", color: "#fff" }}>{sinEnviar}</span></div>
            <div style={{ textAlign: "center" }}><span style={{ font: "600 13px Poppins", color: "#fff", opacity: .9 }}>confirmadas </span><span style={{ font: "600 16px Poppins", color: "#fff" }}>{confirmados}</span></div>
            <button onClick={() => router.push("/invitaciones")} style={{ padding: "11px 18px", borderRadius: 10, background: "#fff", color: "#EF5B94", font: "600 12.5px Poppins", cursor: "pointer", border: "none" }}>Ver mis invitaciones</button>
          </div>
        </div>

        {/* MESAS + LISTA DE REGALOS */}
        <div className="rs-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18, alignItems: "stretch" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ font: "600 16px Poppins", color: "#6b6b72" }}>Mesas</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, padding: "8px 18px 18px", flex: 1, display: "flex", flexDirection: "column", boxShadow: "0 4px 14px rgba(0,0,0,.06)" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                {mesasList.length === 0 && <div style={{ textAlign: "center", padding: "22px 0", font: "500 12px Poppins", color: "#a0a0a8" }}>Aún no has creado planos de mesas.</div>}
                {mesasList.map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: `1px solid ${i < mesasList.length - 1 ? "#f0f0f2" : "transparent"}` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, flex: "none", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}><svg width="22" height="22" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" strokeWidth={1.7}><ellipse cx="12" cy="9" rx="8" ry="3" /><path d="M6 10v8M18 10v8" /></svg></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "600 13px Poppins", color: "#3A3A42" }}>{m.name}</div>
                      <div style={{ font: "500 11px Poppins", color: "#a0a0a8", marginTop: 1 }}>{m.total} mesas</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FCE7F0", padding: "5px 11px", borderRadius: 20 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3.2" /></svg><span style={{ font: "600 12px Poppins", color: "#EF5B94" }}>{m.seated}{m.capacity ? ` de ${m.capacity}` : ""} sentados</span></div>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push("/mesas")} style={dashBtn}>Ver mesas</button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ font: "600 16px Poppins", color: "#6b6b72" }}>Lista de regalos</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 16, flex: 1, boxShadow: "0 4px 14px rgba(0,0,0,.06)" }}>
              <div style={{ display: "flex", gap: 12, flex: 1, alignItems: "center" }}>
                <div style={{ flex: 1, background: "#faf9fb", borderRadius: 12, padding: "16px 14px", textAlign: "center" }}><div style={{ font: "600 16px Poppins", color: "#3A3A42" }}>{Math.round(raised).toLocaleString("es-ES")}€</div><div style={{ font: "500 10.5px Poppins", color: "#a0a0a8", marginTop: 2 }}>Recaudado</div></div>
                <div style={{ flex: 1, background: "#faf9fb", borderRadius: 12, padding: "16px 14px", textAlign: "center" }}><div style={{ font: "600 16px Poppins", color: "#3A3A42" }}>{participantes}</div><div style={{ font: "500 10.5px Poppins", color: "#a0a0a8", marginTop: 2 }}>Participantes</div></div>
              </div>
              <button onClick={() => router.push("/lista-regalos")} style={dashBtn}>{listaActiva ? "Ver lista" : "Activar lista"}</button>
            </div>
          </div>
        </div>

        {/* ACCESOS RÁPIDOS */}
        <div className="rs-hero" style={{ display: "grid", gridTemplateColumns: "44% 1fr", gap: 18, marginBottom: 16 }}>
          <button onClick={() => router.push("/itinerario")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "9px 13px", borderRadius: 12, background: "#FCE7F0", color: "#EF5B94", font: "600 13px Poppins", border: "none", cursor: "pointer" }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" /></svg>Ver itinerarios</button>
          <div style={{ display: "flex", alignItems: "stretch", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 14px rgba(0,0,0,.06)" }}>
            <button title="Directorio de lugares (próximamente)" style={{ flex: "none", padding: "9px 20px", background: "#EF5B94", color: "#fff", font: "600 13px Poppins", border: "none", cursor: "default" }}>Lugar del evento</button>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "#fff", padding: "8px 16px" }}>
              <input type="text" placeholder="Buscar lugar en el directorio de Bodasdehoy…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", font: "500 13px Poppins", color: "#3A3A42" }} />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            </div>
          </div>
        </div>

        {/* MOMENTOS */}
        <div className="rs-2col" style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, padding: "18px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "center", marginBottom: 22, boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, flex: "none", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M5.5 18l4-4 2.5 2.5L16 13l2.5 3" /></svg></div>
            <div style={{ flex: 1 }}><div style={{ font: "600 16px Poppins", color: "#6b6b72" }}>Momentos</div><div style={{ font: "500 11.5px Poppins", color: "#8a8a90", marginTop: 2 }}>Álbumes de fotos compartidos con tus invitados.</div></div>
            <div style={{ textAlign: "center" }}><div style={{ font: "600 16px Poppins", color: "#EF5B94" }}>{albumes}</div><div style={{ font: "500 10.5px Poppins", color: "#a0a0a8" }}>álbumes</div></div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", paddingLeft: 22 }}>
            <button onClick={() => router.push("/momentos")} style={{ height: 42, width: 160, padding: "0 18px", borderRadius: 11, background: "transparent", border: "1.5px dashed #F4A9C8", color: "#EF5B94", font: "600 12.5px Poppins", cursor: "pointer" }}>{albumes > 0 ? "Ver álbumes" : "Crear álbum"}</button>
          </div>
        </div>

        {/* SOBRE MI EVENTO */}
        <div style={{ font: "600 16px Poppins", color: "#6b6b72", marginBottom: 14 }}>Sobre mi evento</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 30, marginBottom: 14, justifyItems: "center" }}>
          {aspects.map((a) => (
            <div key={a.key} onClick={() => { if (a.key === "tematica") setTematicaDraft(event?.tematica || ""); setPicker(picker === (a.key as any) ? null : (a.key as any)); }} style={{ width: "100%", aspectRatio: "1", maxWidth: 150, borderRadius: "50%", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center", boxShadow: "0 8px 20px rgba(0,0,0,.07)", cursor: "pointer" }}>
              {aspectVisual(a.key)}
              <div style={{ font: "500 12px Poppins", color: "#8a8a90" }}>{a.name}</div>
              {a.has && <div style={{ font: "700 11.5px Poppins", color: "#6b6b72" }}>{a.value}</div>}
            </div>
          ))}
        </div>

        {picker === "color" && (
          <div style={popover}>
            {colorOpts.map((c) => (
              <div key={c.name} onClick={() => { saveField({ color: [c.name] }); setPicker(null); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "pointer", minWidth: 52 }}>
                <div style={{ height: 46, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="30" height="34" viewBox="0 0 24 25"><path d="M12 2 C12 2 4.5 11 4.5 16 a7.5 7.5 0 0 0 15 0 C19.5 11 12 2 12 2 Z" fill={c.hex} stroke={colorVal === c.name ? "#3A3A42" : "rgba(0,0,0,.14)"} strokeWidth={colorVal === c.name ? 1.6 : 1} /></svg>
                </div>
                <span style={{ font: "500 12.5px Poppins", color: "#6b6b72" }}>{c.name}</span>
              </div>
            ))}
            {closeX}
          </div>
        )}
        {picker === "temporada" && (
          <div style={{ ...popover, justifyContent: "space-around" }}>
            {seasonOpts.map((s) => (
              <div key={s.name} onClick={() => { saveField({ temporada: s.name }); setPicker(null); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, cursor: "pointer", minWidth: 72 }}>
                <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>{seasonIcon(s.name, 30)}</div>
                <span style={{ font: "500 13px Poppins", color: "#6b6b72" }}>{s.name}</span>
              </div>
            ))}
            {closeX}
          </div>
        )}
        {picker === "estilo" && (
          <div style={{ ...popover, justifyContent: "space-around" }}>
            {estiloOpts.map((s) => (
              <div key={s.name} onClick={() => { saveField({ estilo: s.name }); setPicker(null); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, cursor: "pointer", minWidth: 72 }}>
                <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>{estiloIcon(s.name, 30)}</div>
                <span style={{ font: "500 13px Poppins", color: "#6b6b72" }}>{s.name}</span>
              </div>
            ))}
            {closeX}
          </div>
        )}
        {picker === "tematica" && (
          <div style={{ ...popover, display: "block", padding: "22px 30px 24px" }}>
            <div style={{ font: "600 13px Poppins", color: "#EF5B94", marginBottom: 10 }}>Temática del evento</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input value={tematicaDraft} onChange={(e) => setTematicaDraft(e.target.value)} placeholder="Escribe la temática de tu evento…" style={{ flex: 1, border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "11px 15px", font: "500 13px Poppins", color: "#3A3A42", outline: "none" }} />
              <button onClick={() => { saveField({ tematica: tematicaDraft.trim() }); setPicker(null); }} style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 20px", height: 44, background: "#EF5B94", borderRadius: 10, color: "#fff", font: "600 13px Poppins", border: "none", cursor: "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>Guardar</button>
            </div>
            {closeX}
          </div>
        )}

        {/* NOTAS INTERNAS */}
        <div style={{ marginTop: 22 }}>
          <div style={{ font: "600 16px Poppins", color: "#6b6b72", marginBottom: 14 }}>Notas internas</div>
          <EntityNotesSection entityType="EVENTO" entityId={event._id} entityName={event.nombre || "Evento"} />
        </div>

      </div>

      {/* EDITAR EVENTO — reusa el modal de Crear evento (FormCrearEvento) en modo edición.
          Los cambios se guardan en el evento (eventUpdate + setEvent dentro del propio form). */}
      <div className={`${!shouldRenderChild ? "hidden" : "fixed z-30 top-0 left-0"}`}>
        {shouldRenderChild && (
          <ModalLeft set={setIsMounted} state={isMounted} clickAwayListened={false} studio={true}>
            <FormCrearEvento set={setIsMounted} state={isMounted} EditEvent={true} eventData={event} />
          </ModalLeft>
        )}
      </div>
    </div>
  );
};
