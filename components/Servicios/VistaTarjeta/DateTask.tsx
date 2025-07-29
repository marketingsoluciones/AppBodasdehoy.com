import { FC, useState } from 'react';
import { formatDate } from './TaskNewUtils';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';

interface Props {
  handleUpdate: (field: string, value: any) => Promise<void>;
  canEdit: boolean;
  task: Task;
  ht: () => void;
}

export const DateTask: FC<Props> = ({ handleUpdate, canEdit, task, ht }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<boolean>(false);
  const [value, setValue] = useState<string>();

  const getDateString = (value: Date | string) => {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return (
    <div className="w-[120px] h-full flex items-center">
      {editing
        ? <div className="flex items-center space-x-2">
          <input
            type="date"
            value={task?.fecha ? getDateString(task.fecha) : ''}
            onChange={(e) => {
              console.log(100046, "aqui cambio");
              handleUpdate('fecha', e.currentTarget.value)
            }}
            onBlur={(e) => {
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUpdate('fecha', e.currentTarget.value)
              } else if (e.key === 'Escape') {
                setEditing(false);
              }
            }}
            className="px-1 py-[1px] border-none rounded text-xs focus:ring-gray-400 focus:ring-
                      [1px] focus:outline-none transition"
            autoFocus
          />
        </div>
        : <span
          className={`text-xs ${canEdit ? 'cursor-pointer text-gray-700 hover:text-gray-900' : 'cursor-default text-gray-600'}`}
          onClick={() => {
            if (canEdit) {
              console.log(100044, task.fecha);
              setEditing(true);
              if (!task?.fecha) {

              }
              // Formatear la fecha correctamente para el input tipo date
              // if (task.fecha) {
              //   const date = new Date(task.fecha);
              //   const year = date.getFullYear();
              //   const month = String(date.getMonth() + 1).padStart(2, '0');
              //   const day = String(date.getDate()).padStart(2, '0');
              //   handleFieldClick('fecha', `${year}-${month}-${day}`);
              // } else {
              //   handleFieldClick('fecha', '');
              // }
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