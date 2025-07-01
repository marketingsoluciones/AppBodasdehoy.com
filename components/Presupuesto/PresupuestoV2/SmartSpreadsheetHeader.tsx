// components/SmartSpreadsheetHeader.tsx
import React from 'react';
import { IoSearchOutline, IoFilterOutline, IoEyeOutline, IoInformationCircleOutline } from "react-icons/io5";
import { TableFilters, TableTotals } from './types';

interface SmartSpreadsheetHeaderProps {
  filters: TableFilters;
  onFilterChange: (filterType: keyof TableFilters, value: any) => void;
  totals: TableTotals;
  showFiltersModal: boolean;
  setShowFiltersModal: (show: boolean) => void;
  showColumnsConfig: boolean;
  setShowColumnsConfig: (show: boolean) => void;
  showEventInfoModal: boolean;
  setShowEventInfoModal: (show: boolean) => void;
  formatNumber: (value: number) => string;
}

export const SmartSpreadsheetHeader: React.FC<SmartSpreadsheetHeaderProps> = ({
  filters,
  onFilterChange,
  totals,
  showFiltersModal,
  setShowFiltersModal,
  showColumnsConfig,
  setShowColumnsConfig,
  showEventInfoModal,
  setShowEventInfoModal,
  formatNumber
}) => {
  // Calcular el número de filtros activos
  const activeFiltersCount = 
    filters.categories.length + 
    (filters.paymentStatus !== 'all' ? 1 : 0) + 
    (filters.visibilityStatus !== 'all' ? 1 : 0) + 
    (filters.amountRange.min || filters.amountRange.max ? 1 : 0);

  return (
    <div className="bg-white shadow-sm border-b px-3 py-2 flex flex-col lg:flex-row lg:items-center lg:justify-between relative gap-2 lg:gap-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <h2 className="text-base font-semibold text-gray-800">Vista Inteligente</h2>
        
        {/* Barra de búsqueda */}
        <div className="relative">
          <IoSearchOutline className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <input
            type="text"
            placeholder="Buscar..."
            value={filters.searchText}
            onChange={(e) => onFilterChange('searchText', e.target.value)}
            className="pl-8 pr-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-48"
          />
        </div>

        {/* Botones de control */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowEventInfoModal(!showEventInfoModal)}
            className={`event-info-button flex items-center gap-1 px-2 py-1 text-xs border rounded transition-colors ${
              showEventInfoModal 
                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <IoInformationCircleOutline className="w-3 h-3" />
            <span className="hidden sm:inline">Info</span>
          </button>

          <button
            onClick={() => setShowFiltersModal(!showFiltersModal)}
            className={`filter-button flex items-center gap-1 px-2 py-1 text-xs border rounded transition-colors ${
              showFiltersModal || activeFiltersCount > 0
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <IoFilterOutline className="w-3 h-3" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowColumnsConfig(!showColumnsConfig)}
            className={`column-button flex items-center gap-1 px-2 py-1 text-xs border rounded transition-colors ${
              showColumnsConfig 
                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <IoEyeOutline className="w-3 h-3" />
            <span className="hidden sm:inline">Columnas</span>
          </button>
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="flex items-center gap-2 sm:gap-4 lg:pr-8 overflow-x-auto">
        <div className="text-center min-w-0 flex-shrink-0">
          <div className="text-xs text-gray-500">Estimado</div>
          <div className="font-semibold text-blue-600 text-xs sm:text-sm">
            {formatNumber(totals.estimado)}
          </div>
        </div>
        <div className="text-center min-w-0 flex-shrink-0">
          <div className="text-xs text-gray-500">Total</div>
          <div className="font-semibold text-gray-800 text-xs sm:text-sm">
            {formatNumber(totals.total)}
          </div>
        </div>
        <div className="text-center min-w-0 flex-shrink-0">
          <div className="text-xs text-gray-500">Pagado</div>
          <div className="font-semibold text-green-600 text-xs sm:text-sm">
            {formatNumber(totals.pagado)}
          </div>
        </div>
        <div className="text-center min-w-0 flex-shrink-0">
          <div className="text-xs text-gray-500">Pendiente</div>
          <div className="font-semibold text-red-600 text-xs sm:text-sm">
            {formatNumber(totals.total - totals.pagado)}
          </div>
        </div>
      </div>
    </div>
  );
};