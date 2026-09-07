import { FC, ReactNode } from "react";
import { AuthContextProvider } from "../../context";

/**
 * ModuloBloqueadoInvitado — pantalla de módulo bloqueado en modo invitado (usuario fantasma),
 * fiel a modulos-bloqueados-invitado.html. 3 capas: PREVIEW difuminado (skeleton de ejemplo,
 * NUNCA datos reales) → VELO 50% → TARJETA modal de registro. El nav superior sigue navegable.
 */

type ModKey = "invitados" | "mesas" | "presupuesto" | "invitaciones" | "itinerario" | "regalos" | "momentos";
type Preview = "tabla" | "plano" | "cards" | "fotos" | "presupuesto" | "invitaciones" | "itinerario" | "regalos" | "momentos";

const check = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1F8A5F" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg>
);

const MODULOS: Record<ModKey, { preview: Preview; icon: ReactNode; title: string; desc: string; benefits: string[] }> = {
  invitados: {
    preview: "tabla",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="3.6" /><path d="M3 19.2c0-3.3 2.7-5.7 6-5.7s6 2.4 6 5.7c0 .4-.3.8-.8.8H3.8a.8.8 0 0 1-.8-.8z" /><circle cx="16.8" cy="9" r="2.8" opacity=".55" /><path d="M16.4 13.4c2.7.2 4.6 2.3 4.6 5 0 .3-.3.6-.6.6h-3.2c.2-.5.3-1 .3-1.6 0-1.5-.5-2.9-1.1-4z" opacity=".55" /></svg>,
    title: "Lista de invitados",
    desc: "Crea tu cuenta gratis para gestionar invitados reales, confirmaciones de asistencia y organización por mesas.",
    benefits: ["Lista centralizada con estados de confirmación", "Enlaces públicos de RSVP y control de acompañantes", "Exportación e importación para coordinar con proveedores"],
  },
  mesas: {
    preview: "plano",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4.2" /><circle cx="12" cy="4.5" r="1.7" opacity=".55" /><circle cx="12" cy="19.5" r="1.7" opacity=".55" /><circle cx="4.5" cy="12" r="1.7" opacity=".55" /><circle cx="19.5" cy="12" r="1.7" opacity=".55" /><circle cx="6.7" cy="6.7" r="1.5" opacity=".55" /><circle cx="17.3" cy="6.7" r="1.5" opacity=".55" /><circle cx="6.7" cy="17.3" r="1.5" opacity=".55" /><circle cx="17.3" cy="17.3" r="1.5" opacity=".55" /></svg>,
    title: "Plano de mesas",
    desc: "Crea tu cuenta gratis para diseñar el plano real de tu evento y sentar a tus invitados.",
    benefits: ["Editor visual de mesas y salas", "Asignación de invitados y control de capacidad", "Enlaces para proveedores y seating público"],
  },
  presupuesto: {
    preview: "presupuesto",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 2A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 2h-11zM7 5.5h10a1 1 0 0 1 1 1V8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1zM7.5 12a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm-9 4.5a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z" /></svg>,
    title: "Control de presupuesto",
    desc: "Crea tu cuenta gratis para registrar gastos reales, categorías y pagos vinculados a tu evento.",
    benefits: ["Totales por categoría y comparación con lo estimado", "Seguimiento de pagos a proveedores", "Exportación para compartir con tu pareja o tu planner"],
  },
  invitaciones: {
    preview: "invitaciones",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8.8l8.4-5.2a1.2 1.2 0 0 1 1.2 0L21 8.8V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.8z" /><path d="M12 15.6l-8.7-5.4v-.2L12 15l8.7-5v.2L12 15.6z" fill="#fff" opacity=".9" /><path d="M12 13.4c-.9-1-2.4-1.6-2.4-3 0-1 .7-1.7 1.5-1.7.4 0 .7.2.9.5.2-.3.5-.5.9-.5.8 0 1.5.7 1.5 1.7 0 1.4-1.5 2-2.4 3z" fill="#fff" /></svg>,
    title: "Invitaciones digitales",
    desc: "Crea tu cuenta gratis para diseñar y enviar invitaciones personalizadas por WhatsApp, email o enlace.",
    benefits: ["Plantillas personalizables con tu estilo", "Envío masivo por WhatsApp, email o SMS", "Seguimiento de aperturas y confirmaciones"],
  },
  itinerario: {
    preview: "itinerario",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2.5a1 1 0 0 1 1 1V5h8V3.5a1 1 0 1 1 2 0V5h.5A2.5 2.5 0 0 1 21 7.5v11A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5v-11A2.5 2.5 0 0 1 5.5 5H6V3.5a1 1 0 0 1 1-1z" /><path d="M12 17.2c-1.4-1.4-3.6-2.4-3.6-4.4 0-1.4 1-2.4 2.2-2.4.6 0 1.1.3 1.4.8.3-.5.8-.8 1.4-.8 1.2 0 2.2 1 2.2 2.4 0 2-2.2 3-3.6 4.4z" fill="#fff" /></svg>,
    title: "Itinerario",
    desc: "Crea tu cuenta gratis para organizar el día del evento hora a hora y compartirlo con tu equipo.",
    benefits: ["Tareas con horario, responsables y avisos", "Vista tarjeta, tabla y esquema para compartir", "Descarga en PDF y enlace público"],
  },
  regalos: {
    preview: "regalos",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 8A1.5 1.5 0 0 1 5 6.5h14A1.5 1.5 0 0 1 20.5 8v2a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V8z" /><path d="M5 12.5h6V21H6.5A1.5 1.5 0 0 1 5 19.5v-7zM13 12.5h6v7a1.5 1.5 0 0 1-1.5 1.5H13v-8.5z" /><path d="M12 6.5c-1.2-2.2-3-3.6-4.6-2.7C6 4.6 6.3 6.5 8 6.5h4zm0 0c1.2-2.2 3-3.6 4.6-2.7 1.4.8 1.1 2.7-.6 2.7H12z" opacity=".55" /></svg>,
    title: "Lista de regalos",
    desc: "Crea tu cuenta gratis para publicar tu lista real de regalos y compartirla con tus invitados.",
    benefits: ["Enlaces públicos y seguimiento de reservas", "Integración con tiendas habituales", "Control de saldo y aportaciones"],
  },
  momentos: {
    preview: "momentos",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M7 6.5A2.5 2.5 0 0 1 9.5 4h9A2.5 2.5 0 0 1 21 6.5v7A2.5 2.5 0 0 1 18.5 16h-9A2.5 2.5 0 0 1 7 13.5v-7z" /><path d="M4.5 7.5c-.8.3-1.5 1.2-1.5 2.2V18a3 3 0 0 0 3 3h8.3c1 0 1.9-.6 2.2-1.5H6.5a2 2 0 0 1-2-2V7.5z" opacity=".55" /><circle cx="11" cy="8" r="1.3" fill="#fff" /><path d="M8.5 14.5l2.6-3 1.9 2 1.6-1.6 3.4 2.6H8.5z" fill="#fff" /></svg>,
    title: "Momentos",
    desc: "Crea tu cuenta gratis para recopilar las fotos de tus invitados en álbumes por momento del evento.",
    benefits: ["Portal del evento con QR para invitados", "Álbumes automáticos por momento del itinerario", "Descarga de todas las fotos en alta calidad"],
  },
};

