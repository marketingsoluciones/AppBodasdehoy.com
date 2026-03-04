'use client';

import { useBillingData } from '../hooks/useBillingData';

interface CostByProviderProps {
  period: 'day' | 'week' | 'month';
}

export function CostByProvider({ period }: CostByProviderProps) {
  const { data, loading, error } = useBillingData(period);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-lg bg-gray-200" />;
  }

  if (error) {
    return <div className="text-center text-red-600">Error: {error.message}</div>;
  }

  if (!data || data.byProvider.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No hay datos de proveedores disponibles
      </div>
    );
  }

  // Ordenar por costo descendente
  const sortedProviders = [...data.byProvider].sort((a, b) => b.realCost - a.realCost);

  // Mapeo de nombres de proveedores a nombres amigables
  const providerNames: Record<string, string> = {
    anthropic: 'Anthropic',
    'cloudflare-workers-ai': 'Cloudflare',
    gemini: 'Google Gemini',
    'lm-studio': 'LM-Studio',
    ollama: 'Ollama',
    openai: 'OpenAI',
    'together-ai': 'Together.AI',
  };

  // Colores por proveedor
  const providerColors: Record<string, string> = {
    anthropic: 'bg-purple-500',
    'cloudflare-workers-ai': 'bg-orange-500',
    gemini: 'bg-yellow-500',
    'lm-studio': 'bg-indigo-500',
    ollama: 'bg-gray-500',
    openai: 'bg-green-500',
    'together-ai': 'bg-blue-500',
  };

  const maxCost = Math.max(...sortedProviders.map((p) => p.realCost));

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700">
            <tr>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3 text-right">Requests</th>
              <th className="px-4 py-3 text-right">Costo Real</th>
              <th className="px-4 py-3 text-right">Facturado</th>
              <th className="px-4 py-3 text-right">Margen</th>
              <th className="px-4 py-3 text-right">Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {sortedProviders.map((provider) => (
              <tr className="border-b hover:bg-gray-50" key={provider.provider}>
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        providerColors[provider.provider] || 'bg-gray-400'
                      }`}
                    />
                    {providerNames[provider.provider] || provider.provider}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {provider.requests.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-red-600">
                  ${provider.realCost.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">
                  ${provider.billedCost.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-blue-600">
                  ${provider.margin.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                      provider.successRate >= 0.95
                        ? 'bg-green-100 text-green-800'
                        : provider.successRate >= 0.9
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {(provider.successRate * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td className="px-4 py-3">TOTAL</td>
              <td className="px-4 py-3 text-right">
                {sortedProviders.reduce((sum, p) => sum + p.requests, 0).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-red-600">
                ${sortedProviders.reduce((sum, p) => sum + p.realCost, 0).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right text-green-600">
                ${sortedProviders.reduce((sum, p) => sum + p.billedCost, 0).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right text-blue-600">
                ${sortedProviders.reduce((sum, p) => sum + p.margin, 0).toFixed(2)}
              </td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bar Chart */}
      <div className="space-y-3 pt-4">
        <div className="text-sm font-medium text-gray-700">Distribución de Costos</div>
        {sortedProviders.map((provider) => {
          const percentage = maxCost > 0 ? (provider.realCost / maxCost) * 100 : 0;
          return (
            <div className="space-y-1" key={provider.provider}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600">
                  {providerNames[provider.provider] || provider.provider}
                </span>
                <span className="text-gray-500">${provider.realCost.toFixed(2)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full ${providerColors[provider.provider] || 'bg-gray-400'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

