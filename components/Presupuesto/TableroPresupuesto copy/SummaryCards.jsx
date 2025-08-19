import React from 'react';
import { DollarSign, AlertCircle, CreditCard, Wallet, TrendingUp } from 'lucide-react';
import SummaryCard from './SummaryCard';

const SummaryCards = ({ 
  fondosRecibidos, 
  fondosDisponibles, 
  totalComprometido,
  pagosDirectos,
  presupuestoTotal,
  numeroProveedores,
  numeroTransacciones 
}) => {
  return (
    <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
      <SummaryCard
        title="Total Recibido"
        amount={fondosRecibidos}
        subtitle="Recibido"
        icon={Wallet}
        iconColor="text-blue-500"
        bgColor="bg-blue-100"
        textColor="text-blue-600"
        description="De presupuesto total"
      />
      
      <SummaryCard
        title="Fondos Disponibles"
        amount={fondosDisponibles}
        subtitle="Disponible"
        icon={DollarSign}
        iconColor="text-green"
        bgColor="bg-[#93E6B5]"
        textColor="text-[#0DBD50]"
        percentage={((fondosDisponibles/fondosRecibidos)*100).toFixed(1)}
        description="del total"
      />
      
      <SummaryCard
        title="Total Comprometido"
        amount={totalComprometido}
        subtitle="Comprometido"
        icon={AlertCircle}
        iconColor="text-orange-500"
        bgColor="bg-orange-100"
        textColor="text-orange-600"
        description={`En ${numeroProveedores} proveedores`}
      />

      <SummaryCard
        title="Pagos Directos Novia"
        amount={pagosDirectos}
        subtitle="Directos"
        icon={CreditCard}
        iconColor="text-purple-500"
        bgColor="bg-purple-100"
        textColor="text-purple-600"
        description={`${numeroTransacciones} transacciones`}
      />

      <SummaryCard
        title="Presupuesto Total"
        amount={presupuestoTotal}
        subtitle="Total"
        icon={TrendingUp}
        iconColor="text-indigo-500"
        bgColor="bg-indigo-100"
        textColor="text-indigo-600"
        description="Todos los gastos"
      />
    </div>
  );
};

export default SummaryCards;