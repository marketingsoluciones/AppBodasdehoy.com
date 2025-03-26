import { ForwardRefComponent } from "framer-motion";
import { useEffect, forwardRef, useRef, useState, FC, ReactNode } from "react";
import { useRowSelect, useTable, useExpanded, } from "react-table";
import { EventContextProvider } from "../../context";
import { guests } from "../../utils/Interfaces";
import { DataTableGroupContextProvider } from "../../context/DataTableGroupContext";
import { TrExpand } from "./TrExpand";
import { IndeterminateCheckbox } from "../Invitaciones/IndeterminateCheckbox";
import { useTranslation } from 'react-i18next';


interface propsDataTableFinal {
  data: guests[];
  columns: any;
  children?: ReactNode;
  renderRowSubComponent?: any
}

const DataTableFinal: FC<propsDataTableFinal> = (props) => {
  const { t } = useTranslation();
  const { children, data = [], columns = [], renderRowSubComponent } = props;
  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows, state: { expanded } } = useTable({ columns, data }, useExpanded);
  const { event } = EventContextProvider();

  // Uso de useTable para pasar data y cargar propiedades
  const tableInstance = useTable(
    { columns, data },
    useRowSelect,
    (hooks: any) => {
      hooks.visibleColumns.push((columns: any) => [
        {
          id: "selection",
          Header: (props: any) => {
            return false;
          },

          Cell: (props) => {
            const { row } = props;
            const { dispatch, dataTableGroup: { arrIDs, checkedAll } } = DataTableGroupContextProvider()

            useEffect(() => {
              checkedAll
                ? row.toggleRowSelected(true)
                : row.toggleRowSelected(false);
            }, [checkedAll]);

            useEffect(() => {
              const id = row?.original?._id;
              if (row.isSelected && !arrIDs.includes(id)) {
                dispatch({ type: "ADD_ROW_SELECTED", payload: id })
              }

              if (!row.isSelected && arrIDs.includes(id)) {
                dispatch({ type: "REMOVE_ROW_SELECTED", payload: id })
              }

            }, [row.isSelected, dispatch, arrIDs, row]);

            return (
              <div className="w-full flex justify-center items-center">
                <IndeterminateCheckbox
                  propParent={props}
                  {...row.getToggleRowSelectedProps()}
                />
              </div>
            );
          },
        },
        ...columns,
      ]);
    }
  );

  /*  const {
     getTableProps,
     getTableBodyProps,
     headerGroups,
     prepareRow,
     rows,
     toggleHideColumn,
   } = tableInstance; */

  const ColSpan = (id: string, headers: { id: string }[], columns: number = 12) => {
    const values = {
      selection: 1,
      nombre: 5,
      asistencia: 3,
      nombre_menu: 3,
      tableNameRecepcion: 4,
      tableNameCeremonia: 4,
      passesQuantity: 3,
      compartir: 1,
      delete: 1
    }
    const arr = ["col-span-0", "col-span-1", "col-span-2", "col-span-3", "col-span-4", "col-span-5", "col-span-6", "col-span-7", "col-span-8",]
    return arr[values[id]]
  };

  return (
    // apply the table props
    <div className={`bg-transparent pb-4 rounded-md w-full grid col-span-12`}>
      {children}
      <table
        {...getTableProps()}
        className="w-full text-sm text-left text-gray-500"
      >
        <thead className="relative text-xs text-gray-700 uppercase bg-gray-100 w-full">
          {
            // Loop over the header rows
            headerGroups.map((headerGroup, i) => (
              // Apply the header row props
              <tr
                {...headerGroup.getHeaderGroupProps()}
                key={i}
                className="grid grid-cols-24"
              >
                {
                  // Loop over the headers in each row
                  headerGroup.headers.map((column, i) => {
                    return (
                      // Apply the header cell props
                      <th
                        {...column.getHeaderProps()}
                        key={i}
                        className={`px-6 py-1 md:py-2 text-center flex justify-center items-center text-sm font-light font-display ${ColSpan(column.id, headerGroup.headers, 12)}`}
                      >
                        {
                          // Render the header
                          column.render("Header")
                        }
                      </th>
                    )
                  })
                }
              </tr>

            ))
          }
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows?.length == 0 && (
            <tr className="bg-white border-b font-display text-sm w-full grid grid-cols-12">
              <td className="pl-6 py-4 col-span-1 table-cell	">
              </td>
              <td className="py-4 w-max pl-5 text-gray-300">
                {t("noguests")}
              </td>
            </tr>
          )}
          {
            // Loop over the table rows
            rows.map((row, i) => {
              // Prepare the row for display
              prepareRow(row);
              return (
                <TrExpand key={i} row={row} ColSpan={ColSpan} renderRowSubComponent={renderRowSubComponent} />
              );
            })
          }
        </tbody>
      </table>
    </div>
  );
};

export default DataTableFinal;
