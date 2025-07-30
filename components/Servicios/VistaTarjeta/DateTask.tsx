import { FC, useState } from 'react';
import { formatDate } from './TaskNewUtils';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import ClickAwayListener from 'react-click-away-listener';
import i18n from '../../../utils/i18n';

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
  const [blockUpdate, setBlockUpdate] = useState<boolean>(false);

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
        ? <ClickAwayListener onClickAway={() => setEditing(false)}>
          <div className="w-full flex items-center relative">
            <div onClick={async () => {
              setValue(null);
              await handleUpdate('fecha', null)
              setEditing(false);
            }} className="absolute z-10 -right-[6px] cursor-pointer p-[2px]">
              <div className='relative group'>
                <X className="w-3 h-3" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                  {t('Eliminar fecha')}
                </div>
              </div>
            </div>
            <input
              type="date"
              value={value ? value : task?.fecha ? getDateString(task.fecha) : ''}
              onChange={(e) => {
                setValue(e.currentTarget.value);
                if (!blockUpdate) {
                  const value = new Date(new Date(e.currentTarget.value).getTime() + new Date().getTimezoneOffset() * 60000)
                  if (typeof value !== "string") {
                    handleUpdate('fecha', value)
                  }
                }
                setBlockUpdate(false);
              }}
              onKeyDown={async (e) => {
                setBlockUpdate(true);
                if (e.key === 'Enter') {
                  await handleUpdate('fecha', new Date(new Date(e.currentTarget.value).getTime() + new Date().getTimezoneOffset() * 60000))
                  setEditing(false);
                } else if (e.key === 'Escape') {
                  setEditing(false);
                }
              }}
              className="px-1 py-[1px] border-none rounded text-xs focus:ring-gray-400 focus:ring-[1px] focus:outline-none transition [&::-webkit-calendar-picker-indicator]:relative [&::-webkit-calendar-picker-indicator]:-left-[11px] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              autoFocus
            />
          </div>
        </ClickAwayListener>
        : <span
          className={`text-xs ${canEdit ? 'cursor-pointer text-gray-700 hover:text-gray-900' : 'cursor-default text-gray-600'}`}
          onClick={() => {
            if (canEdit) {
              setEditing(true);
            } else {
              ht();
            }
          }}
          title={canEdit ? "Haz clic para editar fecha" : "No tienes permisos para editar"}
        >
          {task.fecha ? formatDate({ locale: navigator.language, date: task.fecha }) : t('Sin fecha')}
        </span>
      }
    </div>
  );
};