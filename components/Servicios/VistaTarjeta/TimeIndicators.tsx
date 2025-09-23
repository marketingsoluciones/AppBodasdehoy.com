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
}

export const TimeIndicators: FC<TimeIndicatorsProps> = ({ task, canEdit, handleUpdate, setEditingStartTime, editingStartTime, setEditingEndTime, editingEndTime }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center space-x-6 bg-gray-50 rounded-lg p-3">
      {/* Hora de Inicio */}
      <div className="flex items-center space-x-2">
        <PlayCircle className="w-5 h-5 text-green" />
        <div>
          <span className="text-xs text-gray-500 block">{t('Inicio')}</span>
          <TimeTask
            handleUpdate={handleUpdate}
            canEdit={canEdit}
            task={task}
            setEditing={setEditingStartTime}
            editing={editingStartTime}
            uso="startTime"
          />
        </div>
      </div>
      {/* Separador */}
      <div className="w-px h-8 bg-gray-300"></div>
      {/* Hora de Fin */}
      <div className="flex items-center space-x-2">
        <StopCircle className="w-5 h-5 text-red" />
        <div>
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
          />
        </div>
      </div>
    </div>
  );
};
