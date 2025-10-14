import { FC, useEffect, useState } from "react";
import { useRowSelect, useSortBy, useTable } from "react-table";
import { IndeterminateCheckbox } from "./IndeterminateCheckbox";
import { DataTableGroupContextProvider } from "../../context/DataTableGroupContext";
import { DataTableProps } from "./types";
import { COLUMN_SPAN_CONFIG } from "./constants";
import { TableHeader } from "./components/TableHeader";
import { TableBody } from "./components/TableBody";
import { SendButton } from "./components/SendButton";
import { useRowSelectionCell } from "./hooks/useRowSelection";
import { ColumnToggle } from "./ColumnToggle";
import { useColumnVisibility } from "./hooks/useColumnVisibility";

export const DataTableInvitaciones: FC<DataTableProps> = ({
  columns,
  data = [],
  multiSeled = false,
  optionSelect,
  eventId,
}) => {
  const { dataTableGroup: { arrIDs } } = DataTableGroupContextProvider();
  console.log(99999, arrIDs)

  // Hook para gestionar visibilidad de columnas
  const {
    visibleColumns,
    toggleColumn,
    filteredColumns,
  } = useColumnVisibility(columns, eventId);

  // Para correos:
  const selectedEmails = data
    .filter(guest => arrIDs.includes(guest._id))
    .map(guest => guest.correo);

  // Para teléfonos:
  const selectedPhones = data
    .filter(guest => arrIDs.includes(guest._id))
    .map(guest => guest.telefono);

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

  // Calcular el total de spans de las columnas visibles
  const totalSpan = headerGroups[0]?.headers.reduce((sum: number, header: any) => {
    return sum + (COLUMN_SPAN_CONFIG[header.id] || 1);
  }, 0) || 24;

  const isSendButtonDisabled = !arrIDs?.length;


  return (
    <div className="relative">
      <div className="flex justify-between items-center px-4 border-b border-gray-200">
        {multiSeled && (
          <SendButton
            isDisabled={isSendButtonDisabled}
            isResend={data?.length && data[0]?.invitacion}
            optionSelect={optionSelect}
            arrEnviarInvitaciones={selectedEmails}
          />
        )}
        <ColumnToggle
          columns={columns}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumn}
        />
      </div>
      <table
        {...getTableProps()}
        className="table-auto border-collapse w-full  relative p-4"
      >
        <TableHeader
          headerGroups={headerGroups}
          totalSpan={totalSpan}
        />
        <TableBody
          getTableBodyProps={getTableBodyProps}
          rows={rows}
          prepareRow={prepareRow}
          totalSpan={totalSpan}
        />
      </table>
    </div>
  );
};