/* ── Skeletons del preview (datos de EJEMPLO, jamás reales; no interactivos) ── */

// Maqueta FIEL de la pantalla real (cabecera + estadísticas + acciones + tabla), con
// datos de EJEMPLO. Se pinta detrás del velo y difuminada: al desenfocarse se lee como
// el módulo real. La usan invitados/presupuesto/itinerario (mismo patrón cabecera+tabla).
const SAMPLE_ROWS: { n: string; est: [string, string, string]; menu: string }[] = [
  { n: "Isabel Gómez", est: ["Confirmado", "#2FB37E", "#E4F5EE"], menu: "Pescado" },
  { n: "Raúl Martín", est: ["Confirmado", "#2FB37E", "#E4F5EE"], menu: "Vegano" },
  { n: "Lucía Fernández", est: ["Por confirmar", "#E0A32B", "#FBF0DA"], menu: "Carne" },
  { n: "Carlos Ruiz", est: ["Confirmado", "#2FB37E", "#E4F5EE"], menu: "Pescado" },
  { n: "Marta Díaz", est: ["Cancelado", "#D83E7C", "#FBE3ED"], menu: "—" },
  { n: "Javier López", est: ["Confirmado", "#2FB37E", "#E4F5EE"], menu: "Vegano" },
];
const AV = ["#F9CFE1", "#C9B6E8", "#B6D8E8", "#E8D6B6", "#B6E8C9", "#E8B6C4"];

