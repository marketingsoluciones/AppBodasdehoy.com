import { FC, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import ClickAwayListener from "react-click-away-listener";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { estimate } from "../../utils/Interfaces";

interface Props {
  onClose: () => void;
}

/**
 * Modal studio "Importar presupuesto" — copia el presupuesto de OTRO evento del
 * usuario a este (mismo backend: duplicatePresupuesto). Fiel a
 * Modal__Importar_presupuesto.html. No borra nada de lo actual (aditivo).
 */
const ModalImportarStudio: FC<Props> = ({ onClose }) => {
  const { t } = useTranslation();
  const { config, user } = AuthContextProvider();
  const { eventsGroup } = EventsGroupContextProvider();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Eventos del usuario con permiso, excluyendo el actual (mismo filtro legacy).
  const options = (eventsGroup || []).filter((el: any) =>
    (el?.usuario_id === user?.uid ||
      el?.permissions?.some((p: any) => p.title === "servicios" && p.value === "edit")) &&
    el?._id !== event?._id
  );

  const handleImport = async () => {
    if (!sel?._id || saving) return;
    setSaving(true);
    try {
      const result: any = await fetchApiEventos({
        query: queries.duplicatePresupuesto,
        variables: { evento_id: sel._id, nuevo_evento_id: event._id },
        domain: config.domain,
      });
      if (result?.evento?.presupuesto_objeto) {
        setEvent((prev: any) => ({ ...prev, presupuesto_objeto: result.evento.presupuesto_objeto as estimate }));
      }
      toast("success", t("successful"));
      onClose();
    } catch (e: any) {
      console.warn("[ModalImportarStudio] duplicatePresupuesto falló:", e?.message ?? e);
      toast("error", t("Error al importar", { defaultValue: "Error al importar" }));
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,30,40,.38)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20, fontFamily: "'Poppins',sans-serif" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 20px 50px rgba(0,0,0,.2)", width: "min(520px,92vw)", padding: "24px 26px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ font: "700 17px Poppins", color: "#3A3A42" }}>{t("Importar presupuesto", { defaultValue: "Importar presupuesto" })}</div>
          <button onClick={onClose} title={t("Cerrar", { defaultValue: "Cerrar" })} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ font: "400 12.5px Poppins", color: "#6b6b72", marginBottom: 18 }}>{t("Copia el presupuesto de otro de tus eventos a este.", { defaultValue: "Copia el presupuesto de otro de tus eventos a este." })}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* DESDE */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ font: "600 11px Poppins", color: "#8a8a90", textTransform: "uppercase", letterSpacing: ".4px" }}>{t("from", { defaultValue: "Desde" })}</label>
            <ClickAwayListener onClickAway={() => setOpen(false)}>
              <div style={{ position: "relative" }}>
                <div onClick={() => setOpen((v) => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, border: "1.5px solid #E7E7EA", borderRadius: 12, padding: "11px 14px", font: "500 13px Poppins", color: sel ? "#3A3A42" : "#a0a0a8", cursor: "pointer", background: "#fff" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sel ? sel.nombre : t("Selecciona un evento…", { defaultValue: "Selecciona un evento…" })}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a0a0a8" strokeWidth={2.2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                </div>
                {open && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 2, border: "1.5px solid #E7E7EA", borderRadius: 12, overflow: "hidden", background: "#fff", zIndex: 5, maxHeight: 220, overflowY: "auto", boxShadow: "0 12px 32px rgba(0,0,0,.12)" }}>
                    {options.length === 0 && <div style={{ padding: "12px 14px", font: "500 13px Poppins", color: "#a0a0a8" }}>{t("No hay otros eventos", { defaultValue: "No hay otros eventos" })}</div>}
                    {options.map((ev: any) => (
                      <div key={ev._id} className="imp-opt-studio" onClick={() => { setSel(ev); setOpen(false); }} style={{ padding: "10px 14px", font: "500 13px Poppins", color: "#3A3A42", cursor: "pointer", borderBottom: "1px solid #f2f2f4" }}>{ev.nombre}</div>
                    ))}
                  </div>
                )}
              </div>
            </ClickAwayListener>
          </div>

          {/* flecha */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#c9c9cf" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
          </div>

          {/* IMPORTAR EN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ font: "600 11px Poppins", color: "#8a8a90", textTransform: "uppercase", letterSpacing: ".4px" }}>{t("importInto", { defaultValue: "Importar en" })}</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #E7E7EA", borderRadius: 12, padding: "11px 14px", font: "600 13px Poppins", color: "#3A3A42", background: "#faf9fb" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event?.nombre}</span>
              <span style={{ display: "inline-flex", flex: "none", background: "#FCE7F0", color: "#D83E7C", borderRadius: 999, padding: "3px 10px", font: "600 10px Poppins", textTransform: "uppercase", letterSpacing: ".4px" }}>{t("Este evento", { defaultValue: "Este evento" })}</span>
            </div>
          </div>

          {/* aviso */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FBF0DA", borderRadius: 999, padding: "9px 16px", font: "500 12px Poppins", color: "#B4801F" }}>{t("Se añadirán las categorías y partidas del evento elegido; no se borra nada de lo actual.", { defaultValue: "Se añadirán las categorías y partidas del evento elegido; no se borra nada de lo actual." })}</div>
        </div>

        {/* acciones */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 12, background: "#fff", border: "1.5px solid #E7E7EA", color: "#6b6b72", font: "600 12.5px Poppins", cursor: "pointer" }}>{t("cancel", "Cancelar")}</button>
          <button onClick={handleImport} disabled={!sel || saving} style={{ padding: "10px 20px", borderRadius: 12, background: sel ? "#EF5B94" : "#F5A8C7", border: "none", color: "#fff", font: "600 12.5px Poppins", cursor: sel && !saving ? "pointer" : "not-allowed" }}>{t("import", "Importar")}</button>
        </div>
        <style dangerouslySetInnerHTML={{ __html: ".imp-opt-studio:hover{background:#FCE7F0 !important;}" }} />
      </div>
    </div>,
    document.body
  );
};

export default ModalImportarStudio;
