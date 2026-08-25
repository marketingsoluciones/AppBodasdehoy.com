import { FC, useCallback, useEffect, useRef, useState, ReactNode } from "react";
import Head from "next/head";
import { useTranslation } from "react-i18next";
import BlockTitle from "../Utils/BlockTitle";
import { subir_archivo } from "./ModuloSubida";
import { EventContextProvider } from "../../context/EventContext";
import { AuthContextProvider } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { fetchApiEventos, queries } from "../../utils/Fetching";

/**
 * InvitacionesStudio — Rediseño UI (wizard 2 pasos). FASE A: paso "Diseñar invitación".
 * CSS replicado VERBATIM del HTML "Invitaciones estudio" (estilos inline exactos).
 * MISMO BACKEND: persiste vía updateEmailTemplate/createEmailTemplate ({design, html});
 * design = JSON estructurado (_studio:'v1'); html = email renderizado. No toca Fetching.ts.
 */

type TemplateKey = "elegante" | "clasica" | "moderna";
type FontKey = "elegante" | "moderna" | "script";
type ChannelKey = "email" | "whatsapp" | "sms";

interface DesignData {
  _studio: "v1";
  template: TemplateKey;
  font: FontKey;
  accent: string;
  cover: string;
  title: string;
  names: string;
  date: string;
  message: string;
  venue: string;
  time: string;
  rsvp: string;
}

// Gradientes de plantilla EXACTOS del HTML
const PRESETS: Record<TemplateKey, { label: string; grad: string }> = {
  elegante: { label: "Elegante", grad: "linear-gradient(135deg,#e9d6c3,#d8bfa3)" },
  clasica: { label: "Clásica", grad: "linear-gradient(135deg,#ece4d6,#dccdb4)" },
  moderna: { label: "Moderna", grad: "linear-gradient(135deg,#dfe6ec,#b9cbdb)" },
};
const FONTS: Record<FontKey, { label: string; family: string }> = {
  elegante: { label: "Elegante", family: "'Playfair Display',serif" },
  moderna: { label: "Moderna", family: "'Poppins',sans-serif" },
  script: { label: "Script", family: "'Dancing Script',cursive" },
};
// Paleta "Color de acento" (tonos suaves): rosa · crema · oliva · azul acero · oro
const ACCENTS = ["#C99AA6", "#E8DEC5", "#8DA07A", "#6E8BAA", "#C9A24B"];