const SkTabla: FC = () => (
  <div style={{ fontFamily: "'Poppins',sans-serif" }}>
    {/* Cabecera del módulo */}
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 3px 12px rgba(0,0,0,.05)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ font: "700 24px Poppins", color: "#3A3A42" }}>Mis invitados</span>
        <span style={{ font: "600 12px Poppins", color: "#B99323", background: "#FBF0DA", borderRadius: 20, padding: "5px 12px" }}>Propietario</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex" }}>
          {AV.slice(0, 4).map((c, i) => <span key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: "2px solid #fff", marginLeft: i ? -9 : 0 }} />)}
        </div>
        <span style={{ font: "600 11px Poppins", color: "#8a8a90", letterSpacing: ".5px" }}>BODA DE ISABEL &amp; RAÚL</span>
      </div>
    </div>
    {/* Estadísticas */}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px 14px", borderBottom: "2px solid #EF5B94", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ font: "700 22px Poppins", color: "#EF5B94" }}>44</span>
        <span style={{ font: "600 14px Poppins", color: "#3A3A42" }}>Invitados</span>
        <span style={{ font: "500 12px Poppins", color: "#8a8a90" }}>35 adultos · 8 niños</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {[["4 por confirmar", "#E0A32B", "#FBF0DA"], ["39 confirmados", "#2FB37E", "#E4F5EE"], ["1 cancelados", "#D83E7C", "#FBE3ED"]].map((s, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, font: "600 12px Poppins", color: s[1], background: s[2], borderRadius: 20, padding: "7px 14px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor" }} />{s[0]}
          </span>
        ))}
        <span style={{ font: "600 12.5px Poppins", color: "#fff", background: "#EF5B94", borderRadius: 12, padding: "10px 18px" }}>Sentar invitados</span>
      </div>
    </div>
    {/* Acciones + buscador */}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <span style={{ font: "600 12.5px Poppins", color: "#fff", background: "#EF5B94", borderRadius: 12, padding: "10px 18px" }}>+ Invitados</span>
        {["+ Grupo", "+ Menú", "Exportar"].map((b, i) => (
          <span key={i} style={{ font: "600 12.5px Poppins", color: "#6b6b72", background: "#fff", border: "1.5px solid #E7E7EA", borderRadius: 12, padding: "10px 18px" }}>{b}</span>
        ))}
      </div>
      <div style={{ width: 260, font: "500 12.5px Poppins", color: "#b3b3ba", background: "#fff", border: "1.5px solid #E7E7EA", borderRadius: 12, padding: "10px 16px" }}>Buscar invitado</div>
    </div>
    {/* Tabla */}
    <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1.2fr 1fr 1.2fr 1.2fr 1fr", gap: 12, padding: "0 10px 12px", font: "700 10px Poppins", color: "#a0a0a8", letterSpacing: ".5px" }}>
      {["INVITADO", "ASISTENCIA", "MENÚ", "ASIENTOS RECEPCIÓN", "ASIENTOS CEREMONIA", "ACOMPAÑANTES"].map((h, i) => <span key={i}>{h}</span>)}
    </div>
    <div style={{ font: "700 11.5px Poppins", color: "#6b6b72", padding: "10px 12px", background: "#f7f7f9", borderRadius: 8, marginBottom: 4 }}>Novios <span style={{ color: "#a0a0a8" }}>2</span></div>
    {SAMPLE_ROWS.map((r, i) => (
      <div key={i} style={{ display: "grid", gridTemplateColumns: "2.2fr 1.2fr 1fr 1.2fr 1.2fr 1fr", gap: 12, alignItems: "center", padding: "13px 12px", borderBottom: "1px solid #f2f2f4" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: AV[i % AV.length], flex: "none" }} />
          <span style={{ font: "500 12.5px Poppins", color: "#3A3A42" }}>{r.n}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, font: "600 11.5px Poppins", color: r.est[1] }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor" }} />{r.est[0]}
        </span>
        <span style={{ font: "500 12px Poppins", color: "#6b6b72" }}>{r.menu}</span>
        <span style={{ font: "500 11px Poppins", color: "#8a8a90" }}>FAMILIA</span>
        <span style={{ font: "500 11px Poppins", color: "#8a8a90" }}>NOVIOS</span>
        <span style={{ font: "500 12px Poppins", color: "#6b6b72" }}>0</span>
      </div>
    ))}
  </div>
);

