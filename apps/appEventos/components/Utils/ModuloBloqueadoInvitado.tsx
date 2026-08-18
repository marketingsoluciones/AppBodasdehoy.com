import { FC, ReactNode } from "react";
import { AuthContextProvider } from "../../context";

/**
 * ModuloBloqueadoInvitado — pantalla de módulo bloqueado en modo invitado (usuario fantasma),
 * fiel a modulos-bloqueados-invitado.html. 3 capas: PREVIEW difuminado (skeleton de ejemplo,
 * NUNCA datos reales) → VELO 50% → TARJETA modal de registro. El nav superior sigue navegable.
 */

type ModKey = "invitados" | "mesas" | "presupuesto" | "invitaciones" | "itinerario" | "regalos" | "momentos";
type Preview = "tabla" | "plano" | "cards" | "fotos";

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
    preview: "tabla",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 2A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 2h-11zM7 5.5h10a1 1 0 0 1 1 1V8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1zM7.5 12a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm-9 4.5a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm4.5 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z" /></svg>,
    title: "Control de presupuesto",
    desc: "Crea tu cuenta gratis para registrar gastos reales, categorías y pagos vinculados a tu evento.",
    benefits: ["Totales por categoría y comparación con lo estimado", "Seguimiento de pagos a proveedores", "Exportación para compartir con tu pareja o tu planner"],
  },
  invitaciones: {
    preview: "cards",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8.8l8.4-5.2a1.2 1.2 0 0 1 1.2 0L21 8.8V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.8z" /><path d="M12 15.6l-8.7-5.4v-.2L12 15l8.7-5v.2L12 15.6z" fill="#fff" opacity=".9" /><path d="M12 13.4c-.9-1-2.4-1.6-2.4-3 0-1 .7-1.7 1.5-1.7.4 0 .7.2.9.5.2-.3.5-.5.9-.5.8 0 1.5.7 1.5 1.7 0 1.4-1.5 2-2.4 3z" fill="#fff" /></svg>,
    title: "Invitaciones digitales",
    desc: "Crea tu cuenta gratis para diseñar y enviar invitaciones personalizadas por WhatsApp, email o enlace.",
    benefits: ["Plantillas personalizables con tu estilo", "Envío masivo por WhatsApp, email o SMS", "Seguimiento de aperturas y confirmaciones"],
  },
  itinerario: {
    preview: "tabla",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2.5a1 1 0 0 1 1 1V5h8V3.5a1 1 0 1 1 2 0V5h.5A2.5 2.5 0 0 1 21 7.5v11A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5v-11A2.5 2.5 0 0 1 5.5 5H6V3.5a1 1 0 0 1 1-1z" /><path d="M12 17.2c-1.4-1.4-3.6-2.4-3.6-4.4 0-1.4 1-2.4 2.2-2.4.6 0 1.1.3 1.4.8.3-.5.8-.8 1.4-.8 1.2 0 2.2 1 2.2 2.4 0 2-2.2 3-3.6 4.4z" fill="#fff" /></svg>,
    title: "Itinerario",
    desc: "Crea tu cuenta gratis para organizar el día del evento hora a hora y compartirlo con tu equipo.",
    benefits: ["Tareas con horario, responsables y avisos", "Vista tarjeta, tabla y esquema para compartir", "Descarga en PDF y enlace público"],
  },
  regalos: {
    preview: "cards",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 8A1.5 1.5 0 0 1 5 6.5h14A1.5 1.5 0 0 1 20.5 8v2a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V8z" /><path d="M5 12.5h6V21H6.5A1.5 1.5 0 0 1 5 19.5v-7zM13 12.5h6v7a1.5 1.5 0 0 1-1.5 1.5H13v-8.5z" /><path d="M12 6.5c-1.2-2.2-3-3.6-4.6-2.7C6 4.6 6.3 6.5 8 6.5h4zm0 0c1.2-2.2 3-3.6 4.6-2.7 1.4.8 1.1 2.7-.6 2.7H12z" opacity=".55" /></svg>,
    title: "Lista de regalos",
    desc: "Crea tu cuenta gratis para publicar tu lista real de regalos y compartirla con tus invitados.",
    benefits: ["Enlaces públicos y seguimiento de reservas", "Integración con tiendas habituales", "Control de saldo y aportaciones"],
  },
  momentos: {
    preview: "fotos",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M7 6.5A2.5 2.5 0 0 1 9.5 4h9A2.5 2.5 0 0 1 21 6.5v7A2.5 2.5 0 0 1 18.5 16h-9A2.5 2.5 0 0 1 7 13.5v-7z" /><path d="M4.5 7.5c-.8.3-1.5 1.2-1.5 2.2V18a3 3 0 0 0 3 3h8.3c1 0 1.9-.6 2.2-1.5H6.5a2 2 0 0 1-2-2V7.5z" opacity=".55" /><circle cx="11" cy="8" r="1.3" fill="#fff" /><path d="M8.5 14.5l2.6-3 1.9 2 1.6-1.6 3.4 2.6H8.5z" fill="#fff" /></svg>,
    title: "Momentos",
    desc: "Crea tu cuenta gratis para recopilar las fotos de tus invitados en álbumes por momento del evento.",
    benefits: ["Portal del evento con QR para invitados", "Álbumes automáticos por momento del itinerario", "Descarga de todas las fotos en alta calidad"],
  },
};

