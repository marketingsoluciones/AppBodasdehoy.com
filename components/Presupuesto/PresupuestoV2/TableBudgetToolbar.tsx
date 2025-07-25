import React from 'react';
import { HiOutlineSearch, HiOutlineX, HiOutlineFilter } from 'react-icons/hi';
import { IoInformationCircleOutline } from 'react-icons/io5';
import { TbColumns3 } from 'react-icons/tb';

interface ToolbarProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  clearSearch: () => void;
  showFiltersModal: boolean;
  setShowFiltersModal: (v: boolean) => void;
  hasActiveFilters: () =>string | boolean;
  showEventInfoModal: boolean;
  setShowEventInfoModal: (v: boolean) => void;
  showColumnsModal: boolean;
  setShowColumnsModal: (v: boolean) => void;
  event: any;
  handleClearFilters: () => void;
}

export const TableBudgetToolbar: React.FC<ToolbarProps> = ({
  searchTerm,
  setSearchTerm,
  clearSearch,
  showFiltersModal,
  setShowFiltersModal,
  hasActiveFilters,
  showEventInfoModal,
  setShowEventInfoModal,
  showColumnsModal,
  setShowColumnsModal,
  event,
  handleClearFilters
}) => (
  <div className="bg-white shadow-sm border-b px-2 py-1.5 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 bg-gray-50 rounded px-2 py-1 border">
          <HiOutlineSearch className="w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs placeholder-gray-400 w-40 h-5"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <HiOutlineX className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>
      <div className="relative">
        <button
          data-filters-button="true"
          onClick={() => setShowFiltersModal(!showFiltersModal)}
          className={`p-1 rounded transition-colors flex items-center gap-1 ${showFiltersModal || hasActiveFilters()
            ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          title="Filtros"
        >
          <HiOutlineFilter className="w-3.5 h-3.5" />
          <span className="text-xs">Filtros</span>
          {hasActiveFilters() && (
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
          )}
        </button>
      </div>
      <div className="relative">
        <button
          data-event-button="true"
          onClick={() => setShowEventInfoModal(true)}
          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors group flex items-center gap-1"
          title="Información del evento"
        >
          <IoInformationCircleOutline className="w-3.5 h-3.5" />
          <span className="text-xs">Info evento</span>
        </button>
      </div>
      <div className="relative">
        <button
          data-columns-button="true"
          onClick={() => setShowColumnsModal(true)}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
          title="Configurar columnas"
        >
          <TbColumns3 className="w-3.5 h-3.5" />
          <span className="text-xs">Columnas</span>
        </button>
      </div>
    </div>
    <div className={`flex items-center gap-3. mr-6 ${event?.presupuesto_objeto?.viewEstimates ? "w-[38%]" : "w-[33.7%]"}`}>
      <div className={`text-center ${!event?.presupuesto_objeto?.viewEstimates ? "w-[27%]" : "w-[22%]"} `}>
        <div className="text-xs text-gray-500">Total</div>
        <div className="font-semibold text-gray-800 text-xs">
          {/* El total se debe renderizar desde el padre */}
        </div>
      </div>
      {event?.presupuesto_objeto?.viewEstimates && (
        <div className="text-center  w-[22%] ">
          <div className="text-xs text-gray-500 ">Estimado</div>
          <div className="font-semibold text-blue-600 text-xs">
            {/* Estimado desde el padre */}
          </div>
        </div>
      )}
      <div className={`text-center ${!event?.presupuesto_objeto?.viewEstimates ? "w-[27%]" : "w-[22%]"} `}>
        <div className="text-xs text-gray-500">Pagado</div>
        <div className="font-semibold text-green text-xs">
          {/* Pagado desde el padre */}
        </div>
      </div>
      <div className={`text-center ${!event?.presupuesto_objeto?.viewEstimates ? "w-[27%]" : "w-[22%]"} `}>
        <div className="text-xs text-gray-500">Pendiente</div>
        <div className="font-semibold text-red text-xs">
          {/* Pendiente desde el padre */}
        </div>
      </div>
    </div>
  </div>
); 