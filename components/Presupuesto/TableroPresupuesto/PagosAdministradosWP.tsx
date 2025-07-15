import React from 'react';
import PagoWPItem from './PagoWPItem';

const PagosAdministradosWP = () => (
  <div className="bg-white rounded-xl shadow p-4 h-full flex flex-col">
    <div className="flex items-center mb-2">
      <span className="text-blue-600 text-lg mr-2"><i className="fas fa-briefcase" /></span>
      <h2 className="font-semibold text-gray-700 text-base flex-1">Pagos Administrados por WP</h2>
      <span className="text-xs text-gray-400">Pagado / Total</span>
      <span className="ml-2 text-lg font-bold text-green-600">$10,000</span>
      <span className="ml-1 text-gray-400">/ $21,300</span>
    </div>
    <div className="flex-1 space-y-2">
      <PagoWPItem nombre="Salón de Eventos - Hacienda Real" monto="$8000" estado="Pagado" fecha="2025-05-10" categoria="Locación" contacto="Carlos Ruiz - 555-0123" invitados="300 invitados" />
      <PagoWPItem nombre="Catering - Sabores Gourmet" monto="$4500" estado="Parcial" fecha="2025-05-25" categoria="Alimentos" contacto="Chef María - 555-0124" invitados="" progreso={44} />
    </div>
    <button className="mt-4 text-blue-600 hover:underline text-sm">+ Agregar proveedor</button>
  </div>
);

export default PagosAdministradosWP; 