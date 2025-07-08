import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Tag, Check, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TagData {
  name: string;
  color: string;
}

interface TagsEditorProps {
  value: string[];
  onChange: (tags: string[]) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder?: string;
}

// Colores predefinidos para las etiquetas
const TAG_COLORS = [
  { name: 'Rosa', value: 'bg-primary', text: 'text-primary', bg: 'bg-primary/10' },
  { name: 'Verde', value: 'bg-green-500', text: 'text-green', bg: 'bg-green-100' },
  { name: 'Rojo', value: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-100' },
  { name: 'Amarillo', value: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-100' },
  { name: 'Púrpura', value: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-100' },
  { name: 'Azul', value: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-100' },
  { name: 'Índigo', value: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-100' },
  { name: 'Gris', value: 'bg-gray-500', text: 'text-gray-700', bg: 'bg-gray-100' },
];

export const TagsEditor: React.FC<TagsEditorProps> = ({
  value = [],
  onChange,
  isEditing,
  onStartEdit,
  onStopEdit,
  onSave,
  onCancel,
  placeholder = "Agregar etiquetas..."
}) => {
  const [newTag, setNewTag] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null);
  const [tagColors, setTagColors] = useState<Record<string, string>>({});
  const [showAllTags, setShowAllTags] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColorPicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTagColor = (tag: string) => {
    const colorInfo = tagColors[tag];
    if (colorInfo) {
      const color = TAG_COLORS.find(c => c.value === colorInfo);
      return color || TAG_COLORS[0];
    }
    // Color por defecto basado en hash del nombre
    const hash = tag.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
  };

  const handleAddTag = () => {
    if (newTag.trim() && !value.includes(newTag.trim())) {
      const updatedTags = [...value, newTag.trim()];
      onChange(updatedTags);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = value.filter(tag => tag !== tagToRemove);
    onChange(updatedTags);
    
    // Remover color asociado
    const newTagColors = { ...tagColors };
    delete newTagColors[tagToRemove];
    setTagColors(newTagColors);
  };

  const handleSetTagColor = (tag: string, colorValue: string) => {
    setTagColors(prev => ({
      ...prev,
      [tag]: colorValue
    }));
    setShowColorPicker(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newTag.trim()) {
        handleAddTag();
      } else {
        onSave();
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const displayTags = showAllTags ? value : value.slice(0, 2);
  const remainingCount = value.length - 2;

  if (isEditing) {
    return (
      <div className="w-full space-y-2" onKeyDown={handleKeyDown}>
        {/* Etiquetas existentes */}
        <div className="flex flex-wrap gap-1">
          {value.map((tag, index) => {
            const colorInfo = getTagColor(tag);
            return (
              <div
                key={index}
                className={`group relative inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${colorInfo.bg} ${colorInfo.text} transition-all`}
              >
                <span>{tag}</span>
                
                {/* Botón de color */}
                <button
                  onClick={() => setShowColorPicker(showColorPicker === index ? null : index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  title={t('Cambiar color')}
                >
                  <Palette className="w-3 h-3" />
                </button>
                
                {/* Botón de eliminar */}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                  title={t('Eliminar etiqueta')}
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Selector de colores */}
                {showColorPicker === index && (
                  <div 
                    ref={dropdownRef}
                    className="absolute top-8 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
                  >
                    <div className="grid grid-cols-4 gap-1">
                      {TAG_COLORS.map((color, colorIndex) => (
                        <button
                          key={colorIndex}
                          onClick={() => handleSetTagColor(tag, color.value)}
                          className={`w-6 h-6 rounded-full ${color.value} hover:ring-2 hover:ring-primary/50 transition-all`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Input para nueva etiqueta */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder={t('Escribir nueva etiqueta...')}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          
          <button
            onClick={handleAddTag}
            disabled={!newTag.trim()}
            className="p-1.5 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Controles de guardar/cancelar */}
        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {t('Cancelar')}
          </button>
          <button
            onClick={onSave}
            className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            {t('Guardar')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group w-full min-h-[32px] flex items-center cursor-pointer"
      onClick={onStartEdit}
    >
      <div className="flex-1 min-w-0">
        {value.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            {displayTags.map((tag, index) => {
              const colorInfo = getTagColor(tag);
              return (
                <span
                  key={index}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${colorInfo.bg} ${colorInfo.text}`}
                >
                  {tag}
                </span>
              );
            })}
            {!showAllTags && remainingCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllTags(true);
                }}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                +{remainingCount} más
              </button>
            )}
            {showAllTags && remainingCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllTags(false);
                }}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Ver menos
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-gray-400">
            <Tag className="w-4 h-4" />
            <span className="text-sm">{placeholder}</span>
          </div>
        )}
      </div>
    </div>
  );
};