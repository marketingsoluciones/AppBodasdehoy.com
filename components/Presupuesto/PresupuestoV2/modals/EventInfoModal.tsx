import React, { useState, useMemo } from 'react';
import { IoCloseOutline} from "react-icons/io5";
import { TableTotals } from '../types';
import { fetchApiEventos, queries } from '../../../../utils/Fetching';
import { useToast } from '../../../../hooks/useToast';

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
  const [activeGuestsTab, setActiveGuestsTab] = useState<'confirmed' | 'estimated'>('confirmed');
  const [estimatedAdults, setEstimatedAdults] = useState(totalStimatedGuests.adults);
  const [estimatedChildren, setEstimatedChildren] = useState(totalStimatedGuests.children);
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  // Calcular invitados confirmados desde event.invitados_array
  const confirmedGuests = useMemo(() => {
    if (!event?.invitados_array || !Array.isArray(event.invitados_array)) {
      return { adults: 0, children: 0, total: 0 };
    }

    const adults = event.invitados_array.filter(invitado =>
      !invitado.edad || invitado.edad >= 18 || invitado.tipo === 'adulto'
    ).length;

    const children = event.invitados_array.filter(invitado =>
      (invitado.edad && invitado.edad < 18) || invitado.tipo === 'niño'
    ).length;

    return { adults, children, total: adults + children };
  }, [event?.invitados_array]);

  // Función para actualizar invitados estimados
  const updateEstimatedGuests = async (adults: number, children: number) => {
    setIsUpdating(true);
    try {
      await fetchApiEventos({
        query: queries.editTotalStimatedGuests,
        variables: {
          evento_id: event._id,
          adults: adults,
          children: children,
        }
      });

      if (event?.presupuesto_objeto?.totalStimatedGuests) {
        event.presupuesto_objeto.totalStimatedGuests.adults = adults;
        event.presupuesto_objeto.totalStimatedGuests.children = children;
      }

      toast("success", "Invitados estimados actualizados");
    } catch (error) {
      console.error("Error al actualizar invitados estimados:", error);
      toast("error", "Error al actualizar invitados estimados");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEstimatedAdultsChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setEstimatedAdults(numValue);
    updateEstimatedGuests(numValue, estimatedChildren);
  };

  const handleEstimatedChildrenChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setEstimatedChildren(numValue);
    updateEstimatedGuests(estimatedAdults, numValue);
  };


  const ExternalTabsDesign = () => (
    <div className="space-y-3">
      {/* Pestañas fuera del cuadro */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-medium text-gray-700">Resumen de Invitados</h4>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveGuestsTab('confirmed')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeGuestsTab === 'confirmed'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-gray-600 hover:text-green-600'
              }`}
          >
            Confirmados
          </button>
          <button
            onClick={() => setActiveGuestsTab('estimated')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeGuestsTab === 'estimated'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-blue-600'
              }`}
          >
            Estimados
          </button>
        </div>
      </div>

      {/* Cuadro principal sin pestañas */}
      <div className={`bg-gradient-to-br  bg-gray-100 rounded-lg p-4 border transition-all duration-300`}>

        {activeGuestsTab === 'confirmed' ? (
          <div className="text-center">
            <div className="mb-3">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {confirmedGuests.total}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Invitados Confirmados</div>
            </div>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800 h-9 w-14">{confirmedGuests.adults}</div>
                <div className="text-xs text-gray-600">Adultos</div>
              </div>
              <div className="w-px bg-blue-200"></div>

              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800 h-9 w-14">{confirmedGuests.children}</div>
                <div className="text-xs text-gray-600">Niños</div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`text-center ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="mb-3">
              <div className="text-3xl font-bold text-gray-600. mb-1">
                {estimatedAdults + estimatedChildren}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide.">
                Invitados Estimados {isUpdating && '⏳'}
              </div>
            </div>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <input
                  type="number"
                  min="0"
                  value={estimatedAdults}
                  onChange={(e) => handleEstimatedAdultsChange(e.target.value)}
                  className="w-16 text-lg font-semibold text-center border border-gray-300 rounded-lg h-8 focus:outline-none focus:ring-0 focus:ring-gray-400  bg-white"
                  disabled={isUpdating}
                />
                <div className="text-xs text-gray-600 mt-1">Adultos</div>
              </div>
              <div className="w-px bg-blue-200"></div>
              <div className="text-center">
                <input
                  type="number"
                  min="0"
                  value={estimatedChildren}
                  onChange={(e) => handleEstimatedChildrenChange(e.target.value)}
                  className="w-16 text-lg font-semibold text-center border border-gray-300 rounded-lg h-8 focus:outline-none focus:ring-0 focus:ring-gray-400  bg-white"
                  disabled={isUpdating}
                />
                <div className="text-xs text-gray-600 mt-1">Niños</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="event-info-modal absolute top-12 left-3 bg-white shadow-lg rounded border z-50 w-80 max-w-[calc(100vw-24px)]">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Información del Evento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <IoCloseOutline className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-4">
        <ExternalTabsDesign />

        {/* Resto del modal sin cambios */}
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
                className="bg-green h-2 rounded-full transition-all duration-300"
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