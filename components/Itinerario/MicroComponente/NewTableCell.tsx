import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Edit3, Calendar, Clock, User, Flag } from 'lucide-react';
import { 
  ClickUpCellProps, 
  TASK_STATUSES, 
  TASK_PRIORITIES 
} from './NewTypes';
import { 
  StatusDropdown, 
  PriorityDropdown, 
  DateSelector 
} from './NewDropdown';
import { MyEditor } from '../MicroComponente/QuillText';
import { GruposResponsablesArry } from '../MicroComponente/ResponsableSelector';
import { ImageAvatar } from '../../Utils/ImageAvatar';
import { AuthContextProvider, EventContextProvider } from '../../../context';

export const ClickUpTableCell: React.FC<ClickUpCellProps> = ({
  column,
  row,
  value,
  onUpdate,
  isEditing,
  onStartEdit,
  onStopEdit
}) => {
  const [editValue, setEditValue] = useState(value);
  const [showEditControls, setShowEditControls] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = AuthContextProvider();
  const { event } = EventContextProvider();

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onUpdate(editValue);
    onStopEdit();
  };

  const handleCancel = () => {
    setEditValue(value);
    onStopEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const renderCellContent = () => {
    switch (column.type) {
      case 'text':
        return isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none"
            placeholder="Escribir..."
          />
        ) : (
          <span className={`truncate ${!value ? 'text-gray-400' : ''}`}>
            {value || 'Sin información'}
          </span>
        );

      case 'select':
        return (
          <StatusDropdown
            value={value || 'pending'}
            onChange={(newValue) => onUpdate(newValue)}
            size="sm"
          />
        );

      case 'priority':
        return (
          <PriorityDropdown
            value={value || 'normal'}
            onChange={(newValue) => onUpdate(newValue)}
            size="sm"
          />
        );

      case 'date':
        return (
          <DateSelector
            value={value}
            onChange={(newValue) => onUpdate(newValue)}
            placeholder="Sin fecha"
          />
        );

      case 'time':
        return isEditing ? (
          <input
            ref={inputRef}
            type="time"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none"
          />
        ) : (
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className={!value ? 'text-gray-400' : ''}>
              {value || 'Sin hora'}
            </span>
          </div>
        );

      case 'number':
        return isEditing ? (
          <input
            ref={inputRef}
            type="number"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none"
            placeholder="0"
          />
        ) : (
          <span className={!value ? 'text-gray-400' : ''}>
            {value || 'Sin duración'}
          </span>
        );

      case 'user':
        const responsables = Array.isArray(value) ? value : [];
        const allUsers = [user, event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])];

        return (
          <div className="flex items-center space-x-2 min-h-[32px]">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {responsables.length > 0 ? (
              <div className="flex items-center space-x-1 flex-1">
                <div className="flex -space-x-1">
                  {responsables.slice(0, 3).map((resp, index) => {
                    const userSelect = GruposResponsablesArry.find(el => 
                      el.title.toLowerCase() === resp?.toLowerCase()
                    ) ?? allUsers.find(el => 
                      el?.displayName?.toLowerCase() === resp?.toLowerCase()
                    );

                    return (
                      <div key={index} className="w-6 h-6 rounded-full border-[1px] border-gray-300 overflow-hidden">
                        <ImageAvatar user={userSelect} />
                      </div>
                    );
                  })}
                  {responsables.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-100 border-[1px] border-gray-300 flex items-center justify-center">
                      <span className="text-xs text-gray-600">+{responsables.length - 3}</span>
                    </div>
                  )}
                </div>
                {isExpanded && (
                  <div className="ml-2 text-xs text-gray-600">
                    {responsables.join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-400 flex-1">Sin asignar</span>
            )}
          </div>
        );

      case 'tags':
        const tags = Array.isArray(value) ? value : [];
        
        return (
          <div className="flex items-center space-x-2 min-h-[32px]">
            {tags.length > 0 ? (
              <div className="flex items-center space-x-1 flex-wrap">
                {tags.slice(0, isExpanded ? tags.length : 2).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 2 && !isExpanded && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                  >
                    +{tags.length - 2}
                  </button>
                )}
                {isExpanded && tags.length > 2 && (
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                  >
                    Menos
                  </button>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-400">Sin etiquetas</span>
            )}
          </div>
        );

      case 'editor':
        return (
          <div className="w-full">
            {isEditing ? (
              <div className="w-full max-h-32 overflow-y-auto">
                <MyEditor
                  name="tips"
                  value={editValue || ''}
                  onChange={(newValue) => setEditValue(newValue)}
                />
              </div>
            ) : (
              <div 
                className="w-full cursor-text"
                onClick={() => !isEditing && onStartEdit()}
              >
                {value ? (
                  <div 
                    className="text-sm text-gray-700 max-h-16 overflow-hidden"
                    dangerouslySetInnerHTML={{ 
                      __html: value.length > 100 ? `${value.substring(0, 100)}...` : value 
                    }}
                  />
                ) : (
                  <span className="text-sm text-gray-400">Sin información</span>
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <span className={`truncate ${!value ? 'text-gray-400' : ''}`}>
            {value || 'Sin información'}
          </span>
        );
    }
  };

  const canEdit = ['text', 'number', 'time', 'editor'].includes(column.type);

  return (
    <div
      ref={cellRef}
      className={`
        relative group h-auto min-h-[40px] flex items-center px-2 py-1 min-w-0
        ${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}
        ${canEdit ? 'cursor-text' : 'cursor-default'}
      `}
      onClick={() => {
        if (canEdit && !isEditing) {
          onStartEdit();
        }
      }}
      onMouseEnter={() => setShowEditControls(true)}
      onMouseLeave={() => setShowEditControls(false)}
    >
      <div className="flex-1 min-w-0 w-full">
        {renderCellContent()}
      </div>

      {/* Controles de edición */}
      {isEditing && canEdit && (
        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            className="p-1 text-green-600 hover:bg-green-100 rounded"
            title="Guardar"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCancel();
            }}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
            title="Cancelar"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Indicador de edición para celdas editables */}
      {!isEditing && canEdit && showEditControls && (
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex-shrink-0">
          <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );
};

// Componente para renderizar valores con formato específico - ACTUALIZADO
export const CellValueRenderer: React.FC<{
  type: string;
  value: any;
  options?: any[];
}> = ({ type, value, options }) => {
  const { user } = AuthContextProvider();
  const { event } = EventContextProvider();

  switch (type) {
    case 'status':
      const status = TASK_STATUSES.find(s => s.value === value);
      return status ? (
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${status.color}`} />
          <span className="text-sm">{status.label}</span>
        </div>
      ) : (
        <span className="text-gray-400 text-sm">Sin estado</span>
      );

    case 'priority':
      const priority = TASK_PRIORITIES.find(p => p.value === value);
      return priority ? (
        <div className="flex items-center space-x-2">
          <Flag className={`w-3 h-3 ${priority.color.replace('bg-', 'text-')}`} />
          <span className="text-sm">{priority.label}</span>
        </div>
      ) : (
        <span className="text-gray-400 text-sm">Sin prioridad</span>
      );

    case 'date':
      return value ? (
        <div className="flex items-center space-x-2">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-sm">
            {new Date(value).toLocaleDateString('es-ES')}
          </span>
        </div>
      ) : (
        <span className="text-gray-400 text-sm">Sin fecha</span>
      );

    case 'duration':
      return (
        <div className="flex items-center space-x-2">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-sm">
            {value ? `${value} min` : 'Sin duración'}
          </span>
        </div>
      );

    case 'user':
      const responsables = Array.isArray(value) ? value : [];
      const allUsers = [user, event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])];
      
      return responsables.length > 0 ? (
        <div className="flex items-center space-x-2">
          <User className="w-3 h-3 text-gray-400" />
          <div className="flex -space-x-1">
            {responsables.slice(0, 3).map((resp, index) => {
              const userSelect = GruposResponsablesArry.find(el => 
                el.title.toLowerCase() === resp?.toLowerCase()
              ) ?? allUsers.find(el => 
                el?.displayName?.toLowerCase() === resp?.toLowerCase()
              );

              return (
                <div key={index} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden">
                  <ImageAvatar user={userSelect} />
                </div>
              );
            })}
            {responsables.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                <span className="text-xs text-gray-600">+{responsables.length - 3}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <span className="text-gray-400 text-sm">Sin asignar</span>
      );

    case 'tags':
      return Array.isArray(value) && value.length > 0 ? (
        <div className="flex items-center space-x-1">
          {value.slice(0, 2).map((tag, index) => (
            <span
              key={`tag-${index}-${tag}`}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {value.length > 2 && (
            <span className="text-xs text-gray-500">
              +{value.length - 2}
            </span>
          )}
        </div>
      ) : (
        <span className="text-gray-400 text-sm">Sin etiquetas</span>
      );

    default:
      return (
        <span className={`text-sm ${!value ? 'text-gray-400' : ''}`}>
          {value || 'Sin información'}
        </span>
      );
  }
};