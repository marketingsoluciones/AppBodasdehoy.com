import React, { FC } from 'react';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { PlayCircle, StopCircle } from 'lucide-react';
import { TimeTask } from './TimeTask';

interface TimeIndicatorsProps {
  task: Task;
  canEdit: boolean;
  handleUpdate: (field: string, value: any) => Promise<void>;
  setEditingStartTime: (editing: boolean) => void;
  editingStartTime: boolean;
  setEditingEndTime: (editing: boolean) => void;
  editingEndTime: boolean;
  ValidationEdit: boolean;
}

export const TimeIndicators: FC<TimeIndicatorsProps> = ({ task, canEdit, handleUpdate, setEditingStartTime, editingStartTime, setEditingEndTime, editingEndTime, ValidationEdit }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-3 md:space-y-0 bg-gray-50 rounded-lg p-3 w-[170px] md:w-full ">
      {/* Hora de Inicio */}
      <div className="flex items-center space-x-2  ">
        <PlayCircle className="w-5 h-5 text-green" />
        <div className='border-r border-gray-300 pr-2'>
          <span className="text-xs text-gray-500 block">{t('Inicio')}</span>
          <TimeTask
            handleUpdate={handleUpdate}
            canEdit={canEdit}
            task={task}
            setEditing={setEditingStartTime}
            editing={editingStartTime}
            uso="startTime"
            ValidationEdit={ValidationEdit}
          />
        </div>
      </div>
      {/* Separador */}
     
      {/* Hora de Fin */}
      <div className="flex items-center space-x-2  ">
        <StopCircle className="w-5 h-5 text-red" />
        <div className='border-r border-gray-300 pr-2'>
          <span className="text-xs text-gray-500 block">{t('Final')}</span>
          <TimeTask
            handleUpdate={() => {
              return Promise.resolve();
            }}
            canEdit={canEdit}
            task={task}
            setEditing={setEditingEndTime}
            editing={editingEndTime}
            uso="endTime"
            ValidationEdit={ValidationEdit}
          />
        </div>
      </div>
    </div>
  );
};
