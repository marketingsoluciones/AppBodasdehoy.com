import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, X, Check, User, Calendar } from 'lucide-react';
import { TableDropdownProps, SelectOption, TASK_STATUSES, TASK_PRIORITIES } from './NewTypes';
import { useTranslation } from 'react-i18next';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { isStudioPathname } from '../../../utils/studioPaths';

export const TableDropdown: React.FC<TableDropdownProps> = ({ options, value, onChange, placeholder = "Seleccionar...", multiple = false, searchable = false, size = 'md' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const filteredOptions = searchable
    ? options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : options;

  const selectedOptions = multiple
    ? options.filter(option => (value as string[]).includes(option.value))
    : options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: SelectOption) => {
    if (multiple) {
      const currentValues = value as string[];
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter(v => v !== option.value)
        : [...currentValues, option.value];
      onChange(newValues);
    } else {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-2 py-1 text-xs';
      case 'lg': return 'px-4 py-3 text-base';
      default: return 'px-3 py-1.5 text-sm';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between border border-gray-300 rounded-md
          hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20
          transition-colors ${getSizeClasses()}
        `}
      >
        <span className="flex items-center space-x-2 truncate">
          {multiple ? (
            selectedOptions && (selectedOptions as SelectOption[]).length > 0 ? (
              <span>{(selectedOptions as SelectOption[]).length} {t('seleccionados')}</span>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )
          ) : (
            selectedOptions ? (
              <div className="flex items-center space-x-2">
                {(selectedOptions as SelectOption).color && (
                  <div className={`w-3 h-3 rounded-full ${(selectedOptions as SelectOption).color}`} />
                )}
                <span>{(selectedOptions as SelectOption).label}</span>
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('Buscar...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">{t('No hay opciones')}</div>
            ) : (
              filteredOptions.map((option, optionIndex) => {
                const isSelected = multiple
                  ? (value as string[]).includes(option.value)
                  : value === option.value;

                return (
                  <button
                    key={option.value || `option-${optionIndex}`}
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-100
                      ${isSelected ? 'bg-primary/10 text-primary' : 'text-gray-700'}
                      transition-colors
                    `}
                  >
                    {multiple && (
                      <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                        }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    )}

                    {option.color && (
                      <div className={`w-3 h-3 rounded-full ${option.color}`} />
                    )}

                    {option.icon && (
                      <div className="w-4 h-4">{option.icon}</div>
                    )}

                    <span className="flex-1 truncate">{option.label}</span>

                    {!multiple && isSelected && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Dropdown especializado para estados
const useStudioDrop = () => typeof window !== "undefined"
  && isStudioPathname(window.location.pathname)
  && new URLSearchParams(window.location.search).get("studio") !== "legacy";

// Estado = chip de color (fondo suave). Prioridad = solo texto de color. Fiel a
// tareasvistatabla_1.html: sin caja de dropdown; la edición se hace abriendo la fila.
const EST_CHIP: Record<string, [string, string, string]> = {
  pending: ["#f0f0f2", "#3A3A42", "#3A3A42"], in_progress: ["#FCE7F0", "#D83E7C", "#EF5B94"],
  completed: ["#E4F5EE", "#2FB37E", "#2FB37E"], blocked: ["#FBE3ED", "#D83E7C", "#D83E7C"],
};
const PRIO_TXT: Record<string, string> = { alta: "#D83E7C", media: "#8F6E14", baja: "#2FB37E" };

export const StatusDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, onChange, size = 'md' }) => {
  const { t } = useTranslation();
  if (useStudioDrop()) {
    const opt = TASK_STATUSES.find((o: any) => o.value === (value || 'pending')) || TASK_STATUSES[0];
    const [bg, fg, dot] = EST_CHIP[String(opt.value)] ?? EST_CHIP.pending;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: 12, background: bg, color: fg, font: "600 11px Poppins", whiteSpace: "nowrap" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flex: "none" }} />
        {t(opt.label)}
      </span>
    );
  }
  return (
    <TableDropdown
      options={TASK_STATUSES}
      value={value}
      onChange={onChange as any}
      placeholder="Sin estado"
      size={size}
    />
  );
};

