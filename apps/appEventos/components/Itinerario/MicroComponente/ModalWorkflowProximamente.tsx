import { FC, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * ModalWorkflowProximamente — modal "Workflows: automatiza tus tareas · PRÓXIMAMENTE".
 * Fiel a modalworkflowproximamente.html. Se abre al pulsar el icono de workflow en la
 * barra de acciones de la tarea. Overlay semitransparente (sin blur); ✕ / clic fuera /
 * "Entendido" cierran. "Avisarme cuando esté lista" da feedback verde (aún sin backend).
 */
export const ModalWorkflowProximamente: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const [avisado, setAvisado] = useState(false);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes wf-pop{from{opacity:0;transform:translate(-50%,-50%) scale(.96);}to{opacity:1;transform:translate(-50%,-50%) scale(1);}}` }} />
      {/* overlay */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(40,40,46,.45)", zIndex: 90 }} />
      {/* modal */}
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, maxWidth: "92vw", background: "#fff", borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,.3)", zIndex: 91, animation: "wf-pop .18s ease", overflow: "hidden", textAlign: "center", fontFamily: "'Poppins',sans-serif" }}>
        {/* cerrar */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 14px 0" }}>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8a90", cursor: "pointer" }}
            onMouseOver={(e) => { e.currentTarget.style.background = "#f5f5f7" }} onMouseOut={(e) => { e.currentTarget.style.background = "" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </div>
        </div>

        <div style={{ padding: "2px 34px 30px", display: "flex", flexDirection: "column", alignItems: "center", gap: 13 }}>
          {/* icono workflow */}
          <div style={{ width: 66, height: 66, borderRadius: "50%", background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF5B94" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="5" r="2.4" /><circle cx="6" cy="19" r="2.4" /><circle cx="18" cy="12" r="2.4" /><path d="M6 7.5v9M8.4 5.5c5.5 0 3.8 6 7.2 6.3M8.4 18.5c5.5 0 3.8-6 7.2-6.3" /></svg>
          </div>

          {/* badge PRÓXIMAMENTE */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FDF6DE", borderRadius: 14, padding: "5px 14px", font: "700 10px Poppins", color: "#B08A1E", letterSpacing: 1.2 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z" /></svg>
            {t("SOON", { defaultValue: "PRÓXIMAMENTE" })}
          </div>

          <div style={{ font: "700 19px/1.35 Poppins", color: "#3A3A42" }}>{t("workflowsTitle", { defaultValue: "Workflows: automatiza tus tareas" })}</div>
          <div style={{ font: "400 12.5px/1.65 Poppins", color: "#6b6b72", maxWidth: 300 }}>{t("workflowsDesc", { defaultValue: "Estamos construyendo esta funcionalidad para que conectes tareas y se disparen solas. Muy pronto estará disponible." })}</div>

          <button type="button" onClick={() => setAvisado(true)} disabled={avisado}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 26px", borderRadius: 12, background: avisado ? "#2FB37E" : "#EF5B94", color: "#fff", font: "600 13px Poppins", border: "none", cursor: avisado ? "default" : "pointer", boxShadow: avisado ? "0 6px 16px rgba(47,179,126,.3)" : "0 6px 16px rgba(239,91,148,.3)", marginTop: 6, transition: "background .2s" }}>
            {avisado
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>{t("weWillNotifyYou", { defaultValue: "¡Te avisaremos!" })}</>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>{t("notifyMeWhenReady", { defaultValue: "Avisarme cuando esté lista" })}</>}
          </button>
          <span onClick={onClose} style={{ font: "600 12px Poppins", color: "#8a8a90", cursor: "pointer" }}
            onMouseOver={(e) => { e.currentTarget.style.color = "#EF5B94" }} onMouseOut={(e) => { e.currentTarget.style.color = "#8a8a90" }}>
            {t("understoodBackToTasks", { defaultValue: "Entendido, volver a mis tareas" })}
          </span>
        </div>
      </div>
    </>
  );
};

export default ModalWorkflowProximamente;
