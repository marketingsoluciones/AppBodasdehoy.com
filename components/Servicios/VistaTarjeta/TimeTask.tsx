import { FC, useEffect, useState } from 'react';
import { Task } from '../../../utils/Interfaces';
import { Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ClickAwayListener from 'react-click-away-listener';
import { useDateTime } from '../../../hooks/useDateTime';
import { EventContextProvider } from '../../../context';

interface TimeTaskProps {
  handleUpdate: (field: string, value: any) => Promise<void>;
  canEdit: boolean;
  task: Task;
  setEditing: (editing: boolean) => void;
  editing: boolean;
}

export const TimeTask: FC<TimeTaskProps> = ({ handleUpdate, canEdit, task, setEditing, editing }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>();
  const [blockUpdate, setBlockUpdate] = useState<boolean>(false);
  const { utcDateTime, is12HourFormat, dateTimeFormated } = useDateTime()
  const { event } = EventContextProvider()

  // const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // // Función debounce para manejar las actualizaciones
  // const debouncedUpdate = useCallback(async (timeValue: string) => {
  //   if (debounceRef.current) {
  //     clearTimeout(debounceRef.current);
  //   }
  //   debounceRef.current = setTimeout(async () => {
  //     if (!blockUpdate) {
  //       const value = new Date(`${utcDateTime(task.fecha)}T${timeValue}:00.000Z`)
  //       if (typeof value !== "string") {
  //         await handleUpdate('fecha', value)
  //         await handleUpdate('horaActiva', true)
  //         setValue(null);
  //       }
  //     }
  //     setBlockUpdate(false);
  //   }, 600); // 500ms de delay
  // }, [blockUpdate, utcDateTime, task.fecha, handleUpdate]);

  // // Cleanup del timeout al desmontar el componente
  // useEffect(() => {
  //   return () => {
  //     if (debounceRef.current) {
  //       clearTimeout(debounceRef.current);
  //     }
  //   };
  // }, []);

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
                const value = new Date(`${utcDateTime(task.fecha)}T00:00:00.000Z`)
                handleUpdate('fecha', value)
                handleUpdate('duracion', 0)
              } else {
                setEditing(false);
              }
            }} className="absolute z-10 -right-[6px] cursor-pointer p-[2px]">
              <div className='relative group'>
                <X className="w-3 h-3" />
                <div id={`time-task-tooltip_${task._id}`} className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity whitespace-nowrap z-20">
                  {t('Eliminar hora')}
                </div>
              </div>
            </div>
            <input
              type="time"
              value={value ? value : task?.horaActiva !== false ? new Date(task.fecha).toJSON().slice(-13, -8) : undefined}
              defaultValue={'00:00'}
              onClickCapture={async (e) => {
                const valir = new Date(task.fecha).toJSON().slice(-13, -8) === '00:00'
                if (e.currentTarget.value && valir) {
                  await handleUpdate('horaActiva', true)
                }
              }}
              // onChange={async (e) => {
              //   setValue(e.currentTarget.value);
              //   // Usar la función debounce
              //   debouncedUpdate(e.currentTarget.value);
              // }}
              onChange={async (e) => {
                setValue(e.currentTarget.value);
                //funcion debounce
                // if (!blockUpdate) {
                // const value = new Date(`${utcDateTime(task.fecha)}T${e.currentTarget.value}:00.000Z`)
                // setValue(e.currentTarget.value);
                // if (typeof value !== "string") {
                //   await handleUpdate('fecha', value)
                //   await handleUpdate('horaActiva', true)
                //   setValue(null);
                // }
                // }
                setBlockUpdate(false);
              }}
              onKeyDown={async (e) => {
                setBlockUpdate(true);
                if (e.key === 'Enter') {
                  const value = `${utcDateTime(task.fecha)}T${e.currentTarget.value}:00.000Z`
                  await handleUpdate('fecha', value)
                  await handleUpdate('horaActiva', true)
                  setEditing(false);
                } else if (e.key === 'Escape') {
                  setBlockUpdate(false);
                  setEditing(false);
                  setValue(null);
                }
              }}
              onBlur={async (e) => {
                const valir = e.currentTarget.value !== new Date(task.fecha).toJSON().slice(-13, -8)
                if (e.currentTarget.value && valir) {
                  const value = `${utcDateTime(task.fecha)}T${e.currentTarget.value}:00.000Z`
                  await handleUpdate('fecha', value)
                  await handleUpdate('horaActiva', true)
                  setValue(null);
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
          className={`flex items-center space-x-1 ${canEdit && task?.fecha ? 'cursor-pointer hover:text-gray-900' : task?.fecha ? `text-gray-00` : ''}`}>
          <Clock className="w-4 h-4 text-gray-600" />
          <span className={`flex items-center space-x-1 text-xs`}>
            {task?.fecha && task?.horaActiva !== false
              ? is12HourFormat()
                ? dateTimeFormated(task.fecha, event.timeZone).slice(11, 24)
                : dateTimeFormated(task.fecha, event.timeZone).slice(11, 17)
              : t('Sin hora')}
          </span>
        </div>
      }
    </div>
  );
};