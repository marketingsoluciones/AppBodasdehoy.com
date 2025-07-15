import React from 'react';
import PagoDirectoItem from './PagoDirectoItem';

const PagosDirectosNovia = () => (
  <div className="bg-white rounded-xl shadow p-4 h-full flex flex-col">
    <div className="flex items-center mb-2">
      <span className="text-purple-600 text-lg mr-2"><i className="fas fa-credit-card" /></span>
      <h2 className="font-semibold text-gray-700 text-base flex-1">Pagos Directos de la Novia</h2>
      <span className="text-xs text-gray-400">Total en pagos directos</span>
      <span className="ml-2 text-lg font-bold text-purple-600">$11,350</span>
    </div>
    <div className="flex-1 space-y-2">
      <PagoDirectoItem nombre="Vestido de Novia - Boutique Elegance" monto="$3500" estado="Pagado" fecha="2025-05-15" categoria="Vestuario" />
      <PagoDirectoItem nombre="Anillos - Joyería Diamante" monto="$2800" estado="Pagado" fecha="2025-05-20" categoria="Joyería" />
      <PagoDirectoItem nombre="Luna de Miel - Viajes Paradise" monto="$4200" estado="Pendiente" fecha="2025-06-01" categoria="Viajes" />
    </div>
    <button className="mt-4 text-blue-600 hover:underline text-sm">+ Agregar pago directo</button>
  </div>
);

export default PagosDirectosNovia; 