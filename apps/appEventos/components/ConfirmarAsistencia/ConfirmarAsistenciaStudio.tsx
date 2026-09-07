import { FC, useMemo, useState } from "react";
import { fetchApiBodas, queries } from "../../utils/Fetching";

/**
 * ConfirmarAsistenciaStudio — portal público de RSVP del invitado, fiel a
 * Confirmar_asistencia(.movil).dc.html. MISMO backend que FormConfirmarAsistencia:
 * confirma la asistencia + menú del invitado y crea/actualiza acompañantes con la
 * mutación queries.createGuests (agregarInvitadosBatch). Responsivo: 2 columnas en
 * escritorio, una sola en móvil. No usa contextos autenticados (página pública).
 */

interface Guest {
  _id?: string;
  id?: string;
  nombre?: string;
  telefono?: string;
  correo?: string;
  email?: string;
  sexo?: string;
  grupo_edad?: string;
  nombre_menu?: string;
  menu?: { nombre?: string };
  asistencia?: string;
  alergenos?: string;
  father?: string | null;
  passesQuantity?: number;
  acompanantes?: number;
}
interface Menu { nombre?: string; }
interface Props {
  guestData?: any[];
  guestFather?: any;
  menus_array?: any[];
  eventId?: string;
  pGuestToken?: string;
}

interface Acomp { _id: string | null; nombre: string; tipo: string; menu: string; alergia: string; }

const gid = (g?: Guest) => g?._id || g?.id || "";
const gmenu = (g?: Guest) => g?.nombre_menu || g?.menu?.nombre || "";

