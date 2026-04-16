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
  ValidationEdit?: boolean;
}

export const TimeTask: FC<TimeTaskProps> = ({ handleUpdate, canEdit, task, setEditing, editing, uso, ValidationEdit }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>();
  const [blockUpdate, setBlockUpdate] = useState<boolean>(false);
  const { utcDateTime, timeFormated, utcTime } = useDateTime()
  const { event } = EventContextProvider()

  const endTime = task?.fecha && task?.duracion ? calculateEndTime(task.fecha, task.duracion as number) : null;
  const endTimeFormated = endTime ? timeFormated(endTime, event?.timeZone) : null;

  return (
    <div className="w-[100px] h-full flex items-center">
      {ValidationEdit && editing
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
              value={
                value !== undefined && value !== null
                  ? value
                  : uso !== 'endTime'
                    ? task?.fecha
                      ? task?.horaActiva !== false
                        ? utcTime(task.fecha)
                        : '00:00'
                      : '00:00'
                    : endTime
                      ? new Date(endTime).toJSON().slice(-13, -8)
                      : '00:00'
              }
              onClickCapture={() => {
                setBlockUpdate(false);
              }}
              onChange={async (e) => {
                setValue(e.currentTarget.value);
                if (uso !== 'endTime' && !blockUpdate) {
                  const newFecha = `${utcDateTime(task.fecha)}T${e.currentTarget.value}:00.000Z`;
                  await handleUpdate('fecha', newFecha);
                  await handleUpdate('horaActiva', true);
                  setEditing(false);
                }
                setBlockUpdate(false);
              }}
              onKeyDown={async (e) => {
                if (parseInt(e.key) > -1 || e.key === 'Backspace' || e.key === ':') {
                  setBlockUpdate(true);
                } else if (e.key === 'Enter') {
                  if (uso !== 'endTime') {
                    const newFecha = `${utcDateTime(task.fecha)}T${e.currentTarget.value}:00.000Z`;
                    await handleUpdate('fecha', newFecha);
                    await handleUpdate('horaActiva', true);
                  }
                  setEditing(false);
                } else if (e.key === 'Escape') {
                  setBlockUpdate(false);
                  setEditing(false);
                  setValue(undefined);
                }
              }}
              onBlur={async (e) => {
                if (uso !== 'endTime') {
                  const currentTaskTime = task?.fecha ? utcTime(task.fecha) : '00:00';
                  const valir = e.currentTarget.value !== currentTaskTime;
                  if (e.currentTarget.value && valir) {
                    const newFecha = `${utcDateTime(task.fecha)}T${e.currentTarget.value}:00.000Z`;
                    await handleUpdate('fecha', newFecha);
                    await handleUpdate('horaActiva', true);
                    setValue(undefined);
                  }
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
                ? timeFormated(task.fecha, event?.timeZone)
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