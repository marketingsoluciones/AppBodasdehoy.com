import React, { useEffect, useState } from "react";
import { EventContextProvider } from "../../../context/";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { getCurrency } from "../../../utils/Funciones";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const DepositsHistory = ({ deposits, currency }) => {
  const { event, setEvent } = EventContextProvider();
  const [isMobile, setIsMobile] = useState(false)

  const handleDeleteDeposit = (depositId) => {
    try {
      fetchApiEventos({
        query: queries.deleteWeddingPlannerIngreso,
        variables: {
          evento_id: event?._id,
          weddingPlannerIngreso_id: depositId,
        },
      });

      const updatedIngresos =
        event?.presupuesto_objeto?.weddingPlannerIngresos.filter(
          (deposit) => deposit._id !== depositId
        );

      const updatedEvent = {
        ...event,
        presupuesto_objeto: {
          ...event.presupuesto_objeto,
          weddingPlannerIngresos: updatedIngresos,
        },
      };

      setEvent(updatedEvent);
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])


  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h3 className="text-xl font-bold mb-3">Historial de Depósitos</h3>
      <div className="overflow-x-auto">
        <table className={`w-full text-sm  ${isMobile ? 'min-w-[900px]' : ''}`}>
          <thead>
            <tr className="border-b-2">
              <th className="text-left py-2 px-2">Fecha</th>
              <th className="text-left py-2 px-2">Monto</th>
              <th className="text-left py-2 px-2">Método de Pago</th>
              <th className="text-left py-2 px-2">Referencia Bancaria</th>
              <th className="text-left py-2 px-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {deposits && deposits.length > 0 ? (
              deposits.map((deposito) => (
                <tr key={deposito.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2 ">{formatDate(deposito.fecha)}</td>
                  <td className="py-2 px-2 font-bold">
                     {getCurrency(parseFloat(deposito.monto), currency)}
                  </td>
                  <td className="py-2 px-2">{deposito.metodo}</td>
                  <td className="py-2 px-2">
                    <div
                      className="relative group "
                      /* title={deposito.referencia} */
                    >
                      <span className="block truncate max-w-[200px]">
                        {truncateText(deposito.referencia, 50)}
                      </span>
                      {deposito.referencia &&
                        deposito.referencia.length > 50 && (
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs break-words">
                            {deposito.referencia}
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        )}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    {/* <button 
                      onClick={() => onViewDeposit && onViewDeposit(deposito)}
                      className="text-blue-600 hover:text-blue-700 mr-2 text-xs"
                    >
                      Ver
                    </button> */}
                    <button
                      onClick={() => handleDeleteDeposit(deposito._id)}
                      className="text-blue-600 hover:text-blue-700 mr-2 text-xs"
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-lg font-medium">
                      No hay depósitos guardados
                    </p>
                    <p className="text-sm text-gray-400">
                      Los depósitos que agregues aparecerán aquí
                    </p>
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

export default DepositsHistory;
