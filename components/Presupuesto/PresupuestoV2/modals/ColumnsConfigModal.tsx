import React from 'react';
import { IoCloseOutline } from "react-icons/io5";
import { ColumnConfig } from '../types';

interface ColumnsConfigModalProps {
  columnConfig: ColumnConfig;
  toggleColumnVisibility: (columnKey: keyof ColumnConfig) => void;
  onClose: () => void;
}

export const ColumnsConfigModal: React.FC<ColumnsConfigModalProps> = ({
  columnConfig,
  toggleColumnVisibility,
  onClose
}) => {
  const columnLabels = {
    categoria: 'Categoría',
    partida: 'Partida de Gasto',
    unidad: 'Unidad',
    cantidad: 'Cantidad',
    item: 'Item',
    valorUnitario: 'Valor Unitario',
    total: 'Coste Total',
    estimado: 'Coste Estimado',
    pagado: 'Pagado',
    pendiente: 'Pendiente',
    acciones: 'Acciones'
  };

  return (
    <div className="columns-modal absolute top-12 left-3 bg-white shadow-lg rounded border z-50 w-52 max-w-[calc(100vw-24px)]">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Columnas</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <IoCloseOutline className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      <div className="p-3 space-y-1 max-h-80 overflow-y-auto">
        {Object.entries(columnConfig).map(([key, config]) => (
          <label key={key} className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={config.visible}
              onChange={() => toggleColumnVisibility(key as keyof ColumnConfig)}
              className="mr-2 rounded text-xs"
            />
            <span className="truncate">
              {columnLabels[key as keyof typeof columnLabels]}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};