// Maqueta FIEL de Mesas y asientos: cabecera + panel izquierdo (planos/mesas/invitados)
// + lienzo beige con rejilla y estado vacío. Datos de EJEMPLO.
const SkPlano: FC = () => (
  <div style={{ fontFamily: "'Poppins',sans-serif" }}>
    {/* Cabecera del módulo */}
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 3px 12px rgba(0,0,0,.05)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ font: "700 24px Poppins", color: "#3A3A42" }}>Mesas y asientos</span>
        <span style={{ font: "600 12px Poppins", color: "#B99323", background: "#FBF0DA", borderRadius: 20, padding: "5px 12px" }}>Propietario</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex" }}>
          {AV.slice(0, 4).map((c, i) => <span key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: "2px solid #fff", marginLeft: i ? -9 : 0 }} />)}
        </div>
        <span style={{ font: "600 11px Poppins", color: "#8a8a90", letterSpacing: ".5px" }}>BODA DE ISABEL &amp; RAÚL</span>
      </div>
    </div>
    {/* Cuerpo: panel izquierdo + lienzo */}
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, height: 520 }}>
      {/* Panel izquierdo */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f2", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 16, borderBottom: "1px solid #f0f0f2", paddingBottom: 10 }}>
          {[["Planos", false], ["Mesas", true], ["Mobiliario", false], ["Resumen", false]].map((tb, i) => (
            <span key={i} style={{ font: "600 12px Poppins", color: tb[1] ? "#EF5B94" : "#8a8a90", borderBottom: tb[1] ? "2px solid #EF5B94" : "none", paddingBottom: 6 }}>{tb[0]}</span>
          ))}
        </div>
        <div style={{ font: "700 10px Poppins", color: "#EF5B94", letterSpacing: ".5px" }}>MESAS EN «RECEPCIÓN» · 0</div>
        <div style={{ font: "400 11.5px/1.6 Poppins", color: "#a0a0a8" }}>Aún no hay mesas en este plano. Usa «+ Añadir mesa» en el plano.</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f0f0f2", paddingTop: 10 }}>
          <span style={{ font: "700 12.5px Poppins", color: "#3A3A42" }}>Invitados</span>
          <span style={{ font: "500 11px Poppins", color: "#8a8a90" }}>Sentados 0</span>
        </div>
        <div style={{ display: "flex", gap: 6, background: "#f5f5f7", borderRadius: 9, padding: 3 }}>
          {[["Todos", true], ["Por Sentar", false], ["Sentados", false]].map((tb, i) => (
            <span key={i} style={{ flex: 1, textAlign: "center", font: "600 10.5px Poppins", color: tb[1] ? "#3A3A42" : "#8a8a90", background: tb[1] ? "#fff" : "transparent", borderRadius: 7, padding: "6px 0" }}>{tb[0]}</span>
          ))}
        </div>
        <div style={{ font: "700 10px Poppins", color: "#a0a0a8", letterSpacing: ".5px" }}>POR SENTAR · 44</div>
        {["Jose Millán", "Ana Torres", "Pablo Sanz"].map((n, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: AV[i % AV.length], flex: "none" }} />
            <span style={{ font: "500 12px Poppins", color: "#3A3A42" }}>{n}</span>
          </div>
        ))}
      </div>
      {/* Lienzo */}
      <div style={{ position: "relative", background: "#EFEBE0", borderRadius: 14, overflow: "hidden", backgroundImage: "linear-gradient(#E4DFD0 1px,transparent 1px),linear-gradient(90deg,#E4DFD0 1px,transparent 1px)", backgroundSize: "34px 34px" }}>
        {/* barra de controles */}
        <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 10 }}>
          <span style={{ font: "600 12px Poppins", color: "#3A3A42", background: "#fff", borderRadius: 10, padding: "8px 16px", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>28%</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, font: "600 12px Poppins", color: "#3A3A42", background: "#fff", borderRadius: 10, padding: "8px 16px", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>🔒 Desbloquear plano</span>
          <span style={{ font: "600 11.5px Poppins", color: "#8a8a90", background: "#fff", borderRadius: 10, padding: "8px 16px", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>Plano: recepción · 20×15 m</span>
        </div>
        {/* estado vacío */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#fff", border: "2px dashed #F3B6CE", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", marginBottom: 6 }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="9" rx="7" ry="3.2" /><path d="M11 11h2v7h-2z" /></svg>
          </div>
          <div style={{ font: "700 18px Poppins", color: "#3A3A42" }}>Aún no hay mesas</div>
          <div style={{ font: "400 13px Poppins", color: "#8a8a90" }}>Empieza creando tu primera mesa para este espacio.</div>
          <span style={{ font: "600 13px Poppins", color: "#fff", background: "#EF5B94", borderRadius: 12, padding: "12px 24px", marginTop: 6 }}>+ Crea tu primera mesa</span>
        </div>
        {/* botones inferiores */}
        <div style={{ position: "absolute", right: 16, bottom: 16, display: "flex", gap: 10 }}>
          <span style={{ font: "600 12.5px Poppins", color: "#EF5B94", background: "#fff", border: "1.5px solid #F3B6CE", borderRadius: 12, padding: "10px 18px" }}>+ Bancos</span>
          <span style={{ font: "600 12.5px Poppins", color: "#fff", background: "#EF5B94", borderRadius: 12, padding: "10px 18px" }}>+ Añadir mesa</span>
        </div>
      </div>
    </div>
  </div>
);

const SkCards: FC = () => (
  <div style={{ display: "flex", gap: 18, paddingTop: 40, justifyContent: "center" }}>
    <div style={{ width: 220, height: 300, borderRadius: 16, background: "#FCE7F0", border: "1px solid #F3B6CE" }} />
    <div style={{ width: 220, height: 300, borderRadius: 16, background: "#fff", border: "1px solid #ececef", boxShadow: "0 10px 30px rgba(0,0,0,.08)" }} />
    <div style={{ width: 220, height: 300, borderRadius: 16, background: "#FDF6DE", border: "1px solid #f0e6bd" }} />
  </div>
);

const SkFotos: FC = () => {
  const bg = ["linear-gradient(135deg,#F9CFE1,#EF9CC0)", "#e4e4e8", "linear-gradient(135deg,#e8e2d4,#d7ccb8)", "#efeff2", "#efeff2", "linear-gradient(135deg,#F9CFE1,#F3B6CE)", "#e4e4e8", "linear-gradient(135deg,#efe7f5,#dcd0ea)"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
      {bg.map((b, i) => <div key={i} style={{ height: 150, borderRadius: 12, background: b }} />)}
    </div>
  );
};

// Cabecera común de módulo (título + Propietario + avatares + evento). Datos de EJEMPLO.
const SkHead: FC<{ title: string }> = ({ title }) => (
  <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 3px 12px rgba(0,0,0,.05)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ font: "700 24px Poppins", color: "#3A3A42" }}>{title}</span>
      <span style={{ font: "600 12px Poppins", color: "#B99323", background: "#FBF0DA", borderRadius: 20, padding: "5px 12px" }}>Propietario</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex" }}>
        {AV.slice(0, 4).map((c, i) => <span key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: "2px solid #fff", marginLeft: i ? -9 : 0 }} />)}
      </div>
      <span style={{ font: "600 11px Poppins", color: "#8a8a90", letterSpacing: ".5px" }}>BODA DE ISABEL &amp; RAÚL</span>
    </div>
  </div>
);

