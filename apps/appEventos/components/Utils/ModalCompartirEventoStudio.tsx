import { FC, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";

/**
 * ModalCompartirEventoStudio — modal de "Compartir evento" (pantalla Resumen), fiel a
 * Modal__Compartir_evento.html. Invitar por email + lista de personas con acceso; cada
 * persona abre un sub-panel de PERMISOS POR SECCIÓN (Sin acceso / Ver / Editar). Mismo
 * backend: addCompartitions / updateCompartitions / deleteCompartitions con permisos[{title,value}].
 */

type Perm = "none" | "view" | "edit";
const SECCIONES: { key: string; label: string }[] = [
  { key: "resumen", label: "Resumen" }, { key: "invitados", label: "Invitados" }, { key: "mesas", label: "Mesas" },
  { key: "regalos", label: "Regalos" }, { key: "presupuesto", label: "Presupuesto" }, { key: "invitaciones", label: "Invitaciones" },
  { key: "itinerario", label: "Itinerario" }, { key: "servicios", label: "Servicios" }, { key: "memories", label: "Momentos" },
];
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const IconNone = (s = 13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><circle cx="12" cy="12" r="9" /><path d="M8 8l8 8" /></svg>;
const IconView = (s = 13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>;
const IconEdit = (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;

interface Props { event: any; onClose: () => void; }

const ModalCompartirEventoStudio: FC<Props> = ({ event, onClose }) => {
  const { user, config } = AuthContextProvider() as any;
  const { setEvent } = EventContextProvider() as any;
  const { eventsGroup, setEventsGroup } = EventsGroupContextProvider() as any;
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [permTarget, setPermTarget] = useState<any>(null);      // persona con el sub-panel abierto
  const [permState, setPermState] = useState<Record<string, Perm>>({});
  useEffect(() => setMounted(true), []);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") { permTarget ? setPermTarget(null) : onClose(); } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [permTarget, onClose]);

  const evLive = useMemo(() => (Array.isArray(eventsGroup) ? eventsGroup.find((e: any) => e._id === event?._id) : null) || event, [eventsGroup, event]);
  const people: any[] = Array.isArray(evLive?.detalles_compartidos_array) ? evLive.detalles_compartidos_array : [];
  const ownerName = user?.displayName && user.displayName !== "guest" ? user.displayName : (config?.name || "Bodas");
  const link = typeof window !== "undefined" ? `${window.location.host}/?pAccShas=${String(event?._id).slice(3, 9)}${event?._id}` : "";
  const fullLink = typeof window !== "undefined" ? `${window.location.origin}/?pAccShas=${String(event?._id).slice(3, 9)}${event?._id}` : "";

  const mergeIntoGroup = (updates: any) => {
    setEventsGroup({ type: "INITIAL_STATE", payload: (eventsGroup || []).map((e: any) => e._id === event._id ? { ...e, ...updates } : e) });
    setEvent((prev: any) => (prev && prev._id === event._id ? { ...prev, ...updates } : prev));
  };

  const invitar = async () => {
    const em = email.trim().toLowerCase();
    if (!EMAIL_RE.test(em)) { toast("error", "Correo no válido"); return; }
    if (user?.email && user.email.toLowerCase() === em) { toast("error", "No puedes compartir contigo mismo"); return; }
    if (people.some((p) => (p?.email || "").toLowerCase() === em)) { toast("error", "Esa persona ya tiene acceso"); return; }
    setSaving(true);
    try {
      const r: any = await fetchApiEventos({ query: queries.addCompartitions, variables: { args: { evento_id: event._id, usuario_id: em, permisos: SECCIONES.map((s) => ({ title: s.key, value: "view" })) } } });
      const evt = r?.evento;
      if (evt) mergeIntoGroup({ compartido_array: evt.compartido_array ?? evLive?.compartido_array, detalles_compartidos_array: evt.detalles_compartidos_array ?? evLive?.detalles_compartidos_array });
      setEmail("");
      toast("success", "Invitación enviada");
    } catch (e) { console.warn("[Compartir] invitar:", (e as any)?.message ?? e); toast("error", "Ha ocurrido un error al compartir el evento"); }
    finally { setSaving(false); }
  };

  const quitar = async (p: any) => {
    mergeIntoGroup({ detalles_compartidos_array: people.filter((x) => x.uid !== p.uid), compartido_array: (evLive?.compartido_array || []).filter((id: string) => id !== p.uid) });
    try { await fetchApiEventos({ query: queries.deleteCompartitions, variables: { args: { evento_id: event._id, usuario_id: p.uid } } }); toast("success", "Acceso revocado"); }
    catch (e) { console.warn("[Compartir] revocar:", (e as any)?.message ?? e); toast("error", "Ha ocurrido un error"); }
  };

  const abrirPermisos = (p: any) => {
    const st: Record<string, Perm> = {};
    SECCIONES.forEach((s) => { const f = (p?.permissions || []).find((x: any) => x.title === s.key); st[s.key] = (f?.value as Perm) || "none"; });
    setPermState(st);
    setPermTarget(p);
  };

  const guardarPermisos = async () => {
    const p = permTarget; if (!p) return;
    const permisos = SECCIONES.map((s) => ({ title: s.key, value: permState[s.key] || "none" }));
    mergeIntoGroup({ detalles_compartidos_array: people.map((x) => x.uid === p.uid ? { ...x, permissions: permisos } : x) });
    setPermTarget(null);
    try { await fetchApiEventos({ query: queries.updateCompartitions, variables: { args: { evento_id: event._id, usuario_id: p.uid, permisos } } }); toast("success", "Permisos actualizados"); }
    catch (e) { console.warn("[Compartir] permisos:", (e as any)?.message ?? e); toast("error", "Ha ocurrido un error"); }
  };

  const copiar = () => { try { navigator.clipboard?.writeText(fullLink); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* noop */ } };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* ── Modal principal ── */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(43,43,48,.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Poppins',sans-serif" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: "100%", background: "#fff", borderRadius: 18, boxShadow: "0 30px 70px rgba(0,0,0,.3)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 22px 14px", borderBottom: "1px solid #f0f0f2" }}>
            <div style={{ font: "700 18px Poppins", color: "#3A3A42" }}>Compartir evento</div>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, color: "#a0a0a8", fontSize: 17, background: "none", border: "none", cursor: "pointer" }}>✕</button>
          </div>
          <div className="mcs-scroll" style={{ padding: "20px 22px", maxHeight: "60vh", overflow: "auto" }}>
            <div style={{ display: "flex", gap: 9, marginBottom: 20 }}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (!saving) invitar(); } }} placeholder="Correo de la persona a invitar…" style={{ flex: 1, padding: "12px 14px", borderRadius: 11, border: "1.5px solid #E7E7EA", font: "500 13px Poppins", color: "#3A3A42", outline: "none" }} />
              <button onClick={() => !saving && invitar()} disabled={saving} style={{ flex: "none", padding: "12px 18px", borderRadius: 11, background: "#EF5B94", border: "none", color: "#fff", font: "600 13px Poppins", cursor: saving ? "default" : "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)", opacity: saving ? .7 : 1 }}>Invitar</button>
            </div>
            <div style={{ font: "700 11px Poppins", color: "#b3b3ba", letterSpacing: 1, textTransform: "uppercase", marginBottom: 11 }}>Personas con acceso</div>
            {/* Propietario */}
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: 10, borderRadius: 12, background: "#faf9fb", marginBottom: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", flex: "none", background: "#EF5B94", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "700 13px Poppins" }}>{(ownerName || "?").charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0, font: "600 12.5px Poppins", color: "#3A3A42", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Tú ({ownerName})</div>
              <span style={{ flex: "none", background: "#f2f2f4", color: "#8a8a90", borderRadius: 999, padding: "6px 14px", font: "600 11.5px Poppins" }}>Propietario</span>
            </div>
            {/* Invitados */}
            {people.map((p: any, i: number) => {
              const em = p?.email || p?.displayName || p?.uid || "";
              return (
                <div key={p?.uid || i} className="mcs-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 10px", borderRadius: 12, marginBottom: 4 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", flex: "none", background: "#FCE7F0", color: "#EF5B94", display: "flex", alignItems: "center", justifyContent: "center", font: "700 13px Poppins" }}>{String(em || "?").charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0, font: "500 12.5px Poppins", color: "#3A3A42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={em}>{em}</div>
                  <button className="mcs-perm" onClick={() => abrirPermisos(p)} style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E7E7EA", background: "#fff", font: "600 11.5px Poppins", color: "#3A3A42", cursor: "pointer" }}>Permisos:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg></button>
                  <button className="mcs-x" onClick={() => quitar(p)} title="Quitar acceso" style={{ flex: "none", width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
                </div>
              );
            })}
            {/* Enlace público */}
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", borderRadius: 11, background: "#f7f7f9", border: "1px solid #f0f0f2" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={1.8}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
              <span style={{ flex: 1, font: "500 12px Poppins", color: "#8a8a90", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={link}>{link}</span>
              <button onClick={copiar} style={{ flex: "none", display: "flex", alignItems: "center", gap: 5, font: "600 12px Poppins", color: "#EF5B94", background: "none", border: "none", cursor: "pointer" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>{copied ? "¡Copiado!" : "Copiar"}</button>
            </div>
          </div>
          <div style={{ padding: "14px 22px", borderTop: "1px solid #f0f0f2", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "11px 28px", borderRadius: 11, background: "#EF5B94", border: "none", color: "#fff", font: "600 13px Poppins", cursor: "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}>Hecho</button>
          </div>
        </div>
      </div>

      {/* ── Sub-panel: permisos por sección ── */}
      {permTarget && (
        <div onClick={() => setPermTarget(null)} style={{ position: "fixed", inset: 0, background: "rgba(43,43,48,.3)", zIndex: 52, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Poppins',sans-serif" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: "100%", background: "#fff", borderRadius: 18, boxShadow: "0 30px 70px rgba(0,0,0,.3)", padding: "18px 22px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 2 }}>
              <div style={{ font: "700 13.5px Poppins", color: "#D83E7C", wordBreak: "break-all" }}>{permTarget?.email || permTarget?.displayName || permTarget?.uid}</div>
              <button onClick={() => setPermTarget(null)} style={{ width: 26, height: 26, flex: "none", borderRadius: 8, color: "#a0a0a8", fontSize: 15, background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ font: "600 12px Poppins", color: "#8a8a90", marginBottom: 10 }}>Lista de permisos por sección</div>
            <div style={{ border: "1.5px solid #E7E7EA", borderRadius: 14, padding: 4, display: "flex", flexDirection: "column" }}>
              {SECCIONES.map((s) => (
                <div key={s.key} className="mcs-secrow" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "4px 10px", borderRadius: 10 }}>
                  <span style={{ font: "500 12.5px Poppins", color: "#3A3A42" }}>{s.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {(["none", "view", "edit"] as Perm[]).map((v) => {
                      const on = (permState[s.key] || "none") === v;
                      return (
                        <button key={v} onClick={() => setPermState((st) => ({ ...st, [s.key]: v }))} title={v === "none" ? "Sin acceso" : v === "view" ? "Ver" : "Editar"} style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", background: on ? "#FCE7F0" : "#f7f7f9", color: on ? "#EF5B94" : "#c9c9cf" }}>{v === "none" ? IconNone() : v === "view" ? IconView() : IconEdit()}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, font: "500 10.5px Poppins", color: "#a0a0a8" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{IconNone(11)}Sin acceso</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{IconView(11)}Ver</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{IconEdit(10)}Editar</span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={guardarPermisos} style={{ padding: "10px 24px", borderRadius: 11, background: "#EF5B94", border: "none", color: "#fff", font: "600 13px Poppins", cursor: "pointer", boxShadow: "0 6px 16px rgba(239,91,148,.3)" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: ".mcs-row:hover{background:#faf9fb;}.mcs-perm:hover{border-color:#EF5B94 !important;color:#D83E7C !important;}.mcs-x:hover{background:#FBE4EF !important;color:#D83E7C !important;}.mcs-secrow:hover{background:#faf9fb;}.mcs-scroll{scrollbar-width:none;}.mcs-scroll::-webkit-scrollbar{width:0;height:0;display:none;}" }} />
    </>,
    document.body
  );
};

export default ModalCompartirEventoStudio;
