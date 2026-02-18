'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CostOverview } from './components/CostOverview';
import { CostByProvider } from './components/CostByProvider';
import { CostByChannel } from './components/CostByChannel';
import { StorageCosts } from './components/StorageCosts';
import { CostChart } from './components/CostChart';
import { UsageTable } from './components/UsageTable';

type Period = 'day' | 'week' | 'month';

export default function BillingDashboard() {
  const [period, setPeriod] = useState<Period>('month');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">💰 Facturación y Costos</h1>
          <p className="mt-2 text-gray-600">
            Monitoreo de costos de IA, storage y facturación por cliente
          </p>
          <Link
            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            href="/admin/billing/dar-credito"
          >
            Dar crédito a usuario (admin)
          </Link>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
          <button
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              period === 'day'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setPeriod('day')}
            type="button"
          >
            Hoy
          </button>
          <button
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              period === 'week'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setPeriod('week')}
            type="button"
          >
            Semana
          </button>
          <button
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              period === 'month'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setPeriod('month')}
            type="button"
          >
            Mes
          </button>
        </div>
      </div>

      {/* Cost Overview Cards */}
      <CostOverview period={period} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cost by Provider */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Costos por Proveedor IA</h2>
          <CostByProvider period={period} />
        </div>

        {/* Cost by Channel */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Costos por Canal</h2>
          <CostByChannel period={period} />
        </div>
      </div>

      {/* Storage Costs */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Costos de Almacenamiento</h2>
        <StorageCosts />
      </div>

      {/* Cost Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Evolución de Costos</h2>
        <CostChart period={period} />
      </div>

      {/* Usage Table */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Detalle de Uso</h2>
        <UsageTable period={period} />
      </div>
    </div>
  );
}