// Maqueta FIEL de Presupuesto (tabs + total + progreso + tarjetas). Datos de EJEMPLO.
const SkPresupuesto: FC = () => (
  <div style={{ fontFamily: "'Poppins',sans-serif" }}>
    <SkHead title="Presupuesto" />
    <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,.04)", padding: "16px 28px", display: "flex", gap: 60, marginBottom: 16 }}>
      {[["Resumen", true], ["Gastos", false], ["Panel del planner", false]].map((tb, i) => (
        <span key={i} style={{ font: "600 14px Poppins", color: tb[1] ? "#EF5B94" : "#8a8a90" }}>{tb[0]}</span>
      ))}
    </div>
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,.04)", padding: "26px 28px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ width: 54, height: 54, borderRadius: 14, background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M4 11a6 6 0 0 1 6-6h3a6 6 0 0 1 6 5c1 .2 1 1.5 0 1.7V13a4 4 0 0 1-2 3.4V19h-2.5v-1.5h-3V19H9v-2.2A6 6 0 0 1 6 13H5a1 1 0 0 1-1-1v-1zm10.5-1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" /></svg>
          </span>
          <div>
            <div style={{ font: "500 13px Poppins", color: "#8a8a90" }}>Presupuesto total</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ font: "700 30px Poppins", color: "#3A3A42" }}>5.089.984,10 €</span>
              <span style={{ font: "500 13px Poppins", color: "#8a8a90", textDecoration: "underline" }}>Modificar</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ font: "600 12.5px Poppins", color: "#6b6b72", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "9px 14px" }}>EUR ⌄</span>
          <span style={{ font: "600 12.5px Poppins", color: "#6b6b72", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "9px 16px" }}>↧ importar</span>
          <span style={{ font: "600 12.5px Poppins", color: "#6b6b72", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "9px 16px" }}>↥ exportar</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, font: "600 13px Poppins", color: "#2FB37E", background: "#E4F5EE", borderRadius: 12, padding: "12px 16px", width: "fit-content", margin: "18px 0 14px" }}>✓ Vas por buen camino · 3.566.603,10 € disponibles</div>
      <div style={{ height: 12, borderRadius: 8, background: "#f0e3e9", overflow: "hidden", marginBottom: 14 }}><div style={{ height: "100%", width: "30%", background: "#F3B6CE" }} /></div>
      <div style={{ display: "flex", gap: 50 }}>
        {[["Ya pagado", "0,00 €", "#EF5B94"], ["Comprometido sin pagar", "1.523.381,00 €", "#F3B6CE"], ["Aún libre", "3.566.603,10 €", "#2FB37E"]].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s[2], flex: "none" }} />
            <div><div style={{ font: "500 11px Poppins", color: "#8a8a90" }}>{s[0]}</div><div style={{ font: "700 13px Poppins", color: i === 2 ? "#2FB37E" : "#3A3A42" }}>{s[1]}</div></div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,.04)", padding: "20px 22px" }}>
        <div style={{ font: "700 15px Poppins", color: "#3A3A42", marginBottom: 14 }}>¿Cómo va tu presupuesto?</div>
        <div style={{ font: "600 12.5px Poppins", color: "#B99323", background: "#FBF0DA", borderRadius: 10, padding: "10px 14px" }}>⚡ Atención: 3 categorías superan su estimado</div>
      </div>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,.04)", padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div><div style={{ font: "700 15px Poppins", color: "#3A3A42", marginBottom: 6 }}>¿Cuánto cuesta mi evento?</div><div style={{ font: "400 12.5px Poppins", color: "#8a8a90" }}>Distribución del gasto real por categoría</div></div>
        <span style={{ font: "600 12.5px Poppins", color: "#EF5B94", textDecoration: "underline" }}>Ver distribución</span>
      </div>
    </div>
  </div>
);

