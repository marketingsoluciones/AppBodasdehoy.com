import { FC, useState } from "react";
import { useCRMNotes } from "@bodasdehoy/shared/crm-ui";
import { EventContextProvider } from "../../context";
import { useTranslation } from "react-i18next";

// Notas internas fiel al HTML (Detalle_Categoria.html), reusando el backend real (useCRMNotes).
// entityType por defecto "ENTITY" (categorías de Presupuesto); Resumen lo usa con "EVENTO".
interface Props { entityId: string; entityName: string; entityType?: string; }

const fmtFecha = (iso?: string) => {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; }
};

// Cuerpo (monta el hook solo cuando el acordeón está abierto → no fetch en cerrado).
const NotesBody: FC<Props> = ({ entityId, entityName, entityType = "ENTITY" }) => {
  const { t } = useTranslation();
  const { event } = EventContextProvider() as any;
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const entity: any = { entityId, entityName, entityType };
  // No duplicar el evento en alsoShow cuando la propia entidad YA es el EVENTO.
  const alsoShow: any = (event?._id && entityType !== "EVENTO") ? [{ entityId: event._id, entityName: event.nombre ?? "Evento", entityType: "EVENTO" }] : [];
  const { notes, createNote, deleteNote } = useCRMNotes({ entity, alsoShow } as any);

  const save = async () => {
    const content = text.trim();
    if (!content || saving) return;
    setSaving(true);
    try { await createNote({ content } as any); setText(""); } finally { setSaving(false); }
  };

  const canSave = !!text.trim() && !saving;

  return (
    <div style={{ marginTop: 14 }}>
      {Array.isArray(notes) && notes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {notes.map((n: any) => (
            <div key={n.id} style={{ background: "#faf9fb", border: "1px solid #f0f0f2", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ font: "500 13px Poppins", color: "#3A3A42", lineHeight: 1.5, flex: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{n.content}</div>
                <button className="sn-x" title={t("Eliminar")} onClick={() => deleteNote(n.id)} style={{ flex: "none", width: 24, height: 24, borderRadius: 7, color: "#c0c0c8", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "600 10.5px Poppins", color: "#EF5B94", background: "#FCE7F0", padding: "3px 10px", borderRadius: 999 }}>{n.author?.name || t("Tú")}</span>
                <span style={{ font: "500 10.5px Poppins", color: "#a0a0a8", marginLeft: "auto" }}>{fmtFecha(n.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <textarea className="sn-ta" value={text} onChange={(e) => setText(e.target.value)} placeholder={t(entityType === "EVENTO" ? "Escribe una nota interna sobre este evento…" : "Escribe una nota interna sobre esta categoría…") as string} style={{ width: "100%", minHeight: 80, resize: "vertical", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E7E7EA", font: "500 13px Poppins", color: "#3A3A42", outline: "none" }} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <button className={canSave ? "sn-save" : ""} onClick={save} disabled={!canSave} style={{ background: canSave ? "#EF5B94" : "#c8c8ce", color: "#fff", border: "none", borderRadius: 12, padding: "10px 22px", font: "600 13px Poppins", cursor: canSave ? "pointer" : "default", whiteSpace: "nowrap" }}>{t("Guardar nota")}</button>
      </div>
    </div>
  );
};

export const StudioNotesSection: FC<Props> = ({ entityId, entityName, entityType }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!entityId) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 16, boxShadow: "0 4px 14px rgba(0,0,0,.05)", padding: "16px 20px", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: ".sn-ta:focus{border-color:#EF5B94!important;}.sn-save:hover{background:#D83E7C!important;}.sn-x:hover{background:#FBE4EF!important;color:#D83E7C!important;}" }} />
      <div onClick={() => setOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .18s" }}><path d="M9 6l6 6-6 6" /></svg>
        <span style={{ font: "600 16px Poppins", color: "#6b6b72" }}>{t("Notas internas")}</span>
      </div>
      {open && <NotesBody entityId={entityId} entityName={entityName} entityType={entityType} />}
    </div>
  );
};

export default StudioNotesSection;
