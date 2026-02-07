import React from 'react';

const DepositsHistory = ({ 
  deposits,
  onViewDeposit,
  onPrintDeposit 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h3 className="text-xl font-bold mb-3">Historial de Depósitos</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2">
              <th className="text-left py-2 px-2">Fecha</th>
              <th className="text-left py-2 px-2">Monto</th>
              <th className="text-left py-2 px-2">Método de Pago</th>
              <th className="text-left py-2 px-2">Referencia</th>
              <th className="text-left py-2 px-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map(deposito => (
              <tr key={deposito.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-2">{deposito.fecha}</td>
                <td className="py-2 px-2 font-bold">${deposito.monto.toLocaleString()}</td>
                <td className="py-2 px-2">{deposito.metodo}</td>
                <td className="py-2 px-2">{deposito.referencia}</td>
                <td className="py-2 px-2">
                  <button 
                    onClick={() => onViewDeposit && onViewDeposit(deposito)}
                    className="text-blue-600 hover:text-blue-700 mr-2 text-xs"
                  >
                    Ver
                  </button>
                  <button 
                    onClick={() => onPrintDeposit && onPrintDeposit(deposito)}
                    className="text-gray-600 hover:text-gray-700 text-xs"
                  >
                    Imprimir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepositsHistory;