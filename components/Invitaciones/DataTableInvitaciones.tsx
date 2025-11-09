import { FC, useMemo, useState, useEffect, useCallback } from "react";
import { useRowSelect, useSortBy, useTable } from "react-table";
import { IndeterminateCheckbox } from "./IndeterminateCheckbox";
import { DataTableProps } from "./types";
import { COLUMN_WIDTH_CONFIG } from "./constants";
import { TableHeader } from "./components/TableHeader";
import { TableBody } from "./components/TableBody";
import { SendButton } from "./components/SendButton";
import { useRowSelectionCell } from "./hooks/useRowSelection";
import { ColumnToggle } from "./ColumnToggle";
import { useColumnVisibility } from "./hooks/useColumnVisibility";
import { HiOutlineFilter, HiOutlineSearch, HiOutlineX } from "react-icons/hi";
import { IoCloseOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import { DataTableGroupContextProvider } from "../../context/DataTableGroupContext";

// Tipos de filtros adaptados para invitaciones
interface InvitationFilters {
  invitationStatus: 'all' | 'sent' | 'not_sent';
  sexo: 'all' | 'hombre' | 'mujer';
  companionsRange: {
    min: string;
    max: string;
  };
}

export const DataTableInvitaciones: FC<DataTableProps> = ({ columns, data = [], multiSeled = false, optionSelect, eventId, }) => {
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [filters, setFilters] = useState<InvitationFilters>({
    invitationStatus: 'all',
    sexo: 'all',
    companionsRange: { min: '', max: '' }
  });

  // Detectar si es móvil o desktop
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px es el breakpoint md de Tailwind
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Hook para gestionar visibilidad de columnas
  const {
    visibleColumns,
    toggleColumn,
    filteredColumns,
  } = useColumnVisibility(columns, eventId);

  // Función para limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Función para verificar si hay filtros activos
  const hasActiveFilters = () => {
    return filters.invitationStatus !== 'all' ||
      filters.sexo !== 'all' ||
      filters.companionsRange.min ||
      filters.companionsRange.max;
  };

  // Función para manejar cambios en filtros
  const handleFilterChange = (filterType: keyof InvitationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Función para limpiar todos los filtros
  const handleClearFilters = () => {
    setFilters({
      invitationStatus: 'all',
      sexo: 'all',
      companionsRange: { min: '', max: '' }
    });
  };

  // Función para aplicar filtros a los datos
  const applyFilters = useCallback((data: any[]) => {
    let filteredData = [...data];

    // Filtro por estado de invitación
    if (filters.invitationStatus !== 'all') {
      filteredData = filteredData.filter(item => {
        if (filters.invitationStatus === 'sent') {
          return item.invitacion === true || item.comunicaciones_array?.length > 0;
        } else if (filters.invitationStatus === 'not_sent') {
          return item.invitacion === false && (!item.comunicaciones_array || item.comunicaciones_array.length === 0);
        }
        return true;
      });
    }

    // Filtro por sexo
    if (filters.sexo !== 'all') {
      filteredData = filteredData.filter(item => item.sexo === filters.sexo);
    }

    // Filtro por rango de acompañantes
    if (filters.companionsRange.min || filters.companionsRange.max) {
      filteredData = filteredData.filter(item => {
        const companions = item.acompañantes || 0;
        const min = filters.companionsRange.min ? parseFloat(filters.companionsRange.min) : 0;
        const max = filters.companionsRange.max ? parseFloat(filters.companionsRange.max) : Infinity;
        return companions >= min && companions <= max;
      });
    }

    return filteredData;
  }, [filters]);

  // Datos filtrados y con búsqueda aplicada
  const filteredData = useMemo(() => {
    let result: any[] = [...data];

    // Aplicar búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter((item: any) => {
        const searchableFields = [
          item.nombre,
          item.correo,
          item.telefono
        ];
        return searchableFields.some(field =>
          field && field.toString().toLowerCase().includes(searchLower)
        );
      });
    }

    // Aplicar filtros
    result = applyFilters(result);
    return result as typeof data;
  }, [data, searchTerm, applyFilters]);

  // useEffect para manejar clicks fuera de los modales
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showFiltersModal) {
        const filtersModal = document.querySelector('.filters-modal');
        const filtersButton = document.querySelector('[data-filters-button]');
        if (filtersModal && !filtersModal.contains(target) &&
          filtersButton && !filtersButton.contains(target)) {
          setShowFiltersModal(false);
        }
      }
    };
    if (showFiltersModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFiltersModal]);

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } =
    useTable({ columns: filteredColumns, data: filteredData }, useSortBy, useRowSelect, (hooks) => {
      hooks.visibleColumns.push((columns) => [
        {
          id: "selection",
          Cell: ({ row }) => {
            useRowSelectionCell(row, multiSeled);

            return (
              <div key={row.id} className="flex w-full justify-center items-center">
                {multiSeled && <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />}
              </div>
            );
          },
          Header: ({ getToggleAllRowsSelectedProps }) => {
            return (
              <div className="flex justify-center items-center">
                <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} tooltip="Seleccionar todos" />
              </div>
            );
          },
        },
        ...columns,
      ]);
    });

  // Construir el gridTemplate basado en las columnas visibles y sus anchos configurados
  const gridTemplate = useMemo(() => {
    return headerGroups[0]?.headers
      .map((header: any) => COLUMN_WIDTH_CONFIG[header.id] || '150px')
      .join(' ') || 'auto';
  }, [headerGroups]);

  return (
    <div className="flex flex-col w-full h-full relative">
      <div className="flex px-3 justify-center items-center border-b border-gray-200">


      </div>
      <div className="flex items-center py-1 px-2 gap-2 relative">
        <div className="flex items-center gap-1.5">
          <div className="relative flex items-center gap-1.5 bg-gray-50 rounded-md px-2 py-1 border h-8">
            <HiOutlineSearch onClick={() => isMobile ? setShowSearch(!showSearch) : null} className="w-3.5 h-3.5 text-gray-700" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${showSearch ? 'block' : 'hidden'} md:block bg-transparent border-none outline-none text-xs placeholder-gray-400 w-[80vw] md:w-80 h-5`}
              autoFocus
            />
            {(searchTerm || (isMobile && showSearch)) && (
              <button
                onClick={() => {
                  clearSearch();
                  setShowSearch(false);
                }}
                className="absolute right-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HiOutlineX className="w-3 h-3 text-gray-700" />
              </button>
            )}
          </div>
        </div>
        {!showSearch && <div className="relative w-16">
          <button
            data-filters-button="true"
            onClick={() => setShowFiltersModal(!showFiltersModal)}
            className={`p-1 rounded transition-colors flex items-center gap-1 ${showFiltersModal || hasActiveFilters()
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              : 'text-gray-700 hover:text-gray-600 hover:bg-gray-100'
              }`}
            title="Filtros"
          >
            <HiOutlineFilter className="w-3.5 h-3.5" />
            <span className="text-xs">Filtros</span>
            {hasActiveFilters() && (
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            )}
          </button>

        </div>}
        <div className="flex-1 bg-white h-full flex justify-center items-center" >
          {multiSeled && (
            <SendButton
              optionSelect={optionSelect}
            />
          )}
        </div>

        {/* Modal de Filtros */}
        {showFiltersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isMobile ? 0.3 : 0 }}
          >
            <div className="md:hidden top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40" />
            <div className="filters-modal fixed top-1/2 left-1/2 y transform -translate-x-1/2 -translate-y-1/2 md:absolute md:top-11 md:left-32 md:translate-x-0 md:translate-y-0 bg-white shadow-xl rounded-xl border z-50 w-full h-[80vh] md:w-80 md:h-auto md:max-h-[450px] overflow-y-auto">
              <div className="px-3 py-1 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 text-sm">Filtros</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleClearFilters}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={() => setShowFiltersModal(false)}
                      className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <IoCloseOutline className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>


              <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
                {/* Filtro por Estado de Invitación */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado de Invitación</label>
                  <select
                    value={filters.invitationStatus}
                    onChange={(e) => handleFilterChange('invitationStatus', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todas las invitaciones</option>
                    <option value="sent">✅ Enviadas</option>
                    <option value="not_sent">⏳ No enviadas</option>
                  </select>
                </div>

                {/* Filtro por Sexo */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sexo</label>
                  <select
                    value={filters.sexo}
                    onChange={(e) => handleFilterChange('sexo', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="hombre">Hombre</option>
                    <option value="mujer">Mujer</option>
                  </select>
                </div>

                {/* Filtro por Rango de Acompañantes */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Rango de Acompañantes
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Mínimo"
                        value={filters.companionsRange.min}
                        onChange={(e) => handleFilterChange('companionsRange', { ...filters.companionsRange, min: e.target.value })}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <span className="text-xs text-gray-400 self-center">a</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Máximo"
                        value={filters.companionsRange.max}
                        onChange={(e) => handleFilterChange('companionsRange', { ...filters.companionsRange, max: e.target.value })}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Resumen de filtros activos */}
                {hasActiveFilters() && (
                  <div className="pt-2 mt-3 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-700 mb-1">Filtros Activos:</div>
                    <div className="space-y-1 text-xs text-gray-600">
                      {filters.invitationStatus !== 'all' && (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Estado: {filters.invitationStatus === 'sent' ? 'Enviadas' : 'No enviadas'}
                        </div>
                      )}
                      {filters.sexo !== 'all' && (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Sexo: {filters.sexo === 'hombre' ? 'Hombre' : 'Mujer'}
                        </div>
                      )}
                      {(filters.companionsRange.min || filters.companionsRange.max) && (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                          Acompañantes: {filters.companionsRange.min || '0'} - {filters.companionsRange.max || '∞'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {!showSearch && <ColumnToggle
          columns={columns}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumn}
        />}

      </div>
      <div id="scrolls-table-container" className="flex w-full overflow-visible">
        <table
          {...getTableProps()}
          className="border-collapse min-w-full w-max relative overflow-visible"
        >
          <TableHeader
            headerGroups={headerGroups}
            gridTemplate={gridTemplate}
          />
          <TableBody
            getTableBodyProps={getTableBodyProps}
            rows={rows}
            prepareRow={prepareRow}
            gridTemplate={gridTemplate}
          />
        </table>
      </div>

    </div>
  );
};