const defaultDesign = (event: any): DesignData => ({
  _studio: "v1",
  template: "elegante",
  font: "elegante",
  accent: "#C99AA6",
  cover: "",
  title: "NOS CASAMOS",
  names: event?.nombre || "Ana & Marcos",
  date: event?.fecha ? new Date(event.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "12 de Junio, 2028",
  message: "Nos encantaría compartir contigo este día tan especial.",
  venue: "",
  time: "",
  rsvp: "Confirma tu asistencia",
});

const renderEmailHtml = (d: DesignData): string => {
  const p = PRESETS[d.template];
  const font = FONTS[d.font].family;
  return `<!doctype html><html><body style="margin:0;background:#f1f1f4;font-family:${font};">
  <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f0f0f2;">
    <div style="height:190px;background:${d.cover ? `url(${d.cover}) center/cover` : p.grad};border-bottom:3px solid ${d.accent};"></div>
    <div style="padding:26px 26px 30px;text-align:center;">
      <div style="font-weight:700;font-size:15px;color:${d.accent};letter-spacing:3px;">${d.title}</div>
      <div style="height:1px;background:${d.accent};opacity:.4;margin:14px 34px;"></div>
      <div style="font-weight:700;font-size:26px;color:#3A3A42;">${d.names}</div>
      <div style="font-weight:600;font-size:12px;color:${d.accent};margin-top:8px;">${d.date}</div>
      <div style="font-size:13.5px;color:#8a8a90;margin-top:14px;line-height:1.6;">${d.message}</div>
    </div>
  </div></body></html>`;
};

// SVG de canales (como el HTML: iconos, no emoji)
const chanIcon = (c: ChannelKey, color: string): ReactNode => {
  const common = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (c === "email") return (<svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>);
  if (c === "whatsapp") return (<svg {...common}><path d="M21 11.5a8.4 8.4 0 0 1-11.6 7.8L3 21l1.9-5.4A8.4 8.4 0 1 1 21 11.5z" /></svg>);
  return (<svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>);
};

export const InvitacionesStudio: FC = () => {
  const { i18n } = useTranslation();
  const { event } = EventContextProvider() as any;
  const auth = AuthContextProvider() as any;
  const toast = useToast();

  const [tab, setTab] = useState<"diseno" | "envio">("diseno");
  const [channel, setChannel] = useState<ChannelKey>("email");
  const [face, setFace] = useState<"front" | "back">("front");
  const [previewMobile, setPreviewMobile] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [design, setDesign] = useState<DesignData>(() => defaultDesign(event));
  const [templateId, setTemplateId] = useState<string | undefined>(event?.templateEmailSelect);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("saved");
  const [showOnb, setShowOnb] = useState(true);
  const [coverLocal, setCoverLocal] = useState<string>("");
  const [uploadingCover, setUploadingCover] = useState(false);
  // Paso "Enviar" (Fase B)
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [searchB, setSearchB] = useState("");
  const [filterB, setFilterB] = useState<"todos" | "sin" | "enviadas" | "abiertas" | "pend">("todos");
  const [sendChan, setSendChan] = useState<ChannelKey>("email");
  const [sendMode, setSendMode] = useState<"now" | "sched">("now");
  const [sending, setSending] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const id = event?.templateEmailSelect;
    if (!id || loadedRef.current) return;
    loadedRef.current = true;
    setTemplateId(id);
    fetchApiEventos({ query: queries.getEmailTemplate, variables: { template_id: id } })
      .then((res: any) => {
        const tpl = Array.isArray(res) ? res[0] : res;
        const dz = tpl?.design;
        if (dz && dz._studio === "v1") setDesign({ ...defaultDesign(event), ...dz });
      })
      .catch(() => {/* plantilla antigua → defaults */});
  }, [event?._id, event?.templateEmailSelect]);

  const persist = useCallback((d: DesignData) => {
    if (!event?._id) return;
    setSaveState("saving");
    const html = renderEmailHtml(d);
    const done = (id?: string) => { if (id) setTemplateId(id); setSaveState("saved"); };
    if (templateId) {
      fetchApiEventos({ query: queries.updateEmailTemplate, variables: { evento_id: event._id, template_id: templateId, design: d, html } })
        .then((res: any) => done(Array.isArray(res) ? res[0]?._id : res?._id)).catch(() => setSaveState("idle"));
    } else {
      fetchApiEventos({ query: queries.createEmailTemplate, variables: { evento_id: event._id, design: d, html, configTemplate: { name: "Invitación", subject: d.title || "Invitación" }, domain: auth?.config?.dominio || auth?.config?.domain } })
        .then((res: any) => done(res?._id)).catch(() => setSaveState("idle"));
    }
  }, [event?._id, templateId, auth]);

  const update = useCallback((patch: Partial<DesignData>) => {
    setDesign((prev) => {
      const next = { ...prev, ...patch };
      setSaveState("saving");
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(next), 800);
      return next;
    });
  }, [persist]);

  const handleCoverFile = useCallback(async (file?: File | null) => {
    if (!file || !event?._id) return;
    setCoverLocal(URL.createObjectURL(file));
    setUploadingCover(true);
    try {
      const r: any = await subir_archivo({ imagePreviewUrl: { file }, event, use: "portada" });
      const url = r?.i1024 || r?.i800 || r?.i640;
      if (url) update({ cover: url }); else toast("error", "No se pudo subir la imagen");
    } catch { toast("error", "No se pudo subir la imagen"); }
    finally { setUploadingCover(false); }
  }, [event, update, toast]);

  // Envío real — mismo backend que el módulo actual (sendComunications: email/whatsapp).
  const doSend = useCallback(async () => {
    const ids = Object.keys(checked).filter((k) => checked[k]);
    if (!ids.length) { toast("error", "Selecciona al menos un invitado"); return; }
    if (sendChan === "sms") { toast("error", "El envío por SMS aún no está disponible"); return; }
    if (sendChan === "email" && !templateId) { toast("error", "Diseña y guarda la invitación antes de enviar"); return; }
    if (sendChan === "whatsapp" && !event?.templateWhatsappSelect) { toast("error", "Configura una plantilla de WhatsApp antes de enviar"); return; }
    setSending(true);
    try {
      await fetchApiEventos({
        query: queries.sendComunications,
        variables: {
          evento_id: event?._id,
          invitados_ids_array: ids,
          dominio: auth?.config?.dominio || auth?.config?.domain,
          transport: sendChan,
          lang: i18n?.language || "es",
          template_id: sendChan === "email" ? templateId : event?.templateWhatsappSelect,
        },
      });
      toast("success", sendChan === "email" ? "Envío por email exitoso" : "Envío por WhatsApp exitoso");
      setChecked({});
    } catch {
      toast("error", "Error al enviar invitaciones");
    } finally {
      setSending(false);
    }
  }, [checked, sendChan, templateId, event, auth, i18n, toast]);

  const grad = PRESETS[design.template].grad;
  const invFont = FONTS[design.font].family;
  const accent = design.accent;
  const coverBg = (design.cover || coverLocal) ? `url(${design.cover || coverLocal}) center/cover` : grad;
  const smsText = `${design.names}: ${design.message} ${design.date}. Confirma: bod.as/xxxx`;

  // helpers de estilo replicando el HTML
  const cardBox: React.CSSProperties = { background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, boxShadow: "0 4px 14px rgba(0,0,0,.05)", padding: "20px 22px" };
  const cardTitle: React.CSSProperties = { font: "600 13.5px Poppins", color: "#3A3A42", marginBottom: 14 };
  const fieldLabel: React.CSSProperties = { font: "600 11px Poppins", color: "#EF5B94", marginBottom: 6 };
  const fieldInput: React.CSSProperties = { width: "100%", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "10px 13px", font: "500 12.5px Poppins", color: "#3A3A42", outline: "none" };

  const TEXTS: { k: keyof DesignData; label: string }[] = [
    { k: "title", label: "Encabezado" }, { k: "names", label: "Nombres" }, { k: "date", label: "Fecha" },
  ];

  return (
    <div style={{ background: "#f1f1f4", minHeight: "100%", fontFamily: "'Poppins',sans-serif" }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Playfair+Display:wght@500;600;700&family=Dancing+Script:wght@600;700&display=swap" rel="stylesheet" />
      </Head>
      {/* Keyframes del HTML (fadein/slidein) + responsive del studio */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slidein{from{transform:translateX(-26px);opacity:0}to{transform:translateX(0);opacity:1}}
        @media (max-width:900px){.inv-design-grid{grid-template-columns:1fr !important}.inv-preview-col{position:static !important;top:auto !important}}
        /* MÓVIL (fiel al HTML): padding compacto, tabs full-width y CTA/barra inferior fija */
        .inv-mob-cta{display:none;}
        @media (max-width:640px){
          .inv-container{padding:14px 14px 96px !important;}
          .inv-tabs{display:flex !important;width:100% !important;}
          .inv-tab{flex:1 !important;justify-content:center !important;padding:10px 6px !important;}
          .inv-mob-cta{display:block !important;}
          .inv-chan-icons{display:none !important;}
          .inv-chan-text{display:flex !important;}
          .inv-mobtoggle{display:none !important;}
          /* Stats: 4 en fila compactos (fiel al HTML), NO apilados */
          .inv-stats-grid{gap:8px !important;}
          .inv-stat-card{padding:10px 6px !important;text-align:center !important;}
          .inv-stat-num{font-size:17px !important;}
          .inv-stat-lbl{font-size:9px !important;}
          /* Cabecera: en móvil se muestra la limpia (título + BODA·evento) a todo el ancho */
          .inv-header-desk{display:none !important;}
          .inv-header-mob{display:block !important;}
          /* Filtros del paso Enviar: una sola línea con scroll horizontal (fiel al HTML) */
          .inv-envio-controls{flex-direction:column !important;align-items:stretch !important;}
          .inv-filters{flex-wrap:nowrap !important;overflow-x:auto !important;-webkit-overflow-scrolling:touch;}
          .inv-filters::-webkit-scrollbar{display:none;}
          .inv-selall{width:100% !important;}
        }
      ` }} />
      <div className="inv-container" style={{ maxWidth: 1000, margin: "0 auto", padding: "22px 30px 60px" }}>

        {/* Cabecera estándar compartida */}
        {/* ESCRITORIO: cabecera estándar (BlockTitle con avatares/compartir) */}
        <div className="inv-header-desk" style={{ marginBottom: 20 }}><BlockTitle title={"Invitaciones"} /></div>
        {/* MÓVIL: cabecera limpia a todo el ancho (fiel al HTML): solo título + BODA · evento */}
        <div className="inv-header-mob" style={{ display: "none", margin: "-14px -14px 14px", padding: "13px 16px 12px", background: "#fff", borderBottom: "1px solid #f0f0f2" }}>
          <div style={{ font: "700 19px Poppins", color: "#3A3A42" }}>Invitaciones</div>
          <div style={{ marginTop: 2 }}>
            <span style={{ font: "700 10px Poppins", color: "#EF5B94", letterSpacing: ".5px", textTransform: "uppercase" }}>{event?.tipo || "Boda"}</span>
            <span style={{ font: "500 11px Poppins", color: "#8a8a90", marginLeft: 5 }}>· {event?.nombre}</span>
          </div>
        </div>

        {/* Tabs 1 Diseñar / 2 Enviar */}
        <div className="inv-tabs" style={{ display: "inline-flex", gap: 6, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 14, boxShadow: "0 4px 14px rgba(0,0,0,.05)", padding: 6, marginBottom: 24 }}>
          {([["diseno", "1", "Diseñar invitación"], ["envio", "2", "Enviar"]] as const).map(([key, num, txt]) => {
            const a = tab === key;
            return (
              <div key={key} className="inv-tab" onClick={() => setTab(key)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 22px", borderRadius: 10, background: a ? "#FCE7F0" : "transparent", color: a ? "#D83E7C" : "#6b6b72", font: `${a ? 700 : 600} 14px Poppins`, cursor: "pointer" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", background: a ? "#EF5B94" : "#EDEDF0", color: a ? "#fff" : "#9aa0a8", font: "700 11px Poppins", flex: "none" }}>{num}</span>
                {txt}
              </div>
            );
          })}
        </div>

        {/* Onboarding */}
        {showOnb && (
          <div style={{ display: "flex", marginBottom: 16 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FCE7F0", borderRadius: 999, padding: "10px 18px", whiteSpace: "nowrap" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B23A6B" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              <span style={{ font: "600 13px Poppins", color: "#B23A6B" }}>Diseña tu invitación y envíala por email, WhatsApp o SMS.</span>
              <div onClick={() => setShowOnb(false)} style={{ cursor: "pointer", color: "#B23A6B", display: "flex", marginLeft: 4 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg>
              </div>
            </div>
          </div>
        )}

        {/* CTA fija SOLO móvil (fiel al HTML): pasar de Diseñar → Enviar */}
        {tab === "diseno" && (
          <div className="inv-mob-cta" style={{ position: "fixed", left: 10, right: 10, bottom: 16, zIndex: 40 }}>
            <button onClick={() => setTab("envio")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, background: "#EF5B94", color: "#fff", font: "600 14px Poppins", border: "none", boxShadow: "0 10px 26px rgba(239,91,148,.4)", cursor: "pointer" }}>Continuar a enviar<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
          </div>
        )}

        {tab === "diseno" && (
          <div className="inv-design-grid" style={{ animation: "fadein .2s ease", display: "grid", gridTemplateColumns: "380px 1fr", gap: 22, alignItems: "start" }}>

            {/* LIVE PREVIEW */}
            <div className="inv-preview-col" style={{ position: "sticky", top: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ font: "700 10.5px Poppins", color: "#a0a0a8", letterSpacing: ".8px", textTransform: "uppercase" }}>Vista previa</div>
                  {saveState === "saved" && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, font: "600 10px Poppins", color: "#2FB37E", background: "#E4F5EE", padding: "3px 8px", borderRadius: 10 }}>✓ Guardado</span>}
                  {saveState === "saving" && <span style={{ font: "600 10px Poppins", color: "#a0a0a8", background: "#f0f0f2", padding: "3px 8px", borderRadius: 10 }}>Guardando…</span>}
                </div>
                {/* ESCRITORIO: iconos de canal */}
                <div className="inv-chan-icons" style={{ display: "flex", gap: 3, background: "#ececed", borderRadius: 9, padding: 3 }}>
                  {(["email", "whatsapp", "sms"] as ChannelKey[]).map((c) => {
                    const a = channel === c;
                    return <div key={c} onClick={() => setChannel(c)} title={c} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 26, borderRadius: 7, background: a ? "#fff" : "transparent", boxShadow: a ? "0 1px 3px rgba(0,0,0,.14)" : "none", cursor: "pointer" }}>{chanIcon(c, a ? "#EF5B94" : "#9aa0a8")}</div>;
                  })}
                </div>
                {/* MÓVIL: pastillas de texto (fiel al HTML) */}
                <div className="inv-chan-text" style={{ display: "none", gap: 3, background: "#ececed", borderRadius: 9, padding: 3 }}>
                  {(["email", "whatsapp", "sms"] as ChannelKey[]).map((c) => {
                    const a = channel === c;
                    const label = c === "email" ? "Email" : c === "whatsapp" ? "WhatsApp" : "SMS";
                    return <div key={c} onClick={() => setChannel(c)} style={{ padding: "5px 11px", borderRadius: 7, background: a ? "#fff" : "transparent", color: a ? "#EF5B94" : "#8a8a90", font: "600 10.5px Poppins", cursor: "pointer", boxShadow: a ? "0 1px 3px rgba(0,0,0,.12)" : "none", whiteSpace: "nowrap" }}>{label}</div>;
                  })}
                </div>
              </div>

              {channel === "email" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 3, background: "#ececed", borderRadius: 9, padding: 3 }}>
                    {(["front", "back"] as const).map((f) => (
                      <div key={f} onClick={() => setFace(f)} style={{ padding: "6px 13px", borderRadius: 7, background: face === f ? "#fff" : "transparent", color: face === f ? "#D83E7C" : "#9aa0a8", font: "600 11px Poppins", cursor: "pointer" }}>{f === "front" ? "Portada" : "Detalles"}</div>
                    ))}
                  </div>
                  <div className="inv-mobtoggle" onClick={() => setPreviewMobile((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", padding: "6px 12px", borderRadius: 9, border: "1.5px solid #EF5B94", background: "#fff", color: "#D83E7C", font: "600 11px Poppins", cursor: "pointer" }}>
                    {previewMobile ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></svg>
                    )}
                    {previewMobile ? "Escritorio" : "Móvil"}
                  </div>
                </div>
              )}

              {/* EMAIL face */}
              {channel === "email" && (
                <div style={{ margin: previewMobile ? "0 auto" : undefined, maxWidth: previewMobile ? 300 : undefined }}>
                  {previewMobile && <div style={{ width: 52, height: 5, borderRadius: 3, background: "#3a3a42", margin: "2px auto 10px" }} />}
                  <div style={{ width: "100%", background: "#fff", borderRadius: 18, boxShadow: "0 12px 34px rgba(0,0,0,.12)", overflow: "hidden", border: "1px solid #f0f0f2" }}>
                    <div onClick={() => coverInputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleCoverFile(e.dataTransfer.files?.[0]); }}
                      style={{ height: 190, position: "relative", background: coverBg, borderBottom: `3px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4, color: "rgba(255,255,255,.92)", font: "600 12px Poppins", cursor: "pointer" }}>
                      {!(design.cover || coverLocal) && (<>Arrastra la foto de portada<span style={{ fontSize: 10, opacity: .85, textDecoration: "underline" }}>o haz clic para subir</span></>)}
                      {uploadingCover && <span style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", font: "600 12px Poppins" }}>Subiendo…</span>}
                      <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => handleCoverFile(e.target.files?.[0])} style={{ display: "none" }} />
                    </div>
                    {face === "front" ? (
                      <div style={{ padding: "26px 26px 30px", textAlign: "center", background: "#fff" }}>
                        <div style={{ fontFamily: invFont, fontWeight: 700, fontSize: 15, color: accent, letterSpacing: 3 }}>{design.title}</div>
                        <div style={{ height: 1, background: accent, opacity: .4, margin: "14px 34px" }} />
                        <div style={{ fontFamily: invFont, fontWeight: 700, fontSize: 26, color: "#3A3A42" }}>{design.names}</div>
                        <div style={{ font: "600 12px Poppins", color: accent, marginTop: 8, letterSpacing: ".5px" }}>{design.date}</div>
                        <div style={{ fontFamily: invFont, fontSize: 13.5, color: "#8a8a90", marginTop: 14, lineHeight: 1.6 }}>{design.message}</div>
                      </div>
                    ) : (
                      <div style={{ padding: "28px 26px 32px", textAlign: "center", background: "#fff" }}>
                        <div style={{ fontFamily: invFont, fontWeight: 700, fontSize: 14, color: accent, letterSpacing: 2 }}>DETALLES</div>
                        <div style={{ height: 1, background: accent, opacity: .4, margin: "14px 34px" }} />
                        <div style={{ font: "600 11px Poppins", color: "#a0a0a8" }}>Lugar</div>
                        <div style={{ fontFamily: invFont, fontSize: 16, color: "#3A3A42" }}>{design.venue || "—"}</div>
                        <div style={{ font: "600 11px Poppins", color: "#a0a0a8", marginTop: 12 }}>Hora</div>
                        <div style={{ fontFamily: invFont, fontSize: 16, color: "#3A3A42" }}>{design.time || "—"}</div>
                        <div style={{ marginTop: 18, display: "inline-block", background: accent, color: "#fff", font: "600 11.5px Poppins", padding: "8px 16px", borderRadius: 20 }}>{design.rsvp}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ font: "500 11px Poppins", color: "#a0a0a8", marginTop: 10, textAlign: "center" }}>Correo con diseño completo e imagen de portada.</div>
                </div>
              )}

              {/* WHATSAPP face */}
              {channel === "whatsapp" && (
                <>
                  <div style={{ width: "100%", background: "#E5DDD5", borderRadius: 20, boxShadow: "0 12px 34px rgba(0,0,0,.12)", padding: "20px 16px", border: "1px solid #f0f0f2" }}>
                    <div style={{ maxWidth: 270, background: "#fff", borderRadius: "4px 14px 14px 14px", boxShadow: "0 1px 2px rgba(0,0,0,.15)", overflow: "hidden" }}>
                      <div style={{ height: 150, background: coverBg }} />
                      <div style={{ padding: "10px 12px 12px" }}>
                        <div style={{ font: "700 13px Poppins", color: "#3A3A42" }}>{design.names} · ¡Nos casamos!</div>
                        <div style={{ font: "400 12px Poppins", color: "#4a4a52", marginTop: 4, lineHeight: 1.5 }}>{design.message} 📅 {design.date}</div>
                        <div style={{ font: "500 12px Poppins", color: "#EF5B94", marginTop: 8 }}>Ver invitación y confirmar →</div>
                        <div style={{ textAlign: "right", font: "400 9px Poppins", color: "#9aa0a6", marginTop: 6 }}>12:30 ✓✓</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ font: "500 11px Poppins", color: "#a0a0a8", marginTop: 10, textAlign: "center" }}>Mensaje con imagen, texto corto y enlace a la invitación.</div>
                </>
              )}

              {/* SMS face */}
              {channel === "sms" && (
                <>
                  <div style={{ width: "100%", background: "#f2f2f4", borderRadius: 20, boxShadow: "0 12px 34px rgba(0,0,0,.12)", padding: "22px 18px", border: "1px solid #f0f0f2", minHeight: 150 }}>
                    <div style={{ maxWidth: 250, background: "#E9E9EB", borderRadius: "16px 16px 16px 4px", padding: "12px 15px" }}>
                      <div style={{ font: "400 12.5px Poppins", color: "#3A3A42", lineHeight: 1.55 }}>{smsText}</div>
                    </div>
                    <div style={{ font: "400 9.5px Poppins", color: "#a0a0a8", marginTop: 6, paddingLeft: 4 }}>Entregado</div>
                  </div>
                  <div style={{ font: "500 11px Poppins", color: smsText.length > 160 ? "#E76F51" : "#a0a0a8", marginTop: 10, textAlign: "center" }}>{smsText.length} caracteres · sin imagen, solo texto y enlace.</div>
                </>
              )}
            </div>

            {/* CONTROLS */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Plantilla */}
              <div style={cardBox}>
                <div style={cardTitle}>Plantilla</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {(Object.keys(PRESETS) as TemplateKey[]).map((k) => {
                    const sel = design.template === k;
                    return (
                      <div key={k} onClick={() => update({ template: k })} style={{ border: `2px solid ${sel ? "#EF5B94" : "#f0f0f2"}`, borderRadius: 13, overflow: "hidden", cursor: "pointer" }}>
                        <div style={{ height: 76, background: PRESETS[k].grad }} />
                        <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
                          <span style={{ font: "600 11px Poppins", color: "#3A3A42" }}>{PRESETS[k].label}</span>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#EF5B94", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", font: "700 9px Poppins" }}>{sel ? "✓" : ""}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tipografía */}
              <div style={cardBox}>
                <div style={cardTitle}>Tipografía</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {(Object.keys(FONTS) as FontKey[]).map((f) => {
                    const sel = design.font === f;
                    return (
                      <div key={f} onClick={() => update({ font: f })} style={{ border: `1.5px solid ${sel ? "#EF5B94" : "#E7E7EA"}`, background: sel ? "#FCE7F0" : "#fff", borderRadius: 11, padding: "12px 8px", textAlign: "center", cursor: "pointer" }}>
                        <div style={{ fontFamily: FONTS[f].family, fontSize: 22, color: "#3A3A42", lineHeight: 1 }}>Aa</div>
                        <div style={{ font: "600 10.5px Poppins", color: sel ? "#D83E7C" : "#9aa0a8", marginTop: 6 }}>{FONTS[f].label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Textos */}
              <div style={cardBox}>
                <div style={cardTitle}>Textos</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {TEXTS.map((f) => (
                    <div key={f.k}>
                      <div style={fieldLabel}>{f.label}</div>
                      <input value={(design[f.k] as string) || ""} onChange={(e) => update({ [f.k]: e.target.value } as any)} style={fieldInput} />
                    </div>
                  ))}
                  <div>
                    <div style={fieldLabel}>Mensaje</div>
                    <textarea value={design.message} onChange={(e) => update({ message: e.target.value })} rows={3} style={{ ...fieldInput, resize: "none" }} />
                  </div>
                  <div>
                    <div style={fieldLabel}>Lugar (reverso)</div>
                    <input value={design.venue} onChange={(e) => update({ venue: e.target.value })} style={fieldInput} />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={fieldLabel}>Hora</div>
                      <input value={design.time} onChange={(e) => update({ time: e.target.value })} style={fieldInput} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={fieldLabel}>RSVP</div>
                      <input value={design.rsvp} onChange={(e) => update({ rsvp: e.target.value })} style={fieldInput} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Color de acento */}
              <div style={cardBox}>
                <div style={cardTitle}>Color de acento</div>
                <div style={{ display: "flex", gap: 12 }}>
                  {ACCENTS.map((c) => (
                    <div key={c} onClick={() => update({ accent: c })} style={{ width: 34, height: 34, borderRadius: "50%", background: c, cursor: "pointer", border: `3px solid ${design.accent === c ? "#3A3A42" : "transparent"}`, boxShadow: "0 2px 6px rgba(0,0,0,.12)" }} />
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setShowPreview(true)} style={{ padding: "12px 20px", borderRadius: 10, border: "1.5px solid #E7E7EA", background: "#fff", color: "#6b6b72", font: "600 13px Poppins", cursor: "pointer" }}>Vista previa completa</button>
                <button onClick={() => setTab("envio")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", boxShadow: "0 6px 16px rgba(239,91,148,.3)", cursor: "pointer" }}>
                  Continuar a enviar
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "envio" && (() => {
          const invitados: any[] = event?.invitados_array || [];
          const isSent = (inv: any) => !!inv.invitacion;
          const total = invitados.length;
          const sentN = invitados.filter(isSent).length;
          const unsentN = total - sentN;
          const openN = 0; // el backend aún no rastrea aperturas
          const stMap: Record<string, [string, string]> = {
            "Enviada": ["#2FB37E", "#E4F5EE"], "Abierta": ["#EF5B94", "#FCE7F0"],
            "Pendiente": ["#E0A32B", "#FBF0DA"], "Sin enviar": ["#b3b3ba", "#f2f2f4"], "Programada": ["#6E8BAA", "#EEF2F6"],
          };
          const avPal = ["#EF5B94", "#f588b3", "#d86fa0", "#EF5B94", "#f588b3"];
          const stats = [
            { v: total, l: "Total", c: "#3A3A42" },
            { v: sentN, l: "Enviadas", c: "#2FB37E" },
            { v: openN, l: "Abiertas", c: "#EF5B94" },
            { v: unsentN, l: "Sin enviar", c: "#E0A32B" },
          ];
          const q = searchB.trim().toLowerCase();
          const rows = invitados.map((inv, i) => {
            const st = isSent(inv) ? "Enviada" : "Sin enviar";
            const ch: ChannelKey = inv.correo ? "email" : (inv.telefono ? "whatsapp" : "email");
            return {
              id: inv._id as string, initial: ((inv.nombre || "?").trim().charAt(0) || "?").toUpperCase(),
              name: inv.nombre || "Sin nombre", email: inv.correo || "Sin correo",
              channel: ch === "email" ? "Email" : ch === "whatsapp" ? "WhatsApp" : "SMS", channelKey: ch,
              status: st, action: st === "Sin enviar" ? "Enviar" : "Reenviar", avBg: avPal[i % avPal.length],
            };
          });
          const fMap: Record<string, string | null> = { todos: null, sin: "Sin enviar", enviadas: "Enviada", abiertas: "Abierta", pend: "Pendiente" };
          const want = fMap[filterB];
          const guests = rows.filter((g) => (!want || g.status === want) && (!q || g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q)));
          const fbDefs: [typeof filterB, string, number][] = [
            ["todos", "Todos", total], ["sin", "Sin enviar", unsentN], ["enviadas", "Enviadas", sentN], ["abiertas", "Abiertas", openN], ["pend", "Pendientes", 0],
          ];
          const selIds = Object.keys(checked).filter((k) => checked[k]);
          const selN = selIds.length;
          const visibleIds = guests.map((g) => g.id);
          const allOn = visibleIds.length > 0 && visibleIds.every((id) => checked[id]);
          const toggleAll = () => {
            const c = { ...checked };
            if (allOn) visibleIds.forEach((id) => delete c[id]); else visibleIds.forEach((id) => { c[id] = true; });
            setChecked(c);
          };
          const noEmailN = selIds.filter((id) => { const inv = invitados.find((x) => x._id === id); return inv && !inv.correo; }).length;
          const checkMark = <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>;
          const sumTpl = PRESETS[design.template].label;
          const sendChanLabel = sendChan === "email" ? "Email" : sendChan === "whatsapp" ? "WhatsApp" : "SMS";
          const sendPreview = sendChan === "email" ? "Correo con diseño completo e imagen de portada." : sendChan === "whatsapp" ? `${design.names} · ¡Nos casamos! ${design.message} 📅 ${design.date}` : smsText;

          return (
            <div style={{ animation: "fadein .2s ease" }}>
              {/* Stats */}
              <div className="inv-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
                {stats.map((s, i) => (
                  <div key={i} className="inv-stat-card" style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 14, padding: "15px 18px", boxShadow: "0 4px 14px rgba(0,0,0,.05)" }}>
                    <div className="inv-stat-num" style={{ font: `700 22px Poppins`, color: s.c }}>{s.v}</div>
                    <div className="inv-stat-lbl" style={{ font: "500 11px Poppins", color: "#8a8a90" }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Toolbar: invitación + buscador */}
              <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", boxShadow: "0 4px 14px rgba(0,0,0,.05)", marginBottom: 14 }}>
                <div onClick={() => setTab("diseno")} title="Editar el diseño de la invitación" style={{ display: "flex", alignItems: "center", gap: 9, border: "1.5px solid #f0d9e4", background: "#fdf8fa", borderRadius: 11, padding: "9px 14px", cursor: "pointer" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={1.8}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h5" /></svg>
                  <span style={{ font: "500 11.5px Poppins", color: "#8a8a90" }}>Invitación:</span>
                  <span style={{ font: "600 11.5px Poppins", color: "#3A3A42" }}>{sumTpl}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#faf9fb", border: "1.5px solid #E7E7EA", borderRadius: 11, padding: "8px 13px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b3b3ba" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                  <input value={searchB} onChange={(e) => setSearchB(e.target.value)} type="text" placeholder="Buscar invitado" style={{ border: "none", outline: "none", background: "transparent", font: "500 12px Poppins", width: 130 }} />
                </div>
              </div>

              {/* Filtros + seleccionar todos */}
              <div className="inv-envio-controls" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                <div className="inv-filters" style={{ display: "flex", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
                  {fbDefs.map(([key, label, count]) => {
                    const a = filterB === key;
                    return (
                      <div key={key} onClick={() => setFilterB(key)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${a ? "#EF5B94" : "#E7E7EA"}`, background: a ? "#EF5B94" : "#fff", color: a ? "#fff" : "#6b6b72", font: "600 12px Poppins", cursor: "pointer", flex: "none", whiteSpace: "nowrap" }}>
                        {label}<span style={{ font: "600 10.5px Poppins", color: a ? "#fff" : "#a0a0a8" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="inv-selall" onClick={toggleAll} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 15px", borderRadius: 10, background: allOn ? "#EF5B94" : "#fff", border: `1.5px solid ${allOn ? "#EF5B94" : "#E7E7EA"}`, color: allOn ? "#fff" : "#6b6b72", font: "600 12px Poppins", cursor: "pointer", flex: "none" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                  {allOn ? "Quitar selección" : "Seleccionar todos"}
                </div>
              </div>

              {/* Tabla */}
              <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, boxShadow: "0 6px 20px rgba(0,0,0,.05)", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "34px 1.6fr 1fr 1fr 1fr", gap: 12, alignItems: "center", padding: "10px 22px", background: "#faf9fb", borderBottom: "1px solid #f0f0f2", font: "700 10px Poppins", color: "#a0a0a8", letterSpacing: ".5px", textTransform: "uppercase" }}>
                  <div><div onClick={toggleAll} style={{ width: 17, height: 17, borderRadius: 5, border: `1.8px solid ${allOn ? "#EF5B94" : "#d8d8de"}`, background: allOn ? "#EF5B94" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{allOn ? checkMark : null}</div></div>
                  <div style={{ textAlign: "left" }}>Invitado</div><div style={{ textAlign: "left" }}>Canal</div><div style={{ textAlign: "left" }}>Estado</div><div style={{ textAlign: "left" }}>Acción</div>
                </div>
                {guests.length === 0 && (
                  <div style={{ padding: "40px 22px", textAlign: "center", font: "500 12.5px Poppins", color: "#a0a0a8" }}>{total === 0 ? "Aún no tienes invitados en este evento." : "No hay invitados que coincidan con el filtro."}</div>
                )}
                {guests.map((g) => {
                  const on = !!checked[g.id];
                  const st = stMap[g.status];
                  return (
                    <div key={g.id} style={{ display: "grid", gridTemplateColumns: "34px 1.6fr 1fr 1fr 1fr", gap: 12, alignItems: "center", padding: "13px 22px", borderBottom: "1px solid #f5f5f7" }}>
                      <div><div onClick={() => setChecked((c) => ({ ...c, [g.id]: !c[g.id] }))} style={{ width: 17, height: 17, borderRadius: 5, border: `1.8px solid ${on ? "#EF5B94" : "#d8d8de"}`, background: on ? "#EF5B94" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{on ? checkMark : null}</div></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", flex: "none", background: g.avBg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "700 12px Poppins" }}>{g.initial}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ font: "600 12.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</div>
                          <div style={{ font: "500 10.5px Poppins", color: "#a0a0a8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.email}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, font: "600 11.5px Poppins", color: "#8a8a90" }}>{chanIcon(g.channelKey, "#8a8a90")}{g.channel}</div>
                      <div><span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: st[1], color: st[0], font: "600 10.5px Poppins", padding: "5px 10px", borderRadius: 20 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: st[0] }} />{g.status}</span></div>
                      <div style={{ justifySelf: "start" }}><button onClick={() => setChecked((c) => ({ ...c, [g.id]: true }))} style={{ padding: "7px 15px", borderRadius: 9, border: "1.5px solid #EF5B94", background: "#fff", color: "#EF5B94", font: "600 11px Poppins", cursor: "pointer" }}>{g.action}</button></div>
                    </div>
                  );
                })}
              </div>

              {/* Barra flotante de envío / aviso vacío */}
              {selN > 0 ? (
                <div style={{ position: "sticky", bottom: 20, marginTop: 18, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", boxShadow: "0 14px 34px rgba(0,0,0,.16)", animation: "fadein .2s ease" }}>
                  <div style={{ flexBasis: "100%", display: "flex", alignItems: "flex-start", gap: 11, background: "#faf9fb", border: "1px solid #f0f0f2", borderRadius: 12, padding: "11px 14px" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, flex: "none", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}>{chanIcon(sendChan, "#EF5B94")}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ font: "700 10px Poppins", color: "#a0a0a8", letterSpacing: ".5px", textTransform: "uppercase" }}>Vista previa · {sendChanLabel}</div>
                      <div style={{ font: "500 12px Poppins", color: "#4a4a52", marginTop: 3, lineHeight: 1.5 }}>{sendPreview}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#EF5B94", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "700 13px Poppins", flex: "none" }}>{selN}</div>
                    <div style={{ lineHeight: 1.3 }}>
                      <div style={{ font: "600 13px Poppins", color: "#3A3A42" }}>{selN} seleccionado{selN > 1 ? "s" : ""}</div>
                      <div onClick={() => setChecked({})} style={{ font: "500 11px Poppins", color: "#EF5B94", cursor: "pointer" }}>Quitar selección</div>
                    </div>
                    {noEmailN > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#FBF0DA", color: "#B8860B", font: "600 10.5px Poppins", padding: "5px 10px", borderRadius: 20 }}>⚠ {noEmailN} sin correo · se enviarán por WhatsApp</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 4, background: "#f2f2f4", borderRadius: 11, padding: 4 }}>
                      <div onClick={() => setSendMode("now")} style={{ padding: "8px 13px", borderRadius: 8, background: sendMode === "now" ? "#fff" : "transparent", color: sendMode === "now" ? "#3A3A42" : "#8a8a90", font: "600 11.5px Poppins", cursor: "pointer", boxShadow: sendMode === "now" ? "0 1px 3px rgba(0,0,0,.12)" : "none" }}>Ahora</div>
                      <div title="Próximamente" style={{ padding: "8px 13px", borderRadius: 8, background: "transparent", color: "#c5c5cc", font: "600 11.5px Poppins", cursor: "not-allowed" }}>Programar</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ font: "500 11.5px Poppins", color: "#8a8a90" }}>Enviar por</span>
                      <div style={{ display: "flex", gap: 4, background: "#f2f2f4", borderRadius: 11, padding: 4 }}>
                        {(["email", "whatsapp", "sms"] as ChannelKey[]).map((c) => {
                          const a = sendChan === c;
                          return <div key={c} onClick={() => setSendChan(c)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 8, background: a ? "#fff" : "transparent", color: a ? "#3A3A42" : "#8a8a90", font: "600 11.5px Poppins", cursor: "pointer", boxShadow: a ? "0 1px 3px rgba(0,0,0,.12)" : "none" }}>{chanIcon(c, a ? "#EF5B94" : "#9aa0a8")}{c === "email" ? "Email" : c === "whatsapp" ? "WhatsApp" : "SMS"}</div>;
                        })}
                      </div>
                    </div>
                    <button onClick={doSend} disabled={sending} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", boxShadow: "0 6px 16px rgba(239,91,148,.35)", border: "none", cursor: sending ? "wait" : "pointer", opacity: sending ? .7 : 1 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                      {sending ? "Enviando…" : `Enviar por ${sendChanLabel}`}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: 14, border: "1.5px dashed #e6d0da", borderRadius: 14, background: "#fdf8fa" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={1.8}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                  <span style={{ font: "500 12.5px Poppins", color: "#8a8a90" }}>Marca los invitados que quieras y elige cómo enviarles la invitación.</span>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Modal "Vista previa de la invitación" — markup exacto del HTML */}
      {showPreview && (
        <div onClick={() => setShowPreview(false)} style={{ position: "fixed", inset: 0, background: "rgba(43,43,48,.62)", zIndex: 64, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", overflow: "auto" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: "100%", animation: "fadein .22s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ font: "600 13px Poppins", color: "#fff" }}>Vista previa de la invitación</div>
              <div onClick={() => setShowPreview(false)} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.16)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg>
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 22, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.4)" }}>
              <div style={{ height: 300, background: coverBg, borderBottom: `3px solid ${accent}` }} />
              <div style={{ padding: "40px 40px 46px", textAlign: "center" }}>
                <div style={{ fontFamily: invFont, fontWeight: 700, fontSize: 16, color: accent, letterSpacing: 4 }}>{design.title}</div>
                <div style={{ height: 1, background: accent, opacity: .4, margin: "16px 44px" }} />
                <div style={{ fontFamily: invFont, fontWeight: 700, fontSize: 34, color: "#3A3A42" }}>{design.names}</div>
                <div style={{ font: "600 14px Poppins", color: accent, marginTop: 12, letterSpacing: ".5px" }}>{design.date}</div>
                <div style={{ fontFamily: invFont, fontSize: 14, color: "#8a8a90", marginTop: 20, lineHeight: 1.7 }}>{design.message}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitacionesStudio;
