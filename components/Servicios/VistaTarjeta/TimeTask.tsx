import { FC, useState } from 'react';
import { Task } from '../../../utils/Interfaces';
import { formatTime } from './TaskNewUtils';
import { Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ClickAwayListener from 'react-click-away-listener';
import { getDateString, getTimeString } from './TaskNewUtils';

interface TimeTaskProps {
  handleUpdate: (field: string, value: any) => Promise<void>;
  canEdit: boolean;
  task: Task;
}

export const TimeTask: FC<TimeTaskProps> = ({ handleUpdate, canEdit, task }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>();
  const [editing, setEditing] = useState<boolean>(false);
  const [blockUpdate, setBlockUpdate] = useState<boolean>(false);

  return (
    <div className="w-[100px] h-full flex items-center">
      {editing
        ? <ClickAwayListener onClickAway={() => {
          setEditing(false)
          setValue(null);
        }}>
          <div className="w-full flex items-center relative">
            <div onClick={() => {
              setValue(null);
              if (task?.horaActiva !== false) {
                handleUpdate('horaActiva', false)
                  .then(() => {
                    setEditing(false);
                  })
                const value = new Date(`${getDateString(task.fecha)}T00:00`)
                handleUpdate('fecha', value)
              } else {
                setEditing(false);
              }
            }} className="absolute z-10 -right-[6px] cursor-pointer p-[2px]">
              <div className='relative group'>
                <X className="w-3 h-3" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                  {t('Eliminar hora')}
                </div>
              </div>
            </div>
            <input
              type="time"
              value={value ? value : task?.horaActiva !== false ? getTimeString(task.fecha) : undefined}
              defaultValue={'00:00'}
              onChange={(e) => {
                setValue(e.currentTarget.value);
                if (!blockUpdate) {
                  const value = new Date(`${getDateString(task.fecha)}T${e.currentTarget.value}`)
                  setValue(e.currentTarget.value);
                  if (typeof value !== "string") {
                    handleUpdate('horaActiva', true)
                    handleUpdate('fecha', value)
                  }
                }
                setBlockUpdate(false);
              }}
              onKeyDown={(e) => {
                setBlockUpdate(true);
                if (e.key === 'Enter') {
                  handleUpdate('fecha', new Date(`${getDateString(task?.fecha)}T${e.currentTarget.value}`))
                    .then(() => {
                      setEditing(false);
                    })
                } else if (e.key === 'Escape') {
                  setEditing(false);
                }
              }}
              className="px-1 py-[1px] border-none rounded text-xs focus:ring-gray-400 focus:ring-[1px] focus:outline-none transition [&::-webkit-calendar-picker-indicator]:relative [&::-webkit-calendar-picker-indicator]:-left-[11px] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              autoFocus
            />
          </div>
        </ClickAwayListener>
        : <div onClick={() => {
          if (task?.fecha) {
            canEdit && setEditing(true)
          }
        }}
          title={canEdit && "Haz clic para editar hora"} className={`flex items-center space-x-1 ${canEdit && task?.fecha ? 'cursor-pointer hover:text-gray-900' : task?.fecha ? `text-gray-00` : ''}`}>
          <Clock className="w-4 h-4 text-gray-600" />
          <span className={`flex items-center space-x-1 text-xs`}>
            {task?.fecha && task?.horaActiva !== false ? formatTime(task.fecha) : t('Sin hora')}
          </span>
        </div>
      }
    </div>
  );
};