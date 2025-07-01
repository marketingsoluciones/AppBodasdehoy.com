import React from 'react';
import { IoCloseOutline } from "react-icons/io5";
import { TableTotals } from '../types';

interface EventInfoModalProps {
  event: any;
  currency: string;
  categorias_array: any[];
  totalStimatedGuests: { adults: number; children: number };
  totals: TableTotals;
  formatNumber: (value: number) => string;
  onClose: () => void;
}

export const EventInfoModal: React.FC<EventInfoModalProps> = ({
  event,
  currency,
  categorias_array,
  totalStimatedGuests,
  totals,
  formatNumber,
  onClose
}) => {
  return (
    <div className="event-info-modal absolute top-12 left-3 bg-white shadow-lg rounded border z-50 w-80 max-w-[calc(100vw-24px)]">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Información del Evento</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <IoCloseOutline className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      <div className="p-3 space-y-4">
        {/* Resumen de Invitados */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Resumen de Invitados</h4>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {totalStimatedGuests.adults + totalStimatedGuests.children}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700">
                {totalStimatedGuests.adults}
              </div>
              <div className="text-xs text-gray-500">Adultos</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700">
                {totalStimatedGuests.children}
              </div>
              <div className="text-xs text-gray-500">Niños</div>
            </div>
          </div>
        </div>

        {/* Información del Evento */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Detalles del Evento</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Nombre:</span>
              <span className="text-gray-800 font-medium truncate ml-2">{event?.nombre || 'Sin nombre'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Moneda:</span>
              <span className="text-gray-800 font-medium uppercase">{currency}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Categorías:</span>
              <span className="text-gray-800 font-medium">{categorias_array.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Total Gastos:</span>
              <span className="text-gray-800 font-medium">
                {categorias_array.reduce((acc, cat) => acc + ((cat.gastos_array && Array.isArray(cat.gastos_array)) ? cat.gastos_array.length : 0), 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Progreso del Presupuesto */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Progreso del Presupuesto</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">% Pagado:</span>
              <span className="text-gray-800 font-medium">
                {totals.total > 0 ? Math.round((totals.pagado / totals.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${totals.total > 0 ? Math.min((totals.pagado / totals.total) * 100, 100) : 0}%` 
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">Pagado: {formatNumber(totals.pagado)}</span>
              <span className="text-red-600">Pendiente: {formatNumber(totals.total - totals.pagado)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};