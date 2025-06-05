import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Check, X, Maximize2, Minimize2, FileText } from 'lucide-react';
import { Interweave } from 'interweave';
import { HashtagMatcher, UrlMatcher } from 'interweave-autolink';
import { useTranslation } from 'react-i18next';

interface TipsEditorProps {
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder?: string;
}

export const TipsEditor: React.FC<TipsEditorProps> = ({
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
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      // Ajustar altura automáticamente
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  // Función para limpiar HTML y obtener texto plano
  const stripHtml = (html: string): string => {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const plainText = stripHtml(value || "");
  const isLongText = plainText.length > 100;
  const truncatedText = isLongText && !isExpanded ? `${plainText.slice(0, 100)}...` : plainText;
  const hasContent = value && value.trim() !== '';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setLocalValue(value);
      onCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = () => {
    onChange(localValue);
    onSave();
  };

  const handleCancel = () => {
    setLocalValue(value);
    onCancel();
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    // Ajustar altura automáticamente
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  if (isEditing) {
    return (
      <div className="w-full relative" onKeyDown={handleKeyDown}>
        <div className="border-2 border-primary rounded-lg overflow-hidden">
          <textarea
            ref={textareaRef}
            value={localValue}
            onChange={handleTextareaChange}
            className="w-full min-h-[120px] max-h-[300px] p-3 resize-none border-0 focus:ring-0 focus:outline-none text-sm"
            placeholder={t('Escribe una descripción detallada...')}
          />
          
          {/* Barra de herramientas */}
          <div className="flex items-center justify-between bg-gray-50 border-t border-gray-200 px-3 py-2">
            <div className="text-xs text-gray-500">
              {t('Presiona Ctrl+Enter para guardar')}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                title={t('Cancelar (Esc)')}
              >
                {t('Cancelar')}
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                title={t('Guardar (Ctrl+Enter)')}
              >
                {t('Guardar')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="group relative w-full min-h-[32px] flex items-start cursor-text rounded-lg hover:bg-gray-50 p-2 transition-colors"
      onClick={onStartEdit}
      onMouseEnter={() => setShowTooltip(isLongText && !isExpanded)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex-1 min-w-0">
        {hasContent ? (
          <div className="relative">
            {/* Contenido con Interweave */}
            <div className={`text-sm text-gray-700 break-words ${!isExpanded && isLongText ? 'line-clamp-3' : ''}`}>
              <Interweave
                content={isExpanded ? value : (isLongText ? truncatedText : value)}
                matchers={[new UrlMatcher('url'), new HashtagMatcher('hashtag')]}
              />
            </div>
            
            {/* Contenedor expandido con z-index alto */}
            {isExpanded && isLongText && (
              <div className="absolute top-0 left-0 right-0 bg-white rounded-lg shadow-lg p-2 z-30 border border-gray-200">
                <div className="text-sm text-gray-700 break-words">
                  <Interweave
                    content={value}
                    matchers={[new UrlMatcher('url'), new HashtagMatcher('hashtag')]}
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="mt-2 text-xs text-primary hover:text-primary/80 flex items-center space-x-1 transition-colors"
                >
                  <Minimize2 className="w-3 h-3" />
                  <span>{t('Ver menos')}</span>
                </button>
              </div>
            )}
            
            {/* Botón para expandir */}
            {isLongText && !isExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
                className="mt-1 text-xs text-primary hover:text-primary/80 flex items-center space-x-1 transition-colors"
              >
                <Maximize2 className="w-3 h-3" />
                <span>{t('Ver más')}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-gray-400">
            <FileText className="w-4 h-4" />
            <span className="text-sm italic">{placeholder}</span>
          </div>
        )}
      </div>

      {/* Tooltip para texto completo */}
      {showTooltip && isLongText && !isExpanded && (
        <div className="absolute z-50 top-full left-0 mt-2 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-md">
          <div className="whitespace-pre-wrap break-words">
            {plainText}
          </div>
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};