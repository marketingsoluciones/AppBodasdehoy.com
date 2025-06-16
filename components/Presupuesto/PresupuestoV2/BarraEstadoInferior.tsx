import { FC } from 'react';
import { getCurrency } from '../../../utils/Funciones';


interface Props {
    tableData: any[];
    viewLevel: number;
    event: any;
    totals: {
        total: number;
        pagado: number;
    };
}

export const BarraEstadoInferior: FC <Props> = ({tableData, viewLevel, event,totals }) => {
    return (
        <div className="bg-gray-100 px-4 py-2 border-t flex justify-between items-center text-sm text-gray-600">
            <div>
                {tableData.filter(r => r.type === 'category').length} categorías, {' '}
                {tableData.filter(r => r.type === 'expense').length} gastos
                {viewLevel >= 3 && (
                    <>, {tableData.filter(r => r.type === 'item').length} items</>
                )}
            </div>
            <div className="flex items-center gap-4">
                <span>Total: {getCurrency(totals.total, event?.presupuesto_objeto?.currency)}</span>
                <span>|</span>
                <span>Pendiente: {getCurrency(totals.total - totals.pagado, event?.presupuesto_objeto?.currency)}</span>
            </div>
        </div>
    )
}