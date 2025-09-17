import React, { FC, useState, useEffect } from 'react';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { PlayCircle, StopCircle, Clock } from 'lucide-react';
import ClickAwayListener from 'react-click-away-listener';
import { formatTime, calculateEndTime } from './TaskNewUtils';

interface TimeIndicatorsProps {
  task: Task;
  canEdit: boolean;
  handleUpdate: (field: string, value: any) => Promise<void>;
}

export const TimeIndicators: FC<TimeIndicatorsProps> = ({ task, canEdit, handleUpdate }) => {
  const { t } = useTranslation();
  const [editingStartTime, setEditingStartTime] = useState(false);
  const [editingEndTime, setEditingEndTime] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');

  // Inicializar inputs cuando se abre la edición
  useEffect(() => {
    if (editingStartTime && task.fecha) {
      setStartTimeInput(formatTime(task.fecha));
    }
  }, [editingStartTime, task.fecha]);

  useEffect(() => {
    if (editingEndTime && task.fecha && task.duracion) {
      setEndTimeInput(calculateEndTime(task.fecha, task.duracion as number));
    }
  }, [editingEndTime, task.fecha, task.duracion]);

  // Función para convertir hora en formato HH:MM a minutos desde medianoche
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Función para convertir minutos desde medianoche a formato HH:MM
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Función para actualizar hora de inicio
  const updateStartTime = async (newStartTime: string) => {
    if (!task.fecha || !task.duracion) return;

    const currentStartMinutes = timeToMinutes(formatTime(task.fecha));
    const newStartMinutes = timeToMinutes(newStartTime);
    const duration = task.duracion as number;

    // Actualizar fecha (mantener la fecha pero cambiar la hora)
    const newDate = new Date(task.fecha);
    newDate.setHours(Math.floor(newStartMinutes / 60), newStartMinutes % 60, 0, 0);

    await handleUpdate('fecha', newDate.toISOString());
  };

  // Función para actualizar hora de fin
  const updateEndTime = async (newEndTime: string) => {
    if (!task.fecha) return;

    const currentStartMinutes = timeToMinutes(formatTime(task.fecha));
    const newEndMinutes = timeToMinutes(newEndTime);
    
    // Calcular nueva duración
    let newDuration = newEndMinutes - currentStartMinutes;
    if (newDuration < 0) {
      newDuration += 24 * 60; // Si es negativo, asumir que es del día siguiente
    }

    await handleUpdate('duracion', newDuration);
  };

  // Función para actualizar duración basada en hora de fin
  const updateDurationFromEndTime = async (newEndTime: string) => {
    if (!task.fecha) return;

    const startMinutes = timeToMinutes(formatTime(task.fecha));
    const endMinutes = timeToMinutes(newEndTime);
    
    let newDuration = endMinutes - startMinutes;
    if (newDuration < 0) {
      newDuration += 24 * 60;
    }

    await handleUpdate('duracion', newDuration);
  };

  if (!task.fecha || !task.duracion) {
    return null;
  }

  return (
    <div className="flex items-center space-x-6 bg-gray-50 rounded-lg p-3">
      {/* Hora de Inicio */}
      <div className="flex items-center space-x-2">
        <PlayCircle className="w-5 h-5 text-green-600" />
        <div>
          <span className="text-xs text-gray-500 block">{t('Inicio')}</span>
          {editingStartTime ? (
            <ClickAwayListener onClickAway={() => setEditingStartTime(false)}>
              <input
                type="time"
                value={startTimeInput}
                onChange={(e) => setStartTimeInput(e.target.value)}
                onBlur={async () => {
                  await updateStartTime(startTimeInput);
                  setEditingStartTime(false);
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    await updateStartTime(startTimeInput);
                    setEditingStartTime(false);
                  } else if (e.key === 'Escape') {
                    setEditingStartTime(false);
                  }
                }}
                className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </ClickAwayListener>
          ) : (
            <span
              className={`text-sm font-medium ${canEdit ? 'cursor-pointer text-gray-900 hover:text-primary' : 'text-gray-900'}`}
              onClick={() => canEdit && setEditingStartTime(true)}
              title={canEdit ? "Haz clic para editar hora de inicio" : ""}
            >
              {formatTime(task.fecha)}
            </span>
          )}
        </div>
      </div>

      {/* Separador */}
      <div className="w-px h-8 bg-gray-300"></div>

      {/* Hora de Fin */}
      <div className="flex items-center space-x-2">
        <StopCircle className="w-5 h-5 text-red-600" />
        <div>
          <span className="text-xs text-gray-500 block">{t('Final')}</span>
          {editingEndTime ? (
            <ClickAwayListener onClickAway={() => setEditingEndTime(false)}>
              <input
                type="time"
                value={endTimeInput}
                onChange={(e) => setEndTimeInput(e.target.value)}
                onBlur={async () => {
                  await updateDurationFromEndTime(endTimeInput);
                  setEditingEndTime(false);
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    await updateDurationFromEndTime(endTimeInput);
                    setEditingEndTime(false);
                  } else if (e.key === 'Escape') {
                    setEditingEndTime(false);
                  }
                }}
                className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </ClickAwayListener>
          ) : (
            <span
              className={`text-sm font-medium ${canEdit ? 'cursor-pointer text-gray-900 hover:text-primary' : 'text-gray-900'}`}
              onClick={() => canEdit && setEditingEndTime(true)}
              title={canEdit ? "Haz clic para editar hora de fin" : ""}
            >
              {calculateEndTime(task.fecha, task.duracion as number)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
