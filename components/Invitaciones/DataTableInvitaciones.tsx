import { FC, useEffect } from "react";
import { useRowSelect, useSortBy, useTable } from "react-table";
import { IndeterminateCheckbox } from "./IndeterminateCheckbox";
import { DataTableGroupContextProvider } from "../../context/DataTableGroupContext";
import { useTranslation } from 'react-i18next';
import { DataTableProps } from "./types";
import { COLUMN_SPAN_CONFIG } from "./constants";
import { TableHeader } from "./components/TableHeader";
import { TableBody } from "./components/TableBody";
import { SendButton } from "./components/SendButton";
import { useRowSelection, useRowSelectionCell } from "./hooks/useRowSelection";

export const DataTableInvitaciones: FC<DataTableProps> = ({
  columns,
  data = [],
  multiSeled = false,
  setArrEnviatInvitaciones,
  reenviar,
  activeFunction
}) => {
  const { t } = useTranslation();
  const { selectedData, setSelectedData } = useRowSelection();

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
            const { dataTableGroup: { arrIDs } } = DataTableGroupContextProvider();

            useEffect(() => {
              setSelectedData({ arrIDs, getToggleAllRowsSelectedProps });
            }, [arrIDs, getToggleAllRowsSelectedProps, setSelectedData]);

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

  const handleSendInvitations = () => {
    if (selectedData?.arrIDs?.length) {
      setArrEnviatInvitaciones(selectedData.arrIDs);
    }
  };

  const isSendButtonDisabled = !selectedData?.arrIDs?.length;

  return (
    <div className="relative">
      {multiSeled && (
        <SendButton
          isDisabled={isSendButtonDisabled}
          onClick={handleSendInvitations}
          isResend={reenviar}
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