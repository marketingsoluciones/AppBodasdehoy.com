import React from 'react';
import PaymentCard from './PaymentCard';

const PaymentsList = ({ 
  title, 
  payments, 
  icon: Icon, 
  iconColor, 
  total,
  paidAmount,
  type,
  onAddPayment,
  onViewDetails,
  onMakePayment,
  addButtonText 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md">
      <div className={`p-3 border-b bg-gradient-to-r ${
        type === 'directo' ? 'from-purple-50' : 'from-blue-50'
      } to-white`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Icon className={`w-6 h-6 ${iconColor}`} />
            {title}
          </h2>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {type === 'wp' ? 'Pagado / Total' : 'Total en pagos directos'}
            </p>
            {type === 'wp' ? (
              <p className="text-xl font-bold">
                <span className="text-green-600">${paidAmount?.toLocaleString()}</span>
                <span className="text-gray-400 text-base"> / </span>
                <span className="text-gray-700">${total.toLocaleString()}</span>
              </p>
            ) : (
              <p className={`text-xl font-bold ${iconColor}`}>${total.toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {payments.map(payment => (
            <PaymentCard 
              key={payment.id} 
              payment={payment} 
              type={type}
              onViewDetails={onViewDetails}
              onMakePayment={onMakePayment}
            />
          ))}
        </div>
        <button 
          onClick={onAddPayment}
          className={`mt-2 w-full py-1 ${
            type === 'directo' ? 'text-purple-600 hover:text-purple-700' : 'text-blue-600 hover:text-blue-700'
          } font-medium text-sm`}
        >
          + {addButtonText || `Agregar ${type === 'directo' ? 'pago directo' : 'proveedor'}`}
        </button>
      </div>
    </div>
  );
};

export default PaymentsList;