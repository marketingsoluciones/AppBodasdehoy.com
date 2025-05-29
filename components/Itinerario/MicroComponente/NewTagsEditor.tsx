import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Tag, Check, Palette } from 'lucide-react';

interface TagData {
  name: string;
  color: string;
}

interface ClickUpTagsEditorProps {
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
  { name: 'Azul', value: 'bg-primary', text: 'text-primary', bg: 'bg-pink-100' },
  { name: 'Verde', value: 'bg-green-500', text: 'text-green-800', bg: 'bg-green-100' },
  { name: 'Rojo', value: 'bg-red-500', text: 'text-red-800', bg: 'bg-red-100' },
  { name: 'Amarillo', value: 'bg-yellow-500', text: 'text-yellow-800', bg: 'bg-yellow-100' },
  { name: 'Púrpura', value: 'bg-purple-500', text: 'text-purple-800', bg: 'bg-purple-100' },
  { name: 'Rosa', value: 'bg-pink-500', text: 'text-pink-800', bg: 'bg-pink-100' },
  { name: 'Índigo', value: 'bg-indigo-500', text: 'text-indigo-800', bg: 'bg-indigo-100' },
  { name: 'Gris', value: 'bg-gray-500', text: 'text-gray-800', bg: 'bg-gray-100' },
];

export const ClickUpTagsEditor: React.FC<ClickUpTagsEditorProps> = ({
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
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      handleAddTag();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

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
                className={`group relative inline-flex items-center space-x-1 px-2 py-1 rounded text-xs ${colorInfo.bg} ${colorInfo.text}`}
              >
                <span>{tag}</span>
                
                {/* Botón de color */}
                <button
                  onClick={() => setShowColorPicker(showColorPicker === index ? null : index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Cambiar color"
                >
                  <Palette className="w-3 h-3" />
                </button>
                
                {/* Botón de eliminar */}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 rounded"
                  title="Eliminar etiqueta"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Selector de colores */}
                {showColorPicker === index && (
                  <div 
                    ref={dropdownRef}
                    className="absolute top-8 left-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg p-2"
                  >
                    <div className="grid grid-cols-4 gap-1">
                      {TAG_COLORS.map((color, colorIndex) => (
                        <button
                          key={colorIndex}
                          onClick={() => handleSetTagColor(tag, color.value)}
                          className={`w-6 h-6 rounded ${color.value} hover:ring-2 hover:ring-gray-300 transition-all`}
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
              placeholder="Escribir nueva etiqueta..."
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          
          <button
            onClick={handleAddTag}
            disabled={!newTag.trim()}
            className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Controles de guardar/cancelar */}
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={onSave}
            className="p-1 text-green-600 hover:bg-green-100 rounded"
            title="Guardar"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={onCancel}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
            title="Cancelar"
          >
            <X className="w-3 h-3" />
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
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 3).map((tag, index) => {
              const colorInfo = getTagColor(tag);
              return (
                <span
                  key={index}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs ${colorInfo.bg} ${colorInfo.text}`}
                >
                  {tag}
                </span>
              );
            })}
            {value.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                +{value.length - 3} más
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-gray-400">
            <Tag className="w-4 h-4" />
            <span className="text-sm">{placeholder}</span>
          </div>
        )}
      </div>

      {/* Indicador de edición */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
        <Plus className="w-3 h-3 text-gray-400" />
      </div>
    </div>
  );
};
