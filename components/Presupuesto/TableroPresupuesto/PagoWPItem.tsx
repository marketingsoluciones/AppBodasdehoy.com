import React from 'react';

interface Props {
  nombre: string;
  monto: string;
  estado: 'Pagado' | 'Parcial';
  fecha: string;
  categoria: string;
  contacto: string;
  invitados?: string;
  progreso?: number; // porcentaje
}

const PagoWPItem: React.FC<Props> = ({ nombre, monto, estado, fecha, categoria, contacto, invitados, progreso }) => (
  <div className="flex flex-col bg-gray-50 rounded-lg px-3 py-2">
    <div className="flex justify-between items-center">
      <div>
        <div className="font-medium text-gray-700 text-sm">{nombre}</div>
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <span>Vence: {fecha}</span>
          <span>•</span>
          <span>{categoria}</span>
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <span>{contacto}</span>
          {invitados && <span>• {invitados}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="font-semibold text-gray-700">{monto}</span>
        <span className={`text-xs font-semibold mt-1 ${estado === 'Pagado' ? 'text-green-600' : 'text-yellow-600'}`}>{estado}</span>
      </div>
    </div>
    {typeof progreso === 'number' && (
      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progreso}%` }} />
      </div>
    )}
  </div>
);

export default PagoWPItem; 