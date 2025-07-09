import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw, 
  Settings,
  Palette,
  Grid3x3,
  List,
  Calendar,
  Clock,
  Users,
  Tag,
  BarChart,
  Save,
  FolderOpen
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuickActionsMenuProps {
  onAction: (action: string) => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({ 
  onAction, 
  position = 'bottom-right' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const actions = [
    {
      id: 'add-task',
      icon: <Plus className="w-5 h-5" />,
      label: t('Nueva Tarea'),
      color: 'text-primary',
      bgColor: 'bg-pink-50',
      description: t('Crear una nueva tarea rápidamente')
    },
    {
      id: 'filter',
      icon: <Filter className="w-5 h-5" />,
      label: t('Filtros'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: t('Filtrar tareas por criterios')
    },
    {
      id: 'calendar-view',
      icon: <Calendar className="w-5 h-5" />,
      label: t('Vista Calendario'),
      color: 'text-green',
      bgColor: 'bg-[#eeffee]',
      description: t('Ver tareas en calendario')
    },
    {
      id: 'timeline-view',
      icon: <Clock className="w-5 h-5" />,
      label: t('Línea de Tiempo'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: t('Ver cronología de tareas')
    },
    {
      id: 'team-view',
      icon: <Users className="w-5 h-5" />,
      label: t('Vista Equipo'),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: t('Ver tareas por responsable')
    },
    {
      id: 'analytics',
      icon: <BarChart className="w-5 h-5" />,
      label: t('Analíticas'),
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      description: t('Ver estadísticas del tablero')
    },
    {
      id: 'export',
      icon: <Download className="w-5 h-5" />,
      label: t('Exportar'),
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      description: t('Exportar datos del tablero')
    },
    {
      id: 'import',
      icon: <Upload className="w-5 h-5" />,
      label: t('Importar'),
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      description: t('Importar tareas desde archivo')
    },
    {
      id: 'templates',
      icon: <FolderOpen className="w-5 h-5" />,
      label: t('Plantillas'),
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      description: t('Usar plantillas predefinidas')
    },
    {
      id: 'settings',
      icon: <Settings className="w-5 h-5" />,
      label: t('Configuración'),
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      description: t('Configurar el tablero')
    }
  ];

  const positionClasses = {
    'bottom-right': 'bottom-20 right-6',
    'bottom-left': 'bottom-20 left-6',
    'top-right': 'top-20 right-6',
    'top-left': 'top-20 left-6'
  };

  const menuPositionClasses = {
    'bottom-right': 'bottom-16 right-0',
    'bottom-left': 'bottom-16 left-0',
    'top-right': 'top-16 right-0',
    'top-left': 'top-16 left-0'
  };

  return (
    <div ref={menuRef} className={`fixed ${positionClasses[position]} z-50`}>
      {/* Menú de acciones */}
      {isOpen && (
        <div className={`absolute ${menuPositionClasses[position]} mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-72`}>
          <div className="p-4 bg-gradient-to-r from-primary to-purple-600 text-white">
            <h3 className="font-semibold text-lg">{t('Acciones Rápidas')}</h3>
            <p className="text-sm opacity-90 mt-1">{t('Accede rápidamente a las funciones')}</p>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            <div className="p-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    onAction(action.id);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                  className={`
                    w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200
                    ${hoveredAction === action.id 
                      ? `${action.bgColor} shadow-md transform scale-105` 
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <div className={`
                    p-2 rounded-lg transition-colors
                    ${hoveredAction === action.id 
                      ? `${action.color} ${action.bgColor}` 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {action.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-medium text-sm ${hoveredAction === action.id ? action.color : 'text-gray-700'}`}>
                      {action.label}
                    </div>
                    {hoveredAction === action.id && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {action.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{t('Presiona ESC para cerrar')}</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                Ctrl + K
              </kbd>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group relative w-14 h-14 bg-gradient-to-r from-primary to-purple-600 
          text-white rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300
          ${isOpen ? 'rotate-45 scale-110' : 'hover:scale-110'}
        `}
      >
        <Plus className="w-6 h-6 mx-auto" />
        
        {/* Indicador de pulsación */}
        <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
        
        {/* Anillo de animación */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping bg- opacity-20"></span>
        )}
      </button>

      {/* Tooltip */}
      {!isOpen && (
        <div className="absolute bottom-full mb-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
            {t('Acciones rápidas')} (Ctrl+K)
          </div>
        </div>
      )}
    </div>
  );
};