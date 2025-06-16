import React, { useState, useRef, useEffect } from 'react';
import { 
  Check, 
  X, 
  Edit3, 
  Calendar, 
  Clock, 
  User, 
  Flag, 
  MessageSquare,
  ChevronRight,
  Tag,
  FileText,
  MoreHorizontal,
  Paperclip,
  Download
} from 'lucide-react';
import { 
  TableCellProps, 
  TASK_STATUSES, 
  TASK_PRIORITIES 
} from './NewTypes';
import { 
  StatusDropdown, 
  PriorityDropdown, 
  DateSelector 
} from './NewDropdown';
import { ClickUpResponsableSelector } from './NewResponsableSelector';
import { ImageAvatar } from '../../Utils/ImageAvatar';
import { AuthContextProvider, EventContextProvider } from '../../../context';
import { Interweave } from 'interweave';
import { HashtagMatcher, UrlMatcher } from 'interweave-autolink';
import { TagsEditor } from './NewTagsEditor';
import { TipsEditor } from './NewTipsEditor';
import { AttachmentsEditor } from './AttachmentsEditor';
import { useTranslation } from 'react-i18next';
import { GruposResponsablesArry } from '../MicroComponente/ResponsableSelector';
import { getStorage } from 'firebase/storage';
import { downloadFile } from '../../Utils/storages';
import { useToast } from '../../../hooks/useToast';

