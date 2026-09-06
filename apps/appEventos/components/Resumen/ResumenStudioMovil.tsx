import { FC, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { EventContextProvider, AuthContextProvider } from "../../context";
import ModalCompartirEventoStudio from "../Utils/ModalCompartirEventoStudio";
import { defaultImagenes } from "../Home/Card";
import StudioNotesSection from "../Presupuesto/StudioNotesSection";
import FormCrearEvento from "../Forms/FormCrearEvento";
import ModalLeft from "../Utils/ModalLeft";
import { useDelayUnmount } from "../../utils/Funciones";

/**
 * ResumenStudioMovil — versión MÓVIL del Resumen, fiel al HTML de referencia.
 * MISMO backend que ResumenStudio: todo se deriva del objeto `event` (api-mcp).
 * Solo cambia el layout (hero foto-arriba, checklist scroll, tarjetas apiladas,
 * banner invitaciones compacto, overlay "Lugar del evento", notas colapsables).
 */

const curSym = (c?: string) => {
  const m: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", MXN: "$", ARS: "$", COP: "$", CLP: "$", PEN: "S/", BRL: "R$", USB: "$" };
  if (!c) return "€";
  return m[c.toUpperCase()] || (c.length <= 2 ? c : "€");
};

const DASH = "1.5px dashed #F4A9C8";
const dashBtn: React.CSSProperties = { display: "block", margin: "14px auto 0", height: 40, width: 170, borderRadius: 11, background: "transparent", border: DASH, color: "#EF5B94", font: "600 12px Poppins", cursor: "pointer" };
const secTitle: React.CSSProperties = { font: "600 15px Poppins", color: "#6b6b72", margin: "0 2px 9px" };
const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #f0f0f2", borderRadius: 15, boxShadow: "0 3px 10px rgba(0,0,0,.04)" };

const DIRECTORIO = [
  ["Hacienda Los Rosales", "Sevilla · Fincas y haciendas"],
  ["Salones Vista Mar", "Málaga · Salones de celebración"],
  ["Masía El Olivar", "Valencia · Masías"],
  ["Palacio de Cristal", "Madrid · Palacios"],
];

const ResumenStudioMovil: FC = () => {
  const router = useRouter();
  const { event } = EventContextProvider() as any;
  const { user } = AuthContextProvider() as any;
  const [openShare, setOpenShare] = useState(false);
  const [isMounted, setIsMounted] = useState(false);   // drawer editar evento
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [lugarOpen, setLugarOpen] = useState(false);

  const inv: any[] = event?.invitados_array || [];
  const total = inv.length;
  const pendientes = inv.filter((x) => x?.asistencia === "pendiente").length;
  const confirmados = inv.filter((x) => x?.asistencia === "confirmado").length;
  const enviadas = inv.filter((x) => !!x?.invitacion).length;
  const sinEnviar = total - enviadas;
  const seatedGlobal = inv.filter((x) => x?.nombre_mesa && String(x.nombre_mesa).toLowerCase() !== "no asignado").length;

  const estimado = Number(event?.presupuesto_objeto?.coste_estimado || 0);
  const gastado = Number(event?.presupuesto_objeto?.coste_final || 0);
  const cur = curSym(event?.presupuesto_objeto?.currency);
  const over = gastado > estimado && estimado > 0;
  const fmt = (n: number) => `${Math.round(n).toLocaleString("es-ES")} ${cur}`;
  const presupPct = estimado > 0 ? Math.min((gastado / estimado) * 100, 100) : (gastado > 0 ? 100 : 0);
  const presupColor = over ? "#D83E7C" : "#EF5B94";

  const isOwner = event?.usuario_id === user?.uid;

  const fechaObj = event?.fecha ? new Date(event.fecha) : null;
  const fechaValida = !!fechaObj && !isNaN(fechaObj.getTime());
  const fechaTxt = fechaValida ? fechaObj!.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "Fecha por definir";
  const dias = fechaValida ? Math.max(0, Math.ceil((fechaObj!.getTime() - Date.now()) / 86400000)) : null;
  const tipoTxt = event?.tipo ? event.tipo.charAt(0).toUpperCase() + event.tipo.slice(1).toLowerCase() : "Evento";

  // Mesas por espacio
  const spaces: any[] = event?.planSpace || [];
  const mesasList = spaces.map((sp: any) => {
    const tables: any[] = sp?.tables || [];
    const names = new Set(tables.map((t: any) => t?.title));
    const seatedHere = inv.filter((g) => g?.nombre_mesa && names.has(g.nombre_mesa)).length;
    return { name: sp?.title || "Espacio", total: tables.length, seated: seatedHere };
  });
  const totalMesas = mesasList.reduce((s, m) => s + m.total, 0);

  // Lista de regalos
  const lista: any = event?.listaRegalos ?? null;
  const regItems: any[] = Array.isArray(lista?.items) ? lista.items : Array.isArray(lista?.regalos) ? lista.regalos : Array.isArray(lista) ? lista : [];
  const raised = regItems.reduce((s: number, it: any) => {
    const c = Array.isArray(it?.contribuciones) ? it.contribuciones : [];
    const cs = c.reduce((a: number, x: any) => a + (Number(x?.monto ?? x?.importe ?? 0) || 0), 0);
    return s + (cs || (Number(it?.conseguido ?? 0) || 0));
  }, 0);
  const participantes = regItems.reduce((s: number, it: any) => s + (Array.isArray(it?.contribuciones) ? it.contribuciones.length : 0), 0);
  const listaActiva = regItems.length > 0;

  const albumes = Number((event as any)?.memoriesAlbumCount || 0);

  const heroSrc = (event?.imgEvento?.i640 || event?.imgEvento?.i800 || event?.imgEvento?.i320)
    ? `/api/proxy-image?url=${encodeURIComponent(`https://api-mcp.eventosorganizador.com/${event.imgEvento.i640 || event.imgEvento.i800 || event.imgEvento.i320}`)}`
    : (defaultImagenes[event?.tipo?.toLowerCase()] || defaultImagenes["otro"]);

  // Checklist (mismo cálculo que ResumenStudio; toggle local mueve la barra)
  const [stepsDone, setStepsDone] = useState<boolean[]>(() => {
    const est = estimado, gas = gastado;
    return [
      !!(event?.nombre && event?.fecha),
      total > 0,
      est > 0 || gas > 0,
      seatedGlobal > 0,
      enviadas > 0,
      (event?.itinerarios_array?.length || 0) > 0,
    ];
  });
  const stepTitles = ["Datos del evento", "Invitados", "Presupuesto", "Plano de mesas", "Invitaciones", "Itinerario"];
  const doneN = stepsDone.filter(Boolean).length;
  const pct = Math.round((doneN / stepTitles.length) * 100);
  const estadoMsg = pct >= 100 ? "¡Evento completo!" : "Completa tu evento →";

  const heroChips = [
    { n: total, l: "Invitados" },
    { n: totalMesas, l: "Mesas" },
    { n: regItems.length, l: "Regalos" },
  ];

  // Invitados: 3 métricas con badge
  const invStats = [
    { n: total, l: "Total", soft: "#FCE7F0", fg: "#EF5B94", d: "M12 5v14M5 12h14" },
    { n: confirmados, l: "Confirmados", soft: "#E4F5EE", fg: "#2FB37E", d: "M5 12l5 5L20 7" },
    { n: pendientes, l: "Pendientes", soft: "#FBF0DA", fg: "#C99A3B", d: "M12 6v6l4 2" },
  ];

  return (
    <div className="md:hidden" style={{ background: "#f1f1f4", minHeight: "100%", fontFamily: "'Poppins',sans-serif" }}>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.rsm-hs{scrollbar-width:none;}.rsm-hs::-webkit-scrollbar{display:none;width:0;height:0;}" }} />
      {isOwner && openShare && <ModalCompartirEventoStudio event={event} onClose={() => setOpenShare(false)} />}

      <div style={{ maxWidth: 420, margin: "0 auto", padding: "16px 14px 24px" }}>

        {/* HERO */}
        <div style={{ ...cardStyle, borderRadius: 18, overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,.06)", marginBottom: 14 }}>
          <div style={{ position: "relative", height: 170, background: "#f4f4f6" }}>
            <img src={heroSrc} alt={event?.nombre} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).src = defaultImagenes[event?.tipo?.toLowerCase()] || defaultImagenes["otro"]; }} />
            <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 8 }}>
              <div onClick={() => isOwner && setOpenShare(true)} title="Compartir" style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", boxShadow: "0 3px 10px rgba(0,0,0,.14)", cursor: isOwner ? "pointer" : "default" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></svg></div>
              <div onClick={() => isOwner && setIsMounted(true)} title="Editar evento" style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", boxShadow: "0 3px 10px rgba(0,0,0,.14)", opacity: isOwner ? 1 : .5, cursor: isOwner ? "pointer" : "default" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg></div>
            </div>
          </div>
          <div style={{ padding: "16px 18px 18px", textAlign: "center" }}>
            <div style={{ font: "700 20px Poppins", color: "#4a4a52", textTransform: "uppercase" }}>{event?.nombre}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6, font: "600 12px Poppins", color: "#8a8a90" }}>{fechaTxt}<span style={{ background: "#FCE7F0", color: "#EF5B94", font: "600 10.5px Poppins", padding: "3px 10px", borderRadius: 20 }}>{tipoTxt}</span></div>
            {dias !== null && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 9, background: "linear-gradient(135deg,#EF5B94,#f588b3)", color: "#fff", font: "500 12px Poppins", padding: "6px 14px", borderRadius: 22, boxShadow: "0 6px 16px rgba(239,91,148,.28)" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h12M6 22h12M6 2c0 5 4 6 4 10s-4 5-4 10M18 2c0 5-4 6-4 10s4 5 4 10" /></svg>{dias === 0 ? "¡Es hoy!" : `Faltan ${dias.toLocaleString("es-ES")} días`}</div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <div style={{ font: "600 11px Poppins", color: "#8a8a90", whiteSpace: "nowrap" }}>Estado <span style={{ color: "#3A3A42" }}>· {pct}%</span></div>
              <div style={{ font: "600 11px Poppins", color: "#EF5B94", whiteSpace: "nowrap" }}>{estadoMsg}</div>
            </div>
            <div style={{ position: "relative", height: 7, borderRadius: 8, background: "#f0f0f2", marginTop: 7 }}>
              <div style={{ position: "absolute", inset: 0, height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#EF5B94,#f588b3)", borderRadius: 8, transition: "width .9s cubic-bezier(.2,.7,.2,1)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              {heroChips.map((c, i) => (
                <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#faf9fb", borderRadius: 999, padding: "5px 12px" }}><span style={{ font: "600 12.5px Poppins", color: "#3A3A42" }}>{c.n}</span><span style={{ font: "500 10px Poppins", color: "#a0a0a8" }}>{c.l}</span></div>
              ))}
            </div>
          </div>
        </div>

        {/* CHECKLIST scroll horizontal */}
        <div style={{ font: "500 10.5px Poppins", color: "#a0a0a8", margin: "0 2px 8px" }}>Marca lo completado</div>
        <div className="rsm-hs" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 2px 6px", marginBottom: 12 }}>
          {stepTitles.map((title, i) => {
            const on = !!stepsDone[i];
            return (
              <div key={i} onClick={() => setStepsDone((prev) => prev.map((v, idx) => (idx === i ? !v : v)))} style={{ flex: "none", display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 999, cursor: "pointer", background: on ? "#faf9fb" : "#fff", border: on ? "1.5px solid #f0f0f2" : DASH }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: on ? "#FCE7F0" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: on ? "#EF5B94" : "#c9c9cf", font: "700 9px Poppins", flex: "none" }}>{on ? "✓" : ""}</div>
                <span style={{ font: "500 11px Poppins", color: on ? "#a0a0a8" : "#3A3A42", whiteSpace: "nowrap" }}>{title}</span>
              </div>
            );
          })}
        </div>

        {/* PRESUPUESTO */}
        <div style={secTitle}>Presupuesto</div>
        <div style={{ ...cardStyle, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, flex: "none", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" /><path d="M2 9v1c0 1.1.9 2 2 2h1" /></svg></div>
            <div style={{ flex: 1 }}><div style={{ font: "500 10.5px Poppins", color: "#a0a0a8" }}>Estimado</div><div style={{ font: "600 15px Poppins", color: "#3A3A42" }}>{fmt(estimado)}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ font: "500 10.5px Poppins", color: "#a0a0a8" }}>Gastado</div><div style={{ font: "600 15px Poppins", color: presupColor }}>{fmt(gastado)}</div></div>
          </div>
          <div style={{ height: 7, borderRadius: 6, background: "#f2f2f4", overflow: "hidden", marginTop: 12 }}><div style={{ height: "100%", width: `${presupPct.toFixed(0)}%`, borderRadius: 6, background: presupColor }} /></div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: over ? "#FDF6E7" : "#EAF7F0", border: `1px solid ${over ? "#F2E2B8" : "#C3E8D5"}`, borderRadius: 999, padding: "5px 12px", marginTop: 12 }}>
            {over
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B4801F" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h0" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1E8F63" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
            <span style={{ font: "600 10.5px Poppins", color: over ? "#B4801F" : "#1E8F63" }}>{over ? `Superas el presupuesto en ${fmt(gastado - estimado)}` : `Te quedan ${fmt(Math.max(0, estimado - gastado))}`}</span>
          </div>
          <button onClick={() => router.push("/presupuesto")} style={dashBtn}>Añadir gastos</button>
        </div>

        {/* INVITADOS */}
        <div style={secTitle}>Invitados</div>
        <div style={{ ...cardStyle, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            {invStats.map((g, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, textAlign: "center" }}>
                <div style={{ position: "relative", width: 42, height: 42 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: g.soft, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={g.fg} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3.2" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.5a4 4 0 0 1 0 7" /></svg></div>
                  <div style={{ position: "absolute", right: -4, bottom: -4, width: 18, height: 18, borderRadius: "50%", background: g.fg, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d={g.d} /></svg></div>
                </div>
                <div style={{ font: "600 15px Poppins", color: "#3A3A42", lineHeight: 1 }}>{g.n}</div>
                <div style={{ font: "500 10.5px Poppins", color: "#8a8a90" }}>{g.l}</div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/invitados")} style={dashBtn}>Añadir Invitados</button>
        </div>

        {/* BANNER INVITACIONES compacto */}
        <div style={{ borderRadius: 15, padding: "13px 16px", background: "linear-gradient(135deg,#EF5B94,#f588b3)", marginBottom: 14, boxShadow: "0 8px 20px rgba(239,91,148,.26)", display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 34, height: 34, flex: "none", borderRadius: 10, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg></div>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 13px Poppins", color: "#fff" }}>Invitaciones</div><div style={{ font: "500 10.5px Poppins", color: "#fff", opacity: .85 }}>{enviadas} de {total} enviadas · {confirmados} confirmadas</div></div>
          <button onClick={() => router.push("/invitaciones")} style={{ flex: "none", padding: "9px 14px", borderRadius: 10, background: "#fff", color: "#EF5B94", font: "600 11.5px Poppins", whiteSpace: "nowrap", border: "none", cursor: "pointer" }}>Enviar</button>
        </div>

        {/* MESAS */}
        <div style={secTitle}>Mesas</div>
        <div style={{ ...cardStyle, padding: "6px 16px 14px", marginBottom: 14 }}>
          {mesasList.length === 0 && <div style={{ textAlign: "center", padding: "18px 0", font: "500 11.5px Poppins", color: "#a0a0a8" }}>Aún no has creado planos de mesas.</div>}
          {mesasList.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < mesasList.length - 1 ? "1px solid #f2f2f4" : "none" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, flex: "none", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}><svg width="19" height="19" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" strokeWidth={1.7}><ellipse cx="12" cy="9" rx="8" ry="3" /><path d="M6 10v8M18 10v8" /></svg></div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 12px Poppins", color: "#3A3A42" }}>{m.name}</div><div style={{ font: "500 10px Poppins", color: "#a0a0a8" }}>{m.total} mesas</div></div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#FCE7F0", padding: "4px 10px", borderRadius: 20 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3.2" /></svg><span style={{ font: "600 11px Poppins", color: "#EF5B94", whiteSpace: "nowrap" }}>{m.seated} sentados</span></div>
            </div>
          ))}
          <button onClick={() => router.push("/mesas")} style={dashBtn}>Ver mesas</button>
        </div>

        {/* LISTA DE REGALOS */}
        <div style={secTitle}>Lista de regalos</div>
        <div style={{ ...cardStyle, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, background: "#faf9fb", borderRadius: 11, padding: 13, textAlign: "center" }}><div style={{ font: "600 15px Poppins", color: "#3A3A42" }}>{Math.round(raised).toLocaleString("es-ES")}€</div><div style={{ font: "500 10px Poppins", color: "#a0a0a8", marginTop: 1 }}>Recaudado</div></div>
            <div style={{ flex: 1, background: "#faf9fb", borderRadius: 11, padding: 13, textAlign: "center" }}><div style={{ font: "600 15px Poppins", color: "#3A3A42" }}>{participantes}</div><div style={{ font: "500 10px Poppins", color: "#a0a0a8", marginTop: 1 }}>Participantes</div></div>
          </div>
          <button onClick={() => router.push("/lista-regalos")} style={dashBtn}>{listaActiva ? "Ver lista" : "Activar lista"}</button>
        </div>

        {/* ACCESOS RÁPIDOS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <button onClick={() => router.push("/itinerario")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 13, borderRadius: 12, background: "#FCE7F0", color: "#EF5B94", font: "600 12px Poppins", border: "none", cursor: "pointer" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" /></svg>Ver itinerarios</button>
          <button onClick={() => setLugarOpen(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 13, borderRadius: 12, background: "#EF5B94", color: "#fff", font: "600 12px Poppins", border: "none", boxShadow: "0 6px 14px rgba(239,91,148,.26)", cursor: "pointer" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>Lugar del evento</button>
        </div>

        {/* MOMENTOS */}
        <div style={{ ...cardStyle, padding: "15px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, flex: "none", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M5.5 18l4-4 2.5 2.5L16 13l2.5 3" /></svg></div>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 13px Poppins", color: "#6b6b72" }}>Momentos</div><div style={{ font: "500 10.5px Poppins", color: "#8a8a90" }}>{albumes} álbumes compartidos</div></div>
          <button onClick={() => router.push("/momentos")} style={{ flex: "none", height: 36, padding: "0 14px", borderRadius: 10, background: "transparent", border: DASH, color: "#EF5B94", font: "600 11.5px Poppins", whiteSpace: "nowrap", cursor: "pointer" }}>{albumes > 0 ? "Ver álbumes" : "Crear álbum"}</button>
        </div>

        {/* NOTAS INTERNAS (el propio componente ya es colapsable con su título + backend real) */}
        {event?._id && (
          <div style={{ marginBottom: 16 }}>
            <StudioNotesSection entityType="EVENTO" entityId={event._id} entityName={event.nombre || "Evento"} />
          </div>
        )}
      </div>

      {/* LUGAR DEL EVENTO — overlay pantalla completa (directorio, demo hasta conectar backend) */}
      {lugarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "#f6f6f8", display: "flex", justifyContent: "center", animation: "fadein .18s ease" }}>
          <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", background: "#f6f6f8" }}>
            <div style={{ background: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #f0f0f2" }}>
              <button onClick={() => setLugarOpen(false)} style={{ width: 34, height: 34, flex: "none", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#3A3A42", background: "#f4f4f6", border: "none", cursor: "pointer" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></button>
              <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #E7E7EA", borderRadius: 11, padding: "10px 12px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a0a0a8" strokeWidth={2} style={{ flex: "none" }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                <input placeholder="Busca lugares en el directorio…" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", font: "500 13px Poppins", color: "#3A3A42", background: "transparent" }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px" }}>
              <div style={{ font: "600 11px Poppins", color: "#a0a0a8", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 12 }}>Directorio Bodas de Hoy</div>
              {DIRECTORIO.map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 13, padding: "13px 14px", marginBottom: 10 }}>
                  <div style={{ width: 42, height: 42, flex: "none", borderRadius: 11, background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></svg></div>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 13px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l[0]}</div><div style={{ font: "500 11px Poppins", color: "#a0a0a8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l[1]}</div></div>
                  <button style={{ flex: "none", padding: "9px 15px", borderRadius: 9, border: "1.5px solid #E7E7EA", background: "#fff", font: "600 11.5px Poppins", color: "#EF5B94", cursor: "pointer" }}>Elegir</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EDITAR EVENTO — reusa FormCrearEvento en modo edición (mismo backend) */}
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

export default ResumenStudioMovil;
