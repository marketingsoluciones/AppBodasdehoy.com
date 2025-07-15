import React from 'react';

const tabs = [
  'Dashboard Principal',
  'Historial de Depósitos',
  'Reportes y Análisis',
];

const TabsNavegacion = () => (
  <div className="flex space-x-2 border-b border-gray-200 mb-4">
    {tabs.map((tab, idx) => (
      <button
        key={tab}
        className={`px-4 py-2 text-sm font-medium rounded-t-md focus:outline-none ${idx === 0 ? 'bg-white border border-b-0 border-gray-200 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-blue-600'}`}
      >
        {tab}
      </button>
    ))}
  </div>
);

export default TabsNavegacion; 