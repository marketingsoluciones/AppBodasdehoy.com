import React, { useState, useCallback } from 'react';
import { X, Palette } from 'lucide-react';
import { BoardColumn } from '../types';
import { Task } from '../../../utils/Interfaces'; // Añadir esta importación

interface AddColumnModalProps {
  onSave: (column: Omit<BoardColumn, 'tasks' | 'order'>) => void;
  onClose: () => void;
}

// Colores predefinidos para las columnas
const COLUMN_COLORS = [
  { bg: 'bg-gray-50', border: 'border-gray-300', name: 'Gris' },
  { bg: 'bg-pink-50', border: 'border-pink-300', name: 'Azul' },
  { bg: 'bg-[#eeffee]', border: 'border-[#7bff7b]', name: 'Verde' },
  { bg: 'bg-yellow-50', border: 'border-yellow-300', name: 'Amarillo' },
  { bg: 'bg-[#fff0f0]', border: 'border-[#ffa7a7]', name: 'Rojo' },
  { bg: 'bg-purple-50', border: 'border-purple-300', name: 'Púrpura' },
  { bg: 'bg-pink-50', border: 'border-pink-300', name: 'Rosa' },
  { bg: 'bg-indigo-50', border: 'border-indigo-300', name: 'Índigo' },
];

export const AddColumnModal: React.FC<AddColumnModalProps> = ({
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLUMN_COLORS[0]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Validar formulario
  const isValid = title.trim().length > 0;

  // Guardar nueva columna
  const handleSave = useCallback(() => {
    if (!isValid) return;

    const newColumn: Omit<BoardColumn, 'tasks' | 'order'> = {
      id: title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      title: title.trim(),
      color: `${selectedColor.bg} ${selectedColor.border}`,
      isCollapsed,
    };

    onSave(newColumn);
  }, [title, selectedColor, isCollapsed, isValid, onSave]);

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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Agregar Nueva Columna
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de la columna
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ej: En Revisión, Aprobado..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Selector de color */}
          <div>
            <label className="flex items-center space-x-1 text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4" />
              <span>Color de la columna</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLUMN_COLORS.map((color, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedColor(color)}
                  className={`
                    relative p-3 rounded-md transition-all
                    ${color.bg} border-2 ${color.border}
                    ${selectedColor === color 
                      ? 'ring-2 ring-primary ring-offset-2' 
                      : 'hover:ring-2 hover:ring-gray-300'
                    }
                  `}
                  title={color.name}
                >
                  <div className="w-full h-4 rounded-sm opacity-60"></div>
                  {selectedColor === color && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
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
              Vista previa
            </label>
            <div className={`
              border-2 ${selectedColor.border} ${selectedColor.bg} 
              rounded-lg p-3 space-y-2
            `}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">
                  {title || 'Título de la columna'}
                </h4>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  0
                </span>
              </div>
              <div className="bg-white border border-gray-200 rounded-md p-2 text-sm text-gray-500">
                Las tareas aparecerán aquí
              </div>
            </div>
          </div>

          {/* Opciones adicionales */}
          <div>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={isCollapsed}
                onChange={(e) => setIsCollapsed(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Crear columna colapsada</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`
              px-4 py-2 rounded-md transition-colors
              ${isValid
                ? 'bg-primary text-white hover:bg-primary'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Crear Columna
          </button>
        </div>
      </div>
    </div>
  );
};

/* Sub-Task Modal */
interface SubTaskModalProps {
  parentTaskId: string;
  onSave: (parentTaskId: string, subTask: Partial<Task>) => void;
  onClose: () => void;
  itinerario: any;
}

export const SubTaskModal: React.FC<SubTaskModalProps> = ({
  parentTaskId,
  onSave,
  onClose,
  itinerario,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('');

  // Validar formulario
  const isValid = title.trim().length > 0;

  // Guardar sub-tarea
  const handleSave = useCallback(() => {
    if (!isValid) return;

    const subTask = {
      descripcion: title.trim(),
      tips: description.trim(),
      fecha: dueDate ? new Date(dueDate) : undefined,
      responsable: assignee ? [assignee] : [],
      duracion: 15, // Duración por defecto para sub-tareas
      tags: [],
      attachments: [],
      spectatorView: true,
      estatus: false,
    };

    onSave(parentTaskId, subTask);
  }, [title, description, dueDate, assignee, isValid, onSave, parentTaskId]);

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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Crear Sub-tarea
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de la sub-tarea
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ej: Revisar documentos..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales sobre la sub-tarea..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Fecha de vencimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de vencimiento (opcional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Responsable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsable (opcional)
            </label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Nombre del responsable..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`
              px-4 py-2 rounded-md transition-colors
              ${isValid
                ? 'bg-primary text-white hover:bg-primary'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Crear Sub-tarea
          </button>
        </div>
      </div>
    </div>
  );
};