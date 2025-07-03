// components/Presupuesto/PresupuestoV2/FixedOptionsMenu.tsx
import React from 'react';
import { IoCloseOutline } from "react-icons/io5";
import { FloatOptionsMenuInterface } from '../../../utils/Interfaces';

interface FixedOptionsMenuProps {
  showOptionsMenu: FloatOptionsMenuInterface | undefined;
  setShowOptionsMenu: (menu: FloatOptionsMenuInterface | { state: boolean }) => void;
}

export const FixedOptionsMenu: React.FC<FixedOptionsMenuProps> = ({
  showOptionsMenu,
  setShowOptionsMenu
}) => {
  if (!showOptionsMenu?.state || !showOptionsMenu?.values?.options) {
    return null;
  }

  const options = showOptionsMenu.values.options;
  const info = showOptionsMenu.values.info;

  const handleClose = () => {
    setShowOptionsMenu({ state: false });
  };

  const handleOptionClick = async (option: any) => {
    if (option.onClick) {
      await option.onClick(info);
    }
  };

  // Obtener el tipo de objeto para mostrar en el título
  const getObjectTitle = () => {
    const objectType = info?.row?.original?.object;
    switch (objectType) {
      case 'categoria':
        return 'Categoría';
      case 'gasto':
        return 'Partida de Gasto';
      case 'item':
        return 'Item';
      default:
        return 'Elemento';
    }
  };

  const getObjectName = () => {
    const original = info?.row?.original;
    if (original?.object === 'categoria') {
      return original.nombre || 'Sin nombre';
    } else if (original?.object === 'gasto') {
      return original.nombre || 'Sin nombre';
    } else if (original?.object === 'item') {
      return original.nombre || 'Sin nombre';
    }
    return 'Sin nombre';
  };

  // Filtrar opciones según el tipo de objeto
  const filteredOptions = options.filter((option: any) => {
    if (!option.object || !Array.isArray(option.object)) {
      return true; // Mostrar separadores y títulos
    }
    
    const objectType = info?.row?.original?.object;
    return option.object.includes(objectType);
  });

  return (
    <div className="fixed-options-menu absolute top-2 right-2 bg-white shadow-lg rounded-md border border-gray-200 z-50 w-52 max-w-[calc(100vw-24px)] animate-in slide-in-from-right-2 duration-200">
      {/* Header */}
      <div className="px-3 py-2 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-md">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-2">
            <h3 className="font-medium text-gray-800 text-xs">Opciones</h3>
            <p className="text-xs text-gray-500 truncate">
              {getObjectTitle()}: {getObjectName()}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
          >
            <IoCloseOutline className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Opciones */}
      <div className="p-1 max-h-64 overflow-y-auto">
        {filteredOptions.map((option: any, index: number) => {
          // Si es un título o separador (no tiene onClick)
          if (!option.onClick) {
            return (
              <div key={index} className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100 bg-gray-25">
                {option.icon && <span className="text-blue-500 flex-shrink-0">{option.icon}</span>}
                <span>{option.title}</span>
              </div>
            );
          }

          // Si es una opción clickeable
          return (
            <button
              key={index}
              onClick={() => handleOptionClick(option)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-all duration-150 rounded border border-transparent hover:border-blue-200 active:bg-blue-100"
            >
              {option.icon && (
                <span className="text-gray-500 hover:text-blue-600 flex-shrink-0 transition-colors">
                  {option.icon}
                </span>
              )}
              <span className="text-left truncate">{option.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};