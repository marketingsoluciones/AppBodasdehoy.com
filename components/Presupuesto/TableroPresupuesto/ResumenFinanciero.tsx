import React from 'react';

const resumenes = [
  { label: 'Total Recibido', value: '$25,000', sub: 'de presupuesto total', color: 'bg-blue-50', text: 'text-blue-600' },
  { label: 'Fondos Disponibles', value: '$12,500', sub: '50.0% del total', color: 'bg-green-50', text: 'text-green-600' },
  { label: 'Total Comprometido', value: '$21,300', sub: 'en 6 proveedores', color: 'bg-orange-50', text: 'text-orange-600' },
  { label: 'Pagos Directos Novia', value: '$11,350', sub: '4 transacciones', color: 'bg-purple-50', text: 'text-purple-600' },
  { label: 'Presupuesto Total', value: '$32,650', sub: 'Todos los gastos', color: 'bg-indigo-50', text: 'text-indigo-600' },
];

const ResumenFinanciero = () => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
    {resumenes.map((item, idx) => (
      <div key={idx} className={`rounded-xl p-4 shadow-sm ${item.color}`}>
        <div className="text-xs font-medium text-gray-500 mb-1">{item.label}</div>
        <div className={`text-2xl font-bold ${item.text}`}>{item.value}</div>
        <div className="text-xs text-gray-400 mt-1">{item.sub}</div>
      </div>
    ))}
  </div>
);

export default ResumenFinanciero; 