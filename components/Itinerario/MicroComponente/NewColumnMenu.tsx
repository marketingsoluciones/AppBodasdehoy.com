import React, { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Filter,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  Plus,
  Minus,
  Move,
  Maximize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ClickUpColumnMenuProps } from './NewTypes';

export const ClickUpColumnMenu: React.FC<ClickUpColumnMenuProps> = ({
  column,
  onSort,
  onFilter,
  onHide,
  onPin,
  onResize,
  onInsertLeft,
  onInsertRight
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSubMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuAction = (action: () => void) => {
    action();
    setIsOpen(false);
    setShowSubMenu(null);
  };

  const menuItems = [
    {
      id: 'sort',
      label: 'Ordenar',
      icon: <ArrowUp className="w-4 h-4" />,
      hasSubmenu: true,
      submenu: [
        {
          label: 'A → Z',
          icon: <ArrowUp className="w-4 h-4" />,
          action: () => onSort('asc')
        },
        {
          label: 'Z → A',
          icon: <ArrowDown className="w-4 h-4" />,
          action: () => onSort('desc')
        }
      ]
    },
    {
      id: 'filter',
      label: 'Filtrar',
      icon: <Filter className="w-4 h-4" />,
      action: () => onFilter()
    },
    {
      id: 'group',
      label: 'Agrupar',
      icon: <Move className="w-4 h-4" />,
      action: () => console.log('Agrupar por', column.id)
    },
    { id: 'divider' },
    {
      id: 'insert',
      label: 'Insertar columna',
      icon: <Plus className="w-4 h-4" />,
      hasSubmenu: true,
      submenu: [
        {
          label: 'Insertar a la izquierda',
          icon: <ChevronLeft className="w-4 h-4" />,
          action: () => onInsertLeft()
        },
        {
          label: 'Insertar a la derecha',
          icon: <ChevronRight className="w-4 h-4" />,
          action: () => onInsertRight()
        }
      ]
    },
    {
      id: 'resize',
      label: 'Ajustar automáticamente',
      icon: <Maximize2 className="w-4 h-4" />,
      action: () => onResize()
    },
    { id: 'divider' },
    {
      id: 'pin',
      label: column.isPinned ? 'Desanclar columna' : 'Anclar columna',
      icon: column.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />,
      hasSubmenu: !column.isPinned,
      submenu: !column.isPinned ? [
        {
          label: 'Anclar a la izquierda',
          icon: <ChevronLeft className="w-4 h-4" />,
          action: () => onPin('left')
        },
        {
          label: 'Anclar a la derecha',
          icon: <ChevronRight className="w-4 h-4" />,
          action: () => onPin('right')
        }
      ] : undefined,
      action: column.isPinned ? () => onPin(null) : undefined
    },
    {
      id: 'move',
      label: 'Mover columna',
      icon: <Move className="w-4 h-4" />,
      hasSubmenu: true,
      submenu: [
        {
          label: 'Mover a la izquierda',
          icon: <ChevronLeft className="w-4 h-4" />,
          action: () => console.log('Mover izquierda')
        },
        {
          label: 'Mover a la derecha',
          icon: <ChevronRight className="w-4 h-4" />,
          action: () => console.log('Mover derecha')
        }
      ]
    },
    { id: 'divider' },
    {
      id: 'hide',
      label: 'Ocultar columna',
      icon: <EyeOff className="w-4 h-4" />,
      action: () => onHide(),
      className: 'text-red-600 hover:bg-red-50'
    }
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-all"
        title="Opciones de columna"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">
              {column.Header}
            </div>
            
            {menuItems.map((item, index) => {
              if (item.id === 'divider') {
                return <div key={`divider-${index}`} className="my-1 border-t border-gray-200" />;
              }

              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => {
                      if (item.hasSubmenu) {
                        setShowSubMenu(showSubMenu === item.id ? null : item.id);
                      } else if (item.action) {
                        handleMenuAction(item.action);
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-100
                      ${item.className || 'text-gray-700'}
                      ${showSubMenu === item.id ? 'bg-gray-100' : ''}
                    `}
                  >
                    <div className="flex items-center space-x-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.hasSubmenu && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {/* Submenu */}
                  {item.hasSubmenu && showSubMenu === item.id && item.submenu && (
                    <div className="absolute left-full top-0 ml-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      <div className="py-1">
                        {item.submenu.map((subItem, subIndex) => (
                          <button
                            key={`${item.id}-sub-${subIndex}`}
                            onClick={() => handleMenuAction(subItem.action)}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 text-left hover:bg-gray-100"
                          >
                            {subItem.icon}
                            <span>{subItem.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para el botón de configuración de columnas
export const ColumnConfigButton: React.FC<{
  onShowConfig: () => void;
}> = ({ onShowConfig }) => {
  return (
    <button
      onClick={onShowConfig}
      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
      title="Configurar columnas"
    >
      <Eye className="w-4 h-4" />
    </button>
  );
};

// Modal de configuración de columnas
export const ColumnConfigModal: React.FC<{
  columns: any[];
  hiddenColumns: string[];
  onToggleColumn: (columnId: string) => void;
  onClose: () => void;
}> = ({ columns, hiddenColumns, onToggleColumn, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Configurar columnas
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {columns.map((column) => (
              <label
                key={column.id}
                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!hiddenColumns.includes(column.id)}
                  onChange={() => onToggleColumn(column.id)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="flex-1 text-sm text-gray-700">
                  {column.Header}
                </span>
                <div className="flex items-center text-xs text-gray-400">
                  {column.isPinned && <Pin className="w-3 h-3" />}
                  {hiddenColumns.includes(column.id) && <EyeOff className="w-3 h-3" />}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};