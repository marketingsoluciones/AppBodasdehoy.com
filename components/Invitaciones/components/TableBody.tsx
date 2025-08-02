import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { TABLE_GRID_CLASSES } from '../constants';

interface TableBodyProps {
  getTableBodyProps: () => any;
  rows: any[];
  prepareRow: (row: any) => void;
  getColumnSpan: (columnId: string) => string;
}

export const TableBody: FC<TableBodyProps> = ({
  getTableBodyProps,
  rows,
  prepareRow,
  getColumnSpan
}) => {
  const { t } = useTranslation();

  return (
    <tbody {...getTableBodyProps()} className="text-gray-600 text-sm">
      {rows.length >= 1 ? (
        rows.map((row, idx) => {
          prepareRow(row);
          return (
            <tr
              {...row.getRowProps()}
              key={idx}
              className={TABLE_GRID_CLASSES.row}
            >
              {row.cells.map((cell: any, idx: number) => (
                <td
                  key={idx}
                  className={`${TABLE_GRID_CLASSES.cell} ${getColumnSpan(cell.column.id)}`}
                >
                  {cell.render("Cell")}
                </td>
              ))}
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