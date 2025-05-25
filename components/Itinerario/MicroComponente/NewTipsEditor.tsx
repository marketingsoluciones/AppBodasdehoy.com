import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Check, X, Maximize2, Minimize2 } from 'lucide-react';
import { MyEditor } from '../MicroComponente/QuillText';

interface ClickUpTipsEditorProps {
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder?: string;
}

export const ClickUpTipsEditor: React.FC<ClickUpTipsEditorProps> = ({
  value,
  onChange,
  isEditing,
  onStartEdit,
  onStopEdit,
  onSave,
  onCancel,
  placeholder = "Agregar descripción..."
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Función para limpiar HTML y obtener texto plano
  const stripHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const plainText = stripHtml(value || "");
  const isLongText = plainText.length > 100;
  const truncatedText = isLongText ? `${plainText.slice(0, 100)}...` : plainText;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="w-full relative" onKeyDown={handleKeyDown}>
        <div className="w-full min-h-[120px] max-h-[300px] overflow-y-auto border border-blue-500 rounded-md bg-white">
        <MyEditor
  name="tips"
  value={value}
  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value); // Extraer el valor del evento y pasarlo como string
  }}
/>
        </div>
        
        {/* Controles de edición */}
        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-white rounded-md shadow-sm border">
          <button
            onClick={onSave}
            className="p-1 text-green-600 hover:bg-green-100 rounded"
            title="Guardar (Enter)"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={onCancel}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
            title="Cancelar (Esc)"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="group relative w-full min-h-[32px] flex items-start cursor-text"
      onClick={onStartEdit}
      onMouseEnter={() => setShowTooltip(isLongText)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex-1 min-w-0">
        {value ? (
          <div className="relative">
            <div 
              className={`text-sm text-gray-700 ${!isExpanded && isLongText ? 'line-clamp-3' : ''}`}
              style={{
                display: !isExpanded && isLongText ? '-webkit-box' : 'block',
                WebkitLineClamp: !isExpanded && isLongText ? 3 : 'unset',
                WebkitBoxOrient: !isExpanded && isLongText ? 'vertical' : 'unset',
                overflow: !isExpanded && isLongText ? 'hidden' : 'visible'
              }}
              dangerouslySetInnerHTML={{ __html: value }}
            />
            
            {/* Botón para expandir/contraer */}
            {isLongText && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                {isExpanded ? (
                  <>
                    <Minimize2 className="w-3 h-3" />
                    <span>Mostrar menos</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3" />
                    <span>Mostrar más</span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic">
            {placeholder}
          </span>
        )}
      </div>

      {/* Indicador de edición */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
        <Edit3 className="w-3 h-3 text-gray-400" />
      </div>

      {/* Tooltip para texto completo */}
      {showTooltip && isLongText && !isExpanded && (
        <div className="absolute z-50 top-full left-0 mt-2 p-3 bg-gray-900 text-white text-sm rounded-md shadow-lg max-w-sm">
          <div className="whitespace-pre-wrap break-words">
            {plainText}
          </div>
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};