const ConfirmarAsistenciaStudio: FC<Props> = ({ guestData, guestFather, menus_array, eventId, pGuestToken }) => {
  const menuOptions = useMemo(() => {
    const fromEvent = (menus_array || []).map((m) => m?.nombre).filter(Boolean) as string[];
    return fromEvent.length ? fromEvent : ["Estándar", "Vegano", "Sin gluten"];
  }, [menus_array]);

  const maxAcomp = guestFather?.passesQuantity ?? guestFather?.acompanantes ?? 3;
  const existingAcomps: Acomp[] = useMemo(
    () => (guestData || [])
      .filter((g) => g?.father != null && gid(g) !== gid(guestFather))
      .map((g) => ({ _id: gid(g) || null, nombre: g?.nombre || "", tipo: g?.grupo_edad || "adulto", menu: gmenu(g) || menuOptions[0], alergia: g?.alergenos || "" })),
    [guestData, guestFather, menuOptions],
  );

  const initAsiste = guestFather?.asistencia === "confirmado" ? true : guestFather?.asistencia === "cancelado" ? false : null;
  const [asiste, setAsiste] = useState<boolean | null>(initAsiste);
  const [menu, setMenu] = useState<string>(gmenu(guestFather) || menuOptions[0]);
  const [alergia, setAlergia] = useState<string>(guestFather?.alergenos || "");
  const [acomps, setAcomps] = useState<Acomp[]>(existingAcomps);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const nombre = guestFather?.nombre || "invitado";
  const inicial = (nombre || "?").charAt(0).toUpperCase();
  const listo = asiste === true || asiste === false;

  const updA = (idx: number, patch: Partial<Acomp>) => setAcomps((l) => l.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  const addAcomp = () => { if (acomps.length >= maxAcomp) return; setAcomps((l) => [...l, { _id: null, nombre: "", tipo: "adulto", menu: menuOptions[0], alergia: "" }]); };
  const delAcomp = (idx: number) => setAcomps((l) => l.filter((_, i) => i !== idx));

  const enviar = async () => {
    if (!listo || enviando) return;
    setEnviando(true);
    try {
      const eventID = eventId || pGuestToken?.slice(-24);
      const asistPadre = asiste ? "confirmado" : "cancelado";
      const sendValues: any[] = [
        {
          _id: gid(guestFather),
          nombre: guestFather?.nombre,
          telefono: guestFather?.telefono,
          correo: guestFather?.correo || guestFather?.email,
          sexo: guestFather?.sexo,
          grupo_edad: guestFather?.grupo_edad,
          nombre_menu: asiste ? menu : gmenu(guestFather),
          alergenos: asiste ? alergia : (guestFather?.alergenos || ""),
          asistencia: asistPadre,
        },
      ];
      if (asiste) {
        acomps.filter((a) => a.nombre.trim()).forEach((a) => {
          sendValues.push({
            _id: a._id || null,
            nombre: a.nombre,
            sexo: "hombre",
            grupo_edad: a.tipo || "adulto",
            nombre_menu: a.menu || menuOptions[0],
            alergenos: a.alergia || "",
            father: gid(guestFather),
            asistencia: "confirmado",
          });
        });
      }
      await fetchApiBodas({ query: queries.createGuests, variables: { eventID, invitados_array: sendValues } });
      setEnviado(true);
    } catch {
      /* fallo silencioso: se mantiene el formulario para reintentar */
    } finally {
      setEnviando(false);
    }
  };

  const IN: React.CSSProperties = { width: "100%", border: "1.5px solid #E7E7EA", borderRadius: 12, padding: "11px 15px", font: "400 12.5px Poppins", color: "#3A3A42", outline: "none", background: "#fff", boxSizing: "border-box" };
  const SEL: React.CSSProperties = { border: "1.5px solid #E7E7EA", borderRadius: 9, padding: "7px 10px", font: "500 11.5px Poppins", color: "#3A3A42", outline: "none", background: "#fff", cursor: "pointer", minWidth: 0 };

  const info = [
    { icon: <path d="M5 13l4 4L19 7" />, txt: "Confirma tu asistencia al evento" },
    { icon: <g><circle cx="9" cy="8" r="3.2" /><path d="M3 19c.9-2.8 3.2-4.5 6-4.5s5.1 1.7 6 4.5" /><path d="M16.5 8.5a2.8 2.8 0 1 1 0 .01M17 14.6c2.2.4 3.7 1.9 4.3 4.4" /></g>, txt: "Registra a tus acompañantes" },
    { icon: <path d="M12 3c-2 3.5-6 5-6 9.5a6 6 0 0 0 12 0C18 8 14 6.5 12 3z" />, txt: "¿Alergias o dieta especial? Apúntalo para que el catering lo tenga en cuenta" },
  ];

  const formCard = (
    <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 10px 34px rgba(0,0,0,.08)", padding: "24px 24px", animation: "ca-fadein .3s ease" }}>
      {!enviado ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#F9CFE1,#EF9CC0)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 17px Poppins", color: "#fff", flex: "none" }}>{inicial}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ font: "700 19px Poppins", color: "#3A3A42" }}>¡Hola, {nombre}!</div>
              <div style={{ font: "400 12px Poppins", color: "#8a8a90" }}>Confirmación de asistencia</div>
            </div>
          </div>
          <div style={{ font: "400 12.5px Poppins", color: "#6b6b72", margin: "10px 0 18px", lineHeight: 1.6 }}>Por favor confirma tus datos y los de tus acompañantes.</div>

          <div style={{ font: "600 12.5px Poppins", color: "#3A3A42", marginBottom: 9 }}>¿Asistirás al evento?</div>
          <div style={{ display: "flex", gap: 9, marginBottom: 20 }}>
            <div onClick={() => setAsiste(true)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: 12, borderRadius: 12, border: `1.5px solid ${asiste === true ? "#2FB37E" : "#E7E7EA"}`, background: asiste === true ? "#E4F5EE" : "#fff", color: asiste === true ? "#1F8A5F" : "#6b6b72", font: "600 13px Poppins", cursor: "pointer" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>Sí, asistiré
            </div>
            <div onClick={() => setAsiste(false)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: 12, borderRadius: 12, border: `1.5px solid ${asiste === false ? "#D83E7C" : "#E7E7EA"}`, background: asiste === false ? "#FBE3ED" : "#fff", color: asiste === false ? "#D83E7C" : "#6b6b72", font: "600 13px Poppins", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>No podré ir
            </div>
          </div>

          {asiste && (
            <>
              <div style={{ font: "600 12.5px Poppins", color: "#3A3A42", marginBottom: 9 }}>Tu menú</div>
              <div className="ca-hs" style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
                {menuOptions.map((m) => {
                  const on = menu === m;
                  return <div key={m} onClick={() => setMenu(m)} style={{ padding: "8px 16px", borderRadius: 16, border: `1.5px solid ${on ? "#EF5B94" : "#E7E7EA"}`, background: on ? "#FCE7F0" : "#fff", color: on ? "#D83E7C" : "#6b6b72", font: "600 11.5px Poppins", cursor: "pointer", whiteSpace: "nowrap" }}>{m}</div>;
                })}
              </div>

              <div style={{ font: "600 12.5px Poppins", color: "#3A3A42", marginBottom: 9 }}>Alergias o dieta especial <span style={{ fontWeight: 400, color: "#a0a0a8" }}>(opcional)</span></div>
              <input value={alergia} onChange={(e) => setAlergia(e.target.value)} placeholder="P. ej. alergia a frutos secos" style={{ ...IN, marginBottom: 20 }} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ font: "600 12.5px Poppins", color: "#3A3A42" }}>Tus acompañantes <span style={{ fontWeight: 400, color: "#a0a0a8" }}>({acomps.length} de {maxAcomp})</span></div>
                <span onClick={addAcomp} style={{ display: "flex", alignItems: "center", gap: 5, font: "600 11.5px Poppins", color: acomps.length >= maxAcomp ? "#c4c4cc" : "#EF5B94", cursor: acomps.length >= maxAcomp ? "default" : "pointer" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>Añadir
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 22 }}>
                {acomps.map((a, idx) => (
                  <div key={idx} style={{ border: "1.5px solid #E7E7EA", borderRadius: 13, padding: "13px 15px", animation: "ca-fadein .2s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                      <input value={a.nombre} onChange={(e) => updA(idx, { nombre: e.target.value })} placeholder="Nombre y apellido" style={{ flex: 1, border: "none", borderBottom: "1.5px solid #f0f0f2", padding: "4px 2px", font: "600 13px Poppins", color: "#3A3A42", outline: "none", minWidth: 0 }} />
                      <span onClick={() => delAcomp(idx)} title="Quitar" style={{ width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#c4c4cc", cursor: "pointer", flex: "none" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" /></svg></span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select value={a.tipo} onChange={(e) => updA(idx, { tipo: e.target.value })} style={{ ...SEL, flex: 1 }}><option value="adulto">Adulto</option><option value="niño">Niño</option></select>
                      <select value={a.menu} onChange={(e) => updA(idx, { menu: e.target.value })} style={{ ...SEL, flex: 1.4 }}>{menuOptions.map((m) => <option key={m} value={m}>{m}</option>)}</select>
                    </div>
                    <input value={a.alergia} onChange={(e) => updA(idx, { alergia: e.target.value })} placeholder="Alergias (opcional)" style={{ ...SEL, width: "100%", marginTop: 8, cursor: "text" }} />
                  </div>
                ))}
                {acomps.length === 0 && (
                  <div onClick={addAcomp} style={{ border: "1.5px dashed #E0D9CE", borderRadius: 13, padding: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#a0a0a8", font: "500 12px Poppins", cursor: "pointer", textAlign: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ flex: "none" }}><path d="M12 5v14M5 12h14" /></svg>Vengo sin acompañantes — o añade el primero
                  </div>
                )}
              </div>
            </>
          )}

          <button onClick={enviar} disabled={!listo || enviando} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 13, background: listo ? "#EF5B94" : "#f0f0f2", color: listo ? "#fff" : "#a0a0a8", font: "600 14px Poppins", border: "none", cursor: listo ? "pointer" : "default", boxShadow: listo ? "0 6px 16px rgba(239,91,148,.3)" : "none" }}>
            {enviando ? "Enviando…" : listo ? (asiste ? "Confirmar asistencia" : "Enviar respuesta") : "Selecciona una opción"}
          </button>
          <div style={{ font: "400 10.5px Poppins", color: "#a0a0a8", textAlign: "center", marginTop: 12 }}>Podrás modificar tu respuesta desde este mismo enlace.</div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "34px 10px", animation: "ca-fadein .3s ease" }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: asiste ? "#2FB37E" : "#8a8a90", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            {asiste
              ? <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>
              : <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c-2 3.5-6 5-6 9.5a6 6 0 0 0 12 0C18 8 14 6.5 12 3z" /></svg>}
          </div>
          <div style={{ font: "700 19px Poppins", color: "#3A3A42", textAlign: "center" }}>{asiste ? "¡Asistencia confirmada!" : "Respuesta enviada"}</div>
          <div style={{ font: "400 13px Poppins", color: "#6b6b72", textAlign: "center", maxWidth: 330, lineHeight: 1.65 }}>
            {asiste
              ? `Gracias, ${nombre}. Hemos registrado tu confirmación${acomps.filter((a) => a.nombre.trim()).length > 0 ? ` y la de tus ${acomps.filter((a) => a.nombre.trim()).length} acompañante(s)` : ""}. ¡Nos vemos en el evento!`
              : `Gracias por avisarnos, ${nombre}. Lamentamos que no puedas acompañarnos — los organizadores han sido notificados.`}
          </div>
          <span onClick={() => setEnviado(false)} style={{ font: "600 12.5px Poppins", color: "#EF5B94", cursor: "pointer", marginTop: 4 }}>Editar mi respuesta</span>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#ECECEE", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes ca-fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.ca-hs::-webkit-scrollbar{display:none;}.ca-hs{scrollbar-width:none;}" }} />
      {/* Header */}
      <div style={{ background: "#fff", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 10px rgba(0,0,0,.04)" }}>
        <div style={{ font: "700 20px Poppins", color: "#EF5B94" }}>Bodasdehoy<span style={{ fontSize: 12, color: "#3A3A42" }}>.com</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, font: "500 12px Poppins", color: "#8a8a90" }}>Español<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg></div>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "40px 20px 70px" }}>
        <div className="ca-grid" style={{ width: "100%", maxWidth: 1060 }}>
          {/* Intro */}
          <div className="ca-intro">
            <div className="ca-title" style={{ font: "700 34px Poppins", color: "#3A3A42", marginBottom: 14, lineHeight: 1.25 }}>Eres un invitado especial al evento</div>
            <div className="ca-sub" style={{ font: "400 14px Poppins", color: "#6b6b72", marginBottom: 26, lineHeight: 1.7, maxWidth: 420 }}>Confirma tu asistencia y registra los detalles de tus acompañantes para brindarles una experiencia inolvidable.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {info.map((it, i) => (
                <div key={i} className="ca-infopoint" style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                  <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94", flex: "none" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{it.icon}</svg>
                  </span>
                  <span style={{ font: "500 13px Poppins", color: "#3A3A42", paddingTop: 4, lineHeight: 1.6 }}>{it.txt}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Formulario */}
          <div>{formCard}</div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ca-grid{display:grid;grid-template-columns:1fr;gap:28px;align-items:start;}
        .ca-intro{text-align:center;}
        .ca-title{font-size:22px!important;}
        .ca-sub{margin-left:auto;margin-right:auto;font-size:12.5px!important;}
        .ca-infopoint{text-align:left;}
        @media(min-width:900px){
          .ca-grid{grid-template-columns:minmax(280px,1fr) minmax(340px,520px);gap:44px;}
          .ca-intro{text-align:left;padding-top:14px;}
          .ca-title{font-size:34px!important;}
          .ca-sub{margin-left:0;margin-right:0;font-size:14px!important;}
        }
      ` }} />
    </div>
  );
};

export default ConfirmarAsistenciaStudio;
