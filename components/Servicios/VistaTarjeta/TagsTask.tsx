import { Plus, Tag, X } from "lucide-react";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import ClickAwayListener from "react-click-away-listener";
import { useAllowed } from "../../../hooks/useAllowed";

interface Props {
  canEdit: boolean;
  task: any;
  handleUpdate: (field: string, value: any) => Promise<void>;
}
export const TagsTask: FC<Props> = ({ canEdit, task, handleUpdate }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<boolean>(false);

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
        {editing
          ? <ClickAwayListener onClickAway={() => setEditing(false)}>
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
              className="px-3 py-0.5 border-gray-300 rounded-md text-xs border-[1px] focus:border-gray-400"
              autoFocus
            />
          </ClickAwayListener>
          : task.estatus && canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Plus className="w-4 h-4 text-primary" />
            </button>
          )
        }
      </div>
    </div>
  )
}