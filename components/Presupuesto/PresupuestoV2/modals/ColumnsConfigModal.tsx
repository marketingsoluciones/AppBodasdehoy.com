import React, { useMemo } from 'react';
import { IoCloseOutline } from "react-icons/io5";

// Definir el tipo basado en los accessors reales de TableBudgetV82
interface ColumnConfig {
  categoria: { visible: boolean };
  gasto: { visible: boolean };
  unidad: { visible: boolean };
  cantidad: { visible: boolean };
  nombre: { visible: boolean };
  valor_unitario: { visible: boolean };
  coste_final: { visible: boolean };
  coste_estimado: { visible: boolean };
  pagado: { visible: boolean };
  pendiente_pagar: { visible: boolean };
  options: { visible: boolean };
}

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
  // Labels que coinciden con los headers de TableBudgetV82
  const columnLabels = {
    categoria: 'Categoría',
    gasto: 'Partida de Gasto', 
    unidad: 'Unidad',
    cantidad: 'Cantidad',
    nombre: 'Item',
    valor_unitario: 'Valor Unitario',
    coste_final: 'Coste Total',
    coste_estimado: 'Coste Estimado',
    pagado: 'Pagado',
    pendiente_pagar: 'Pendiente',
    options: 'Acciones'
  };

  // Calcular el estado del checkbox "Seleccionar todo"
  const allColumnsState = useMemo(() => {
    const visibleColumns = Object.values(columnConfig).filter(config => config.visible).length;
    const totalColumns = Object.keys(columnConfig).length;
    
    if (visibleColumns === 0) return 'none';
    if (visibleColumns === totalColumns) return 'all';
    return 'some';
  }, [columnConfig]);

  // Función para manejar seleccionar/deseleccionar todo
  const handleToggleAll = () => {
    const shouldSelectAll = allColumnsState !== 'all';
    
    Object.keys(columnConfig).forEach(key => {
      if (columnConfig[key as keyof ColumnConfig].visible !== shouldSelectAll) {
        toggleColumnVisibility(key as keyof ColumnConfig);
      }
    });
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
      
      <div className="p-3 max-h-80 overflow-y-auto">
        {/* Checkbox para seleccionar/deseleccionar todo */}
        <div className="border-b border-gray-200 pb-1 mb-1">
          <label className="flex items-center text-xs font-medium text-gray-700">
            <input
              type="checkbox"
              checked={allColumnsState === 'all'}
              ref={(el) => {
                if (el) el.indeterminate = allColumnsState === 'some';
              }}
              onChange={handleToggleAll}
              className="mr-2 rounded text-xs focus:ring-1 focus:ring-blue-500"
            />
            <span className="truncate">
              {allColumnsState === 'all' ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </span>
          </label>
        </div>

        {/* Lista de columnas individuales */}
        {Object.entries(columnConfig).map(([key, config]) => (
          <label key={key} className="flex items-center text-xs hover:bg-gray-50 p-1 rounded">
            <input
              type="checkbox"
              checked={config.visible}
              onChange={() => toggleColumnVisibility(key as keyof ColumnConfig)}
              className="mr-2 rounded text-xs focus:ring-1 focus:ring-blue-500"
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