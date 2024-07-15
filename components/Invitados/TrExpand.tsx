import { FC } from "react";

interface props {
  row: any
  ColSpan: any
  renderRowSubComponent: any
}

export const TrExpand: FC<props> = ({ row, ColSpan, renderRowSubComponent }) => {
  return (
    <>
      <tr
        {...row.getRowProps()}
        className="w-full bg-white border-b font-display text-sm grid grid-cols-24"
      >
        {
          // Loop over the rows cells
          row.cells.map((cell, i) => {
            return (
              <td
                key={i}
                {...cell.getCellProps()}
                className={`px-6 py-2 flex items-center ${ColSpan(cell.column.id, row.cells.map(item => item.column), 12)}`}
              >
                {
                  // Render the cell contents
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