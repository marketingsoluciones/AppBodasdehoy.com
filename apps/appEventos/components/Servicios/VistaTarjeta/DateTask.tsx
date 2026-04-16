import { FC, useEffect, useState } from 'react';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import ClickAwayListener from 'react-click-away-listener';
import { EventContextProvider } from '../../../context';
import { useDateTime } from '../../../hooks/useDateTime';

interface Props {
  handleUpdate: (field: string, value: any) => Promise<void>;
  canEdit: boolean;
  task: Task;
  setEditing: (editing: boolean) => void;
  editing: boolean;
  uso?: "itinerary" | undefined;
  ValidationEdit?: boolean;
}

export const DateTask: FC<Props> = ({ handleUpdate, canEdit, task, setEditing, editing, uso, ValidationEdit }) => {
  const { event } = EventContextProvider()
  const { t } = useTranslation();
  const [value, setValue] = useState<string>();
  const [blockUpdate, setBlockUpdate] = useState<boolean>(false);
  const { utcDateTime, utcDateFormated2Digits, utcTime } = useDateTime()

  return (
    <div className="w-[120px] h-full flex items-center">
      {ValidationEdit && editing
        ? <ClickAwayListener onClickAway={() => setEditing(false)}>
          <div className="w-full flex items-center relative">
            <div onClick={async () => {
              setValue(null);
              handleUpdate('fecha', null)
                .then(() => {
                  setEditing(false);
                  handleUpdate('horaActiva', false)
                })
            }} className="absolute z-10 -right-[6px] cursor-pointer p-[2px]">
              {uso !== "itinerary" && <div className='relative' onMouseEnter={() => {
                document.getElementById(`date-task-tooltip_${task._id}`).classList.add('opacity-100');
              }} onMouseLeave={() => {
                document.getElementById(`date-task-tooltip_${task._id}`).classList.remove('opacity-100');
              }}>
                <X className="w-3 h-3" />
                <div id={`date-task-tooltip_${task._id}`} className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity whitespace-nowrap z-20">
                  {t('Eliminar fecha')}
                </div>
              </div>}
            </div>
            <input
              type="date"
              value={value ? value : task?.fecha ? utcDateTime(task.fecha) : ''}
              onClickCapture={(e) => {
                setBlockUpdate(false);
              }}
              onChange={async (e) => {
                setValue(e.currentTarget.value);
                if (!blockUpdate) {
                  const value = task?.horaActiva !== false
                    ? `${e.currentTarget.value}T${utcTime(task.fecha)}:00.000Z`
                    : `${e.currentTarget.value}T00:00:00.000Z`
                  await handleUpdate('fecha', value)
                  setEditing(false);
                }
                setBlockUpdate(false);
              }}
              onKeyDown={async (e) => {
                if (parseInt(e.key) > -1 || e.key === 'Backspace') {
                  setBlockUpdate(true);
                } else if (e.key === 'Enter') {
                  const value = task?.horaActiva !== false
                    ? `${e.currentTarget.value}T${utcTime(task.fecha)}:00.000Z`
                    : `${e.currentTarget.value}T00:00:00.000Z`
                  await handleUpdate('fecha', value)
                  setEditing(false);
                } else if (e.key === 'Escape') {
                  setBlockUpdate(false);
                  setEditing(false);
                  setValue(null);
                }
              }}
              onBlur={async (e) => {
                const valir = e.currentTarget.value !== (task?.fecha ? utcDateTime(task.fecha) : '')
                if (e.currentTarget.value && valir) {
                  const value = task?.horaActiva !== false
                    ? `${e.currentTarget.value}T${utcTime(task.fecha)}:00.000Z`
                    : `${e.currentTarget.value}T00:00:00.000Z`
                  await handleUpdate('fecha', value)
                }
              }}
              className="px-1 py-[1px] border-none rounded text-xs focus:ring-gray-400 focus:ring-[1px] focus:outline-none transition [&::-webkit-calendar-picker-indicator]:relative [&::-webkit-calendar-picker-indicator]:-left-[11px] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              autoFocus
            />
          </div>
        </ClickAwayListener>
        : <span
          className={`text-xs group ${canEdit ? 'cursor-pointer text-gray-700 hover:text-gray-900' : 'cursor-default'}`}
          onClick={() => {
            if (canEdit) {
              setEditing(true);
            }
          }}
        >
          {task.fecha ? utcDateFormated2Digits(task.fecha, event?.timeZone) : t('Sin fecha')}
        </span>
      }
    </div>
  );
};