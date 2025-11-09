import { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface TableBodyProps {
  getTableBodyProps: () => any;
  rows: any[];
  prepareRow: (row: any) => void;
  gridTemplate: string;
}

export const TableBody: FC<TableBodyProps> = ({
  getTableBodyProps,
  rows,
  prepareRow,
  gridTemplate
}) => {
  const { t } = useTranslation();

  return (
    <tbody {...getTableBodyProps()} className="text-gray-600 text-sm flex-1">
      {rows.length >= 1 ? (
        rows.map((row, idx) => {
          prepareRow(row);
          return (
            <tr
              {...row.getRowProps()}
              key={idx}
              className="w-full bg-white border-b font-display text-sm grid"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              {row.cells.map((cell: any, idx: number) => {
                const isSelectionColumn = cell.column.id === "selection";
                const cellClassName = isSelectionColumn
                  ? "px-2 py-2 flex items-center justify-center overflow-visible"
                  : "truncate px-2 py-2 flex items-center";

                return (
                  <td
                    key={idx}
                    className={cellClassName}
                  >
                    {cell.render("Cell")}
                  </td>
                );
              })}
            </tr>
          );
        })
      ) : (
        <tr className="transition border-b border-base hover:bg-base cursor-pointer w-full grid place-items-center">
          <td className="py-5 font-display text-lg text-gray-500 uppercase">
            {t("noguestsevent")}
          </td>
        </tr>
      )}
    </tbody>
  );
}; 