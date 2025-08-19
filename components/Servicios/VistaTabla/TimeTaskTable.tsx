import { FC, useState, useEffect } from 'react';
import { Task } from '../../../utils/Interfaces';
import { Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ClickAwayListener from 'react-click-away-listener';

// Funciones auxiliares
const formatTime = (date: Date | string) => {
  if (!date) return '';
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getDateString = (date: Date | string) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface TimeTaskTableProps {
  value: any; // La fecha completa
  onChange: (value: any, additionalUpdates?: any) => void;
  canEdit: boolean;
  task: Task;
}

export const TimeTaskTable: FC<TimeTaskTableProps> = ({ 
  value, 
  onChange, 
  canEdit, 
  task 
}) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<boolean>(false);
  const [localTime, setLocalTime] = useState<string>('');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  
  // Actualizar el tiempo local cuando cambia el valor o task
  useEffect(() => {
    if (value && task?.horaActiva !== false) {
      setLocalTime(formatTime(value));
    } else {
      setLocalTime('');
    }
  }, [value, task?.horaActiva]);

  const handleTimeChange = (newTime: string, shouldSave: boolean = false) => {
    if (!newTime) return;
    
    setLocalTime(newTime);
    setHasChanges(true);
    
    // Si shouldSave es true o si queremos actualizar inmediatamente
    if (shouldSave) {
      // Crear nueva fecha con la hora actualizada
      const dateStr = getDateString(value || task.fecha);
      const newDateTime = new Date(`${dateStr}T${newTime}`);
      
      // Actualizar el valor con horaActiva = true
      onChange(newDateTime, { horaActiva: true });
      setHasChanges(false);
    }
  };

  const handleRemoveTime = () => {
    // Establecer fecha sin hora (00:00)
    const dateStr = getDateString(value || task.fecha);
    const newDateTime = new Date(`${dateStr}T00:00`);
    
    // Actualizar con horaActiva = false
    onChange(newDateTime, { horaActiva: false });
    
    setEditing(false);
    setLocalTime('');
    setHasChanges(false);
  };

  const handleSave = () => {
    if (localTime && hasChanges) {
      const dateStr = getDateString(value || task.fecha);
      const newDateTime = new Date(`${dateStr}T${localTime}`);
      onChange(newDateTime, { horaActiva: true });
    }
    setEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    // Restaurar el valor original
    if (value && task?.horaActiva !== false) {
      setLocalTime(formatTime(value));
    } else {
      setLocalTime('');
    }
    setEditing(false);
    setHasChanges(false);
  };

  // Si no hay fecha, no mostrar nada editable
  if (!task?.fecha && !value) {
    return (
      <div className="flex items-center space-x-1 text-gray-400">
        <Clock className="w-4 h-4" />
        <span className="text-sm">{t('Sin fecha')}</span>
      </div>
    );
  }

  if (editing && canEdit) {
    return (
      <ClickAwayListener onClickAway={() => {
        if (hasChanges) {
          handleSave();
        } else {
          handleCancel();
        }
      }}>
        <div className="flex items-center space-x-1 relative">
          <Clock className="w-4 h-4 text-gray-600" />
          <input
            type="time"
            value={localTime}
            onChange={(e) => {
              const newTime = e.target.value;
              handleTimeChange(newTime, false); // No guardar automáticamente en onChange
            }}
            onBlur={() => {
              if (hasChanges && localTime) {
                handleSave();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
              }
            }}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            style={{ width: '90px' }}
            autoFocus
          />
{/*           {localTime && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTime();
              }}
              className="absolute -right-5 p-0.5 hover:bg-gray-100 rounded"
              title={t('Eliminar hora')}
            >
              <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
            </button>
          )} */}
        </div>
      </ClickAwayListener>
    );
  }

  return (
    <div 
      onClick={() => {
        if (canEdit && (task?.fecha || value)) {
          setEditing(true);
          // Si no hay hora activa, inicializar con hora actual
          if (task?.horaActiva === false || !localTime) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            setLocalTime(currentTime);
          }
        }
      }}
      className={`flex items-center space-x-1 ${
        canEdit && (task?.fecha || value) ? 'cursor-pointer hover:text-primary' : ''
      }`}
      title={canEdit ? t('Haz clic para editar hora') : ''}
    >
      <Clock className="w-4 h-4 text-gray-600" />
      <span className="text-sm">
        {value && task?.horaActiva !== false 
          ? formatTime(value) 
          : t('Sin hora')
        }
      </span>
    </div>
  );
};