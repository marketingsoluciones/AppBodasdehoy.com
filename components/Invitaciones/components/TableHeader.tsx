import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { TABLE_GRID_CLASSES } from '../constants';

interface TableHeaderProps {
  headerGroups: any[];
  getColumnSpan: (columnId: string) => string;
}

export const TableHeader: FC<TableHeaderProps> = ({ headerGroups, getColumnSpan }) => {
  const { t } = useTranslation();

  return (
    <thead className="relative text-xs text-gray-700 uppercase bg-gray-100 w-full">
      {headerGroups.map((headerGroup: any, idx: number) => (
        <tr
          {...headerGroup.getHeaderGroupProps()}
          className={TABLE_GRID_CLASSES.header}
          key={idx}
        >
          {headerGroup.headers.map((column: any, idx: number) => {
            const headerProps = column.getHeaderProps(column.getSortByToggleProps());
            delete headerProps.key;
            delete headerProps.role;

            return (
              <th
                key={idx}
                {...headerProps}
                className={`px-6 py-1 md:py-2 text-center flex justify-center items-center text-sm font-light font-display ${getColumnSpan(column.id)}`}
              >
                {typeof column.render("Header") === "string" && t(column.render("Header"))}
                <span>
                  {column.isSorted ? (column.isSortedDesc ? " 🠻" : " 🠹") : ""}
                </span>
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}; 