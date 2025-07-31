import { FC, useState } from 'react';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import ClickAwayListener from 'react-click-away-listener';
import { getDateString } from './DateTask';
import { X } from 'lucide-react';

interface Props {
  handleUpdate: (field: string, value: any) => Promise<void>;
  canEdit: boolean;
  task: Task;
}

export const DurationTask: FC<Props> = ({ handleUpdate, canEdit, task }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<boolean>(false);
  const [hours, setHours] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const [value, setValue] = useState<string>();

  // Función para convertir minutos a formato "01 h 20 m"
  const formatDuration = (totalMinutes: number): string => {
    if (!totalMinutes || totalMinutes <= 0) return '00 h 00 m';

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return `${hours.toString().padStart(2, '0')} h ${mins.toString().padStart(2, '0')} m`;
  };

  // Función para convertir formato "01 h 20 m" a minutos
  const parseDuration = (hours: string, minutes: string): number => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    return h * 60 + m;
  };

  const inputOptions = [
    {
      id: 'hours-input',
      max: '99',
      accessor: 'hours',
      nextTab: 'minutes-input',
    },
    {
      id: 'minutes-input',
      max: '59',
      accessor: 'minutes',
      nextTab: 'hours-input',
    }
  ]

  return (
    <ClickAwayListener onClickAway={() => setEditing(false)}>
      <div onClick={() => {
        if (canEdit) {
          task?.hora !== false && setEditing(true);
          // Inicializar los inputs con los valores actuales
          const totalMinutes = task.duracion as number || 0;
          const currentHours = Math.floor(totalMinutes / 60);
          const currentMinutes = totalMinutes % 60;
          setHours(currentHours.toString());
          setMinutes(currentMinutes.toString());
        }
      }} className={`h-full flex items-center space-x-1  ${(task?.hora !== false && canEdit) && "cursor-pointer"}`}>
        <span className="text-xs text-gray-500">{t('Duración')}</span>
        {editing
          ? <div className="flex items-center rounded px-0.5 border-[1px] border-gray-400 focus:border-gray-400">
            {inputOptions.map((option, index) => (
              <div key={option.id} className="flex items-center">
                <input
                  id={option.id}
                  type="number"
                  min="0"
                  max={option.max}
                  value={option.accessor === 'hours' ? hours : minutes}
                  onChange={(e) => {
                    if (e.target.value.length > 2) {
                      e.target.value = e.target.value.slice(1, 3);
                    }
                    const value = e.target.value;
                    const maxValue = parseInt(option.max);
                    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= maxValue)) {
                      if (option.accessor === 'hours') {
                        setHours(value);
                      } else {
                        setMinutes(value);
                      }
                    }
                  }}
                  onFocus={(e) => {
                    e.target.select();
                  }}
                  onBlur={async () => {
                    const totalMinutes = parseDuration(hours, minutes);
                    await handleUpdate('duracion', totalMinutes);
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const totalMinutes = parseDuration(hours, minutes);
                      await handleUpdate('duracion', totalMinutes);
                      setEditing(false);
                    } else if (e.key === 'Escape') {
                      setEditing(false);
                    } else if (e.key === 'Tab' && e.shiftKey === false) {
                      e.preventDefault();
                      document.getElementById(option.nextTab)?.focus();
                    } else if (e.key === 'Tab' && e.shiftKey) {
                      e.preventDefault();
                      const prevIndex = index === 0 ? inputOptions.length - 1 : index - 1;
                      document.getElementById(inputOptions[prevIndex].id)?.focus();
                    }
                  }}
                  placeholder="00"
                  maxLength={2}
                  className="w-[18px] px-0.5 py-0.5 text-xs focus:outline-none focus:ring-0 border-none focus:border-none text-center"
                  autoFocus={index === 0}
                />
                <span className="text-xs text-gray-800">{option.accessor === 'hours' ? 'h' : 'm'}</span>
              </div>
            ))}
            <div onClick={() => {
              setValue(null);
              handleUpdate('duracion', null)
                .then(() => {
                  setEditing(false);
                })
            }} className="-right-[6px] cursor-pointer p-[2px]">
              <div className='relative group'>
                <X className="w-3 h-3" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                  {t('Eliminar duración')}
                </div>
              </div>
            </div>
          </div>
          : <div
            className={`text-xs ${canEdit && task?.hora !== false ? 'text-gray-800 hover:text-gray-900' : ''}`}
            title={canEdit ? "Haz clic para editar duración" : "No tienes permisos para editar"}
          >
            {task?.fecha && task?.hora !== false ? formatDuration(task.duracion as number) : t('Sin duración')}
          </div>
        }
      </div>
    </ClickAwayListener>
  );
};