// Maqueta FIEL de Invitaciones (pasos + preview portada + plantillas + tipografía). EJEMPLO.
const SkInvitaciones: FC = () => (
  <div style={{ fontFamily: "'Poppins',sans-serif" }}>
    <SkHead title="Invitaciones" />
    <div style={{ display: "inline-flex", gap: 8, background: "#fff", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,.04)", padding: 8, marginBottom: 14 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8, font: "600 13px Poppins", color: "#D83E7C", background: "#FCE7F0", borderRadius: 10, padding: "9px 16px" }}><span style={{ width: 20, height: 20, borderRadius: "50%", background: "#EF5B94", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "700 11px Poppins" }}>1</span>Diseñar invitación</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8, font: "600 13px Poppins", color: "#8a8a90", padding: "9px 16px" }}><span style={{ width: 20, height: 20, borderRadius: "50%", background: "#ececef", color: "#8a8a90", display: "flex", alignItems: "center", justifyContent: "center", font: "700 11px Poppins" }}>2</span>Enviar</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, font: "600 13px Poppins", color: "#6b6b72", background: "#FCE7F0", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>ⓘ Diseña tu invitación y envíala por email, WhatsApp o SMS.</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 20 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><span style={{ font: "700 10px Poppins", color: "#a0a0a8", letterSpacing: ".5px" }}>VISTA PREVIA</span><span style={{ font: "600 11px Poppins", color: "#2FB37E" }}>✓ Guardado</span></div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <span style={{ font: "600 12px Poppins", color: "#D83E7C", background: "#FCE7F0", borderRadius: 8, padding: "6px 16px" }}>Portada</span>
          <span style={{ font: "600 12px Poppins", color: "#8a8a90", padding: "6px 12px" }}>Detalles</span>
        </div>
        <div style={{ height: 300, borderRadius: 12, background: "linear-gradient(160deg,#E7D3BE,#D8B9A2)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#fff", font: "500 13px Poppins", padding: 20 }}>Arrastra la foto de portada<br />o haz clic para subir</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,.04)", padding: "18px 20px" }}>
          <div style={{ font: "700 15px Poppins", color: "#3A3A42", marginBottom: 14 }}>Plantilla</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[["Elegante", "linear-gradient(160deg,#E7D3BE,#D3B99C)", true], ["Clásica", "linear-gradient(160deg,#EDE6D6,#D9CDB4)", false], ["Moderna", "linear-gradient(160deg,#DCE6EE,#BFD3E0)", false]].map((tp, i) => (
              <div key={i} style={{ border: tp[2] ? "2px solid #EF5B94" : "1px solid #ececef", borderRadius: 12, padding: 4 }}>
                <div style={{ height: 90, borderRadius: 9, background: tp[1] as string }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 4px 2px" }}><span style={{ font: "600 11px Poppins", color: "#3A3A42" }}>{tp[0]}</span><span style={{ width: 15, height: 15, borderRadius: "50%", background: "#EF5B94" }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,.04)", padding: "18px 20px" }}>
          <div style={{ font: "700 15px Poppins", color: "#3A3A42", marginBottom: 14 }}>Tipografía</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[["Elegante", true], ["Moderna", false], ["Script", false]].map((tp, i) => (
              <div key={i} style={{ border: tp[1] ? "1.5px solid #F3B6CE" : "1px solid #ececef", background: tp[1] ? "#FCE7F0" : "#fff", borderRadius: 12, padding: "14px 0", textAlign: "center" }}>
                <div style={{ font: "600 22px Poppins", color: "#3A3A42" }}>Aa</div>
                <div style={{ font: "500 10px Poppins", color: "#8a8a90", marginTop: 4 }}>{tp[0]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Maqueta FIEL de Itinerario (pestañas de listas + resumen tipo timeline). EJEMPLO.
const SkItinerario: FC = () => (
  <div style={{ fontFamily: "'Poppins',sans-serif" }}>
    <SkHead title="Itinerario" />
    <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,.04)", padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        {[["Protocolo del Evento", true], ["Ceremonia", false], ["Ceremonia", false], ["Itinerario Boda Público", false], ["sin nombre", false], ["Previo a la boda", false]].map((tb, i) => (
          <span key={i} style={{ font: "600 12.5px Poppins", color: tb[1] ? "#D83E7C" : "#8a8a90", background: tb[1] ? "#FCE7F0" : "transparent", borderRadius: 20, padding: "8px 14px" }}>{tb[0]}</span>
        ))}
        <span style={{ font: "600 12.5px Poppins", color: "#EF5B94", border: "1.5px solid #F3B6CE", borderRadius: 20, padding: "8px 16px" }}>+ Nuevo</span>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <span style={{ font: "600 12px Poppins", color: "#6b6b72", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "8px 14px" }}>🌐 Zona horaria · Madrid ⌄</span>
        <span style={{ font: "600 12px Poppins", color: "#6b6b72", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "8px 14px" }}>Ordenar ⌄</span>
        <span style={{ font: "600 12px Poppins", color: "#6b6b72", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "8px 14px" }}>Esquema ⌄</span>
      </div>
    </div>
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,.04)", padding: "28px 30px" }}>
      <div style={{ textAlign: "center", marginBottom: 6 }}><span style={{ font: "700 24px Poppins", color: "#3A3A42" }}>Protocolo del Evento</span></div>
      <div style={{ width: 60, height: 3, borderRadius: 3, background: "#EF5B94", margin: "0 auto 14px" }} />
      <div style={{ textAlign: "center", font: "400 13px Poppins", color: "#8a8a90", marginBottom: 26 }}>Vista resumida del itinerario · ideal para compartir o descargar en PDF</div>
      {[["", "Recogida de la Novia para Peluquería", "Novia"], ["10:00 p. m. · duración 30 m", "Recogida del Autobús de los distintos hoteles", "Proveedor, Invitados"], ["10:30 p. m. · duración 30 m", "Maquillaje", "Novia"]].map((it, i) => (
        <div key={i} style={{ display: "flex", gap: 16, marginBottom: 4 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ width: 54, height: 54, borderRadius: "50%", background: "#f5f5f7", flex: "none" }} />
            {i < 2 && <span style={{ width: 2, flex: 1, background: "#F3B6CE", minHeight: 30 }} />}
          </div>
          <div style={{ paddingTop: 4 }}>
            {it[0] && <div style={{ font: "700 13px Poppins", color: "#3A3A42", marginBottom: 3 }}>{it[0]}</div>}
            <div style={{ font: "600 15px Poppins", color: "#D83E7C", marginBottom: 3 }}>{it[1]}</div>
            <div style={{ font: "400 12.5px Poppins", color: "#8a8a90" }}>responsable: <span style={{ color: "#3A3A42", fontWeight: 600 }}>{it[2]}</span></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Maqueta FIEL de Lista de regalos (total + estados + tarjeta Amazon). EJEMPLO.
const SkRegalos: FC = () => (
  <div style={{ fontFamily: "'Poppins',sans-serif" }}>
    <SkHead title="Lista de regalos" />
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px 14px", borderBottom: "2px solid #EF5B94", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ font: "700 22px Poppins", color: "#EF5B94" }}>0,00 €</span>
        <span style={{ font: "600 14px Poppins", color: "#3A3A42" }}>Valor total</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, font: "600 12px Poppins", color: "#2FB37E", background: "#E4F5EE", borderRadius: 20, padding: "7px 14px" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor" }} />Conseguido 0,00 €</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, font: "600 12px Poppins", color: "#E0A32B", background: "#FBF0DA", borderRadius: 20, padding: "7px 14px" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor" }} />Pendiente 0,00 €</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, font: "600 12px Poppins", color: "#6b6b72", border: "1.5px solid #E7E7EA", borderRadius: 12, padding: "8px 14px" }}>Saldo transferible <b style={{ color: "#3A3A42" }}>0,00 €</b> <span style={{ color: "#c9a9b6" }}>Transferir</span></span>
      </div>
    </div>
    <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 10px rgba(0,0,0,.04)", padding: "32px 34px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
      <div style={{ maxWidth: 560 }}>
        <span style={{ font: "700 11px Poppins", color: "#D83E7C", background: "#FCE7F0", borderRadius: 20, padding: "6px 14px", letterSpacing: ".5px" }}>CONECTA CON AMAZON</span>
        <div style={{ font: "700 26px Poppins", color: "#3A3A42", margin: "16px 0 10px" }}>Crea la lista de regalos del evento</div>
        <div style={{ font: "400 13.5px/1.6 Poppins", color: "#8a8a90", marginBottom: 22 }}>Millones de opciones para elegir. Los invitados podrán comprar el regalo o aportar dinero, y el saldo se transfiere a los anfitriones del evento.</div>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ font: "600 13px Poppins", color: "#fff", background: "#EF5B94", borderRadius: 12, padding: "13px 22px" }}>a  Crear la lista en Amazon</span>
          <span style={{ font: "600 13px Poppins", color: "#6b6b72", background: "#fff", border: "1.5px solid #E7E7EA", borderRadius: 12, padding: "13px 22px" }}>Ya tengo una lista · Vincular</span>
        </div>
      </div>
      <div style={{ width: 190, height: 190, borderRadius: "50%", background: "#FBDCEA", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <span style={{ width: 130, height: 130, borderRadius: "50%", background: "#EF5B94", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "700 64px Poppins" }}>a</span>
      </div>
    </div>
    <div style={{ font: "700 16px Poppins", color: "#3A3A42", margin: "22px 4px 0" }}>¿Cómo funciona la lista?</div>
  </div>
);

// Maqueta FIEL de Momentos (portal con QR + álbumes). EJEMPLO.
const SkMomentos: FC = () => (
  <div style={{ fontFamily: "'Poppins',sans-serif" }}>
    <SkHead title="Momentos" />
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,.04)", padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ width: 52, height: 52, borderRadius: 8, background: "#3A3A42", flex: "none", backgroundImage: "repeating-linear-gradient(0deg,#3A3A42 0 3px,#fff 3px 6px),repeating-linear-gradient(90deg,#3A3A42 0 3px,transparent 3px 6px)" }} />
        <div>
          <div style={{ font: "700 15px Poppins", color: "#3A3A42" }}>Portal del evento para invitados</div>
          <div style={{ font: "400 12px Poppins", color: "#8a8a90" }}>Comparte este enlace con tus invitados · app-dev.bodasdehoy.com/e/66a9042…</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <span style={{ font: "600 12.5px Poppins", color: "#6b6b72", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "10px 16px" }}>⧉ Copiar URL</span>
        <span style={{ font: "600 12.5px Poppins", color: "#6b6b72", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "10px 16px" }}>Ver portal →</span>
      </div>
    </div>
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,.04)", padding: "22px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
        <span style={{ font: "700 18px Poppins", color: "#3A3A42" }}>Álbumes</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ font: "600 12.5px Poppins", color: "#EF5B94" }}>⚡ Generar desde el itinerario</span>
          <span style={{ font: "600 12.5px Poppins", color: "#fff", background: "#EF5B94", borderRadius: 12, padding: "11px 18px" }}>+ Nuevo álbum</span>
        </div>
      </div>
      <div style={{ textAlign: "center", font: "500 14px Poppins", color: "#a0a0a8", padding: "34px 0 44px" }}>Cargando álbumes…</div>
      <div style={{ textAlign: "right", borderTop: "1px solid #f2f2f4", paddingTop: 16 }}><span style={{ font: "600 12.5px Poppins", color: "#EF5B94" }}>Abrir Momentos en Copilot →</span></div>
    </div>
  </div>
);

const previews: Record<Preview, FC> = { tabla: SkTabla, plano: SkPlano, cards: SkCards, fotos: SkFotos, presupuesto: SkPresupuesto, invitaciones: SkInvitaciones, itinerario: SkItinerario, regalos: SkRegalos, momentos: SkMomentos };

const ModuloBloqueadoInvitado: FC<{ modulo: ModKey }> = ({ modulo }) => {
  const { config } = AuthContextProvider() as any;
  const m = MODULOS[modulo];
  const Preview = previews[m.preview];
  const base = config?.pathLogin || "/login";
  const registerHref = base.includes("?") ? `${base}&q=register` : `${base}?q=register`;
  const loginHref = base;

  return (
    <div style={{ width: "100%", padding: "20px 16px 40px", display: "flex", justifyContent: "center", fontFamily: "'Poppins',sans-serif" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 1080, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 14px rgba(0,0,0,.05)", minHeight: 600 }}>
        {/* 1) PREVIEW difuminado (no interactivo, datos de ejemplo) — se lee como el módulo real */}
        <div aria-hidden style={{ position: "absolute", inset: 0, filter: "blur(3.5px)", opacity: .85, pointerEvents: "none", userSelect: "none", padding: "24px 30px" }}>
          <Preview />
        </div>
        {/* 2) VELO */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(246,245,247,.4)" }} />
        {/* 3) TARJETA modal de registro */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "center", padding: "52px 24px 46px" }}>
          <div style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: 20, boxShadow: "0 30px 80px rgba(0,0,0,.18)", padding: "28px 22px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxSizing: "border-box" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", marginBottom: 16 }}>{m.icon}</div>
            <div style={{ font: "700 21px Poppins", color: "#3A3A42", marginBottom: 8 }}>{m.title}</div>
            <div style={{ font: "400 13px/1.65 Poppins", color: "#8a8a90", maxWidth: 440, marginBottom: 22 }}>{m.desc}</div>
            <div style={{ background: "#fafafa", border: "1px solid #f0f0f2", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start", marginBottom: 24, width: "100%", boxSizing: "border-box" }}>
              {m.benefits.map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, font: "500 12.5px Poppins", color: "#3A3A42", textAlign: "left" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#E2F6EE", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{check}</span>{b}
                </div>
              ))}
            </div>
            <a href={registerHref} className="mbi-cta" style={{ padding: "12px 32px", borderRadius: 12, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", border: "none", cursor: "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)", marginBottom: 14, textDecoration: "none" }}>Crear cuenta gratis</a>
            <div style={{ font: "500 12.5px Poppins", color: "#6b6b72" }}>¿Ya tienes cuenta? <a href={loginHref} style={{ color: "#EF5B94", fontWeight: 600, textDecoration: "none" }}>Inicia sesión</a></div>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: ".mbi-cta:hover{background:#D83E7C !important;}" }} />
      </div>
    </div>
  );
};

export default ModuloBloqueadoInvitado;