export const TableCell: React.FC<TableCellProps> = ({
  column,
  row,
  value,
  task,
  onUpdate,
  isEditing,
  onStartEdit,
  onStopEdit,
  onCommentsClick,
  itinerarioId
}) => {
  const [editValue, setEditValue] = useState(value);
  const [showEditControls, setShowEditControls] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [showResponsableSelector, setShowResponsableSelector] = useState(false);
  const [previousValue, setPreviousValue] = useState(value);
  const cellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const { user } = AuthContextProvider();
  const { event } = EventContextProvider();
  const { t } = useTranslation();
  const storage = getStorage();
  const toast = useToast();

  useEffect(() => {
    setEditValue(value);
    setPreviousValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    // Verificar si el valor cambió antes de actualizar
    if (JSON.stringify(editValue) !== JSON.stringify(previousValue)) {
      onUpdate(editValue);
    }
    onStopEdit();
  };

  const handleCancel = () => {
    setEditValue(previousValue);
    onStopEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // Función para truncar texto con límite de caracteres
  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Función para limpiar HTML
  const stripHtml = (html: string): string => {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const renderCellContent = () => {
    switch (column.type) {
      case 'text':
        const maxLength = column.truncate || 50;
        const displayText = value || '';
        const needsTruncate = displayText.length > maxLength;
        
        return isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full px-3 py-2 border-2 border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder={t('Escribir...')}
          />
        ) : (
          <div className="px-3 py-2 relative">
            <span 
              className={`text-sm ${!value ? 'text-gray-400 italic' : 'text-gray-900 font-medium'} ${needsTruncate && !showFullText ? 'cursor-pointer hover:text-primary' : ''}`}
              onClick={(e) => {
                if (needsTruncate && !showFullText) {
                  e.stopPropagation();
                  setShowFullText(true);
                }
              }}
              title={needsTruncate && !showFullText ? displayText : ''}
            >
              {!value ? t('Sin título') : (showFullText ? displayText : truncateText(displayText, maxLength))}
            </span>
            {needsTruncate && showFullText && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullText(false);
                }}
                className="ml-2 text-xs text-primary hover:text-primary/80"
              >
                {t('Ver menos')}
              </button>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="px-3 py-2">
            <StatusDropdown
              value={value || 'pending'}
              onChange={(newValue) => {
                if (newValue !== value) onUpdate(newValue);
              }}
              size="sm"
            />
          </div>
        );

      case 'priority':
        return (
          <div className="px-3 py-2">
            <PriorityDropdown
              value={value || 'media'}
              onChange={(newValue) => {
                if (newValue !== value) onUpdate(newValue);
              }}
              size="sm"
            />
          </div>
        );

      case 'date':
        return (
          <div className="px-3 py-2">
            <DateSelector
              value={value ? new Date(value).toISOString().split('T')[0] : ''}
              onChange={(newValue) => {
                if (newValue) {
                  const newDate = new Date(newValue);
                  if (!isNaN(newDate.getTime())) {
                    onUpdate(newDate.toISOString());
                  }
                } else {
                  // Si se borra la fecha, usar fecha actual
                  onUpdate(new Date().toISOString());
                }
              }}
              placeholder={t('Sin fecha')}
            />
          </div>
        );

      case 'time':
        const timeValue = value ? new Date(value).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : '';
        
        return isEditing ? (
          <div className="px-3 py-2">
            <input
              ref={inputRef}
              type="time"
              value={editValue || ''}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="w-full px-3 py-2 border-2 border-primary rounded-md text-sm focus:outline-none min-w-[120px]"
            />
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className={`text-sm ${!timeValue ? 'text-gray-400' : ''}`}>
              {timeValue || t('Sin hora')}
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
            onBlur={handleSave}
            className="w-full px-3 py-2 border-2 border-primary rounded-md text-sm focus:outline-none"
            placeholder="0"
          />
        ) : (
          <div className="px-3 py-2">
            <span className={`text-sm ${!value ? 'text-gray-400' : ''}`}>
              {value ? `${value} min` : t('Sin duración')}
            </span>
          </div>
        );

      case 'responsable':
        const responsables = Array.isArray(value) ? value : [];
        const allUsers = [user, event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])];

        return (
          <div className="relative" ref={selectorRef}>
            <div 
              className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-gray-50 min-h-[48px]"
              onClick={(e) => {
                e.stopPropagation();
                setShowResponsableSelector(true);
              }}
            >
              {responsables.length > 0 ? (
                <div className="flex items-center space-x-2 flex-1">
                  <div className="flex -space-x-2">
                    {responsables.slice(0, 3).map((resp, index) => {
                      const userSelect = GruposResponsablesArry.find(el => 
                        el.title.toLowerCase() === resp?.toLowerCase()
                      ) ?? allUsers.find(el => 
                        el?.displayName?.toLowerCase() === resp?.toLowerCase()
                      );

                      return (
                        <div 
                          key={index} 
                          className="w-6 h-6 rounded-full border-2 border-white overflow-hidden hover:z-10 transition-all"
                          title={resp}
                        >
                          <ImageAvatar user={userSelect} />
                        </div>
                      );
                    })}
                    {responsables.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                        <span className="text-xs text-gray-600 font-medium">+{responsables.length - 3}</span>
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
                <div className="flex items-center space-x-2 text-gray-400">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{t('Sin asignar')}</span>
                </div>
              )}
            </div>
            
            {showResponsableSelector && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/20" onClick={() => setShowResponsableSelector(false)} />
                <div className="relative">
                  <ClickUpResponsableSelector
                    value={responsables}
                    onChange={(newValue) => {
                      if (JSON.stringify(newValue) !== JSON.stringify(responsables)) {
                        onUpdate(newValue);
                      }
                      setShowResponsableSelector(false);
                    }}
                    onClose={() => setShowResponsableSelector(false)}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'tags':
        return (
          <div className="p-2">
            <TagsEditor
              value={value || []}
              onChange={(newValue) => {
                if (JSON.stringify(newValue) !== JSON.stringify(value || [])) {
                  onUpdate(newValue);
                }
              }}
              isEditing={isEditing}
              onStartEdit={onStartEdit}
              onStopEdit={onStopEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              placeholder={t('Agregar etiquetas...')}
            />
          </div>
        );

      case 'tips':
        return (
          <div className="p-2">
            <TipsEditor
              value={value || ''}
              onChange={setEditValue}
              isEditing={isEditing}
              onStartEdit={onStartEdit}
              onStopEdit={onStopEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              placeholder={t('Agregar descripción...')}
              maxTooltipLength={200}
            />
          </div>
        );

      case 'attachments':
        return (
          <div className="relative">
            <AttachmentsEditor
              value={value || []}
              onChange={(newValue) => {
                if (JSON.stringify(newValue) !== JSON.stringify(value || [])) {
                  onUpdate(newValue);
                }
              }}
              taskId={task._id}
              isEditing={isEditing}
              onStartEdit={onStartEdit}
              onStopEdit={onStopEdit}
              task={task}
              itinerarioId={itinerarioId || ''}
            />
          </div>
        );

      case 'comments':
        const commentsCount = Array.isArray(value) ? value.length : 0;
        return (
          <div 
            className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-gray-50 group"
            onClick={(e) => {
              e.stopPropagation();
              onCommentsClick && onCommentsClick();
            }}
          >
            <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-primary" />
            <span className={`text-sm ${commentsCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {commentsCount || '-'}
            </span>
            {commentsCount > 0 && (
              <ChevronRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        );

      default:
        return (
          <div className="px-3 py-2">
            <span className={`text-sm ${!value ? 'text-gray-400' : ''}`}>
              {value || t('Sin información')}
            </span>
          </div>
        );
    }
  };

  const canEdit = ['text', 'number', 'time', 'tips', 'tags', 'attachments'].includes(column.type);

  return (
    <div
      ref={cellRef}
      className={`
        relative group h-full min-h-[48px] flex items-center
        ${isEditing ? 'bg-primary/5 ring-2 ring-primary/20' : ''}
        ${canEdit && !isEditing ? 'hover:bg-gray-50' : ''}
        ${column.type === 'comments' || column.type === 'attachments' || column.type === 'responsable' ? '' : canEdit ? 'cursor-text' : 'cursor-default'}
      `}
      onClick={() => {
        if (canEdit && !isEditing && column.type !== 'comments' && column.type !== 'responsable' && column.type !== 'attachments') {
          onStartEdit();
        }
      }}
      onMouseEnter={() => setShowEditControls(true)}
      onMouseLeave={() => setShowEditControls(false)}
    >
      <div className="flex-1 min-w-0 w-full">
        {renderCellContent()}
      </div>

      {/* Controles de edición inline */}
      {isEditing && canEdit && ['text', 'number', 'time'].includes(column.type) && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 bg-white rounded-md shadow-sm border border-gray-200 p-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            className="p-1 text-green hover:bg-green-50 rounded transition-colors"
            title="Guardar"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCancel();
            }}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Indicador de edición */}
      {!isEditing && canEdit && showEditControls && column.type !== 'comments' && column.type !== 'tips' && column.type !== 'tags' && column.type !== 'responsable' && column.type !== 'attachments' && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit3 className="w-3 h-3 text-gray-400" />
        </div>
      )}
    </div>
  );
};