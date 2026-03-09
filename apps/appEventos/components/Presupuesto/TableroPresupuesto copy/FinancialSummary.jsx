import React from "react";
import { FileText, Download } from "lucide-react";
import { getCurrency } from "../../../utils/Funciones";

const FinancialSummary = ({
  presupuestoTotal,
  totalPagado,
  porPagarDirectos,
  porPagarWP,
  categorias,
  onGenerateReport,
  onExportExcel,
  currency
}) => {
  const porcentajePagado = ((totalPagado / presupuestoTotal) * 100).toFixed(1);

  return (
    <div className="mt-4 bg-white rounded-xl shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
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

      <div className="grid grid-cols-4 gap-4">
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
          <p className="text-xs font-medium text-gray-600 mb-1">
            ⏳ Por Pagar (Directos)
          </p>
          <p className="text-2xl font-bold ">
            {getCurrency(parseFloat(porPagarDirectos), currency)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Pagos pendientes</p>
        </div>

        <div className="bg-gradient-to-br from-[#FFB3B3] to-[#FFB3B3] rounded-xl p-3">
          <p className="text-xs font-medium text-gray-600 mb-1">
            💳 Por Pagar (WP)
          </p>
          <p className="text-2xl font-bold text-red-700">
            {getCurrency(parseFloat(porPagarWP),currency)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Fondos necesarios</p>
        </div>
      </div>

      {/* Distribución por categorías */}
      {categorias && Object.keys(categorias).length > 0 && (
        <div className="mt-4">
          <h4 className="text-base. font-semibold mb-2">
            Distribución por Categorías
          </h4>
          <div className="grid grid-cols-3 gap-2">
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
