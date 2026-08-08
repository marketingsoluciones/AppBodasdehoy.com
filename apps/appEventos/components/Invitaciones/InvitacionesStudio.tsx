import { FC, useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useTranslation } from "react-i18next";
import BlockTitle from "../Utils/BlockTitle";
import { subir_archivo } from "./ModuloSubida";
import { EventContextProvider } from "../../context/EventContext";
import { AuthContextProvider } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { fetchApiEventos, queries } from "../../utils/Fetching";

/**
 * InvitacionesStudio — Rediseño UI del módulo de Invitaciones (wizard 2 pasos).
 *
 * FASE A: paso "Diseñar invitación". Réplica del HTML "Invitaciones estudio" (paleta
 * rosa #EF5B94 / Poppins). MISMO BACKEND: el diseñador estructurado persiste vía las
 * operaciones existentes `updateEmailTemplate`/`createEmailTemplate` (design + html),
 * SIN tocar Fetching.ts ni las 16 operaciones. `design` guarda nuestro JSON estructurado
 * (esquema `DesignData` con marca `_studio:'v1'`); `html` = email renderizado.
 * Plantillas antiguas (Unlayer) siguen enviándose; simplemente no se abren aquí (esquema
 * distinto) → se cae a valores por defecto del evento.
 *
 * El paso "Enviar" (Fase B) queda como placeholder en este primer corte.
 */

// ---- Tipos y presets --------------------------------------------------------
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

const PINK = "#EF5B94";
const PINK_HOVER = "#D83E7C";
const INK = "#3A3A42";
const BORDER = "#E7E7EA";

// Gradientes de plantilla EXACTOS del HTML "Invitaciones estudio"
const PRESETS: Record<TemplateKey, { label: string; grad: string }> = {
  elegante: { label: "Elegante", grad: "linear-gradient(135deg,#f7c2da,#EF5B94)" },
  clasica: { label: "Clásica", grad: "linear-gradient(135deg,#ece4d6,#dccdb4)" },
  moderna: { label: "Moderna", grad: "linear-gradient(135deg,#dfe6ec,#b9cbdb)" },
};

// Tipografías del diseño: Elegante=Playfair · Moderna=Poppins · Script=Dancing Script
const FONTS: Record<FontKey, { label: string; family: string }> = {
  elegante: { label: "Elegante", family: "'Playfair Display',serif" },
  moderna: { label: "Moderna", family: "'Poppins',sans-serif" },
  script: { label: "Script", family: "'Dancing Script',cursive" },
};

// Paleta "Color de acento" (tonos suaves): rosa · crema · oliva · azul acero · oro
const ACCENTS = ["#C99AA6", "#E8DEC5", "#8DA07A", "#6E8BAA", "#C9A24B"];

const TEXT_FIELDS: { key: keyof DesignData; label: string; area?: boolean }[] = [
  { key: "title", label: "Encabezado" },
  { key: "names", label: "Nombres" },
  { key: "date", label: "Fecha" },
  { key: "message", label: "Mensaje", area: true },
  { key: "venue", label: "Lugar (reverso)" },
  { key: "time", label: "Hora" },
  { key: "rsvp", label: "RSVP" },
];

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
  venue: event?.poblacion || "",
  time: "",
  rsvp: "Confirma tu asistencia",
});

