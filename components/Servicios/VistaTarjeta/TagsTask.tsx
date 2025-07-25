import { Plus, Tag, X } from "lucide-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import ClickAwayListener from "react-click-away-listener";

interface Props {
  canEdit: boolean;
  localTask: any;
  handleRemoveTag: (tag: string) => void;
  handleAddTag: (tag: string) => void;
  handleFieldCancel: () => void;
  handleFieldClick: (field: string, value: any) => void;
  editingField: string | null;
}
export const TagsTask: FC<Props> = ({ canEdit, localTask, handleRemoveTag, handleAddTag, handleFieldCancel, handleFieldClick, editingField }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center space-x-4">
      <Tag className="w-4 h-4 text-gray-500" />
      <span className="text-xs text-gray-600">{t('Etiquetas')}</span>
      <div className="flex items-center flex-wrap gap-2">
        {(localTask.tags || []).map((tag, idx) => (
          <div key={idx} className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 group">
            <span className="text-sm">{tag}</span>
            {canEdit && (
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-2 hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        {editingField === 'tags'
          ? <ClickAwayListener onClickAway={handleFieldCancel}>
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
              className="px-3 py-1 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </ClickAwayListener>
          : canEdit && (
            <button
              onClick={() => handleFieldClick('tags', '')}
              className="text-gray-500 hover:text-gray-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          )
        }
      </div>
    </div>
  )
}