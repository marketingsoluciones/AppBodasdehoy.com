import { FC, useMemo } from "react";
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
import { IoInformationCircleOutline } from "react-icons/io5";
import { TbColumns3 } from "react-icons/tb";

export const DataTableInvitaciones: FC<DataTableProps> = ({ columns, data = [], multiSeled = false, optionSelect, eventId, }) => {
  console.log(data);

  // Hook para gestionar visibilidad de columnas
  const {
    visibleColumns,
    toggleColumn,
    filteredColumns,
  } = useColumnVisibility(columns, eventId);

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } =
    useTable({ columns: filteredColumns, data }, useSortBy, useRowSelect, (hooks) => {
      hooks.visibleColumns.push((columns) => [
        {
          id: "selection",
          Cell: ({ row }) => {
            useRowSelectionCell(row, multiSeled);

            return (
              <div key={row.id} className="flex justify-center items-center">
                {multiSeled && <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />}
              </div>
            );
          },
          Header: ({ getToggleAllRowsSelectedProps }) => {
            return (
              <div className="absolute z-10 -translate-y-11 -translate-x-1">
                <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
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
    <div className="relative">
      <div className="flex justify-between items-center px-4 border-b border-gray-200">
        {multiSeled && (
          <SendButton
            isResend={data?.length && data[0]?.invitacion}
            optionSelect={optionSelect}
          />
        )}
        <ColumnToggle
          columns={columns}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumn}
        />
      </div>
      <div className="flex items-center gap-2">
        <div className=" hidden md:flex items-center gap-1.5 ">
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
      <div className="overflow-x-auto">
        <table
          {...getTableProps()}
          className="border-collapse min-w-full w-max relative"
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