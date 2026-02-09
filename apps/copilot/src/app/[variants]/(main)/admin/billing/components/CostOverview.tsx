'use client';

import { useBillingData } from '../hooks/useBillingData';

interface CostOverviewProps {
  period: 'day' | 'week' | 'month';
}

export function CostOverview({ period }: CostOverviewProps) {
  const { data, loading, error } = useBillingData(period);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({length: 6}).map((_, i) => (
          <div className="h-32 animate-pulse rounded-lg bg-gray-200" key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
        Error al cargar datos: {error.message}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-gray-600">
        No hay datos disponibles
      </div>
    );
  }

  const periodLabel = period === 'day' ? 'Hoy' : period === 'week' ? 'Esta Semana' : 'Este Mes';

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Gastado (Real) */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-red-50 to-red-100 p-6">
        <div className="text-sm font-medium text-gray-600">💸 Total Gastado (Real)</div>
        <div className="mt-2 text-3xl font-bold text-red-700">
          ${data.realCost.toFixed(2)}
        </div>
        <div className="mt-1 text-xs text-gray-500">{periodLabel}</div>
      </div>

      {/* Total Facturado */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100 p-6">
        <div className="text-sm font-medium text-gray-600">💰 Total Facturado</div>
        <div className="mt-2 text-3xl font-bold text-green-700">
          ${data.billedCost.toFixed(2)}
        </div>
        <div className="mt-1 text-xs text-gray-500">{periodLabel}</div>
      </div>

      {/* Ganancia (Margen) */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6">
        <div className="text-sm font-medium text-gray-600">📈 Ganancia (Margen)</div>
        <div className="mt-2 text-3xl font-bold text-blue-700">
          ${data.margin.toFixed(2)}
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {data.marginPercentage}% de margen
        </div>
      </div>

      {/* Requests Totales */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6">
        <div className="text-sm font-medium text-gray-600">🔢 Requests Totales</div>
        <div className="mt-2 text-3xl font-bold text-purple-700">
          {data.totalRequests.toLocaleString()}
        </div>
        <div className="mt-1 text-xs text-gray-500">{periodLabel}</div>
      </div>

      {/* Tokens Usados */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-orange-50 to-orange-100 p-6">
        <div className="text-sm font-medium text-gray-600">🎯 Tokens Usados</div>
        <div className="mt-2 text-3xl font-bold text-orange-700">
          {(data.totalTokens / 1_000_000).toFixed(2)}M
        </div>
        <div className="mt-1 text-xs text-gray-500">{periodLabel}</div>
      </div>

      {/* Costo Promedio por Request */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-pink-50 to-pink-100 p-6">
        <div className="text-sm font-medium text-gray-600">📊 Costo Promedio/Request</div>
        <div className="mt-2 text-3xl font-bold text-pink-700">
          ${data.avgCostPerRequest.toFixed(4)}
        </div>
        <div className="mt-1 text-xs text-gray-500">Por consulta</div>
      </div>
    </div>
  );
}

