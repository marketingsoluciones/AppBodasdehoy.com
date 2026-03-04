'use client';

import { useState } from 'react';

interface UsageTableProps {
  period: 'day' | 'week' | 'month';
}

export function UsageTable({ period: _period }: UsageTableProps) {
  void _period;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // TODO: Fetch real data from backend
  // Por ahora, datos de ejemplo
  const generateMockData = () => {
    const data = [];
    const providers = ['anthropic', 'openai', 'together-ai', 'gemini'];
    const users = ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'];

    for (let i = 0; i < 100; i++) {
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const inputTokens = Math.floor(Math.random() * 1000) + 100;
      const outputTokens = Math.floor(Math.random() * 3000) + 500;
      const realCost = (inputTokens / 1000) * 0.003 + (outputTokens / 1000) * 0.015;

      data.push({
        billedCost: realCost * 1.5,
        id: `usage_${i}`,
        inputTokens,
        margin: realCost * 0.5,
        outputTokens,
        provider,
        realCost,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        user: users[Math.floor(Math.random() * users.length)],
      });
    }

    return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const allData = generateMockData();
  const totalPages = Math.ceil(allData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = allData.slice(startIndex, endIndex);

  const providerNames: Record<string, string> = {
    anthropic: 'Anthropic',
    gemini: 'Gemini',
    openai: 'OpenAI',
    'together-ai': 'Together.AI',
  };

  return (
    <div className="space-y-4">
      {/* Filters (TODO: Implementar) */}
      <div className="flex gap-4">
        <select className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
          <option value="">Todos los proveedores</option>
          <option value="anthropic">Anthropic</option>
          <option value="openai">OpenAI</option>
          <option value="together-ai">Together.AI</option>
          <option value="gemini">Gemini</option>
        </select>
        <input
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm"
          placeholder="Buscar por usuario..."
          type="text"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700">
            <tr>
              <th className="px-4 py-3">Fecha/Hora</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3 text-right">Input Tokens</th>
              <th className="px-4 py-3 text-right">Output Tokens</th>
              <th className="px-4 py-3 text-right">Costo Real</th>
              <th className="px-4 py-3 text-right">Facturado</th>
              <th className="px-4 py-3 text-right">Margen</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row) => (
              <tr className="border-b hover:bg-gray-50" key={row.id}>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(row.timestamp).toLocaleString('es-ES', {
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    month: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    {row.user}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-700">
                  {providerNames[row.provider] || row.provider}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {row.inputTokens.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {row.outputTokens.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-red-600">
                  ${row.realCost.toFixed(4)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">
                  ${row.billedCost.toFixed(4)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-blue-600">
                  ${row.margin.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Mostrando {startIndex + 1} - {Math.min(endIndex, allData.length)} de{' '}
          {allData.length} registros
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            type="button"
          >
            Anterior
          </button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <button
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            type="button"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          type="button"
        >
          📥 Exportar a CSV
        </button>
      </div>
    </div>
  );
}

