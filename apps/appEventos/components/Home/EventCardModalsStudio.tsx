import { FC, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";

/**
 * Modales studio de la tarjeta de evento (Mis eventos), fieles a modalestarjetaevento.html.
 * Reemplazan los alert()/confirm() nativos y el modal antiguo de compartir. Mismo backend.
 */

/* ─────────────── 1 y 2) Confirmación (Archivar / Borrar) ─────────────── */
interface ConfirmProps {
  variant: "archivar" | "borrar";
  nombre?: string;
  onCancel: () => void;
  onConfirm: () => void;
}
export const ModalConfirmEvento: FC<ConfirmProps> = ({ variant, nombre, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || typeof document === "undefined") return null;

  const esBorrar = variant === "borrar";
  const icon = esBorrar
    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg>
    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="5" rx="1.5" /><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4" /></svg>;

  return createPortal(
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(40,40,46,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Poppins',sans-serif" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: "92vw", background: "#fff", borderRadius: 20, boxShadow: "0 30px 80px rgba(0,0,0,.3)", padding: "28px 28px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <span style={{ width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, background: esBorrar ? "#FBE3ED" : "#FCE7F0", color: esBorrar ? "#D83E7C" : "#EF5B94" }}>{icon}</span>
        <div style={{ font: "700 15.5px Poppins", color: "#3A3A42", marginBottom: 8 }}>{esBorrar ? t("¿Borrar", { defaultValue: "¿Borrar" }) : t("¿Archivar", { defaultValue: "¿Archivar" })} &quot;{nombre}&quot;?</div>
        <div style={{ font: "400 12.5px/1.6 Poppins", color: "#8a8a90", marginBottom: 20 }}>
          {esBorrar
            ? <>{t("Es", { defaultValue: "Es" })} <span style={{ color: "#D83E7C", fontWeight: 600 }}>{t("definitivo", { defaultValue: "definitivo" })}</span> {t("y no se podrá recuperar.", { defaultValue: "y no se podrá recuperar." })}</>
            : <>{t("Se moverá a", { defaultValue: "Se moverá a" })} <span style={{ color: "#EF5B94", fontWeight: 600 }}>{t("Archivados", { defaultValue: "Archivados" })}</span> {t("y podrás recuperarlo en cualquier momento.", { defaultValue: "y podrás recuperarlo en cualquier momento." })}</>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 12, background: "#fff", border: "1.5px solid #E7E7EA", color: "#3A3A42", font: "600 13px Poppins", cursor: "pointer" }}>{t("Cancelar")}</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", color: "#fff", font: "600 13px Poppins", cursor: "pointer", background: esBorrar ? "#D83E7C" : "#EF5B94", boxShadow: esBorrar ? "0 5px 14px rgba(216,62,124,.3)" : "0 5px 14px rgba(239,91,148,.28)" }}>{esBorrar ? t("Borrar") : t("Archivar", { defaultValue: "Archivar" })}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ─────────────── 3) Compartir evento ─────────────── */
const DataModulos = ["resumen", "invitados", "mesas", "regalos", "presupuesto", "invitaciones", "itinerario", "servicios", "memories"];
const permisosFor = (level: "Editor" | "Lector") => DataModulos.map((title) => ({ title, value: level === "Editor" ? "edit" : "view" }));
const levelOf = (permissions: any): "Editor" | "Lector" => (Array.isArray(permissions) && permissions.some((p: any) => p?.value === "edit")) ? "Editor" : "Lector";
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

interface ShareProps { event: any; onClose: () => void; }
export const ModalCompartirEvento: FC<ShareProps> = ({ event, onClose }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { user, config } = AuthContextProvider() as any;
  const { setEvent } = EventContextProvider() as any;
  const { eventsGroup, setEventsGroup } = EventsGroupContextProvider() as any;
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => setMounted(true), []);

  // Lista viva desde eventsGroup (se re-renderiza tras invitar/cambiar/revocar).
  const evLive = useMemo(() => (Array.isArray(eventsGroup) ? eventsGroup.find((e: any) => e._id === event?._id) : null) || event, [eventsGroup, event]);
  const people: any[] = Array.isArray(evLive?.detalles_compartidos_array) ? evLive.detalles_compartidos_array : [];

  const link = typeof window !== "undefined" ? `${window.location.host}/?pAccShas=${String(event?._id).slice(3, 9)}${event?._id}` : "";
  const fullLink = typeof window !== "undefined" ? `${window.location.origin}/?pAccShas=${String(event?._id).slice(3, 9)}${event?._id}` : "";

  const mergeIntoGroup = (updates: any) => {
    setEventsGroup({ type: "INITIAL_STATE", payload: (eventsGroup || []).map((e: any) => e._id === event._id ? { ...e, ...updates } : e) });
    setEvent((prev: any) => (prev && prev._id === event._id ? { ...prev, ...updates } : prev));
  };

  const invitar = async () => {
    const em = email.trim().toLowerCase();
    if (!EMAIL_RE.test(em)) { toast("error", t("Correo no válido", { defaultValue: "Correo no válido" })); return; }
    if (user?.email && user.email.toLowerCase() === em) { toast("error", t("No puedes compartir contigo mismo", { defaultValue: "No puedes compartir contigo mismo" })); return; }
    if (people.some((p) => (p?.email || "").toLowerCase() === em)) { toast("error", t("Esa persona ya tiene acceso", { defaultValue: "Esa persona ya tiene acceso" })); return; }
    setSaving(true);
    try {
      const r: any = await fetchApiEventos({ query: queries.addCompartitions, variables: { args: { evento_id: event._id, usuario_id: em, permisos: permisosFor("Lector") } } });
      const evt = r?.evento;
      if (evt) mergeIntoGroup({ compartido_array: evt.compartido_array ?? evLive?.compartido_array, detalles_compartidos_array: evt.detalles_compartidos_array ?? evLive?.detalles_compartidos_array });
      setEmail("");
      toast("success", t("Invitación enviada", { defaultValue: "Invitación enviada" }));
    } catch (e) {
      console.warn("[Compartir] invitar falló:", (e as any)?.message ?? e);
      toast("error", t("Ha ocurrido un error al compartir el evento"));
    } finally { setSaving(false); }
  };

  const cambiarPermiso = async (p: any, level: "Editor" | "Lector") => {
    const permisos = permisosFor(level);
    // Optimista
    mergeIntoGroup({ detalles_compartidos_array: people.map((x) => x.uid === p.uid ? { ...x, permissions: permisos } : x) });
    try {
      await fetchApiEventos({ query: queries.updateCompartitions, variables: { args: { evento_id: event._id, usuario_id: p.uid, permisos } } });
    } catch (e) {
      console.warn("[Compartir] cambiar permiso falló:", (e as any)?.message ?? e);
      toast("error", t("Ha ocurrido un error"));
    }
  };

  const revocar = async (p: any) => {
    mergeIntoGroup({
      detalles_compartidos_array: people.filter((x) => x.uid !== p.uid),
      compartido_array: (evLive?.compartido_array || []).filter((id: string) => id !== p.uid),
    });
    try {
      await fetchApiEventos({ query: queries.deleteCompartitions, variables: { args: { evento_id: event._id, usuario_id: p.uid } } });
      toast("success", t("Acceso revocado", { defaultValue: "Acceso revocado" }));
    } catch (e) {
      console.warn("[Compartir] revocar falló:", (e as any)?.message ?? e);
      toast("error", t("Ha ocurrido un error"));
    }
  };

  const copiar = () => {
    try { navigator.clipboard?.writeText(fullLink); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* noop */ }
  };

  if (!mounted || typeof document === "undefined") return null;

  const ownerName = user?.displayName && user.displayName !== "guest" ? user.displayName : (config?.name || "Bodas de Hoy");
  const inputSt: any = { flex: 1, border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "11px 14px", font: "400 12.5px Poppins", color: "#3A3A42", outline: "none" };

  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(40,40,46,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Poppins',sans-serif" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 440, maxWidth: "94vw", maxHeight: "90vh", background: "#fff", borderRadius: 20, boxShadow: "0 30px 80px rgba(0,0,0,.3)", display: "flex", flexDirection: "column" }}>
        {/* Cabecera */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "20px 26px 14px", borderBottom: "1px solid #f0f0f2" }}>
          <div>
            <div style={{ font: "700 17px Poppins", color: "#3A3A42" }}>{t("Compartir evento", { defaultValue: "Compartir evento" })}</div>
            <div style={{ font: "400 12px Poppins", color: "#a0a0a8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>{event?.nombre}</div>
          </div>
          <button onClick={onClose} className="msc-x" style={{ width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8a90", cursor: "pointer", border: "none", background: "none", flex: "none" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: "18px 26px", display: "flex", flexDirection: "column", gap: 16, overflow: "auto" }}>
          {/* Invitar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (!saving) invitar(); } }} placeholder={t("Correo de la persona a invitar…", { defaultValue: "Correo de la persona a invitar…" }) as string} style={inputSt} />
            <button onClick={() => !saving && invitar()} disabled={saving} style={{ padding: "11px 18px", borderRadius: 10, background: "#EF5B94", color: "#fff", font: "600 12.5px Poppins", border: "none", cursor: saving ? "default" : "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(239,91,148,.25)", opacity: saving ? 0.7 : 1 }}>{t("Invitar", { defaultValue: "Invitar" })}</button>
          </div>

          {/* Personas con acceso */}
          <div>
            <div style={{ font: "600 12.5px Poppins", color: "#a0a0a8", marginBottom: 8 }}>{t("Personas con acceso", { defaultValue: "Personas con acceso" })}</div>
            {/* Propietario */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: "#fafafa" }}>
              <span style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", font: "700 12px Poppins", flex: "none", background: "#EF5B94", color: "#fff" }}>{(ownerName || "?").charAt(0).toUpperCase()}</span>
              <span style={{ font: "500 12.5px Poppins", color: "#3A3A42", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t("Tú", { defaultValue: "Tú" })} ({ownerName})</span>
              <span style={{ font: "600 11px Poppins", color: "#8a8a90", background: "#f0f0f2", padding: "4px 11px", borderRadius: 11, whiteSpace: "nowrap" }}>{t("Propietario", { defaultValue: "Propietario" })}</span>
            </div>
            {/* Invitados */}
            {people.map((p: any, i: number) => {
              const em = p?.email || p?.displayName || p?.uid || "";
              const level = levelOf(p?.permissions);
              return (
                <div key={p?.uid || i} className="msc-persona" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10 }}>
                  <span style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", font: "700 12px Poppins", flex: "none", background: "#F9CFE1", color: "#D83E7C" }}>{String(em || "?").charAt(0).toUpperCase()}</span>
                  <span style={{ font: "500 12.5px Poppins", color: "#3A3A42", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={em}>{em}</span>
                  <select value={level} onChange={(e) => cambiarPermiso(p, e.target.value as "Editor" | "Lector")} style={{ border: "1.5px solid #E7E7EA", borderRadius: 9, padding: "6px 10px", font: "500 12px Poppins", color: "#3A3A42", outline: "none", background: "#fff", cursor: "pointer" }}>
                    <option value="Editor">{t("Editor", { defaultValue: "Editor" })}</option>
                    <option value="Lector">{t("Lector", { defaultValue: "Lector" })}</option>
                  </select>
                  <button className="msc-quitar" title={t("Revocar acceso", { defaultValue: "Revocar acceso" }) as string} onClick={() => revocar(p)} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8a90", cursor: "pointer", border: "none", background: "none", flex: "none" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
                </div>
              );
            })}
          </div>

          {/* Enlace del evento */}
          <div>
            <div style={{ font: "600 12.5px Poppins", color: "#a0a0a8", marginBottom: 8 }}>{t("Enlace del evento", { defaultValue: "Enlace del evento" })}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input readOnly value={link} style={{ flex: 1, border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "10px 13px", font: "400 12px Poppins", color: "#6b6b72", outline: "none", background: "#fafafa" }} />
              <button className="msc-copiar" onClick={copiar} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 15px", borderRadius: 10, background: "#fff", border: "1.5px solid #E7E7EA", color: "#EF5B94", font: "600 12px Poppins", cursor: "pointer", whiteSpace: "nowrap" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                <span>{copied ? t("¡Copiado!", { defaultValue: "¡Copiado!" }) : t("Copiar", { defaultValue: "Copiar" })}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 26px 18px", borderTop: "1px solid #f0f0f2" }}>
          <button onClick={onClose} style={{ padding: "11px 26px", borderRadius: 11, background: "#EF5B94", color: "#fff", font: "600 13px Poppins", border: "none", cursor: "pointer", boxShadow: "0 5px 14px rgba(239,91,148,.28)" }}>{t("Hecho", { defaultValue: "Hecho" })}</button>
        </div>
        <style dangerouslySetInnerHTML={{ __html: ".msc-x:hover{background:#f5f5f7;}.msc-persona:hover{background:#fdf7fa;}.msc-quitar:hover{background:#FBE3ED;color:#D83E7C;}.msc-copiar:hover{border-color:#EF5B94;}" }} />
      </div>
    </div>,
    document.body
  );
};
