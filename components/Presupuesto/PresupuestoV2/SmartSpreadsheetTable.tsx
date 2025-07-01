import React from 'react';
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import { TableRow, ColumnConfig } from './types';
import { CategoriaCell } from './cells/CategoriaCell';
import { PartidaCell } from './cells/PartidaCell';
import { UnidadCell } from './cells/UnidadCell';
import { CantidadCell } from './cells/CantidadCell';
import { ItemCell } from './cells/ItemCell';
import { ValorUnitarioCell } from './cells/ValorUnitarioCell';
import { CosteTotalCell } from './cells/CosteTotalCell';
import { AccionesCell } from './cells/AccionesCell';

interface SmartSpreadsheetTableProps {
  tableData: TableRow[];
  columnConfig: ColumnConfig;
  onToggleCategory: (categoryId: string) => void;
  onRowChange: (values: any, info: any) => void;
  onOptionsMenu: (e: React.MouseEvent, row: TableRow, isContextMenu?: boolean) => void;
  formatNumber: (value: number) => string;
  categorias_array: any[];
  event: any;
  getMenuOptions: (info: any) => any[];
}

export const SmartSpreadsheetTable: React.FC<SmartSpreadsheetTableProps> = ({
  tableData,
  columnConfig,
  onToggleCategory,
  onRowChange,
  onOptionsMenu,
  formatNumber,
  categorias_array,
  event,
  getMenuOptions
}) => {
  return (
    <div className="flex-1 overflow-auto bg-white relative table-container">
      <div className="min-w-[800px]" onContextMenu={(e) => {
        // Manejar click derecho en área vacía para crear categorías
        if (tableData.length === 0) {
          const mockRow = {
            id: 'empty',
            type: 'category' as const,
            object: 'categoria' as const,
            categoriaID: '',
            gastoID: null,
            itemID: null,
            categoria: '',
            partida: '',
            unidad: '',
            cantidad: '',
            item: '',
            valorUnitario: 0,
            estimado: 0,
            total: 0,
            pagado: 0,
            pendiente: 0,
            level: 0
          };
          
          onOptionsMenu(e, mockRow, true);
          e.preventDefault();
        }
      }}>
        <table className="w-full">
          <thead className="bg-gray-100 sticky top-0 z-20">
            <tr>
              {columnConfig.categoria.visible && (
                <th className="text-left p-2 font-medium text-gray-700 border-r text-xs sticky left-0 bg-gray-100 z-30" style={{width: columnConfig.categoria.width}}>
                  Categoría
                </th>
              )}
              {columnConfig.partida.visible && (
                <th className="text-left p-2 font-medium text-gray-700 border-r text-xs sticky bg-gray-100 z-30" style={{width: columnConfig.partida.width, left: columnConfig.categoria.visible ? columnConfig.categoria.width : 0}}>
                  Partida de Gasto
                </th>
              )}
              {columnConfig.unidad.visible && (
                <th className="text-center p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.unidad.width}}>
                  Unidad
                </th>
              )}
              {columnConfig.cantidad.visible && (
                <th className="text-center p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.cantidad.width}}>
                  Cantidad
                </th>
              )}
              {columnConfig.item.visible && (
                <th className="text-left p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.item.width}}>
                  Item
                </th>
              )}
              {columnConfig.valorUnitario.visible && (
                <th className="text-right p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.valorUnitario.width}}>
                  Valor Unitario
                </th>
              )}
              {columnConfig.total.visible && (
                <th className="text-right p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.total.width}}>
                  Coste Total
                </th>
              )}
              {columnConfig.estimado.visible && event?.presupuesto_objeto?.viewEstimates && (
                <th className="text-right p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.estimado.width}}>
                  Coste Estimado
                </th>
              )}
              {columnConfig.pagado.visible && (
                <th className="text-right p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.pagado.width}}>
                  Pagado
                </th>
              )}
              {columnConfig.pendiente.visible && (
                <th className="text-right p-2 font-medium text-gray-700 border-r text-xs" style={{width: columnConfig.pendiente.width}}>
                  Pendiente
                </th>
              )}
              {columnConfig.acciones.visible && (
                <th className="text-center p-2 font-medium text-gray-700 text-xs" style={{width: columnConfig.acciones.width}}>
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {tableData.length > 0 ? tableData.map((row, index) => {
              const bgColor = row.type === 'category' ? 'bg-blue-50' : 
                             row.type === 'expense' ? 'bg-gray-50' : 'bg-white';
              const textWeight = row.type === 'category' ? 'font-semibold' : 
                               row.type === 'expense' ? 'font-medium' : 'font-normal';
              const paddingLeft = `${row.level * 16 + 8}px`;

              return (
                <tr 
                  key={row.id} 
                  className={`${bgColor} border-b transition-colors group hover:bg-gray-100`}
                  onContextMenu={(e) => {
                    onOptionsMenu(e, row, true);
                  }}
                >
                  {columnConfig.categoria.visible && (
                    <td className={`p-2 border-r text-xs sticky left-0 z-10 ${bgColor} group-hover:bg-gray-100`} style={{paddingLeft, width: columnConfig.categoria.width}}>
                      <div className="flex items-center gap-1">
                        {row.expandable && (
                          <button 
                            onClick={() => onToggleCategory(row.id)}
                            className="hover:bg-gray-200 p-0.5 rounded flex-shrink-0"
                          >
                            {row.expanded ? <IoIosArrowDown size={12} /> : <IoIosArrowForward size={12} />}
                          </button>
                        )}
                        <span className={`${textWeight} ${row.type === 'category' ? 'text-blue-800' : 'text-gray-800'} truncate`}>
                          <CategoriaCell row={row} onRowChange={onRowChange} />
                        </span>
                      </div>
                    </td>
                  )}
                  {columnConfig.partida.visible && (
                    <td className={`p-2 border-r text-left text-xs sticky z-10 ${bgColor} group-hover:bg-gray-100`} style={{width: columnConfig.partida.width, left: columnConfig.categoria.visible ? columnConfig.categoria.width : 0}}>
                      <div className="truncate">
                        <PartidaCell row={row} onRowChange={onRowChange} />
                      </div>
                    </td>
                  )}
                  {columnConfig.unidad.visible && (
                    <td className="p-2 border-r text-center text-xs text-gray-600 group-hover:bg-gray-100">
                      <UnidadCell row={row} onRowChange={onRowChange} />
                    </td>
                  )}
                  {columnConfig.cantidad.visible && (
                    <td className="p-2 border-r text-center text-xs text-gray-600 group-hover:bg-gray-100">
                      <CantidadCell row={row} onRowChange={onRowChange} />
                    </td>
                  )}
                  {columnConfig.item.visible && (
                    <td className="p-2 border-r text-left text-xs group-hover:bg-gray-100">
                      <div className="truncate">
                        <ItemCell row={row} onRowChange={onRowChange} categorias_array={categorias_array} />
                      </div>
                    </td>
                  )}
                  {columnConfig.valorUnitario.visible && (
                    <td className="p-2 border-r text-right text-xs group-hover:bg-gray-100">
                      <ValorUnitarioCell row={row} onRowChange={onRowChange} formatNumber={formatNumber} />
                    </td>
                  )}
                  {columnConfig.total.visible && (
                    <td className={`p-2 border-r ${textWeight} text-xs group-hover:bg-gray-100`}>
                      <CosteTotalCell row={row} onRowChange={onRowChange} formatNumber={formatNumber} />
                    </td>
                  )}
                  {columnConfig.estimado.visible && event?.presupuesto_objeto?.viewEstimates && (
                    <td className="p-2 border-r text-right text-xs group-hover:bg-gray-100">
                      {row.type === 'category' ? (
                        <span className="text-blue-600">
                          {formatNumber(row.estimado)}
                        </span>
                      ) : (
                        <span className="text-gray-300">
                          —
                        </span>
                      )}
                    </td>
                  )}
                  {columnConfig.pagado.visible && (
                    <td className="p-2 border-r text-right text-xs group-hover:bg-gray-100">
                      <span className="text-green-600">
                        {formatNumber(row.pagado)}
                      </span>
                    </td>
                  )}
                  {columnConfig.pendiente.visible && (
                    <td className="p-2 border-r text-right text-xs group-hover:bg-gray-100">
                      <span className="text-red-600">
                        {formatNumber(row.pendiente)}
                      </span>
                    </td>
                  )}
                  {columnConfig.acciones.visible && (
                    <td className="p-2 text-center group-hover:bg-gray-100">
                      <AccionesCell 
                        onOptionsClick={(e) => onOptionsMenu(e, row, false)}
                      />
                    </td>
                  )}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={Object.values(columnConfig).filter(col => col.visible).length} className="p-8 text-center text-gray-500 italic">
                  <div className="flex flex-col items-center gap-2">
                    <span>No hay datos disponibles</span>
                    <span className="text-xs">Haz clic derecho para agregar una categoría</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
