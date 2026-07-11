import React, { useState, useEffect } from "react";
import { Calendar, Eye, DollarSign } from "lucide-react";
import { getCurrency } from "../../../utils/Funciones";

const PaymentCard = ({
  payment,
  type = "directo",
  onViewDetails,
  onMakePayment,
  categorias,
  currency,
}) => {
  const [importeCompleto, setImporteCompleto] = useState(true);

  // BUG QA 10-jul: crash "Cannot read properties of undefined (reading
  // 'delete_url' | 'gastos_array' | 'coste_final')" en /presupuesto pestaña
  // "Pagos Pendientes". Si el pago referencia una categoría o gasto que ya
  // no existe (borrado, migración, o categorias aún sin cargar en 1er
  // render), estos .find() devuelven undefined y los accesos a
  // .gastos_array / .coste_final rompen el árbol de React → ErrorBoundary
  // fuerza remount → aparece "Comprobando sesión y conexión…" y el user
  // percibe pérdida de sesión falsa. Guards defensivos + fallback UI.
  const categoria = (categorias ?? []).find(
    (categoria) => categoria._id === payment.idCategoria
  );
  const gasto = categoria?.gastos_array?.find(
    (gasto) => gasto._id === payment.idGasto
  );
  const costeFinal = gasto?.coste_final ?? 0;

  useEffect(() => {
    if (payment.importe < costeFinal) {
      setImporteCompleto(false);
    } else {
      setImporteCompleto(true);
    }
  }, [payment.importe, costeFinal]);

  if (!categoria || !gasto) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500">
        Pago sin categoría o gasto asociado (id gasto: {payment?.idGasto ?? "—"}).
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pagado":
        return "✓ Pagado";
      case "parcial":
        return "◐ Parcial";
      default:
        return "⏳ Pendiente";
    }
  };

  return (
    <div className="border rounded-lg p-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold text-base text-gray-800 capitalize">
            {gasto?.nombre}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {payment?.fecha_pago}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded capitalize">
              {payment?.nombreCategoria}
            </span>
          </div>
          {payment?.pagado_por && (
            <p className="text-[10px] text-gray-600 mt-0.5 capitalize">
              Por: {payment?.pagado_por}
            </p>
          )}

          {!importeCompleto && (
            <div className="mt-1">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{
                    width: `${(gasto?.pagado / gasto?.coste_final) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-blue-600 mt-0.5">
                Pagado: {getCurrency(parseFloat(gasto?.pagado), currency)} (
                {((gasto?.pagado / gasto?.coste_final) * 100).toFixed(0)}%)
              </p>
            </div>
          )}
        </div>
        <div className="text-right ml-2">
          <p className="text-lg font-bold text-gray-800">
            {getCurrency(parseFloat(gasto?.coste_final), currency)}
          </p>
          <span
            className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
              payment.importe < costeFinal
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {payment.importe < costeFinal
              ? getStatusIcon("parcial")
              : getStatusIcon("pagado")}
          </span>
          {payment.soporte && payment.soporte.delete_url !== null && (
            <div className="mt-1 space-x-1">
              <button
                onClick={() => onViewDetails && onViewDetails(payment)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Eye className="w-4 h-4 inline" />
              </button>
              {/* <button
                onClick={() => onMakePayment && onMakePayment(payment)}
                className="text-green-600 hover:text-green-700"
              >
                <DollarSign className="w-4 h-4 inline" />
              </button> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCard;
