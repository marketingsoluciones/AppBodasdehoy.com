import React from 'react';
import { FileText, TrendingUp } from 'lucide-react';

const ReportsSection = ({ 
  reports,
  onReportClick 
}) => {
  const defaultReports = reports || [
    {
      id: 'estado-cuenta',
      icon: FileText,
      iconColor: 'text-blue-600',
      title: 'Estado de Cuenta General',
      description: 'Reporte completo de ingresos y egresos'
    },
    {
      id: 'analisis-presupuesto',
      icon: TrendingUp,
      iconColor: 'text-green-600',
      title: 'Análisis de Presupuesto',
      description: 'Comparativa presupuesto vs gastos reales'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h3 className="text-xl font-bold mb-3">Reportes y Análisis</h3>
      <div className="grid grid-cols-2 gap-3">
        {defaultReports.map(report => {
          const Icon = report.icon;
          return (
            <div 
              key={report.id}
              onClick={() => onReportClick && onReportClick(report.id)}
              className="border rounded-lg p-3 hover:shadow-lg cursor-pointer"
            >
              <Icon className={`w-8 h-8 ${report.iconColor} mb-2`} />
              <h4 className="text-base font-semibold mb-1">{report.title}</h4>
              <p className="text-gray-600 text-sm">{report.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportsSection;