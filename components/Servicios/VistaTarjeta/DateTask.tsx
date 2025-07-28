import { FC } from 'react';
import { formatDate } from './TaskNewUtils';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';

interface Props {
  editingField: string;
  tempValue: string;
  setTempValue: (value: string) => void;
  handleFieldSave: (field: string) => void;
  handleKeyPress: (e: React.KeyboardEvent, field: string) => void;
  canEdit: boolean;
  task: Task;
  handleFieldClick: (field: string, value: string) => void;
  ht: () => void;
}

export const DateTask: FC<Props> = ({ editingField, tempValue, setTempValue, handleFieldSave, handleKeyPress, canEdit, task, handleFieldClick, ht }) => {
  const { t } = useTranslation();

  return (
    <div className="w-[120px] h-full flex items-center">
      {editingField === 'fecha'
        ? <div className="flex items-center space-x-2">
          <input
            type="date"
            value={tempValue ? tempValue : ''}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => handleFieldSave('fecha')}
            onKeyDown={(e) => handleKeyPress(e, 'fecha')}
            className="px-1 py-[1px] border-none rounded text-xs focus:ring-gray-400 focus:ring-
                      [1px] focus:outline-none transition"
            autoFocus
          />
        </div>
        : <span
          className={`text-xs ${canEdit ? 'cursor-pointer text-gray-700 hover:text-gray-900' : 'cursor-default text-gray-600'}`}
          onClick={() => {
            if (canEdit) {
              // Formatear la fecha correctamente para el input tipo date
              if (task.fecha) {
                const date = new Date(task.fecha);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                handleFieldClick('fecha', `${year}-${month}-${day}`);
              } else {
                handleFieldClick('fecha', '');
              }
            } else {
              ht();
            }
          }}
          title={canEdit ? "Haz clic para editar fecha" : "No tienes permisos para editar"}
        >
          {task.fecha ? formatDate(task.fecha) : t('Sin fecha')}
        </span>
      }
    </div>
  );
};