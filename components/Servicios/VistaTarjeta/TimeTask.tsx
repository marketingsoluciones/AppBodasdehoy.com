import { FC, useState } from 'react';
import { Task } from '../../../utils/Interfaces';
import { Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ClickAwayListener from 'react-click-away-listener';
import { useDateTime } from '../../../hooks/useDateTime';
import { EventContextProvider } from '../../../context';
import { calculateEndTime } from './TaskNewUtils';

interface TimeTaskProps {
  handleUpdate: (field: string, value: any) => Promise<void>;
  canEdit: boolean;
  task: Task;
  setEditing: (editing: boolean) => void;
  editing: boolean;
  uso?: "startTime" | "endTime" | undefined;
}

export const TimeTask: FC<TimeTaskProps> = ({ handleUpdate, canEdit, task, setEditing, editing, uso }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>();
  const { utcDateTime, is12HourFormat, dateTimeFormated } = useDateTime()
  const { event } = EventContextProvider()

  const endTime = task?.fecha && task?.duracion ? calculateEndTime(task.fecha, task.duracion as number) : null;
  const endTimeFormated = endTime ? dateTimeFormated(endTime, event.timeZone).slice(11, 24) : null;

  return (
    <div className="w-[100px] h-full flex items-center">
      {editing
        ? <ClickAwayListener onClickAway={() => {
          setEditing(false)
          setValue(null);
        }}>
          <div className="w-full flex items-center relative">
            <div onClick={() => {
              if (uso !== 'endTime') {
                setValue(null);
                if (task?.horaActiva !== false) {
                  handleUpdate('horaActiva', false)
                    .then(() => {
                      setEditing(false);
                    })
                  const value = `${utcDateTime(task.fecha)}T00:00:00.000Z`
                  handleUpdate('fecha', value)
                  handleUpdate('duracion', 0)
                } else {
                  setEditing(false);
                }
                return;
              }

            }} className="absolute z-10 -right-[6px] cursor-pointer p-[2px]">
              {uso !== "startTime" && <div className='relative group'>
                <X className="w-3 h-3" />
                <div id={`time-task-tooltip_${task._id}`} className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity whitespace-nowrap z-20">
                  {t('Eliminar hora')}
                </div>
              </div>}
            </div>
            <input
              type="time"
              value={value
                ? value
                : uso !== 'endTime' ?
                  task?.horaActiva !== false ? new Date(task.fecha).toJSON().slice(-13, -8) : undefined
                  : new Date(endTime)?.toJSON()?.slice(-13, -8)}
              defaultValue={'00:00'}
              onClickCapture={async (e) => {
                if (uso !== 'endTime') {
                  const valir = new Date(task.fecha).toJSON().slice(-13, -8) === '00:00'
                  if (e.currentTarget.value && valir) {
                    await handleUpdate('horaActiva', true)
                  }
                  return;
                }
              }}
              onChange={async (e) => {
                setValue(e.currentTarget.value);
              }}
              onKeyDown={async (e) => {
                if (uso !== 'endTime') {
                  if (e.key === 'Enter') {
                    const value = `${utcDateTime(task.fecha)}T${e.currentTarget.value}:00.000Z`
                    await handleUpdate('fecha', value)
                    await handleUpdate('horaActiva', true)
                    setEditing(false);
                  } else if (e.key === 'Escape') {
                    setEditing(false);
                    setValue(null);
                  }
                  return;
                }
              }}
              onBlur={async (e) => {
                if (uso !== 'endTime') {
                  const valir = e.currentTarget.value !== new Date(task.fecha).toJSON().slice(-13, -8)
                  if (e.currentTarget.value && valir) {
                    const value = `${utcDateTime(task.fecha)}T${e.currentTarget.value}:00.000Z`
                    await handleUpdate('fecha', value)
                    await handleUpdate('horaActiva', true)
                    setValue(null);
                  }
                  return;
                }
              }}
              className="px-1 py-[1px] border-none rounded text-xs focus:ring-gray-400 focus:ring-[1px] focus:outline-none transition [&::-webkit-calendar-picker-indicator]:relative [&::-webkit-calendar-picker-indicator]:-left-[11px] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              autoFocus
            />
          </div>
        </ClickAwayListener>
        : <div onClick={() => {
          if (task?.fecha && uso !== 'endTime') {
            canEdit && setEditing(true)
          }
        }}
          className={`flex items-center space-x-1 ${canEdit && task?.fecha && uso !== 'endTime' ? 'cursor-pointer hover:text-gray-900' : task?.fecha ? `text-gray-00` : ''}`}>
          <Clock className="w-4 h-4 text-gray-600" />
          <span className={`flex items-center space-x-1 text-xs`}>
            {uso !== 'endTime'
              ? task?.fecha && task?.horaActiva !== false
                ? is12HourFormat()
                  ? dateTimeFormated(task.fecha, event.timeZone).slice(11, 24)
                  : dateTimeFormated(task.fecha, event.timeZone).slice(11, 17)
                : t('Sin hora')
              : task?.fecha && task?.duracion
                ? endTimeFormated
                : t('Sin hora')}
          </span>
        </div>
      }
    </div>
  );
};