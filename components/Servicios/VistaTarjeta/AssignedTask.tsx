import { User } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClickUpResponsableSelector } from "../VistaTabla/NewResponsableSelector";
import { PermissionWrapper } from "./TaskNewComponents";
import { GruposResponsablesArry } from "../Utils/ResponsableSelector";
import { AuthContextProvider } from "../../../context/AuthContext";
import { EventContextProvider } from "../../../context/EventContext";
import { ImageAvatar } from "../../Utils/ImageAvatar";

interface Props {
  canEdit: boolean;
  task: any;
  handleUpdate: (field: string, value: any) => Promise<void>;
}
export const AssignedTask: FC<Props> = ({ canEdit, task, handleUpdate }) => {
  const { t } = useTranslation();
  const { user } = AuthContextProvider();
  const { event } = EventContextProvider();
  const [editing, setEditing] = useState<boolean>(false);
  const [tempResponsable, setTempResponsable] = useState<string[]>(task.responsable || []);

  useEffect(() => {
    setTempResponsable(Array.isArray(task?.responsable) ? task.responsable : []);
  }, [task])


  return (
    <div className="flex items-start space-x-2 w-full relative">
      <div className="flex flex-col gap-1">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-600">{t('Asignados')}</span>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditing(true);
              setTempResponsable(task.responsable || []);
            }}
            className="bg-primary rounded-full px-3 py-0.5 text-xs text-white"
          >
            {task.responsable?.length > 0 ? t('Editar') : t('Asignar')}
          </button>
        )}
      </div>
      <div className="flex items-center flex-wrap w-full border border-gray-200 rounded-md relative p-0.5">
        {(editing && canEdit) && <div className="absolute z-10 top-0 left-0">
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
        <PermissionWrapper hasPermission={canEdit}>
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
        </PermissionWrapper>
      </div>
    </div>
  )
}