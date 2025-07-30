import { FC, useState } from 'react';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import ClickAwayListener from 'react-click-away-listener';

interface Props {
  handleUpdate: (field: string, value: any) => Promise<void>;
  ht: () => void;
  canEdit: boolean;
  task: Task;
}

export const DurationTask: FC<Props> = ({ handleUpdate, ht, canEdit, task }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<boolean>(false);
  const [hours, setHours] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');

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
          setEditing(true);
          // Inicializar los inputs con los valores actuales
          const totalMinutes = task.duracion as number || 0;
          const currentHours = Math.floor(totalMinutes / 60);
          const currentMinutes = totalMinutes % 60;
          setHours(currentHours.toString());
          setMinutes(currentMinutes.toString());
        } else {
          ht();
        }
      }} className=" h-full flex items-center space-x-1 cursor-pointer">
        <span className="text-xs text-gray-500">{t('Duración')}</span>
        {editing
          ? <div className="flex items-center space-x-1">
            {inputOptions.map((option, index) => (
              <div key={option.id} className="flex items-center space-x-1">
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
                  className="w-6 px-0.5 py-0.5 border-gray-300 rounded text-xs border-[1px] focus:outline-none focus:ring-0 focus:border-gray-400 text-center"
                  autoFocus={index === 0}
                />
                <span className="text-xs text-gray-500">{option.accessor === 'hours' ? 'h' : 'm'}</span>
              </div>
            ))}
          </div>
          : <div
            className={`text-xs ${canEdit ? 'text-gray-800 hover:text-gray-900' : 'text-gray-500'}`}
            title={canEdit ? "Haz clic para editar duración" : "No tienes permisos para editar"}
          >
            {formatDuration(task.duracion as number)}
          </div>
        }
      </div>
    </ClickAwayListener>
  );
};