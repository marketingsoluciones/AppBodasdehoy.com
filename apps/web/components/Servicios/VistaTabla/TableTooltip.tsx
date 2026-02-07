import React, { useState, useEffect } from 'react';
import { HelpCircle, Keyboard, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Componente de Tooltip para ayuda contextual
export const TableTooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  delay?: number;
}> = ({ content, children, delay = 500 }) => {
  const [show, setShow] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setShow(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setShow(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2" />
        </div>
      )}
    </div>
  );
};

// Componente de ayuda rápida para la tabla
export const TableHelpButton: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);
  const { t } = useTranslation();

  const shortcuts = [
    { key: 'Click', description: t('Editar celda') },
    { key: 'Enter', description: t('Guardar cambios') },
    { key: 'Esc', description: t('Cancelar edición') },
    { key: 'Tab', description: t('Siguiente celda') },
    { key: 'Shift + Tab', description: t('Celda anterior') },
    { key: 'Ctrl + Enter', description: t('Guardar en editor de texto') },
  ];

  const tips = [
    t('Haz clic en cualquier celda para editarla'),
    t('Los cambios se guardan automáticamente'),
    t('Usa los filtros para encontrar tareas específicas'),
    t('Arrastra las columnas para reordenarlas'),
    t('Guarda vistas personalizadas para acceso rápido'),
  ];

  return (
    <>
      <button
        onClick={() => setShowHelp(true)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        title={t('Ayuda')}
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">{t('Ayuda de la Tabla')}</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Atajos de teclado */}
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <Keyboard className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-medium text-gray-800">{t('Atajos de Teclado')}</h4>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {shortcuts.map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <kbd className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                          {shortcut.key}
                        </kbd>
                        <span className="text-sm text-gray-600 ml-4">{shortcut.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Consejos */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Info className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-medium text-gray-800">{t('Consejos Útiles')}</h4>
                </div>
                <div className="space-y-3">
                  {tips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-600">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipos de campos */}
              <div className="mt-8">
                <h4 className="text-lg font-medium text-gray-800 mb-4">{t('Tipos de Campos')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 mb-2">{t('Campos de Texto')}</h5>
                    <p className="text-sm text-gray-600">{t('Click para editar, Enter para guardar')}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 mb-2">{t('Dropdowns')}</h5>
                    <p className="text-sm text-gray-600">{t('Click para abrir opciones')}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 mb-2">{t('Etiquetas')}</h5>
                    <p className="text-sm text-gray-600">{t('Click para agregar o editar etiquetas')}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 mb-2">{t('Comentarios')}</h5>
                    <p className="text-sm text-gray-600">{t('Click en el número para ver/agregar')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                {t('Entendido')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Hook para detectar atajos de teclado en la tabla
export const useTableKeyboardShortcuts = (callbacks: {
  onSave?: () => void;
  onCancel?: () => void;
  onNextCell?: () => void;
  onPrevCell?: () => void;
  onSearch?: () => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S para guardar
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        callbacks.onSave?.();
      }
      
      // Ctrl/Cmd + F para buscar
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        callbacks.onSearch?.();
      }
      
      // Tab para siguiente celda
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        callbacks.onNextCell?.();
      }
      
      // Shift + Tab para celda anterior
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        callbacks.onPrevCell?.();
      }
      
      // Escape para cancelar
      if (e.key === 'Escape') {
        callbacks.onCancel?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
};

// Componente de indicador de estado de guardado
export const SaveIndicator: React.FC<{
  status: 'idle' | 'saving' | 'saved' | 'error';
}> = ({ status }) => {
  const { t } = useTranslation();
  
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          text: t('Guardando...'),
          className: 'text-gray-600',
          icon: '⏳'
        };
      case 'saved':
        return {
          text: t('Guardado'),
          className: 'text-green',
          icon: '✓'
        };
      case 'error':
        return {
          text: t('Error al guardar'),
          className: 'text-red-600',
          icon: '✗'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  
  if (!config) return null;

  return (
    <div className={`flex items-center space-x-1 text-sm ${config.className} transition-all duration-300`}>
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
};

// Mejora para el TableHeader - Agregar botón de ayuda
export const EnhancedTableHeader: React.FC<any> = (props) => {
  return (
    <div className="relative">
      {/* Agregar el botón de ayuda en la esquina */}
      <div className="absolute top-4 right-20 z-10">
        <TableHelpButton />
      </div>
      {/* El header original */}
      {props.children}
    </div>
  );
};