import React from 'react';

const BotonesReporte = () => (
  <div className="flex gap-2 justify-end mt-6">
    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg shadow-sm">Generar Reporte</button>
    <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow">Exportar Excel</button>
  </div>
);

export default BotonesReporte; 