import React from 'react';
import { IoCloseOutline } from "react-icons/io5";
import { GoEye } from 'react-icons/go';

// Tipos adaptados para TableBudgetV82
interface TableFilters {
  categories: string[];
  paymentStatus: 'all' | 'paid' | 'pending' | 'partial';
  visibilityStatus: 'all' | 'visible' | 'hidden';
  amountRange: {
    min: string;
    max: string;
  };
}

interface FiltersModalProps {
  filters: TableFilters;
  onFilterChange: (filterType: keyof TableFilters, value: any) => void;
  onClose: () => void;
  onClearFilters: () => void;
  categorias_array: any[];
  viewLevel: number;
  setViewLevel: (level: number) => void;
}

export const FiltersModal: React.FC<FiltersModalProps> = ({
  filters,
  onFilterChange,
  onClose,
  onClearFilters,
  categorias_array,
  viewLevel,
  setViewLevel
}) => {
  return (
    <div className="filters-modal absolute top-12 left-3 bg-white shadow-lg rounded border z-50 w-80 max-w-[calc(100vw-24px)]">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Filtros</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>Solo Categorías</option>
            <option value={2}>Categorías + Gastos</option>
            <option value={3}>Detalle Completo</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            {viewLevel === 1 && "Mostrar únicamente las categorías principales"}
            {viewLevel === 2 && "Mostrar categorías y sus gastos asociados"}
            {viewLevel === 3 && "Mostrar todos los elementos: categorías, gastos e items"}
          </div>
        </div>

        {/* Filtro por Categorías */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Filtrar por Categorías ({filters.categories.length} seleccionadas)
          </label>
          <div className="space-y-1 max-h-28 overflow-y-auto py-1 border border-gray-200 rounded px-2">
            {categorias_array && Array.isArray(categorias_array) && categorias_array.length > 0 ? (
              <>
                {/* Opción para seleccionar/deseleccionar todas */}
                <label className="flex items-center text-xs pl-1 py-1 border-b border-gray-100">
                  <input
                    type="checkbox"
                    checked={filters.categories.length === categorias_array.length}
                    onChange={(e) => {
                      const newCategories = e.target.checked
                        ? categorias_array.map(cat => cat._id)
                        : [];
                      onFilterChange('categories', newCategories);
                    }}
                    className="mr-2 rounded text-xs focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="font-medium text-blue-600">
                    {filters.categories.length === categorias_array.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  </span>
                </label>
                
                {/* Lista de categorías */}
                {categorias_array.map(categoria => (
                  <label key={categoria._id} className="flex items-center text-xs pl-1 py-1 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(categoria._id)}
                      onChange={(e) => {
                        const newCategories = e.target.checked
                          ? [...filters.categories, categoria._id]
                          : filters.categories.filter(id => id !== categoria._id);
                        onFilterChange('categories', newCategories);
                      }}
                      className="mr-2 rounded text-xs focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="truncate flex-1">{categoria.nombre}</span>
                  </label>
                ))}
              </>
            ) : (
              <p className="text-xs text-gray-500 italic py-2">No hay categorías disponibles</p>
            )}
          </div>
        </div>

        {/* Filtro por Estado de Pago */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Estado de Pago</label>
          <select
            value={filters.paymentStatus}
            onChange={(e) => onFilterChange('paymentStatus', e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="paid">✅ Completamente Pagado</option>
            <option value="pending">⏳ Sin Pagar</option>
            <option value="partial">🔶 Pago Parcial</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            {filters.paymentStatus === 'paid' && "Elementos donde el monto pagado ≥ costo total"}
            {filters.paymentStatus === 'pending' && "Elementos sin ningún pago realizado"}
            {filters.paymentStatus === 'partial' && "Elementos con pago parcial (0 < pagado < total)"}
            {filters.paymentStatus === 'all' && "Mostrar elementos con cualquier estado de pago"}
          </div>
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
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos (visibles y ocultos)</option>
            <option value="visible">👁️ Solo Visibles</option>
            <option value="hidden">🚫 Solo Ocultos</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            {filters.visibilityStatus === 'visible' && "Mostrar solo elementos visibles en la tabla"}
            {filters.visibilityStatus === 'hidden' && "Mostrar solo elementos marcados como ocultos"}
            {filters.visibilityStatus === 'all' && "Mostrar todos los elementos sin filtrar por visibilidad"}
          </div>
        </div>

        {/* Filtro por Rango de Montos */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Rango de Montos (Costo Total)
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="number"
                placeholder="Mínimo"
                value={filters.amountRange.min}
                onChange={(e) => onFilterChange('amountRange', { ...filters.amountRange, min: e.target.value })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            <span className="text-xs text-gray-400 self-center">a</span>
            <div className="flex-1">
              <input
                type="number"
                placeholder="Máximo"
                value={filters.amountRange.max}
                onChange={(e) => onFilterChange('amountRange', { ...filters.amountRange, max: e.target.value })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {filters.amountRange.min || filters.amountRange.max ? (
              `Filtrar por costo total entre ${filters.amountRange.min || '0'} y ${filters.amountRange.max || '∞'}`
            ) : (
              "Ingrese valores para filtrar por rango de montos"
            )}
          </div>
        </div>

        {/* Resumen de filtros activos */}
        {(filters.categories.length > 0 || filters.paymentStatus !== 'all' || 
          filters.visibilityStatus !== 'all' || filters.amountRange.min || 
          filters.amountRange.max || viewLevel !== 3) && (
          <div className="pt-2 mt-3 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-1">Filtros Activos:</div>
            <div className="space-y-1 text-xs text-gray-600">
              {viewLevel !== 3 && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Vista: {viewLevel === 1 ? 'Solo Categorías' : 'Categorías + Gastos'}
                </div>
              )}
              {filters.categories.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {filters.categories.length} categoría{filters.categories.length > 1 ? 's' : ''} seleccionada{filters.categories.length > 1 ? 's' : ''}
                </div>
              )}
              {filters.paymentStatus !== 'all' && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Estado de pago: {filters.paymentStatus === 'paid' ? 'Pagado' : filters.paymentStatus === 'pending' ? 'Pendiente' : 'Parcial'}
                </div>
              )}
              {filters.visibilityStatus !== 'all' && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Visibilidad: {filters.visibilityStatus === 'visible' ? 'Solo visibles' : 'Solo ocultos'}
                </div>
              )}
              {(filters.amountRange.min || filters.amountRange.max) && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Rango: {filters.amountRange.min || '0'} - {filters.amountRange.max || '∞'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};