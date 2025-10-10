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

export const DataTableInvitaciones: FC<DataTableProps> = ({
  columns,
  data = [],
  multiSeled = false,
  optionSelect,
}) => {
  const { dataTableGroup: { arrIDs } } = DataTableGroupContextProvider();

  // Para correos:
  const selectedEmails = data
    .filter(guest => arrIDs.includes(guest._id))
    .map(guest => guest.correo);

  // Para teléfonos:
  const selectedPhones = data
    .filter(guest => arrIDs.includes(guest._id))
    .map(guest => guest.telefono);

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } =
    useTable({ columns, data }, useSortBy, useRowSelect, (hooks) => {
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

  const getColumnSpan = (columnId: string) => `col-span-${COLUMN_SPAN_CONFIG[columnId] || 1}`;

  const isSendButtonDisabled = !arrIDs?.length;
  

  return (
    <div className="relative">
      {multiSeled && (
        <SendButton
          isDisabled={isSendButtonDisabled}
          isResend={data?.length && data[0]?.invitacion}
          optionSelect={optionSelect}
          arrEnviarInvitaciones={selectedEmails}
        />
      )}

      <table
        {...getTableProps()}
        className="table-auto border-collapse w-full rounded-lg relative p-4"
      >
        <TableHeader
          headerGroups={headerGroups}
          getColumnSpan={getColumnSpan}
        />
        <TableBody
          getTableBodyProps={getTableBodyProps}
          rows={rows}
          prepareRow={prepareRow}
          getColumnSpan={getColumnSpan}
        />
      </table>
    </div>
  );
};