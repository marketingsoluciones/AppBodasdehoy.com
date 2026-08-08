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
  elegante: { label: "Elegante", grad: "linear-gradient(135deg,#f7c2da,#EF5B94)" },
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
  useTranslation();
  const { event } = EventContextProvider() as any;
  const auth = AuthContextProvider() as any;
  const toast = useToast();

  const [tab, setTab] = useState<"diseno" | "envio">("diseno");
  const [channel, setChannel] = useState<ChannelKey>("email");
  const [face, setFace] = useState<"front" | "back">("front");
  const [previewMobile, setPreviewMobile] = useState(false);
  const [design, setDesign] = useState<DesignData>(() => defaultDesign(event));
  const [templateId, setTemplateId] = useState<string | undefined>(event?.templateEmailSelect);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("saved");
  const [showOnb, setShowOnb] = useState(true);
  const [coverLocal, setCoverLocal] = useState<string>("");
  const [uploadingCover, setUploadingCover] = useState(false);
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
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "22px 30px 60px" }}>

        {/* Cabecera estándar compartida */}
        <div style={{ marginBottom: 20 }}><BlockTitle title={"Invitaciones"} /></div>

        {/* Tabs 1 Diseñar / 2 Enviar */}
        <div style={{ display: "inline-flex", gap: 6, background: "#fff", border: "1px solid #f0f0f2", borderRadius: 14, boxShadow: "0 4px 14px rgba(0,0,0,.05)", padding: 6, marginBottom: 24 }}>
          {([["diseno", "1", "Diseñar invitación"], ["envio", "2", "Enviar"]] as const).map(([key, num, txt]) => {
            const a = tab === key;
            return (
              <div key={key} onClick={() => setTab(key)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 22px", borderRadius: 10, background: a ? "#FCE7F0" : "transparent", color: a ? "#D83E7C" : "#6b6b72", font: `${a ? 700 : 600} 14px Poppins`, cursor: "pointer" }}>
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

        {tab === "diseno" && (
          <div style={{ animation: "fadein .2s ease", display: "grid", gridTemplateColumns: "380px 1fr", gap: 22, alignItems: "start" }}>

            {/* LIVE PREVIEW */}
            <div style={{ position: "sticky", top: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ font: "700 10.5px Poppins", color: "#a0a0a8", letterSpacing: ".8px", textTransform: "uppercase" }}>Vista previa</div>
                  {saveState === "saved" && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, font: "600 10px Poppins", color: "#2FB37E", background: "#E4F5EE", padding: "3px 8px", borderRadius: 10 }}>✓ Guardado</span>}
                  {saveState === "saving" && <span style={{ font: "600 10px Poppins", color: "#a0a0a8", background: "#f0f0f2", padding: "3px 8px", borderRadius: 10 }}>Guardando…</span>}
                </div>
                <div style={{ display: "flex", gap: 3, background: "#ececed", borderRadius: 9, padding: 3 }}>
                  {(["email", "whatsapp", "sms"] as ChannelKey[]).map((c) => {
                    const a = channel === c;
                    return <div key={c} onClick={() => setChannel(c)} title={c} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 26, borderRadius: 7, background: a ? "#fff" : "transparent", boxShadow: a ? "0 1px 3px rgba(0,0,0,.14)" : "none", cursor: "pointer" }}>{chanIcon(c, a ? "#EF5B94" : "#9aa0a8")}</div>;
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
                  <div onClick={() => setPreviewMobile((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", padding: "6px 12px", borderRadius: 9, border: `1.5px solid ${previewMobile ? "#EF5B94" : "#E7E7EA"}`, background: "#fff", color: previewMobile ? "#D83E7C" : "#6b6b72", font: "600 11px Poppins", cursor: "pointer" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></svg>Móvil
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
                      {!(design.cover || coverLocal) && (<><span style={{ fontSize: 26 }}>🖼</span>Arrastra la foto de portada<span style={{ fontSize: 10, opacity: .85, textDecoration: "underline" }}>o haz clic para subir</span></>)}
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
                <button style={{ padding: "12px 20px", borderRadius: 10, border: "1.5px solid #E7E7EA", background: "#fff", color: "#6b6b72", font: "600 13px Poppins", cursor: "pointer" }}>Vista previa completa</button>
                <button onClick={() => setTab("envio")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", boxShadow: "0 6px 16px rgba(239,91,148,.3)", cursor: "pointer" }}>
                  Continuar a enviar
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "envio" && (
          <div style={{ ...cardBox, padding: 40, textAlign: "center", color: "#9aa0a8", font: "600 14px Poppins" }}>
            Paso “Enviar” — Fase B (tabla de invitados + barra de envío). Próximamente.
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitacionesStudio;
