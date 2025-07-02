import React from 'react';
import { IoCloseOutline } from "react-icons/io5";
import { GoEye } from 'react-icons/go';
import { TableFilters } from '../types';

interface FiltersModalProps {
  filters: TableFilters;
  onFilterChange: (filterType: keyof TableFilters, value: any) => void;
  onClose: () => void;
  onClearFilters: () => void;
  viewLevel: number;
  setViewLevel: (level: number) => void;
  categorias_array: any[];
}

export const FiltersModal: React.FC<FiltersModalProps> = ({
  filters,
  onFilterChange,
  onClose,
  onClearFilters,
  viewLevel,
  setViewLevel,
  categorias_array
}) => {
  return (
    <div className="filters-modal absolute top-12 left-3 bg-white shadow-lg rounded border z-50 w-80 max-w-[calc(100vw-24px)]">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Filtros</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearFilters}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Limpiar
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <IoCloseOutline className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
        {/* Vista de Detalle */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Vista de Detalle</label>
          <select 
            value={viewLevel} 
            onChange={(e) => setViewLevel(Number(e.target.value))}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value={1}>Solo Categorías</option>
            <option value={2}>Categorías + Gastos</option>
            <option value={3}>Detalle Completo</option>
          </select>
        </div>

        {/* Filtro por Categorías */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Categorías</label>
          <div className="space-y-1 max-h-24 overflow-y-auto py-1">
            {categorias_array && Array.isArray(categorias_array) ? categorias_array.map(categoria => (
              <label key={categoria._id} className="flex items-center text-xs pl-2 ">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(categoria._id)}
                  onChange={(e) => {
                    const newCategories = e.target.checked
                      ? [...filters.categories, categoria._id]
                      : filters.categories.filter(id => id !== categoria._id);
                    onFilterChange('categories', newCategories);
                  }}
                  className="mr-2 rounded text-xs focus:ring-none focus:ring-offset-0"
                />
                <span className="truncate">{categoria.nombre}</span>
              </label>
            )) : (
              <p className="text-xs text-gray-500 italic">No hay categorías disponibles</p>
            )}
          </div>
        </div>

        {/* Filtro por Estado de Pago */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Estado de Pago</label>
          <select
            value={filters.paymentStatus}
            onChange={(e) => onFilterChange('paymentStatus', e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">Todos</option>
            <option value="paid">Pagado</option>
            <option value="pending">Pendiente</option>
            <option value="partial">Pago Parcial</option>
          </select>
        </div>

        {/* Filtro por Estado de Visibilidad */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-1">
              <GoEye className="w-3 h-3" />
              Estado de Visibilidad
            </div>
          </label>
          <select
            value={filters.visibilityStatus}
            onChange={(e) => onFilterChange('visibilityStatus', e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">Todos</option>
            <option value="visible">Solo Visibles</option>
            <option value="hidden">Solo Ocultos</option>
          </select>
          
        </div>

        {/* Filtro por Rango de Montos */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Rango de Montos</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Mín"
              value={filters.amountRange.min}
              onChange={(e) => onFilterChange('amountRange', { ...filters.amountRange, min: e.target.value })}
              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 w-12"
            />
            <input
              type="number"
              placeholder="Máx"
              value={filters.amountRange.max}
              onChange={(e) => onFilterChange('amountRange', { ...filters.amountRange, max: e.target.value })}
              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 w-12"
            />
          </div>
        </div>
      </div>
    </div>
  );
};