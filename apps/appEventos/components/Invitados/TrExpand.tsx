import { FC } from "react";

interface props {
  row: any
  ColSpan: any
  renderRowSubComponent: any
}

export const TrExpand: FC<props> = ({ row, ColSpan, renderRowSubComponent }) => {
  const { key: _rowKey, ...rowProps } = row.getRowProps();

  return (
    <>
      <tr
        {...rowProps}
        className="w-full bg-white border-b font-display text-sm grid grid-cols-24"
      >
        {
          row.cells.map((cell: any, i: number) => {
            const { key: _cellKey, ...cellProps } = cell.getCellProps();
            return (
              <td
                key={i}
                {...cellProps}
                className={`px-6 py-2 flex items-center ${ColSpan(cell.column.id, row.cells.map((item: any) => item.column), 12)}`}
              >
                {
                  cell.render("Cell")
                }
              </td>
            );
          })}
      </tr>
      {row.isExpanded &&
        <tr className="h-40 w-full">
          <td >
            {renderRowSubComponent({ row })}
          </td>
        </tr>
      }
    </>
  )
}