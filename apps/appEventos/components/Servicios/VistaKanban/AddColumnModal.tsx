import React, { useState, useCallback } from 'react';
import { 
  X, 
  Palette, 
  Circle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Archive, 
  Eye, 
  Zap,
  Target,
  Flag,
  Star,
  Heart,
  Bookmark,
  Shield,
  Award,
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { BoardColumn } from '../types';
import { useTranslation } from 'react-i18next';

interface AddColumnModalProps {
  onSave: (column: Omit<BoardColumn, 'tasks' | 'order'>) => void;
  onClose: () => void;
}

// Colores predefinidos mejorados para las columnas
const COLUMN_COLORS = [
  { 
    bg: 'bg-gray-50', 
    border: 'border-gray-300', 
    text: 'text-gray-700',
    name: 'Gris' 
  },
  { 
    bg: 'bg-pink-50', 
    border: 'border-pink-300', 
    text: 'text-primary',
    name: 'Azul' 
  },
  { 
    bg: 'bg-[#eeffee]', 
    border: 'border-[#7bff7b]', 
    text: 'text-green',
    name: 'Verde' 
  },
  { 
    bg: 'bg-yellow-50', 
    border: 'border-yellow-300', 
    text: 'text-yellow-700',
    name: 'Amarillo' 
  },
  { 
    bg: 'bg-[#fff0f0]', 
    border: 'border-[#ffa7a7]', 
    text: 'text-red',
    name: 'Rojo' 
  },
  { 
    bg: 'bg-purple-50', 
    border: 'border-purple-300', 
    text: 'text-purple-700',
    name: 'Púrpura' 
  },
  { 
    bg: 'bg-pink-50', 
    border: 'border-pink-300', 
    text: 'text-pink-700',
    name: 'Rosa' 
  },
  { 
    bg: 'bg-indigo-50', 
    border: 'border-indigo-300', 
    text: 'text-indigo-700',
    name: 'Índigo' 
  },
  { 
    bg: 'bg-amber-50', 
    border: 'border-amber-300', 
    text: 'text-amber-700',
    name: 'Ámbar' 
  },
  { 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-300', 
    text: 'text-emerald-700',
    name: 'Esmeralda' 
  },
  { 
    bg: 'bg-teal-50', 
    border: 'border-teal-300', 
    text: 'text-teal-700',
    name: 'Turquesa' 
  },
  { 
    bg: 'bg-orange-50', 
    border: 'border-orange-300', 
    text: 'text-orange-700',
    name: 'Naranja' 
  },
];

// Íconos disponibles para las columnas
const COLUMN_ICONS = [
  { icon: <Circle className="w-4 h-4" />, name: 'Círculo' },
  { icon: <Clock className="w-4 h-4" />, name: 'Reloj' },
  { icon: <CheckCircle2 className="w-4 h-4" />, name: 'Completado' },
  { icon: <XCircle className="w-4 h-4" />, name: 'Cancelado' },
  { icon: <AlertCircle className="w-4 h-4" />, name: 'Alerta' },
  { icon: <Archive className="w-4 h-4" />, name: 'Archivo' },
  { icon: <Eye className="w-4 h-4" />, name: 'Vista' },
  { icon: <Zap className="w-4 h-4" />, name: 'Rayo' },
  { icon: <Target className="w-4 h-4" />, name: 'Objetivo' },
  { icon: <Flag className="w-4 h-4" />, name: 'Bandera' },
  { icon: <Star className="w-4 h-4" />, name: 'Estrella' },
  { icon: <Heart className="w-4 h-4" />, name: 'Corazón' },
  { icon: <Bookmark className="w-4 h-4" />, name: 'Marcador' },
  { icon: <Shield className="w-4 h-4" />, name: 'Escudo' },
  { icon: <Award className="w-4 h-4" />, name: 'Premio' },
  { icon: <TrendingUp className="w-4 h-4" />, name: 'Tendencia' },
];

export const AddColumnModal: React.FC<AddColumnModalProps> = ({
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLUMN_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(COLUMN_ICONS[0]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const { t } = useTranslation();

  // Validar formulario
  const isValid = title.trim().length > 0;

  // Guardar nueva columna
  const handleSave = useCallback(() => {
    if (!isValid) return;

    const newColumn: Omit<BoardColumn, 'tasks' | 'order'> = {
      id: title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      title: title.trim(),
      color: `${selectedColor.bg} ${selectedColor.border}`,
      colorConfig: {
        bg: selectedColor.bg,
        border: selectedColor.border,
        text: selectedColor.text
      },
      icon: selectedIcon.icon,
      isCollapsed,
      isHidden: false,
    };

    onSave(newColumn);
  }, [title, selectedColor, selectedIcon, isCollapsed, isValid, onSave]);

  // Manejar Enter
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSave, isValid, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            {t('Agregar Nueva Columna')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('Título de la columna')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("Ej: En Revisión, Aprobado...")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              autoFocus
            />
          </div>

          {/* Selector de ícono */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <span>{t('Ícono de la columna')}</span>
            </label>
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              className={`
                w-full p-3 border-2 rounded-lg flex items-center justify-between transition-all
                ${showIconPicker ? 'border-primary ring-2 ring-pink-200' : 'border-gray-300 hover:border-gray-400'}
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={selectedColor.text}>
                  {selectedIcon.icon}
                </div>
                <span className="text-gray-700">{selectedIcon.name}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showIconPicker ? 'rotate-180' : ''}`} />
            </button>
            
            {showIconPicker && (
              <div className="mt-2 p-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                <div className="grid grid-cols-4 gap-2">
                  {COLUMN_ICONS.map((iconOption, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedIcon(iconOption);
                        setShowIconPicker(false);
                      }}
                      className={`
                        p-3 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all
                        ${selectedIcon === iconOption 
                          ? 'bg-pink-100 text-primary ring-2 ring-primary' 
                          : 'hover:bg-gray-100 text-gray-600'
                        }
                      `}
                      title={iconOption.name}
                    >
                      {iconOption.icon}
                      <span className="text-xs">{iconOption.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selector de color */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4" />
              <span>{t('Color de la columna')}</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLUMN_COLORS.map((color, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedColor(color)}
                  className={`
                    relative p-4 rounded-lg transition-all
                    ${color.bg} border-2 ${color.border}
                    ${selectedColor === color 
                      ? 'ring-2 ring-primary ring-offset-2' 
                      : 'hover:ring-2 hover:ring-gray-300'
                    }
                  `}
                  title={color.name}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <div className={`w-full h-6 rounded ${color.bg} opacity-60`}></div>
                    <span className={`text-xs ${color.text}`}>{color.name}</span>
                  </div>
                  {selectedColor === color && (
                    <div className="absolute top-1 right-1">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Vista previa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('Vista previa')}
            </label>
            <div className={`
              border-2 ${selectedColor.border} ${selectedColor.bg} 
              rounded-lg p-4 space-y-3
            `}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={selectedColor.text}>
                    {selectedIcon.icon}
                  </div>
                  <h4 className={`font-semibold ${selectedColor.text}`}>
                    {title || t('Título de la columna')}
                  </h4>
                </div>
                <span className="bg-white bg-opacity-60 text-gray-600 text-xs px-2 py-1 rounded-full">
                  0
                </span>
              </div>
              <div className="bg-white border border-gray-200 rounded-md p-3 text-sm text-gray-500">
                {t('Las tareas aparecerán aquí')}
              </div>
              <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 text-sm">
                + {t('Agregar tarea')}
              </button>
            </div>
          </div>

          {/* Opciones adicionales */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isCollapsed}
                onChange={(e) => setIsCollapsed(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>{t('Crear columna colapsada')}</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('Cancelar')}
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all
              ${isValid
                ? 'bg-primary text-white hover:bg-primary shadow-sm hover:shadow'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {t('Crear Columna')}
          </button>
        </div>
      </div>
    </div>
  );
};