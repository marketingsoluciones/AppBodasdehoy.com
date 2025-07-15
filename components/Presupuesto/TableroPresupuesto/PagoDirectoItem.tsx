import React from 'react';

interface Props {
  nombre: string;
  monto: string;
  estado: 'Pagado' | 'Pendiente';
  fecha: string;
  categoria: string;
}

const PagoDirectoItem: React.FC<Props> = ({ nombre, monto, estado, fecha, categoria }) => (
  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
    <div>
      <div className="font-medium text-gray-700 text-sm">{nombre}</div>
      <div className="text-xs text-gray-400 flex items-center gap-2">
        <span>{fecha}</span>
        <span>•</span>
        <span>{categoria}</span>
      </div>
    </div>
    <div className="flex flex-col items-end">
      <span className="font-semibold text-gray-700">{monto}</span>
      <span className={`text-xs font-semibold mt-1 ${estado === 'Pagado' ? 'text-green-600' : 'text-yellow-600'}`}>{estado}</span>
    </div>
  </div>
);

export default PagoDirectoItem; 