/* ── Skeletons del preview (datos de EJEMPLO, jamás reales; no interactivos) ── */
const PILL_COLORS = ["#E2F6EE", "#FDF6DE", "#E2F6EE", "#FBE3ED", "#E2F6EE", "#FDF6DE"];

const SkTabla: FC = () => (
  <>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
      <div style={{ width: 180, height: 16, borderRadius: 8, background: "#e4e4e8" }} />
      <div style={{ display: "flex", gap: 8 }}><div style={{ width: 120, height: 34, borderRadius: 10, background: "#EF5B94", opacity: .8 }} /><div style={{ width: 90, height: 34, borderRadius: 10, background: "#f0f0f2" }} /></div>
    </div>
    <div style={{ height: 38, borderRadius: 10, background: "#fafafa", marginBottom: 8 }} />
    {PILL_COLORS.map((c, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 10px", borderBottom: "1px solid #f5f5f7" }}>
        <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#F9CFE1", flex: "none" }} />
        <span style={{ width: 150, height: 11, borderRadius: 6, background: "#e4e4e8" }} />
        <span style={{ width: 74, height: 20, borderRadius: 11, background: c }} />
        <span style={{ width: 90, height: 10, borderRadius: 6, background: "#efeff2" }} />
        <span style={{ width: 90, height: 10, borderRadius: 6, background: "#efeff2" }} />
      </div>
    ))}
  </>
);

const SkPlano: FC = () => (
  <div style={{ position: "relative", height: 540, background: "#F3F1EC", borderRadius: 14 }}>
    {[{ l: "8%", t: "12%" }, { l: "38%", t: "8%" }, { l: "68%", t: "14%" }, { l: "58%", t: "50%" }].map((p, i) => (
      <div key={i} style={{ position: "absolute", left: p.l, top: p.t, width: 110, height: 110, borderRadius: "50%", background: "#fff", border: "2px solid #E0D9CE" }} />
    ))}
    <div style={{ position: "absolute", left: "14%", top: "52%", width: 250, height: 44, borderRadius: 10, background: "#fff", border: "2px solid #E0D9CE" }} />
    <div style={{ position: "absolute", right: 24, bottom: 20, width: 150, height: 40, borderRadius: 10, background: "#EF5B94", opacity: .8 }} />
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

const previews: Record<Preview, FC> = { tabla: SkTabla, plano: SkPlano, cards: SkCards, fotos: SkFotos };

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
        {/* 1) PREVIEW difuminado (no interactivo, datos de ejemplo) */}
        <div aria-hidden style={{ position: "absolute", inset: 0, filter: "blur(4px)", opacity: .6, pointerEvents: "none", userSelect: "none", padding: "28px 34px" }}>
          <Preview />
        </div>
        {/* 2) VELO 50% */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(246,245,247,.5)" }} />
        {/* 3) TARJETA modal de registro */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "center", padding: "52px 24px 46px" }}>
          <div style={{ width: 480, maxWidth: "94%", background: "#fff", borderRadius: 20, boxShadow: "0 30px 80px rgba(0,0,0,.18)", padding: "30px 30px 26px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", marginBottom: 16 }}>{m.icon}</div>
            <div style={{ font: "700 21px Poppins", color: "#3A3A42", marginBottom: 8 }}>{m.title}</div>
            <div style={{ font: "400 13px/1.65 Poppins", color: "#8a8a90", maxWidth: 440, marginBottom: 22 }}>{m.desc}</div>
            <div style={{ background: "#fafafa", border: "1px solid #f0f0f2", borderRadius: 14, padding: "18px 24px", display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start", marginBottom: 24, minWidth: 380, maxWidth: "100%" }}>
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
