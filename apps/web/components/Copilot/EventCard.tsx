/**
 * EventCard - Componente para renderizar información de eventos de forma estructurada
 *
 * Muestra datos del evento con botones de acción para navegar a secciones específicas
 */

import { useRouter } from 'next/router';
import { FC } from 'react';

export interface EventCardData {
  event: {
    id: string;
    name: string;
    type: string;
    date?: string;
    guests?: number;
    confirmed?: number;
    pending?: number;
    budget?: number;
    spent?: number;
    paid?: number;
    currency?: string;
    tables?: number;
    tasks?: number;
  };
  actions?: Array<{
    label: string;
    url: string;
    icon?: string;
    badge?: number;
    variant?: 'primary' | 'secondary' | 'success' | 'warning';
  }>;
  message?: string;
}

const variantStyles = {
  primary: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
  secondary: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
  warning: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200',
};

export const EventCard: FC<{ data: EventCardData }> = ({ data }) => {
  const router = useRouter();

  const { event, actions = [], message } = data;

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      // Si es timestamp
      if (!isNaN(Number(dateString))) {
        return new Date(Number(dateString)).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      // Si es fecha ISO
      return new Date(dateString).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount?: number, currency: string = 'EUR') => {
    if (amount === undefined || amount === null) return null;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white shadow-sm my-2">
      {/* Message opcional */}
      {message && (
        <p className="text-sm text-gray-600 mb-2">{message}</p>
      )}

      {/* Header del evento */}
      <div className="border-b border-gray-100 pb-2">
        <h3 className="font-semibold text-lg text-gray-900">{event.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
            {event.type}
          </span>
          {event.date && (
            <span className="text-sm text-gray-500">
              📅 {formatDate(event.date)}
            </span>
          )}
        </div>
      </div>

      {/* Estadísticas en grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Invitados */}
        {event.guests !== undefined && (
          <div className="bg-blue-50 rounded-lg p-2">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">👥</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">Invitados</div>
                <div className="text-xl font-bold text-blue-700">{event.guests}</div>
                {(event.confirmed !== undefined || event.pending !== undefined) && (
                  <div className="text-xs text-gray-600 space-x-2">
                    {event.confirmed !== undefined && <span>✅ {event.confirmed}</span>}
                    {event.pending !== undefined && <span>⏳ {event.pending}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Presupuesto */}
        {event.budget !== undefined && (
          <div className="bg-green-50 rounded-lg p-2">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">💰</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">Presupuesto</div>
                <div className="text-lg font-bold text-green-700">
                  {formatCurrency(event.budget, event.currency)}
                </div>
                {(event.spent !== undefined || event.paid !== undefined) && (
                  <div className="text-xs text-gray-600">
                    {event.paid !== undefined && (
                      <div>Pagado: {formatCurrency(event.paid, event.currency)}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mesas */}
        {event.tables !== undefined && event.tables > 0 && (
          <div className="bg-purple-50 rounded-lg p-2">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🪑</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">Mesas</div>
                <div className="text-xl font-bold text-purple-700">{event.tables}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tareas */}
        {event.tasks !== undefined && event.tasks > 0 && (
          <div className="bg-orange-50 rounded-lg p-2">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">📋</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">Tareas</div>
                <div className="text-xl font-bold text-orange-700">{event.tasks}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      {actions.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {actions.map((action, i) => {
              const variant = action.variant || 'secondary';
              return (
                <button
                  key={i}
                  onClick={() => router.push(action.url)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                    border transition-colors
                    ${variantStyles[variant]}
                  `}
                >
                  {action.icon && <span className="text-base">{action.icon}</span>}
                  <span>{action.label}</span>
                  {action.badge !== undefined && action.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white rounded-full text-xs font-bold">
                      {action.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCard;
