import React from 'react';

const NavigationTabs = ({ activeTab, onTabChange, tabs }) => {
  const defaultTabs = tabs || [
    { id: 'dashboard', label: 'Dashboard Principal' },
    { id: 'depositos', label: 'Historial de Depósitos' },
   /*  { id: 'reportes', label: 'Reportes y Análisis' } */
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm mb-6">
      {/* BUG-17 (informe QA 21-jun): tabs se solapaban/truncaban en móvil <768px.
          overflow-x-auto + whitespace-nowrap + shrink-0 → scroll horizontal limpio. */}
      <div className="flex border-b overflow-x-auto">
        {defaultTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-2 font-normal text-sm transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NavigationTabs;