// Dropdown especializado para prioridades
export const PriorityDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, onChange, size = 'md' }) => {
  const { t } = useTranslation();
  if (useStudioDrop()) {
    const opt = TASK_PRIORITIES.find((o: any) => o.value === (value || 'media')) || TASK_PRIORITIES[0];
    return (
      <span style={{ font: "600 12px Poppins", color: PRIO_TXT[String(opt.value)] ?? "#8F6E14", whiteSpace: "nowrap" }}>
        {t(opt.label)}
      </span>
    );
  }
  return (
    <TableDropdown
      options={TASK_PRIORITIES}
      value={value}
      onChange={onChange as any}
      placeholder="Sin prioridad"
      size={size}
    />
  );
};

// Dropdown para asignados
export const AssigneeDropdown: React.FC<{
  value: string[];
  onChange: (value: string[]) => void;
  users: { id: string; name: string; avatar?: string }[];
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, onChange, users, size = 'md' }) => {
  const userOptions: SelectOption[] = users.map(user => ({
    value: user.id,
    label: user.name,
    icon: user.avatar ? (
      <img src={user.avatar} alt={user.name} className="w-4 h-4 rounded-full" />
    ) : (
      <User className="w-4 h-4" />
    )
  }));

  return (
    <TableDropdown
      options={userOptions}
      value={value}
      onChange={onChange as any}
      placeholder="Sin asignar"
      multiple
      searchable
      size={size}
    />
  );
};

// Selector de fecha personalizado
export const DateSelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  // Nuevas props necesarias:
  task?: any;
  event?: any;
  itinerarioId?: string;
  config?: any;
  onUpdate?: (value: any) => void;
  setEvent?: (fn: any) => void;
  toast?: any;
  t?: any;
}> = ({
  value,
  onChange,
  placeholder = "Sin fecha",
  task,
  event,
  itinerarioId,
  config,
  onUpdate,
  setEvent,
  toast,
  t
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(value);

    // Sincronizar el estado interno con la prop value
    useEffect(() => {
      setSelectedDate(value);
    }, [value]);

    const formatDate = (dateString: string) => {
      if (!dateString) return placeholder;
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = e.target.value;
      setSelectedDate(newDate);
      onChange(newDate);
      setIsOpen(false);
    };

    // Tu función para eliminar la fecha
    const handleDeleteDate = useCallback(async () => {
      if (!event || !task || !config || !itinerarioId) {
        toast && toast('error', t ? t('Faltan datos para eliminar la fecha') : 'Faltan datos para eliminar la fecha');
        return;
      }
      try {
        await fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerarioId,
            taskID: task._id,
            variable: "fecha",
            valor: null
          },
          domain: config.domain
        });

        onUpdate && onUpdate(null);

        setEvent && setEvent((prevEvent: any) => {
          const newEvent = { ...prevEvent };
          const itineraryIndex = newEvent.itinerarios_array.findIndex(
            (it: any) => it._id === itinerarioId
          );

          if (itineraryIndex !== -1) {
            const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks.findIndex(
              (t: any) => t._id === task._id
            );

            if (taskIndex !== -1) {
              newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex].fecha = null;
            }
          }

          return newEvent;
        });

        toast && toast('success', t ? t('Fecha eliminada') : 'Fecha eliminada');
      } catch (error) {
        console.error('Error al eliminar fecha:', error);
        toast && toast('error', t ? t('Error al eliminar la fecha') : 'Error al eliminar la fecha');
      }
    }, [task, event, itinerarioId, config, onUpdate, setEvent, toast, t]);

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 border border-gray-300 rounded-md hover:border-gray-400 text-sm transition-colors"
        >
          <span className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className={value ? 'text-gray-700' : 'text-gray-500'}>
              {formatDate(value)}
            </span>
          </span>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteDate();
                setSelectedDate('');
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 p-3 bg-white border border-gray-300 rounded-md shadow-lg">
            <input
              type="date"
              value={selectedDate || ''}
              onChange={handleDateChange}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>
        )}
      </div>
    );
  };

export const DateTask: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = "Sin fecha" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => { setEditValue(value); }, [value]);

  const formatDate = (dateString: string) => {
    if (!dateString) return placeholder;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsOpen(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsOpen(false);
      if (editValue !== value) {
        onChange(editValue);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setEditValue(value);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue('');
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="px-3 py-2 flex items-center gap-2 cursor-not-allowed" onClick={() => {
        //  setIsOpen(true)
      }}>
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className={value ? 'text-gray-700' : 'text-gray-500'}>
          {formatDate(value)}
        </span>
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 p-3 bg-white border border-gray-300 rounded-md shadow-lg">
          <input
            type="date"
            value={editValue || ''}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
        </div>
      )}
    </div>
  );
};