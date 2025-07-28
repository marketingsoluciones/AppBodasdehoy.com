import { FC } from 'react';
import { Task } from '../../../utils/Interfaces';
import { formatTime } from './TaskNewUtils';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  editingField: string;
  tempValue: string;
  setTempValue: (value: string) => void;
  handleUpdate: (field: string, value: any) => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent, field: string) => void;
  canEdit: boolean;
  task: Task;
  handleFieldClick: (field: string, value: string) => void;
  ht: () => void;
  setEditingField: (field: string | null) => void;
}

export const TimeTask: FC<Props> = ({ editingField, tempValue, setTempValue, handleUpdate, handleKeyPress, canEdit, task, handleFieldClick, ht, setEditingField }) => {
  const { t } = useTranslation();

  return (
    <div className="w-[100px] h-full flex items-center">
      {editingField === 'hora'
        ? <input
          type="time"
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={() => {
            if (task.fecha && tempValue) {
              const fecha = new Date(task.fecha);
              const [hours, minutes] = tempValue.split(':');
              fecha.setHours(parseInt(hours), parseInt(minutes));
              // Convertir a ISO string o al formato que espere tu backend
              handleUpdate('fecha', fecha.toISOString());
            }
            setEditingField(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (task.fecha && tempValue) {
                const fecha = new Date(task.fecha);
                const [hours, minutes] = tempValue.split(':');
                fecha.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                handleUpdate('fecha', fecha.toISOString());
                setEditingField(null);
              }
            } else {
              handleKeyPress(e, 'hora');
            }
          }}
          className="px-1 py-0 border-none rounded text-xs focus:ring-gray-400 focus:ring-
                      [1px] focus:outline-none transition"
          autoFocus
        />
        : <div onClick={() => canEdit ? handleFieldClick('hora', task.fecha ? formatTime(task.fecha) : '') : ht()}
          title={canEdit ? "Haz clic para editar hora" : "No tienes permisos para editar"} className={`flex items-center space-x-1 ${canEdit ? 'cursor-pointer text-gray-700 hover:text-gray-900' : 'cursor-default text-gray-600'}`}>
          <Clock className="w-4 h-4" />
          <span className={`flex items-center space-x-1 text-xs`}>
            {task.fecha ? formatTime(task.fecha) : t('Sin hora')}
          </span>
        </div>
      }
    </div>
  );
};