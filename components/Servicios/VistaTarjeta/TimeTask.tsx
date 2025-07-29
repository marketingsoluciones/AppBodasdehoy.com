import { FC, useState } from 'react';
import { Task } from '../../../utils/Interfaces';
import { formatTime } from './TaskNewUtils';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TimeTaskProps {
  handleUpdate: (field: string, value: any) => Promise<void>;
  canEdit: boolean;
  task: Task;
  ht: () => void;
}

export const TimeTask: FC<TimeTaskProps> = ({ handleUpdate, canEdit, task, ht }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>(task.fecha ? formatTime(task.fecha) : '');
  const [editing, setEditing] = useState<boolean>(false);

  return (
    <div className="w-[100px] h-full flex items-center">
      {editing
        ? <input
          type="time"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            if (task.fecha && value) {
              const fecha = new Date(task.fecha);
              const [hours, minutes] = value.split(':');
              fecha.setHours(parseInt(hours), parseInt(minutes));
              // Convertir a ISO string o al formato que espere tu backend
              handleUpdate('fecha', fecha.toISOString());
            }
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (task.fecha && value) {
                const fecha = new Date(task.fecha);
                const [hours, minutes] = value.split(':');
                fecha.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                handleUpdate('fecha', fecha.toISOString());
                setEditing(false);
              }
            } else {
              if (e.key === 'Enter') {
                if (task.fecha && value) {
                  const fecha = new Date(task.fecha);
                  const [hours, minutes] = value.split(':');
                  fecha.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  handleUpdate('fecha', fecha.toISOString());
                  setEditing(null);
                }
              }
              if (e.key === 'Escape') {
                setEditing(false);
              }
            }
          }}
          className="px-1 py-0 border-none rounded text-xs focus:ring-gray-400 focus:ring-[1px] focus:outline-none transition"
          autoFocus
        />
        : <div onClick={() => {
          // canEdit ? handleFieldClick('hora', task.fecha ? formatTime(task.fecha) : '') : ht()
        }}
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