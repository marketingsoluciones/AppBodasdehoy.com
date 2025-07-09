import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ShortcutsModalProps {
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  const { t } = useTranslation();

  const shortcuts = [
    { keys: 'Ctrl + F', description: t('Buscar tareas') },
    { keys: 'Ctrl + E', description: t('Expandir/Contraer todo') },
    { keys: 'Ctrl + S', description: t('Guardar cambios') },
    { keys: 'Ctrl + H', description: t('Mostrar atajos') },
    { keys: 'Esc', description: t('Cerrar modales') },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            {t('Atajos de Teclado')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                  {shortcut.keys}
                </kbd>
                <span className="text-gray-600">{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};