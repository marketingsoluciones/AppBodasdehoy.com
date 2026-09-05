import React from "react";
import { FileText, Download } from "lucide-react";
import { getCurrency } from "../../../utils/Funciones";

const FinancialSummary = ({
  presupuestoTotal,
  totalPagado,
  PagadoPorOtros,
  PagadoPorWP,
  categorias,
  onGenerateReport,
  onExportExcel,
  currency,
}) => {
  // Guard división por cero: si presupuesto=0 o valores no numéricos → 0.0%
  // (evita "NaN% completado" reportado en QA 04-jul BUG BUD-06 Dashboard).
  const total = parseFloat(presupuestoTotal);
  const pagado = parseFloat(totalPagado);
  const porcentajePagado =
    Number.isFinite(total) && total > 0 && Number.isFinite(pagado)
      ? ((pagado / total) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="mt-4 bg-white rounded-xl shadow-md p-4">
      <div className="flex flex-col md:flex-row items-center justify-between mb-3">
        <h3 className="text-xl font-bold">Resumen Financiero Detallado</h3>
        <div className="flex gap-2">
          <button
            onClick={onGenerateReport}
            className="flex items-center gap-2 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm"
          >
            <FileText className="w-4 h-4" />
            Generar Reporte
          </button>
          <button
            onClick={onExportExcel}
            className="flex items-center gap-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-600 mb-1">
            💰 Presupuesto Total
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {getCurrency(parseFloat(presupuestoTotal), currency)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Todos los gastos incluidos
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#A6FFC9] to-[#A6FFC9] rounded-xl p-3">
          <p className="text-xs font-medium text-gray-600 mb-1">
            ✅ Total Pagado
          </p>
          <p className="text-2xl font-bold text-green-700">
            {getCurrency(parseFloat(totalPagado), currency)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {porcentajePagado}% completado
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-600 mb-1">💳 Por otros</p>
          {/* BUG-CW-N27: faltaba color explícito → invisible si padre tiene text-white */}
          <p className="text-2xl font-bold text-orange-700">
            {getCurrency(parseFloat(PagadoPorOtros), currency)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total pagado</p>
        </div>

        <div className="bg-gradient-to-br from-[#FFB3B3] to-[#FFB3B3] rounded-xl p-3">
          <p className="text-xs font-medium text-gray-600 mb-1">
            💳 Por Wedding Planner
          </p>
          <p className="text-2xl font-bold text-red-700">
            {getCurrency(parseFloat(PagadoPorWP), currency)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total pagado</p>
        </div>
      </div>

      {/* Distribución por categorías */}
      {categorias && Object.keys(categorias).length > 0 && (
        <div className="mt-4">
          <h4 className="text-base. font-semibold mb-2">
            Distribución por Categorías
          </h4>
          <div className="grid md:grid-cols-3 gap-2">
            {categorias.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-700 text-sm">
                  {item.nombre}
                </span>
                <span className="font-bold text-gray-800 text-sm">
                  {getCurrency(parseFloat(item.coste_final), currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialSummary;