// ---- Render del email (html que se persiste) --------------------------------
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
      <a href="#" style="display:inline-block;margin-top:20px;background:${d.accent};color:#fff;text-decoration:none;font-weight:600;font-size:13px;padding:11px 22px;border-radius:10px;">Ver invitación y confirmar</a>
    </div>
  </div></body></html>`;
};

// ---- Componente -------------------------------------------------------------
export const InvitacionesStudio: FC = () => {
  const { t } = useTranslation();
  const { event } = EventContextProvider() as any;
  const auth = AuthContextProvider() as any;
  const toast = useToast();

  const [tab, setTab] = useState<"diseno" | "envio">("diseno");
  const [channel, setChannel] = useState<ChannelKey>("email");
  const [face, setFace] = useState<"front" | "back">("front");
  const [design, setDesign] = useState<DesignData>(() => defaultDesign(event));
  const [templateId, setTemplateId] = useState<string | undefined>(event?.templateEmailSelect);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("saved");
  const [showOnb, setShowOnb] = useState(true);
  const [coverLocal, setCoverLocal] = useState<string>("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Carga del diseño actual (si la plantilla es de nuestro esquema estructurado)
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
      .catch(() => {/* plantilla antigua/no legible → defaults */});
  }, [event?._id, event?.templateEmailSelect]);

  // Autosave (debounce) — MISMO backend: updateEmailTemplate / createEmailTemplate
  const persist = useCallback((d: DesignData) => {
    if (!event?._id) return;
    setSaveState("saving");
    const html = renderEmailHtml(d);
    const done = (id?: string) => { if (id) setTemplateId(id); setSaveState("saved"); };
    if (templateId) {
      fetchApiEventos({ query: queries.updateEmailTemplate, variables: { evento_id: event._id, template_id: templateId, design: d, html } })
        .then((res: any) => done(Array.isArray(res) ? res[0]?._id : res?._id))
        .catch(() => setSaveState("idle"));
    } else {
      fetchApiEventos({
        query: queries.createEmailTemplate,
        variables: {
          evento_id: event._id, design: d, html,
          configTemplate: { name: "Invitación", subject: d.title || "Invitación" },
          domain: auth?.config?.dominio || auth?.config?.domain,
        },
      }).then((res: any) => done(res?._id)).catch(() => setSaveState("idle"));
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

  // Subida de la foto de portada — MISMO backend (singleUpload → R2, subir_archivo reutilizado)
  const handleCoverFile = useCallback(async (file?: File | null) => {
    if (!file || !event?._id) return;
    setCoverLocal(URL.createObjectURL(file)); // preview inmediato mientras sube
    setUploadingCover(true);
    try {
      const r: any = await subir_archivo({ imagePreviewUrl: { file }, event, use: "portada" });
      const url = r?.i1024 || r?.i800 || r?.i640;
      if (url) update({ cover: url });
      else toast("error", "No se pudo subir la imagen");
    } catch {
      toast("error", "No se pudo subir la imagen");
    } finally {
      setUploadingCover(false);
    }
  }, [event, update, toast]);

  const preset = PRESETS[design.template];
  const invFont = FONTS[design.font].family;

  // ---- estilos reutilizables ----
  const card: React.CSSProperties = { background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, boxShadow: "0 4px 14px rgba(0,0,0,.05)" };
  const label: React.CSSProperties = { font: "600 12px Poppins", color: PINK, marginBottom: 6, display: "block" };
  const input: React.CSSProperties = { width: "100%", border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: "11px 14px", font: "500 13px Poppins", color: INK, outline: "none", background: "#fff" };

  return (
    <div style={{ background: "#f1f1f4", minHeight: "100%", fontFamily: "'Poppins',sans-serif" }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Playfair+Display:wght@500;600;700&family=Dancing+Script:wght@600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "22px 30px 60px" }}>

        {/* Cabecera ESTÁNDAR compartida (misma que presupuesto/mesas/invitados) */}
        <div style={{ marginBottom: 20 }}>
          <BlockTitle title={"Invitaciones"} />
        </div>

        {/* Tabs 1 Diseñar / 2 Enviar */}
        <div style={{ display: "inline-flex", gap: 6, ...card, borderRadius: 14, padding: 6, marginBottom: 24 }}>
          {([["diseno", "1", "Diseñar invitación"], ["envio", "2", "Enviar"]] as const).map(([key, num, txt]) => {
            const active = tab === key;
            return (
              <div key={key} onClick={() => setTab(key)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 22px", borderRadius: 10, background: active ? PINK : "transparent", color: active ? "#fff" : "#6b6b72", font: `${active ? 700 : 600} 14px Poppins`, cursor: "pointer" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", background: active ? "rgba(255,255,255,.25)" : "#EDEDF0", color: active ? "#fff" : "#9aa0a8", font: "700 11px Poppins" }}>{num}</span>
                {txt}
              </div>
            );
          })}
        </div>

        {/* Onboarding */}
        {showOnb && (
          <div style={{ display: "flex", marginBottom: 16 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FCE7F0", borderRadius: 999, padding: "10px 18px" }}>
              <span style={{ font: "700 14px Poppins", color: "#B23A6B" }}>ⓘ</span>
              <span style={{ font: "600 13px Poppins", color: "#B23A6B" }}>Diseña tu invitación y envíala por email, WhatsApp o SMS.</span>
              <div onClick={() => setShowOnb(false)} style={{ cursor: "pointer", color: "#B23A6B", marginLeft: 4 }}>✕</div>
            </div>
          </div>
        )}

        {/* PASO DISEÑAR */}
        {tab === "diseno" && (
          <div style={{ animation: "fadein .2s ease", display: "grid", gridTemplateColumns: "380px 1fr", gap: 22, alignItems: "start" }}>

            {/* Vista previa (sticky) */}
            <div style={{ position: "sticky", top: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ font: "700 10.5px Poppins", color: "#a0a0a8", letterSpacing: ".8px", textTransform: "uppercase" }}>Vista previa</div>
                  {saveState === "saved" && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, font: "600 10px Poppins", color: "#2FB37E", background: "#E4F5EE", padding: "3px 8px", borderRadius: 10 }}>✓ Guardado</span>}
                  {saveState === "saving" && <span style={{ font: "600 10px Poppins", color: "#a0a0a8", background: "#f0f0f2", padding: "3px 8px", borderRadius: 10 }}>Guardando…</span>}
                </div>
                <div style={{ display: "flex", gap: 3, background: "#ececed", borderRadius: 9, padding: 3 }}>
                  {(["email", "whatsapp", "sms"] as ChannelKey[]).map((c) => (
                    <div key={c} onClick={() => setChannel(c)} title={c} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 26, borderRadius: 7, background: channel === c ? "#fff" : "transparent", color: channel === c ? PINK : "#9aa0a8", cursor: "pointer", boxShadow: channel === c ? "0 1px 4px rgba(0,0,0,.12)" : "none", font: "600 10px Poppins", textTransform: "uppercase" }}>{c === "email" ? "✉" : c === "whatsapp" ? "💬" : "▤"}</div>
                  ))}
                </div>
              </div>

              {channel === "email" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ display: "flex", gap: 3, background: "#ececed", borderRadius: 9, padding: 3 }}>
                      {(["front", "back"] as const).map((f) => (
                        <div key={f} onClick={() => setFace(f)} style={{ padding: "6px 13px", borderRadius: 7, background: face === f ? "#fff" : "transparent", color: face === f ? INK : "#9aa0a8", font: "600 11px Poppins", cursor: "pointer" }}>{f === "front" ? "Portada" : "Detalles"}</div>
                      ))}
                    </div>
                  </div>
                  <div style={{ width: "100%", background: "#fff", borderRadius: 18, boxShadow: "0 12px 34px rgba(0,0,0,.12)", overflow: "hidden", border: "1px solid #f0f0f2" }}>
                    <div
                      onClick={() => coverInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); handleCoverFile(e.dataTransfer.files?.[0]); }}
                      style={{ height: 190, background: (design.cover || coverLocal) ? `url(${design.cover || coverLocal}) center/cover` : preset.grad, borderBottom: `3px solid ${design.accent}`, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.92)", font: "600 12px Poppins", flexDirection: "column", gap: 4, cursor: "pointer", position: "relative" }}
                    >
                      {!(design.cover || coverLocal) && (<><span style={{ fontSize: 26 }}>🖼</span>Arrastra la foto de portada<span style={{ fontSize: 10, opacity: .85, textDecoration: "underline" }}>o haz clic para subir</span></>)}
                      {uploadingCover && (<span style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", font: "600 12px Poppins" }}>Subiendo…</span>)}
                      <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => handleCoverFile(e.target.files?.[0])} style={{ display: "none" }} />
                    </div>
                    {face === "front" ? (
                      <div style={{ padding: "26px 26px 30px", textAlign: "center" }}>
                        <div style={{ fontFamily: invFont, fontWeight: 700, fontSize: 15, color: design.accent, letterSpacing: 3 }}>{design.title}</div>
                        <div style={{ height: 1, background: design.accent, opacity: .4, margin: "14px 34px" }} />
                        <div style={{ fontFamily: invFont, fontWeight: 700, fontSize: 26, color: INK }}>{design.names}</div>
                        <div style={{ font: "600 12px Poppins", color: design.accent, marginTop: 8, letterSpacing: ".5px" }}>{design.date}</div>
                        <div style={{ fontFamily: invFont, fontSize: 13.5, color: "#8a8a90", marginTop: 14, lineHeight: 1.6 }}>{design.message}</div>
                      </div>
                    ) : (
                      <div style={{ padding: "28px 26px 32px", textAlign: "center" }}>
                        <div style={{ fontFamily: invFont, fontWeight: 700, fontSize: 14, color: design.accent, letterSpacing: 2 }}>DETALLES</div>
                        <div style={{ height: 1, background: design.accent, opacity: .4, margin: "14px 34px" }} />
                        <div style={{ font: "600 11px Poppins", color: "#a0a0a8" }}>Lugar</div>
                        <div style={{ fontFamily: invFont, fontSize: 16, color: INK }}>{design.venue || "—"}</div>
                        <div style={{ font: "600 11px Poppins", color: "#a0a0a8", marginTop: 12 }}>Hora</div>
                        <div style={{ fontFamily: invFont, fontSize: 16, color: INK }}>{design.time || "—"}</div>
                        <div style={{ font: "600 12px Poppins", color: design.accent, marginTop: 14 }}>{design.rsvp}</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {channel === "whatsapp" && (
                <div style={{ ...card, padding: 18 }}>
                  <div style={{ font: "700 13px Poppins", color: INK }}>{design.names} · ¡Nos casamos!</div>
                  <div style={{ font: "500 12.5px Poppins", color: "#6b6b72", marginTop: 8, lineHeight: 1.6 }}>{design.message} 📅 {design.date}</div>
                  <div style={{ color: PINK, font: "600 12.5px Poppins", marginTop: 10 }}>Ver invitación y confirmar →</div>
                  <div style={{ font: "500 10px Poppins", color: "#a0a0a8", marginTop: 12 }}>Mensaje con imagen, texto corto y enlace a la invitación.</div>
                </div>
              )}

              {channel === "sms" && (
                <div style={{ ...card, padding: 18 }}>
                  <div style={{ font: "500 13px Poppins", color: INK, lineHeight: 1.6 }}>{design.names}: {design.message} {design.date}. Confirma: bod.as/xxxx</div>
                  <div style={{ font: "500 10px Poppins", color: "#a0a0a8", marginTop: 12 }}>Solo texto y enlace, sin imagen.</div>
                </div>
              )}
            </div>

            {/* Controles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {/* Plantilla */}
              <div style={{ ...card, padding: 20 }}>
                <div style={{ font: "700 14px Poppins", color: INK, marginBottom: 14 }}>Plantilla</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {(Object.keys(PRESETS) as TemplateKey[]).map((k) => {
                    const sel = design.template === k;
                    return (
                      <div key={k} onClick={() => update({ template: k })} style={{ border: `2px solid ${sel ? PINK : "#f0f0f2"}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", background: "#fff" }}>
                        <div style={{ height: 70, background: PRESETS[k].grad }} />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px" }}>
                          <span style={{ font: "600 12px Poppins", color: INK }}>{PRESETS[k].label}</span>
                          <span style={{ width: 16, height: 16, borderRadius: "50%", background: PINK, color: "#fff", font: "700 10px Poppins", display: "flex", alignItems: "center", justifyContent: "center" }}>{sel ? "✓" : ""}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tipografía */}
              <div style={{ ...card, padding: 20 }}>
                <div style={{ font: "700 14px Poppins", color: INK, marginBottom: 14 }}>Tipografía</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {(Object.keys(FONTS) as FontKey[]).map((f) => {
                    const sel = design.font === f;
                    return (
                      <div key={f} onClick={() => update({ font: f })} style={{ flex: 1, textAlign: "center", border: `1.5px solid ${sel ? PINK : BORDER}`, borderRadius: 10, padding: "10px 6px", cursor: "pointer", background: sel ? "#FDF2F7" : "#fff" }}>
                        <div style={{ fontFamily: FONTS[f].family, fontSize: 20, color: INK }}>Aa</div>
                        <div style={{ font: "600 10.5px Poppins", color: sel ? PINK : "#9aa0a8", marginTop: 4 }}>{FONTS[f].label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Textos */}
              <div style={{ ...card, padding: 20 }}>
                <div style={{ font: "700 14px Poppins", color: INK, marginBottom: 14 }}>Textos</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {TEXT_FIELDS.map((f) => (
                    <div key={f.key}>
                      <label style={label}>{f.label}</label>
                      {f.area ? (
                        <textarea value={(design[f.key] as string) || ""} onChange={(e) => update({ [f.key]: e.target.value } as any)} rows={3} style={{ ...input, resize: "vertical" }} />
                      ) : (
                        <input value={(design[f.key] as string) || ""} onChange={(e) => update({ [f.key]: e.target.value } as any)} style={input} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Color de acento */}
              <div style={{ ...card, padding: 20 }}>
                <div style={{ font: "700 14px Poppins", color: INK, marginBottom: 14 }}>Color de acento</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {ACCENTS.map((c) => (
                    <div key={c} onClick={() => update({ accent: c })} style={{ width: 30, height: 30, borderRadius: "50%", background: c, cursor: "pointer", border: design.accent === c ? "3px solid #fff" : "3px solid transparent", boxShadow: design.accent === c ? `0 0 0 2px ${c}` : "0 1px 4px rgba(0,0,0,.12)" }} />
                  ))}
                </div>
              </div>

              {/* Continuar */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button onClick={() => setTab("envio")} style={{ background: PINK, color: "#fff", font: "600 13px Poppins", padding: "12px 24px", borderRadius: 10, boxShadow: "0 4px 12px rgba(239,91,148,.35)" }}
                  onMouseOver={(e) => (e.currentTarget.style.background = PINK_HOVER)} onMouseOut={(e) => (e.currentTarget.style.background = PINK)}>
                  Continuar a enviar →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO ENVIAR (Fase B — placeholder) */}
        {tab === "envio" && (
          <div style={{ ...card, padding: 40, textAlign: "center", color: "#9aa0a8", font: "600 14px Poppins" }}>
            Paso “Enviar” — Fase B (tabla de invitados + barra de envío). Próximamente.
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitacionesStudio;
