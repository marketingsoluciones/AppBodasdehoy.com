import React from 'react';

interface TableProps {
  table: any;
  initialColumn: any[];
  getColumnWidth: (columnId: string) => number;
  handleResizeStart: (columnId: string, e: React.MouseEvent) => void;
  getRowStyles: (row: any) => string;
  openOptionsModal: (info: any, objectType?: string) => void;
  showOptionsModal: any;
  setShowOptionsModal: (v: any) => void;
  clearSearch: () => void;
  hasActiveFilters: () => string | boolean;
  handleClearFilters: () => void;
  searchTerm: string;
}

export const TableBudgetTable: React.FC<TableProps> = ({
  table,
  initialColumn,
  getColumnWidth,
  handleResizeStart,
  getRowStyles,
  openOptionsModal,
  showOptionsModal,
  setShowOptionsModal,
  clearSearch,
  hasActiveFilters,
  handleClearFilters,
  searchTerm
}) => (
  <div className="flex-1 overflow-auto bg-white relative">
    <div className="min-w-[700px]" onContextMenu={(e) => {
      const element = document.getElementById("ElementEditable")
      if (!element) {
        e.preventDefault();
      }
    }}>
      <table className="w-full">
        <thead className="bg-gray-100 sticky top-0 z-20">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                const isSticky = header.column.getIndex() < 2;
                const leftPosition = header.column.getIndex() === 1 ? getColumnWidth('categoria') : 0;
                const columnId = header.column.id;
                return (
                  <th
                    key={header.id}
                    style={{
                      width: getColumnWidth(columnId),
                      left: isSticky ? leftPosition : undefined,
                      position: isSticky ? 'sticky' : 'relative'
                    }}
                    className={`text-left p-1.5 font-medium text-gray-700 border-r text-xs ${isSticky ? 'bg-gray-100 z-30' : ''}`}
                  >
                    <div className="flex items-center justify-between h-full">
                      <div className="flex-1">
                        {header.isPlaceholder
                          ? null
                          : typeof header.column.columnDef.header === "function"
                            ? header.column.columnDef.header(header.getContext())
                            : header.column.columnDef.header
                        }
                      </div>
                      <div
                        className="w-1 h-full cursor-col-resize hover:bg-blue-500 hover:bg-opacity-50 absolute right-0 top-0 flex items-center justify-center group"
                        onMouseDown={(e) => handleResizeStart(columnId, e)}
                      >
                        <div className="w-0.5 h-4 bg-gray-300 group-hover:bg-blue-500 transition-colors"></div>
                      </div>
                    </div>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length > 0 ? table.getRowModel().rows.map((row, index) => {
            const rowStyles = getRowStyles(row);
            return (
              <tr
                key={row.id}
                className={`${rowStyles} border-b transition-colors group hover:bg-gray-100`}
                onContextMenu={(e) => {
                  const element = document.getElementById("ElementEditable")
                  let infoAsd = row.getVisibleCells()[0].getContext()
                  let info = row.getVisibleCells().find(cell => cell.column.id === "categoria")?.getContext() || infoAsd
                  if (!element) {
                    e.preventDefault();
                    const objectType = row.original?.object;
                    openOptionsModal(info, objectType);
                  }
                }}
              >
                {row.getVisibleCells().map(cell => {
                  const isSticky = cell.column.getIndex() < 2;
                  const leftPosition = cell.column.getIndex() === 1 ? getColumnWidth('categoria') : 0;
                  const alignment = initialColumn.find(col => col.accessor === cell.column.id);
                  const columnId = cell.column.id;
                  const alignmentClass = alignment?.horizontalAlignment === "center" ? "text-center" :
                    alignment?.horizontalAlignment === "end" ? "text-right" : "text-left";
                  return (
                    <td
                      key={cell.id}
                      style={{
                        width: getColumnWidth(columnId),
                        left: isSticky ? leftPosition : undefined,
                        position: isSticky ? 'sticky' : 'relative'
                      }}
                      className={`p-1.5 border-r text-xs group-hover:bg-gray-100 ${alignmentClass} ${isSticky ? `z-10 ${rowStyles}` : ''}`}
                      onContextMenu={(e) => {
                        const element = document.getElementById("ElementEditable")
                        let infoAsd = cell.getContext()
                        let info = cell.column.id === "categoria"
                          ? table.getRowModel().rows.find(elem => elem.original._id === infoAsd.row.original.categoriaID)?.getVisibleCells().find(elem => elem.column.id === cell.column.id)
                          : cell.column.id === "gasto"
                            ? table.getRowModel().rows.find(elem => elem.original._id === infoAsd.row.original.gastoID)?.getVisibleCells().find(elem => elem.column.id === cell.column.id)
                            : cell.getContext()
                        if (!element) {
                          e.preventDefault();
                          const objectType = cell.row.original?.object || "categoria";
                          openOptionsModal(info || infoAsd, objectType);
                        }
                      }}
                    >
                      {cell.column.id === "categoria"
                        ? row.original.object === "categoria"
                          ? cell.column.columnDef.cell(cell.getContext())
                          : ""
                        : cell.column.id === "gasto"
                          ? row.original.object === "gasto"
                            ? cell.column.columnDef.cell(cell.getContext())
                            : ""
                          : cell.column.id === "nombre"
                            ? row.original.object === "item"
                              ? cell.column.columnDef.cell(cell.getContext())
                              : ""
                            : cell.column.columnDef.cell(cell.getContext())
                      }
                    </td>
                  )
                })}
              </tr>
            )
          }) : (
            <tr>
              <td colSpan={table.getAllLeafColumns().length} className="p-6 text-center text-gray-500 italic">
                <div className="flex flex-col items-center gap-1.5">
                  {searchTerm || hasActiveFilters() ? (
                    <>
                      <span className="text-sm">
                        {searchTerm
                          ? `No se encontraron resultados para "${searchTerm}"`
                          : "No se encontraron resultados con los filtros aplicados"
                        }
                      </span>
                      <div className="flex gap-2">
                        {searchTerm && (
                          <button
                            onClick={clearSearch}
                            className="text-blue-600 hover:text-blue-800 text-xs underline"
                          >
                            Limpiar búsqueda
                          </button>
                        )}
                        {hasActiveFilters() && (
                          <button
                            onClick={handleClearFilters}
                            className="text-blue-600 hover:text-blue-800 text-xs underline"
                          >
                            Limpiar filtros
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">No hay datos disponibles</span>
                      <span className="text-xs">Haz clic derecho para agregar una categoría</span>
                    </>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
); 