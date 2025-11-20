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
import { useTranslation } from 'react-i18next';
import { FilterSelectWithMode, FilterMode } from "./components/FilterSelectWithMode";
import { FiltersModal } from "./components/FiltersModal";

// Tipos de filtros adaptados para invitaciones
interface InvitationFilters {
  transport: 'all' | 'email' | 'whatsapp';
  templateId: 'all' | string;
  templateMode: FilterMode;
  sendStatus: 'all' | string;
  sendStatusMode: FilterMode;
  attendance: 'all' | string;
  attendanceMode: FilterMode;
}

const getTemplateKey = (communication: Record<string, any>) => {
  if (!communication) return 'sin_identificar';
  return communication.template_id || (communication.template_name ? `name:${communication.template_name}` : 'sin_identificar');
};

export const DataTableInvitaciones: FC<DataTableProps> = ({ columns, data = [], multiSeled = false, optionSelect, eventId, }) => {
  const { t } = useTranslation();
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [filters, setFilters] = useState<InvitationFilters>({
    transport: 'all',
    templateId: 'all',
    templateMode: 'include',
    sendStatus: 'all',
    sendStatusMode: 'include',
    attendance: 'all',
    attendanceMode: 'include'
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
      filters.sendStatus !== 'all' ||
      filters.attendance !== 'all';
  };

  // Función para manejar cambios en filtros
  const handleFilterChange = (filterType: keyof InvitationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  type FilterModeKey = 'templateMode' | 'sendStatusMode' | 'attendanceMode';

  const handleFilterModeChange = (modeKey: FilterModeKey, mode: FilterMode) => {
    setFilters(prev => ({
      ...prev,
      [modeKey]: mode
    }));
  };

  // Función para limpiar todos los filtros
  const handleClearFilters = () => {
    setFilters({
      transport: 'all',
      templateId: 'all',
      templateMode: 'include',
      sendStatus: 'all',
      sendStatusMode: 'include',
      attendance: 'all',
      attendanceMode: 'include'
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
          return criteria.templateMode === 'exclude';
        }
        const hasTemplate = item.comunicaciones_array.some((communication: any) => getTemplateKey(communication) === criteria.templateId);
        return criteria.templateMode === 'include' ? hasTemplate : !hasTemplate;
      });
    }

    if (criteria.sendStatus !== 'all') {
      filteredData = filteredData.filter(item => {
        if (!Array.isArray(item.comunicaciones_array) || item.comunicaciones_array.length === 0) {
          return criteria.sendStatusMode === 'exclude';
        }
        const hasStatus = item.comunicaciones_array.some((communication: any) =>
          Array.isArray(communication?.statuses) &&
          communication.statuses.some((status: any) => status?.name === criteria.sendStatus)
        );
        return criteria.sendStatusMode === 'include' ? hasStatus : !hasStatus;
      });
    }

    if (criteria.attendance !== 'all') {
      filteredData = filteredData.filter(item => {
        const attendance = (item.asistencia || '').toString().toLowerCase();
        const matches = attendance === criteria.attendance.toLowerCase();
        return criteria.attendanceMode === 'include' ? matches : !matches;
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
      templateMode: filters.templateMode,
      sendStatus: filters.sendStatus,
      sendStatusMode: filters.sendStatusMode,
      attendance: filters.attendance,
      attendanceMode: filters.attendanceMode
    };
    return filterDataByCriteria(searchAppliedData, criteria);
  }, [
    searchAppliedData,
    filters.transport,
    filters.templateMode,
    filters.sendStatus,
    filters.sendStatusMode,
    filters.attendance,
    filters.attendanceMode,
    filterDataByCriteria
  ]);

  const dataForStatusOptions = useMemo(() => {
    const criteria: InvitationFilters = {
      transport: filters.transport,
      templateId: filters.templateId,
      templateMode: filters.templateMode,
      sendStatus: 'all',
      sendStatusMode: filters.sendStatusMode,
      attendance: filters.attendance,
      attendanceMode: filters.attendanceMode
    };
    return filterDataByCriteria(searchAppliedData, criteria);
  }, [
    searchAppliedData,
    filters.transport,
    filters.templateId,
    filters.templateMode,
    filters.sendStatusMode,
    filters.attendance,
    filters.attendanceMode,
    filterDataByCriteria
  ]);

  const dataForAttendanceOptions = useMemo(() => {
    const criteria: InvitationFilters = {
      transport: filters.transport,
      templateId: filters.templateId,
      templateMode: filters.templateMode,
      sendStatus: filters.sendStatus,
      sendStatusMode: filters.sendStatusMode,
      attendance: 'all',
      attendanceMode: filters.attendanceMode
    };
    return filterDataByCriteria(searchAppliedData, criteria);
  }, [
    searchAppliedData,
    filters.transport,
    filters.templateId,
    filters.templateMode,
    filters.sendStatus,
    filters.sendStatusMode,
    filters.attendanceMode,
    filterDataByCriteria
  ]);

  const availableTemplates = useMemo(() => {
    const templatesMap = new Map<string, string>();

    dataForTemplateOptions.forEach((item: any) => {
      if (!Array.isArray(item?.comunicaciones_array)) return;
      item.comunicaciones_array.forEach((communication: any) => {
        const key = getTemplateKey(communication);
        const label = communication?.template_name || t("Sin plantilla");
        if (!templatesMap.has(key)) {
          templatesMap.set(key, label);
        }
      });
    });

    return Array.from(templatesMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [dataForTemplateOptions, t]);

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

  const availableAttendance = useMemo(() => {
    const attendanceSet = new Set<string>();

    dataForAttendanceOptions.forEach((item: any) => {
      if (item?.asistencia) {
        attendanceSet.add(item.asistencia.toString());
      }
    });

    return Array.from(attendanceSet).sort((a, b) => a.localeCompare(b));
  }, [dataForAttendanceOptions]);

  const selectedTemplateLabel = useMemo(() => {
    if (filters.templateId === 'all') {
      return '';
    }
    const match = availableTemplates.find(template => template.value === filters.templateId);
    return match?.label || t("Plantilla seleccionada");
  }, [availableTemplates, filters.templateId, t]);

  const formatAttendanceLabel = useCallback((value: string) => {
    const normalized = value.toLowerCase();
    switch (normalized) {
      case 'pendiente':
        return t("Pendiente", { defaultValue: "Pendiente" });
      case 'aceptado':
        return t("Aceptado", { defaultValue: "Aceptado" });
      case 'cancelado':
        return t("Cancelado", { defaultValue: "Cancelado" });
      default:
        return value;
    }
  }, [t]);

  const templateSelectOptions = useMemo(() => {
    return [
      { value: 'all', label: t("Todas las plantillas") },
      ...availableTemplates,
    ];
  }, [availableTemplates, t]);

  const statusSelectOptions = useMemo(() => {
    return [
      { value: 'all', label: t("Todos los estados") },
      ...availableStatuses.map((status) => ({ value: status, label: status })),
    ];
  }, [availableStatuses, t]);

  const attendanceSelectOptions = useMemo(() => {
    return [
      { value: 'all', label: t("Todas las asistencias", { defaultValue: "Todas las asistencias" }) },
      ...availableAttendance.map((value) => ({ value, label: formatAttendanceLabel(value) })),
    ];
  }, [availableAttendance, formatAttendanceLabel, t]);

  const getModeLabel = useCallback((mode: FilterMode) => {
    return mode === 'include'
      ? t("Incluir", { defaultValue: "Incluir" })
      : t("Excluir", { defaultValue: "Excluir" });
  }, [t]);

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

  useEffect(() => {
    if (filters.attendance !== 'all') {
      const exists = availableAttendance.some(value => value.toLowerCase() === filters.attendance.toLowerCase());
      if (!exists) {
        setFilters(prev => ({ ...prev, attendance: 'all' }));
      }
    }
  }, [availableAttendance, filters.attendance]);

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
                <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} tooltip={t("Seleccionar todos")} />
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

  const filtersModalContent = (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{t("Canal")}</label>
        <select
          value={filters.transport}
          onChange={(e) => handleFilterChange('transport', e.target.value)}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">{t("Todos los canales")}</option>
          <option value="email">{t("Correo electrónico")}</option>
          <option value="whatsapp">{t("whatsapp")}</option>
        </select>
      </div>

      <FilterSelectWithMode
        label={t("template")}
        name="templateMode"
        options={templateSelectOptions}
        value={filters.templateId}
        mode={filters.templateMode}
        includeLabel={t("Incluir")}
        excludeLabel={t("Excluir")}
        onChangeValue={(value) => handleFilterChange('templateId', value)}
        onChangeMode={(mode) => handleFilterModeChange('templateMode', mode)}
        disabled={templateSelectOptions.length <= 1}
      />

      <FilterSelectWithMode
        label={t("Estado de envío")}
        name="sendStatusMode"
        options={statusSelectOptions}
        value={filters.sendStatus}
        mode={filters.sendStatusMode}
        includeLabel={t("Incluir")}
        excludeLabel={t("Excluir")}
        onChangeValue={(value) => handleFilterChange('sendStatus', value)}
        onChangeMode={(mode) => handleFilterModeChange('sendStatusMode', mode)}
        disabled={statusSelectOptions.length <= 1}
      />

      <FilterSelectWithMode
        label={t("Asistencia")}
        name="attendanceMode"
        options={attendanceSelectOptions}
        value={filters.attendance}
        mode={filters.attendanceMode}
        includeLabel={t("Incluir")}
        excludeLabel={t("Excluir")}
        onChangeValue={(value) => handleFilterChange('attendance', value)}
        onChangeMode={(mode) => handleFilterModeChange('attendanceMode', mode)}
        disabled={attendanceSelectOptions.length <= 1}
      />

      {hasActiveFilters() && (
        <div className="pt-2 mt-3 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-1">{t("Filtros activos")}:</div>
          <div className="space-y-1 text-xs text-gray-600">
            {filters.transport !== 'all' && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                {t("Canal")}: {filters.transport === 'email' ? t("Correo electrónico") : t("whatsapp")}
              </div>
            )}
            {filters.templateId !== 'all' && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {t("template")}: {getModeLabel(filters.templateMode)} · {selectedTemplateLabel}
              </div>
            )}
            {filters.sendStatus !== 'all' && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                {t("state")}: {getModeLabel(filters.sendStatusMode)} · {filters.sendStatus}
              </div>
            )}
            {filters.attendance !== 'all' && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                {t("Asistencia")}: {getModeLabel(filters.attendanceMode)} · {formatAttendanceLabel(filters.attendance)}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col w-full h-full relative">
      <div className="flex items-center justify-between pb-2 px-2 gap-2 relative">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center gap-1.5 bg-gray-50 rounded-md px-2 py-1 border h-8">
            <HiOutlineSearch onClick={() => isMobile ? setShowSearch(!showSearch) : null} className="w-3.5 h-3.5 text-gray-700" />
            <input
              type="text"
              placeholder={t("Buscar invitados, correos o teléfonos")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${showSearch ? 'block' : 'hidden'} md:block bg-transparent border-none outline-none text-xs placeholder-gray-400 w-[80vw] md:w-64 h-5`}
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
          {!showSearch && <div className="relative w-16">
            <button
              data-filters-button="true"
              onClick={() => setShowFiltersModal(!showFiltersModal)}
              className={`p-1 rounded transition-colors flex items-center gap-1 ${showFiltersModal || hasActiveFilters()
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                : 'text-gray-700 hover:text-gray-600 hover:bg-gray-100'
                }`}
              title={t("Filtros")}
            >
              <HiOutlineFilter className="w-3.5 h-3.5" />
              <span className="text-xs">{t("Filtros")}</span>
              {hasActiveFilters() && (
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>

          </div>}


          {/* Modal de Filtros */}
          <FiltersModal
            isMobile={isMobile}
            show={showFiltersModal}
            onClose={() => setShowFiltersModal(false)}
            onClear={handleClearFilters}
            title={t("Filtros")}
            clearLabel={t("Limpiar")}
            closeAriaLabel={t("Cerrar")}
            content={filtersModalContent}
            t={t}
          />

          {!showSearch && <ColumnToggle
            columns={columns}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
          />}
        </div>


        <div className=" bg-white h-full flex justify-center items-center" >
          {multiSeled && (
            <SendButton
              optionSelect={optionSelect}
            />
          )}
        </div>

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