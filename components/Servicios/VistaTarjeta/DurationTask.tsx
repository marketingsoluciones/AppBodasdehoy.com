import { FC } from 'react';
import { Task } from '../../../utils/Interfaces';
import { readableFormatToMinutes, minutesToReadableFormat } from './TaskNewUtils';
import { useTranslation } from 'react-i18next';

interface Props {
  editingDuration: boolean;
  durationInput: string;
  setDurationInput: (value: string) => void;
  handleUpdate: (field: string, value: any) => Promise<void>;
  setEditingDuration: (value: boolean) => void;
  ht: () => void;
  canEdit: boolean;
  task: Task;
}

export const DurationTask: FC<Props> = ({ editingDuration, durationInput, setDurationInput, handleUpdate, setEditingDuration, ht, canEdit, task }) => {
  const { t } = useTranslation();
  return (
    <div className="w-[100px] h-full flex items-center">
      {editingDuration
        ? <div className="flex items-center space-x-1">
          <input
            type="text"
            value={durationInput}
            onChange={(e) => setDurationInput(e.target.value)}
            onBlur={() => {
              const minutes = readableFormatToMinutes(durationInput);
              handleUpdate('duracion', minutes);
              setEditingDuration(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const minutes = readableFormatToMinutes(durationInput);
                handleUpdate('duracion', minutes);
                setEditingDuration(false);
              } else if (e.key === 'Escape') {
                setEditingDuration(false);
              }
            }}
            placeholder="Ej: 1h 30min"
            className="w-24 px-3 py-0.5 border-gray-300 rounded-md text-xs border-[1px] focus:border-gray-400"
            autoFocus
          />
        </div>
        : <span
          className={`text-xs ${canEdit ? 'cursor-pointer text-gray-700 hover:text-gray-900' : 'cursor-default text-gray-500'}`}
          onClick={() => {
            if (canEdit) {
              setEditingDuration(true);
              setDurationInput(minutesToReadableFormat(task.duracion as number));
            } else {
              ht();
            }
          }}
          title={canEdit ? "Haz clic para editar duración" : "No tienes permisos para editar"}
        >
          {minutesToReadableFormat(task.duracion as number)}
        </span>
      }
    </div>
  );
};