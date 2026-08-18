import { Plus, Tag, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import ClickAwayListener from "react-click-away-listener";
import { useAllowed } from "../../../hooks/useAllowed";

interface Props {
  canEdit: boolean;
  task: any;
  handleUpdate: (field: string, value: any) => Promise<void>;
  owner: boolean;
  suggestions?: string[];
}
export const TagsTask: FC<Props> = ({ canEdit, task, handleUpdate, owner, suggestions }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<boolean>(false);
  const ruta = usePathname();
  // Rediseño studio (gate ?studio, default ON): solo /itinerario. Fiel a
  // tarjetatareaitinerario.html (.fila-tags / .caja-tags / .tag / .tag-input).
  const isStudio = typeof window !== "undefined"
    && window.location.pathname === "/itinerario"
    && new URLSearchParams(window.location.search).get("studio") !== "legacy";

  // Lógica de validación extraída fuera del return
  const isItinerarioRoute = ["/itinerario"].includes(ruta);
  const isOwner = Boolean(owner);
  const canUserEdit = Boolean(canEdit);
  const hasTaskStatus = Boolean(task.estatus || task.estatus === null);
  
  const canShowAddButton = isItinerarioRoute
    ? isOwner
      ? canUserEdit  // Si es owner, solo necesita canEdit
      : (hasTaskStatus && canUserEdit)  // Si no es owner, necesita task.estatus Y canEdit
    : canUserEdit;  // En otras rutas, solo necesita canEdit

  const handleAddTag = (newTag: string) => {
    if (!canEdit) {
      return;
    }
    const updatedTags = [...(task.tags || []), newTag];
    handleUpdate('tags', updatedTags);
    setEditing(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!canEdit) {
      return;
    }
    const updatedTags = (task.tags || []).filter(tag => tag !== tagToRemove);
    handleUpdate('tags', updatedTags);
  };

  if (isStudio) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, font: "600 12.5px Poppins", color: "#a0a0a8" }}>
          <Tag className="w-[14px] h-[14px]" />
          {t('Etiquetas')}
        </div>
        <div style={{ minHeight: 44, border: "1.5px solid #E7E7EA", borderRadius: 12, padding: "7px 12px", display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          {(task.tags || []).map((tag, idx) => (
            <span key={idx} className="group" style={{ display: "flex", alignItems: "center", gap: 4, font: "600 11px Poppins", color: "#D83E7C", background: "#FCE7F0", padding: "5px 12px", borderRadius: 14 }}>
              {tag}
              {canEdit && (
                <button onClick={() => handleRemoveTag(tag)} className="transition-opacity" style={{ display: "inline-flex" }}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
          {editing ? (
            <ClickAwayListener onClickAway={() => setEditing(false)}>
              <span className="inline-flex">
                <input
                  type="text"
                  placeholder={t('Agregar etiqueta…')}
                  list={`tags-sug-${task?._id}`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) { handleAddTag(input.value.trim()); input.value = ''; }
                    }
                  }}
                  style={{ border: "1.5px solid #E7E7EA", borderRadius: 16, padding: "5px 13px", font: "400 12px Poppins", color: "#3A3A42", outline: "none", width: 150, background: "transparent" }}
                  autoFocus
                />
                {Array.isArray(suggestions) && suggestions.length > 0 && (
                  <datalist id={`tags-sug-${task?._id}`}>
                    {suggestions.map((s) => <option key={s} value={s} />)}
                  </datalist>
                )}
              </span>
            </ClickAwayListener>
          ) : (
            canShowAddButton && (
              <button onClick={() => setEditing(true)} style={{ display: "inline-flex", color: "#EF5B94" }}>
                <Plus className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <Tag className="w-4 h-4 text-gray-500" />
      <span className="text-xs text-gray-600">{t('Etiquetas')}</span>
      <div className="flex h-[52px] items-center flex-wrap gap-1 w-full border border-gray-200 rounded-md p-0.5 overflow-y-auto relative">
        {(task.tags || []).map((tag, idx) => (
          <div key={idx} className="flex items-center bg-primary/10 text-primary rounded-full px-2 py-0.5 group border border-gray-200">
            <span className="text-xs">{tag}</span>
            {canEdit && (
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-2 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        {editing ? (
          <ClickAwayListener onClickAway={() => setEditing(false)}>
            <input
              type="text"
              placeholder={t('Agregar etiqueta...')}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  if (input.value.trim()) {
                    handleAddTag(input.value.trim());
                    input.value = '';
                  }
                }
              }}
              className="px-3 py-0.5 border-gray-300 rounded-md text-xs border-[1px] focus:border-gray-400 w-[200px] "
              autoFocus
            />
          </ClickAwayListener>
        ) : (
          canShowAddButton && (
            <button
              onClick={() => setEditing(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Plus className="w-4 h-4 text-primary" />
            </button>
          )
        )}
      </div>
    </div>
  )
}