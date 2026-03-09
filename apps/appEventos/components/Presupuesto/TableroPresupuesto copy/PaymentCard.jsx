import React from 'react';
import { Calendar, Eye, DollarSign } from 'lucide-react';

const PaymentCard = ({ 
  payment, 
  type = 'directo',
  onViewDetails,
  onMakePayment 
}) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'pagado':
        return 'bg-green-100 text-green-700';
      case 'parcial':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pagado':
        return '✓ Pagado';
      case 'parcial':
        return '◐ Parcial';
      default:
        return '⏳ Pendiente';
    }
  };

  return (
    <div className="border rounded-lg p-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold text-base text-gray-800">{payment.proveedor}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {type === 'directo' ? payment.fecha : `Vence: ${payment.fecha}`}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {payment.categoria}
            </span>
          </div>
          {payment.contacto && (
            <p className="text-xs text-gray-600 mt-0.5">📞 {payment.contacto}</p>
          )}
          {payment.notas && (
            <p className="text-xs text-gray-600 mt-1 italic">{payment.notas}</p>
          )}
          {payment.estado === 'parcial' && payment.pagado && (
            <div className="mt-1">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{width: `${(payment.pagado/payment.monto)*100}%`}}
                ></div>
              </div>
              <p className="text-xs text-blue-600 mt-0.5">
                Pagado: ${payment.pagado?.toLocaleString()} ({((payment.pagado/payment.monto)*100).toFixed(0)}%)
              </p>
            </div>
          )}
        </div>
        <div className="text-right ml-2">
          <p className="text-lg font-bold text-gray-800">${payment.monto.toLocaleString()}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyle(payment.estado)}`}>
            {getStatusIcon(payment.estado)}
          </span>
          {type === 'wp' && (
            <div className="mt-1 space-x-1">
              <button 
                onClick={() => onViewDetails && onViewDetails(payment)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Eye className="w-4 h-4 inline" />
              </button>
              <button 
                onClick={() => onMakePayment && onMakePayment(payment)}
                className="text-green-600 hover:text-green-700"
              >
                <DollarSign className="w-4 h-4 inline" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCard;