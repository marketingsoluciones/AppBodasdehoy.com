import React, { FC } from 'react';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { DurationTask } from './DurationTask';
import { TimeIndicators } from './TimeIndicators';

interface TimeDurationContainerProps {
  task: Task;
  canEdit: boolean;
  handleUpdate: (field: string, value: any) => Promise<void>;
}

export const TimeDurationContainer: FC<TimeDurationContainerProps> = ({ 
  task, 
  canEdit, 
  handleUpdate 
}) => {
  const { t } = useTranslation();

  if (!task.fecha) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 justify-start bg-gray-50 rounded-lg p-3">
            {/* Indicadores de Hora */}
            <TimeIndicators
        task={task}
        canEdit={canEdit}
        handleUpdate={handleUpdate}
      />

      {/* Duración */}
      <div className="flex items-center space-x-3">
        <Clock className="w-5 h-5 text-blue-600" />
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">{t('Duración')}</span>
          <DurationTask
            handleUpdate={handleUpdate}
            canEdit={canEdit}
            task={task}
          />
        </div>
      </div>


    </div>
  );
};
