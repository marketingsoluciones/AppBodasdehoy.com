import { User } from "lucide-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { ClickUpResponsableSelector } from "../VistaTabla/NewResponsableSelector";
import { PermissionWrapper } from "./TaskNewComponents";
import { GruposResponsablesArry } from "../Utils/ResponsableSelector";
import { AuthContextProvider } from "../../../context/AuthContext";
import { EventContextProvider } from "../../../context/EventContext";
import { ImageAvatar } from "../../Utils/ImageAvatar";

interface Props {
  canEdit: boolean;
  editingResponsable: boolean;
  setEditingResponsable: (editing: boolean) => void;
  tempResponsable: string[];
  setTempResponsable: (value: string[]) => void;
  localTask: any;
  handleUpdate: (field: string, value: any) => Promise<void>;
}
export const AssignedTask: FC<Props> = ({ canEdit, editingResponsable, setEditingResponsable, tempResponsable, setTempResponsable, localTask, handleUpdate }) => {
  const { t } = useTranslation();
  const { user } = AuthContextProvider();
  const { event } = EventContextProvider();
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <User className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-600">{t('Asignados')}</span>
      </div>
      <div className="flex items-center flex-wrap gap-2 relative">
        {editingResponsable && canEdit
          ? <div className="relative">
            <ClickUpResponsableSelector
              value={tempResponsable}
              onChange={(newValue) => {
                setTempResponsable(newValue);
                handleUpdate('responsable', newValue);
                setEditingResponsable(false);
              }}
              onClose={() => {
                setEditingResponsable(false);
                setTempResponsable(localTask.responsable || []);
              }}
            />
          </div>
          : <PermissionWrapper hasPermission={canEdit}>
            <div className="flex items-center flex-wrap gap-2">
              {(localTask.responsable || []).map((resp, idx) => {
                const userInfo = GruposResponsablesArry.find((el) => el.title?.toLowerCase() === resp?.toLowerCase()) || [user, event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])].find((el) => {
                  const displayName = el?.displayName || el?.email || 'Sin nombre';
                  return displayName.toLowerCase() === resp?.toLowerCase();
                }
                );
                return (
                  <div key={idx} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                    <div className="w-6 h-6 rounded-full mr-2 overflow-hidden">
                      <ImageAvatar user={userInfo} />
                    </div>
                    <span className="text-sm">{resp}</span>
                  </div>
                );
              })}
              {canEdit && (
                <button
                  onClick={() => {
                    setEditingResponsable(true);
                    setTempResponsable(localTask.responsable || []);
                  }}
                  className="text-gray-500 hover:text-gray-700 border border-gray-300 rounded-full px-3 py-1 text-sm"
                >
                  {localTask.responsable?.length > 0 ? t('Editar') : t('Asignar')}
                </button>
              )}
            </div>
          </PermissionWrapper>
        }
      </div>
    </div>
  )
}