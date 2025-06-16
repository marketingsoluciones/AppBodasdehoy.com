import { FC } from "react";
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { getCurrency } from '../../../utils/Funciones';

interface Props {
    tableData: any[]
    showEstimados: boolean
    handleRowClick: (row: any) => void
    toggleCategory: (CategoriesId: string)=> void
    event: any
}

export const TableBudgetV2: FC<Props> = ({ tableData, showEstimados, handleRowClick, toggleCategory, event }) => {
    return (
        <table className="w-full">
            <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                    <th className="text-left p-3 font-medium text-gray-700 border-r min-w-[200px]">
                        Categoría
                    </th>
                    <th className="text-left p-3 font-medium text-gray-700 border-r min-w-[250px]">
                        Partida de Gasto
                    </th>
                    <th className="text-left p-3 font-medium text-gray-700 border-r min-w-[200px]">
                        Item
                    </th>
                    <th className="text-center p-3 font-medium text-gray-700 border-r w-24">
                        Cantidad
                    </th>
                    <th className="text-center p-3 font-medium text-gray-700 border-r w-24">
                        Unidad
                    </th>
                    {showEstimados && (
                        <th className="text-right p-3 font-medium text-gray-700 border-r w-32">
                            Estimado
                        </th>
                    )}
                    <th className="text-right p-3 font-medium text-gray-700 border-r w-32">
                        Total
                    </th>
                    <th className="text-right p-3 font-medium text-gray-700 border-r w-32">
                        Pagado
                    </th>
                    <th className="text-right p-3 font-medium text-gray-700 border-r w-32">
                        Pendiente
                    </th>
                    <th className="text-center p-3 font-medium text-gray-700 w-20">
                        Acciones
                    </th>
                </tr>
            </thead>
            <tbody>
                {tableData.map((row, index) => {
                    const bgColor = row.type === 'category' ? 'bg-blue-50 hover:bg-blue-100' :
                        row.type === 'expense' ? 'bg-gray-50 hover:bg-gray-100' :
                            'bg-white hover:bg-gray-50';
                    const textWeight = row.type === 'category' ? 'font-semibold' :
                        row.type === 'expense' ? 'font-medium' : 'font-normal';
                    const paddingLeft = `${row.level * 20 + 12}px`;

                    return (
                        <tr
                            key={`${row.type}-${row.id}`}
                            className={`${bgColor} border-b transition-colors cursor-pointer`}
                            onClick={() => handleRowClick(row)}
                        >
                            <td className="p-3 border-r" style={{ paddingLeft }}>
                                <div className="flex items-center gap-2">
                                    {row.expandable && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleCategory(row.id);
                                            }}
                                            className="hover:bg-gray-200 p-1 rounded transition-colors"
                                        >
                                            {row.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                    )}
                                    <span className={`${textWeight} ${row.type === 'category' ? 'text-blue-800' : 'text-gray-800'}`}>
                                        {row.categoria}
                                    </span>
                                </div>
                            </td>
                            <td className={`p-3 border-r ${textWeight} text-gray-700`}>
                                {row.partida}
                            </td>
                            <td className="p-3 border-r text-gray-700">
                                {row.type === 'item' ? row.nombre : ''}
                            </td>
                            <td className="p-3 border-r text-center text-gray-600">
                                {row.type === 'item' ? row.cantidad : ''}
                            </td>
                            <td className="p-3 border-r text-center text-gray-600">
                                {row.type === 'item' ? row.unidad?.replace('.', '') : ''}
                            </td>
                            {showEstimados && (
                                <td className="p-3 border-r text-right text-sm text-blue-600">
                                    {row.estimado ? getCurrency(row.estimado, event?.presupuesto_objeto?.currency) : ''}
                                </td>
                            )}
                            <td className={`p-3 border-r text-right ${textWeight}`}>
                                {getCurrency(row.total, event?.presupuesto_objeto?.currency)}
                            </td>
                            <td className="p-3 border-r text-right text-green-600">
                                {row.type !== 'item' ? getCurrency(row.pagado, event?.presupuesto_objeto?.currency) : ''}
                            </td>
                            <td className="p-3 border-r text-right text-red-600">
                                {row.type !== 'item' ? getCurrency(row.pendiente, event?.presupuesto_objeto?.currency) : ''}
                            </td>
                            <td className="p-3 text-center">
                                <button
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Settings size={16} />
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}