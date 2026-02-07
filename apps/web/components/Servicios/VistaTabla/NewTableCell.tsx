import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Edit3, User, } from 'lucide-react';
import { TableCellProps } from './NewTypes';
import { StatusDropdown, PriorityDropdown, DateTask } from './NewDropdown';
import { ClickUpResponsableSelector } from './NewResponsableSelector';
import { ImageAvatar } from '../../Utils/ImageAvatar';
import { AuthContextProvider, EventContextProvider } from '../../../context';
import { TagsEditor } from './NewTagsEditor';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../hooks/useToast';
import { GruposResponsablesArry } from '../Utils/ResponsableSelector';
import { DescriptionCell, AttachmentsCell, CommentsCell } from './NewCellRenderers';
import { TimeTaskTable } from './TimeTaskTable';

export const NewTableCell: React.FC<TableCellProps> = ({ column, value, task, onUpdate, isEditing, onStartEdit, onStopEdit, onCommentsClick }) => {
  const [editValue, setEditValue] = useState(value);
  const [showEditControls, setShowEditControls] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [showResponsableSelector, setShowResponsableSelector] = useState(false);
  const [previousValue, setPreviousValue] = useState(value);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const { user } = AuthContextProvider();
  const { event } = EventContextProvider();
  const { t } = useTranslation();

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

  // Exportar estados de modales
  useEffect(() => {
    if (column.type === 'tips' && showDescriptionModal) {
      onCommentsClick && onCommentsClick();
    }
  }, [showDescriptionModal, column.type, onCommentsClick]);

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
            className="w-full px-3 py-2 border-2 border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder={t('Escribir...')}
          />
        ) : (
          <div className="px-3 py-2 relative">
            <span
              className={`${!value ? 'text-gray-400 italic' : 'text-gray-900 font-medium'} ${needsTruncate && !showFullText ? 'cursor-pointer hover:text-primary' : ''}`}
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
                className="ml-2 text-primary hover:text-primary/80"
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
          <div className="px-3 py-2 flex items-center gap-2">
            <DateTask
              value={value ? new Date(value).toISOString().split('T')[0] : ''}
              onChange={(newValue) => {
                if (newValue) {
                  onUpdate(newValue);
                } else {
                  onUpdate(new Date().toISOString().split('T')[0]);
                }
              }}
              placeholder={t('Sin fecha')}
            />
          </div>
        );

      case 'time':
        return (
          <div className="px-3 py-2">
            <TimeTaskTable
              value={task.fecha} // Pasar la fecha completa del task
              onChange={async (newValue, additionalUpdates) => {
                // Actualizar fecha y horaActiva si es necesario
                if (additionalUpdates?.horaActiva !== undefined) {
                  // Primero actualizar horaActiva
                  await onUpdate({ horaActiva: additionalUpdates.horaActiva });
                }
                // Luego actualizar la fecha
                await onUpdate({ fecha: newValue });
              }}
              canEdit={true}
              task={task}
            />
          </div>
        );

      case 'number':
        return false ? (
          <input
            ref={inputRef}
            type="number"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full px-3 py-2 border-2 border-primary rounded-md focus:outline-none"
            placeholder="0"
          />
        ) : (
          <div className="px-3 py-2">
            <span className={`${!value ? 'text-gray-400' : ''}`}>
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
                          className="w-6 h-6 rounded-full border-2 border-gray-300 overflow-hidden hover:z-10 transition-all"
                          title={resp}
                        >
                          <ImageAvatar user={userSelect} />
                        </div>
                      );
                    })}
                    {responsables.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">+{responsables.length - 3}</span>
                      </div>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="ml-2 text-gray-600">
                      {responsables.join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-gray-400">
                  <User className="w-4 h-4" />
                  <span className="">{t('Sin asignar')}</span>
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
          <DescriptionCell
            value={value}
            onClick={() => {
              setShowDescriptionModal(false);
              if (onCommentsClick) {
                onCommentsClick();
              }
            }}
          />
        );

      case 'attachments':
        return (
          <AttachmentsCell
            value={value}
            onClick={() => {
              if (onCommentsClick) {
                onCommentsClick();
              }
            }}
          />
        );

      case 'comments':
        return (
          <CommentsCell
            value={value}
            onClick={() => {
              if (onCommentsClick) {
                onCommentsClick();
              }
            }}
          />
        );

      default:
        return (
          <div className="px-3 py-2">
            <span className={`${!value ? 'text-gray-400' : ''}`}>
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
        ${column.type === 'comments' || column.type === 'attachments' || column.type === 'responsable' || column.type === 'tips' ? '' : canEdit ? 'cursor-text' : 'cursor-default'}
      `}
      onClick={() => {
        if (canEdit && !isEditing && column.type !== 'comments' && column.type !== 'responsable' && column.type !== 'attachments' && column.type !== 'tips') {
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
      {/*       {isEditing && canEdit && ['text', 'number', 'time'].includes(column.type) && (
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
      )} */}

      {/* Indicador de edición */}
      {!isEditing && canEdit && showEditControls && column.type !== 'comments' && column.type !== 'tips' && column.type !== 'tags' && column.type !== 'responsable' && column.type !== 'attachments' && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit3 className="w-3 h-3 text-gray-400" />
        </div>
      )}
    </div>
  );
};

// Exportar interface para estados de modales
export interface TableCellModalStates {
  showDescriptionModal: boolean;
  showAttachmentsModal: boolean;
  showCommentsModal: boolean;
  task: any;
}