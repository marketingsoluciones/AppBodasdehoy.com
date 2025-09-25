import React, { FC, useMemo, useState } from 'react';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock } from 'lucide-react';
import { DurationTask } from './DurationTask';
import { TimeIndicators } from './TimeIndicators';
import { DateTask } from './DateTask';
import { useDateTime } from '../../../hooks/useDateTime';
import { EventContextProvider } from '../../../context';

interface TimeDurationContainerProps {
  task: Task;
  canEdit: boolean;
  handleUpdate: (field: string, value: any) => Promise<void>;
  owner?: boolean;
}

export const TimeDurationContainer: FC<TimeDurationContainerProps> = ({ task, canEdit, handleUpdate, owner }) => {
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const [editingDate, setEditingDate] = useState(false);
  const [editingStartTime, setEditingStartTime] = useState(false);
  const [editingEndTime, setEditingEndTime] = useState(false);
  const { dateTimeFormated } = useDateTime();
  const ruta = window.location.pathname;

  const ValidationEdit = useMemo(() => {
    if (["/itinerario"].includes(ruta)) {
      if (owner) {
        return true;
      } else {
        if (task.estatus || task.estatus === null) {
          if (canEdit) {
            return true;
          } else {
            return false;
          }
        }
        return false;
      }
    } else {
      return true;
    }
  }, [ruta, owner, task.estatus, canEdit]);


  if (!task.fecha) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 justify-start bg-gray-50 rounded-lg py-2 relative group">
      {/* Indicadores de Hora */}
      <div className="flex flex-col space-x-2">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500">{t('Fecha')}</span>
          <DateTask
            handleUpdate={handleUpdate}
            canEdit={canEdit}
            task={task}
            setEditing={setEditingDate}
            editing={editingDate}
            uso="itinerary"
            ValidationEdit={ValidationEdit}
          />
        </div>
        <TimeIndicators
          task={task}
          canEdit={canEdit}
          handleUpdate={handleUpdate}
          setEditingStartTime={setEditingStartTime}
          editingStartTime={editingStartTime}
          setEditingEndTime={setEditingEndTime}
          editingEndTime={editingEndTime}
          ValidationEdit={ValidationEdit}
        />
      </div>

      {/* Duración */}
      <div className="flex items-center space-x-3 translate-y-2">
        <Clock className="w-5 h-5 text-blue-600" />
        <div className="flex flex-col items-center space-x-2">
          <span className="text-xs text-gray-500">{t('Duración')}</span>
          <DurationTask
            handleUpdate={handleUpdate}
            canEdit={canEdit}
            task={task}
            ValidationEdit={ValidationEdit}
          />
        </div>
      </div>
      {task.fecha && <div className={`absolute bottom-full left-6 transform -translate-y-1/4 mb-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:delay-300 whitespace-nowrap z-10 flex flex-col ${editingDate || editingStartTime || editingEndTime ? "hidden" : ""}`}>
        <span className='font-bold text-yellow-500'>{dateTimeFormated(task.fecha, event?.timeZone)}</span>
        <span className='text-gray-100'>{dateTimeFormated(task.fecha, "UTC")}</span>
        <span className='text-gray-100'>{dateTimeFormated(task.fecha, Intl.DateTimeFormat().resolvedOptions().timeZone)} {`(${t("hora local")})`}</span>
      </div>}

    </div>
  );
};
