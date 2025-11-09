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

// Tipos de filtros adaptados para invitaciones
interface InvitationFilters {
  transport: 'all' | 'email' | 'whatsapp';
  templateId: 'all' | string;
  sendStatus: 'all' | string;
}

const getTemplateKey = (communication: Record<string, any>) => {
  if (!communication) return 'sin_identificar';
  return communication.template_id || (communication.template_name ? `name:${communication.template_name}` : 'sin_identificar');
};

export const DataTableInvitaciones: FC<DataTableProps> = ({ columns, data = [], multiSeled = false, optionSelect, eventId, }) => {
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [filters, setFilters] = useState<InvitationFilters>({
    transport: 'all',
    templateId: 'all',
    sendStatus: 'all'
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
    return filters.transport !== 'all' ||
      filters.templateId !== 'all' ||
      filters.sendStatus !== 'all';
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
      transport: 'all',
      templateId: 'all',
      sendStatus: 'all'
    });
  };

  // Función para aplicar filtros a los datos
  const filterDataByCriteria = useCallback((dataSet: any[], criteria: InvitationFilters) => {
    let filteredData = [...dataSet];

    if (criteria.transport !== 'all') {
      filteredData = filteredData.filter(item => {
        if (!Array.isArray(item.comunicaciones_array) || item.comunicaciones_array.length === 0) {
          return false;
        }
        return item.comunicaciones_array.some((communication: any) => communication?.transport === criteria.transport);
      });
    }

    if (criteria.templateId !== 'all') {
      filteredData = filteredData.filter(item => {
        if (!Array.isArray(item.comunicaciones_array) || item.comunicaciones_array.length === 0) {
          return false;
        }
        return item.comunicaciones_array.some((communication: any) => getTemplateKey(communication) === criteria.templateId);
      });
    }

    if (criteria.sendStatus !== 'all') {
      filteredData = filteredData.filter(item => {
        if (!Array.isArray(item.comunicaciones_array) || item.comunicaciones_array.length === 0) {
          return false;
        }
        return item.comunicaciones_array.some((communication: any) =>
          Array.isArray(communication?.statuses) &&
          communication.statuses.some((status: any) => status?.name === criteria.sendStatus)
        );
      });
    }

    return filteredData;
  }, []);

  // Datos filtrados y con búsqueda aplicada
  const searchAppliedData = useMemo(() => {
    if (!searchTerm.trim()) {
      return [...data];
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const searchableKeys: Array<'nombre' | 'correo' | 'telefono'> = ['nombre', 'correo', 'telefono'];

    return data.filter((item) => {
      return searchableKeys.some((key) => {
        const value = (item as any)[key];
        return typeof value === 'string'
          ? value.toLowerCase().includes(searchLower)
          : value !== null && value !== undefined && value.toString().toLowerCase().includes(searchLower);
      });
    });
  }, [data, searchTerm]);

  const dataForTemplateOptions = useMemo(() => {
    const criteria: InvitationFilters = {
      transport: filters.transport,
      templateId: 'all',
      sendStatus: filters.sendStatus
    };
    return filterDataByCriteria(searchAppliedData, criteria);
  }, [searchAppliedData, filters.transport, filters.sendStatus, filterDataByCriteria]);

  const dataForStatusOptions = useMemo(() => {
    const criteria: InvitationFilters = {
      transport: filters.transport,
      templateId: filters.templateId,
      sendStatus: 'all'
    };
    return filterDataByCriteria(searchAppliedData, criteria);
  }, [searchAppliedData, filters.transport, filters.templateId, filterDataByCriteria]);

  const availableTemplates = useMemo(() => {
    const templatesMap = new Map<string, string>();

    dataForTemplateOptions.forEach((item: any) => {
      if (!Array.isArray(item?.comunicaciones_array)) return;
      item.comunicaciones_array.forEach((communication: any) => {
        const key = getTemplateKey(communication);
        const label = communication?.template_name || 'Sin plantilla';
        if (!templatesMap.has(key)) {
          templatesMap.set(key, label);
        }
      });
    });

    return Array.from(templatesMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [dataForTemplateOptions]);

  const availableStatuses = useMemo(() => {
    const statusesSet = new Set<string>();

    dataForStatusOptions.forEach((item: any) => {
      if (!Array.isArray(item?.comunicaciones_array)) return;
      item.comunicaciones_array.forEach((communication: any) => {
        if (!Array.isArray(communication?.statuses)) return;
        communication.statuses.forEach((status: any) => {
          if (status?.name) {
            statusesSet.add(status.name);
          }
        });
      });
    });

    return Array.from(statusesSet).sort((a, b) => a.localeCompare(b));
  }, [dataForStatusOptions]);

  const selectedTemplateLabel = useMemo(() => {
    if (filters.templateId === 'all') {
      return '';
    }
    const match = availableTemplates.find(template => template.value === filters.templateId);
    return match?.label || 'Plantilla seleccionada';
  }, [availableTemplates, filters.templateId]);

  useEffect(() => {
    if (filters.templateId !== 'all') {
      const exists = availableTemplates.some(template => template.value === filters.templateId);
      if (!exists) {
        setFilters(prev => ({ ...prev, templateId: 'all' }));
      }
    }
  }, [availableTemplates, filters.templateId]);

  useEffect(() => {
    if (filters.sendStatus !== 'all') {
      const exists = availableStatuses.includes(filters.sendStatus);
      if (!exists) {
        setFilters(prev => ({ ...prev, sendStatus: 'all' }));
      }
    }
  }, [availableStatuses, filters.sendStatus]);

  const filteredData = useMemo(() => {
    return filterDataByCriteria(searchAppliedData, filters) as typeof data;
  }, [searchAppliedData, filters, filterDataByCriteria]);

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
              placeholder="Buscar invitados, correos o teléfonos"
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
                {/* Filtro por canal */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Canal</label>
                  <select
                    value={filters.transport}
                    onChange={(e) => handleFilterChange('transport', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los canales</option>
                    <option value="email">Correo electrónico</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                {/* Filtro por plantilla */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Plantilla</label>
                  <select
                    value={filters.templateId}
                    onChange={(e) => handleFilterChange('templateId', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!availableTemplates.length}
                  >
                    <option value="all">Todas las plantillas</option>
                    {availableTemplates.map((template) => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por estado de envío */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado de envío</label>
                  <select
                    value={filters.sendStatus}
                    onChange={(e) => handleFilterChange('sendStatus', e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!availableStatuses.length}
                  >
                    <option value="all">Todos los estados</option>
                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resumen de filtros activos */}
                {hasActiveFilters() && (
                  <div className="pt-2 mt-3 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-700 mb-1">Filtros Activos:</div>
                    <div className="space-y-1 text-xs text-gray-600">
                      {filters.transport !== 'all' && (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Canal: {filters.transport === 'email' ? 'Correo electrónico' : 'WhatsApp'}
                        </div>
                      )}
                      {filters.templateId !== 'all' && (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Plantilla: {selectedTemplateLabel}
                        </div>
                      )}
                      {filters.sendStatus !== 'all' && (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                          Estado: {filters.sendStatus}
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