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

export const DataTableInvitaciones: FC<DataTableProps> = ({ columns, data = [], multiSeled = false, optionSelect, eventId, }) => {

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