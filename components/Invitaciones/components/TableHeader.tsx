import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { COLUMN_WIDTH_CONFIG } from '../constants';

interface TableHeaderProps {
  headerGroups: any[];
  gridTemplate: string;
}

export const TableHeader: FC<TableHeaderProps> = ({ headerGroups, gridTemplate }) => {
  const { t } = useTranslation();

  return (
    <thead className="relative text-xs text-gray-700 uppercase bg-gray-100 w-full">
      {headerGroups.map((headerGroup: any, idx: number) => (
        <tr
          {...headerGroup.getHeaderGroupProps()}
          className="grid w-full"
          style={{ gridTemplateColumns: gridTemplate }}
          key={idx}
        >
          {headerGroup.headers.map((column: any, idx: number) => {
            const headerProps = column.getHeaderProps(column.getSortByToggleProps());
            console.log(headerProps);
            delete headerProps.key;
            delete headerProps.role;

            return (
              <th
                key={idx}
                {...headerProps}
                className="px-1 py-1 md:py-2 text-center flex items-center justify-center text-sm font-light font-display"
              >
                <div className="truncate w-full text-center">
                  {typeof column.render("Header") === "string" && t(column.render("Header"))}
                  <span>
                    {column.isSorted ? (column.isSortedDesc ? " 🠻" : " 🠹") : ""}
                  </span>
                </div>
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}; 