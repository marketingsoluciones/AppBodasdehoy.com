import React from "react";
import PaymentCard from "./PaymentCard";
import { getCurrency } from "../../../utils/Funciones";

const PaymentsList = ({
  title,
  payments,
  icon: Icon,
  iconColor,
  total,
  type,
  onViewDetails,
  onMakePayment,
  categorias,
  currency,
}) => {

  const uniquePayments = payments.filter(
    (payment, index, self) =>
      index === self.findIndex((p) => p.idGasto === payment.idGasto)
  );

  return (
    <div className="bg-white rounded-xl shadow-md">
      <div
        className={`p-3 border-b bg-gradient-to-r ${
          type === "directo" ? "from-purple-50" : "from-blue-50"
        } to-white`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Icon className={`w-6 h-6 ${iconColor}`} />
            {title}
          </h2>
          <div className="text-right">
            <p className="text-xs text-gray-500 capitalize">
              {type === "wp" ? " Total pagado" : "Total en pagos directos"}
            </p>
            {type === "wp" ? (
              <p className="text-xl font-bold">
                <span className="text-gray-700">{ getCurrency(parseFloat(total), currency)}</span>
              </p>
            ) : (
              <p className={`text-xl font-bold ${iconColor}`}>
                {getCurrency(parseFloat(total), currency)}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="space-y-2 h-72 overflow-y-auto pr-1">
          {uniquePayments && uniquePayments.length > 0 ? (
            uniquePayments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                type={type}
                onViewDetails={onViewDetails}
                onMakePayment={onMakePayment}
                categorias={categorias}
                currency={currency}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
              
              <p className="text-lg font-medium">No hay pagos realizados</p>
              <p className="text-sm text-gray-400 text-center">
                {type === "wp" 
                  ? "Los pagos por Wedding Planner aparecerán aquí" 
                  : "Los pagos directos aparecerán aquí"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsList;
