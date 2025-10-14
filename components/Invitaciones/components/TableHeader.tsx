import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { COLUMN_SPAN_CONFIG } from '../constants';

interface TableHeaderProps {
  headerGroups: any[];
  totalSpan: number;
}

export const TableHeader: FC<TableHeaderProps> = ({ headerGroups, totalSpan }) => {
  const { t } = useTranslation();

  return (
    <thead className="relative text-xs text-gray-700 uppercase bg-gray-100 w-full">
      {headerGroups.map((headerGroup: any, idx: number) => (
        <tr
          {...headerGroup.getHeaderGroupProps()}
          className="grid w-full"
          style={{ gridTemplateColumns: `repeat(${totalSpan}, minmax(0, 1fr))` }}
          key={idx}
        >
          {headerGroup.headers.map((column: any, idx: number) => {
            const headerProps = column.getHeaderProps(column.getSortByToggleProps());
            delete headerProps.key;
            delete headerProps.role;
            
            const span = COLUMN_SPAN_CONFIG[column.id] || 1;

            return (
              <th
                key={idx}
                {...headerProps}
                className="px-6 py-1 md:py-2 text-center flex justify-center items-center text-sm font-light font-display"
                style={{ gridColumn: `span ${span} / span ${span}` }}
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