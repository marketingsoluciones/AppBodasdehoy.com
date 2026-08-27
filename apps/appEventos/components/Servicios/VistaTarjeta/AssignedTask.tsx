import { User } from "lucide-react";
import { usePathname } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClickUpResponsableSelector } from "../VistaTabla/NewResponsableSelector";
import { GruposResponsablesArry } from "../Utils/ResponsableSelector";
import { AuthContextProvider } from "../../../context/AuthContext";
import { EventContextProvider } from "../../../context/EventContext";
import { ImageAvatar } from "../../Utils/ImageAvatar";
import { cleanResponsables } from "./TaskNewUtils";

interface Props {
  canEdit: boolean;
  task: any;
  handleUpdate: (field: string, value: any) => Promise<void>;
  owner: boolean;
}
export const AssignedTask: FC<Props> = ({ canEdit, task, handleUpdate, owner }) => {
  const { t } = useTranslation();
  const { user } = AuthContextProvider();
  const { event } = EventContextProvider();
  const [editing, setEditing] = useState<boolean>(false);
  const [tempResponsable, setTempResponsable] = useState<string[]>(task.responsable || []);
  const ruta = usePathname();
  // Rediseño studio (gate ?studio, default ON): solo /itinerario. Fiel a
  // tarjetatareaitinerario.html (.fila-grid / .caja / .chip-persona / .btn-asignar).
  const isStudio = typeof window !== "undefined"
    && window.location.pathname === "/itinerario"
    && new URLSearchParams(window.location.search).get("studio") !== "legacy";
  const canShowAsignar = canEdit && (["/itinerario"].includes(ruta) ? (owner || task.estatus || task.estatus === null) : true);

  useEffect(() => {
    setTempResponsable(Array.isArray(task?.responsable) ? task.responsable : []);
  }, [task])

  const resolveUserInfo = (resp: string) =>
    GruposResponsablesArry.find((el) => el.title?.toLowerCase() === resp?.toLowerCase())
    || [user, event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])].find((el) => {
      const displayName = el?.displayName || el?.email || 'Sin nombre';
      return displayName.toLowerCase() === resp?.toLowerCase();
    });


  if (isStudio) {
    const respList = cleanResponsables(task.responsable);
    // Más de dos asignados → slider horizontal (scroll invisible) en vez de apilar.
    // Se desactiva mientras se edita para no recortar el selector superpuesto.
    const isSlider = respList.length > 2 && !(editing && canEdit);
    return (
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14, alignItems: "center" }} className="w-full">
        <div style={{ display: "flex", alignItems: "center", gap: 7, font: "600 12.5px Poppins", color: "#a0a0a8" }}>
          <User className="w-[14px] h-[14px]" />
          {t('Asignados')}
        </div>
        <div className={`relative${isSlider ? " asig-slider" : ""}`} style={{ minHeight: 44, border: "1.5px solid #E7E7EA", borderRadius: 12, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8, flexWrap: isSlider ? "nowrap" : "wrap", overflowX: isSlider ? "auto" : "visible" }}>
          {(editing && canEdit) && <div className="absolute z-10 top-0 md:left-0 right-0">
            <ClickUpResponsableSelector
              value={tempResponsable}
              onChange={(newValue) => { setTempResponsable(newValue); handleUpdate('responsable', newValue); setEditing(false); }}
              onClose={() => { setEditing(false); setTempResponsable(task.responsable || []); }}
            />
          </div>}
          {respList.map((resp, idx) => (
            <span key={idx} style={{ display: "flex", alignItems: "center", gap: 7, background: "#f5f5f7", borderRadius: 16, padding: "5px 12px 5px 5px", font: "500 12px Poppins", color: "#3A3A42", flex: "none", whiteSpace: "nowrap" }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", overflow: "hidden", display: "inline-block", flex: "none" }}>
                <ImageAvatar user={resolveUserInfo(resp)} size="md" />
              </span>
              {resp}
            </span>
          ))}
          {canShowAsignar && (
            <button
              onClick={() => { setEditing(true); setTempResponsable(task.responsable || []); }}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 13px", borderRadius: 16, background: "#FCE7F0", color: "#D83E7C", font: "600 11.5px Poppins", border: "none", cursor: "pointer", flex: "none", whiteSpace: "nowrap" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              {task.responsable?.length > 0 ? t('Editar') : t('Asignar')}
            </button>
          )}
        </div>
        <style jsx>{`
          .asig-slider::-webkit-scrollbar { height: 0; width: 0; display: none; }
          .asig-slider { scrollbar-width: none; -ms-overflow-style: none; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 w-full relative ">
      <div className="flex flex-col gap-1">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-600">{t('Asignados')}</span>
        </div>
        {
          canEdit && ["/itinerario"].includes(ruta)
            ? owner
              ? (
                <button
                  onClick={() => {
                    setEditing(true);
                    setTempResponsable(task.responsable || []);
                  }}
                  className="bg-primary rounded-full px-3 py-0.5 text-xs text-white"
                >
                  {task.responsable?.length > 0 ? t('Editar') : t('Asignar')}
                </button>
              )
              : (task.estatus || task.estatus === null) && (
                <button
                  onClick={() => {
                    setEditing(true);
                    setTempResponsable(task.responsable || []);
                  }}
                  className="bg-primary rounded-full px-3 py-0.5 text-xs text-white"
                >
                  {task.responsable?.length > 0 ? t('Editar') : t('Asignar')}
                </button>
              )
            :canEdit && (

              <button
                onClick={() => {
                  setEditing(true);
                  setTempResponsable(task.responsable || []);
                }}
                className="bg-primary rounded-full px-3 py-0.5 text-xs text-white"
              >
                {task.responsable?.length > 0 ? t('Editar') : t('Asignar')}
              </button>
            )
        }
      </div>
      <div className="flex items-center flex-wrap w-full border border-gray-200 rounded-md relative p-0.5">
        {(editing && canEdit) && <div className="absolute z-10 top-0 md:left-0 right-0">
          <ClickUpResponsableSelector
            value={tempResponsable}
            onChange={(newValue) => {
              setTempResponsable(newValue);
              handleUpdate('responsable', newValue);
              setEditing(false);
            }}
            onClose={() => {
              setEditing(false);
              setTempResponsable(task.responsable || []);
            }}
          />
        </div>}
        <div className="flex items-center flex-wrap gap-1 h-[52px] overflow-y-auto relative">
          {(task.responsable || []).map((resp, idx) => {
            const userInfo = GruposResponsablesArry.find((el) => el.title?.toLowerCase() === resp?.toLowerCase()) || [user, event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])].find((el) => {
              const displayName = el?.displayName || el?.email || 'Sin nombre';
              return displayName.toLowerCase() === resp?.toLowerCase();
            }
            );
            return (
              <div key={idx} className="flex items-center bg-gray-200 rounded-full pl-1 pr-2 py-0.5 gap-1">
                <div className="w-5 h-5 rounded-full overflow-hidden">
                  <ImageAvatar user={userInfo} size="md" />
                </div>
                <span className="text-xs">{resp}</span>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  )
}