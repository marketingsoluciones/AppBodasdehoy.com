import {  Eye, EyeOff } from 'lucide-react';
import { getCurrency } from '../../../utils/Funciones';
import { FC } from 'react';



interface props {
    viewLevel: number;
    setViewLevel: (value: number) => void
    showEstimados: boolean
    setShowEstimados:( value: boolean) => void 
    totals: any
    event: any
}

export const PanelControlSuperior : FC <props> = ({viewLevel, setViewLevel, setShowEstimados, showEstimados, totals, event}) => {
    return (
        <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-800">Vista Inteligente</h2>

                {/* Control de Nivel de Detalle */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Detalle:</span>
                    <select
                        value={viewLevel}
                        onChange={(e) => setViewLevel(Number(e.target.value))}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={1}>Solo Categorías</option>
                        <option value={2}>Categorías + Gastos</option>
                        <option value={3}>Detalle Completo</option>
                    </select>
                </div>

                {/* Toggle Estimados */}
                <button
                    onClick={() => setShowEstimados(!showEstimados)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                    {showEstimados ? <Eye size={16} /> : <EyeOff size={16} />}
                    Estimados
                </button>
            </div>

            {/* Panel de Totales */}
            <div className="flex items-center gap-6">
                {showEstimados && (
                    <div className="text-center">
                        <div className="text-xs text-gray-500">Estimado</div>
                        <div className="font-semibold text-blue-600">
                            {getCurrency(totals.estimado, event?.presupuesto_objeto?.currency)}
                        </div>
                    </div>
                )}
                <div className="text-center">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="font-semibold text-gray-800">
                        {getCurrency(totals.total, event?.presupuesto_objeto?.currency)}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-500">Pagado</div>
                    <div className="font-semibold text-green-600">
                        {getCurrency(totals.pagado, event?.presupuesto_objeto?.currency)}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-500">Pendiente</div>
                    <div className="font-semibold text-red-600">
                        {getCurrency(totals.total - totals.pagado, event?.presupuesto_objeto?.currency)}
                    </div>
                </div>
            </div>
        </div>
    )
}