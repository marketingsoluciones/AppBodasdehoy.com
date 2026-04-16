'use client';

import { useMemo, useState } from 'react';

interface UsageTableProps {
  period: 'day' | 'week' | 'month';
}

interface UsageRow {
  billedCost: number;
  id: string;
  inputTokens: number;
  margin: number;
  outputTokens: number;
  provider: string;
  realCost: number;
  timestamp: string;
  user: string;
}

function generateMockData(): UsageRow[] {
  const data: UsageRow[] = [];
  const providers = ['anthropic', 'openai', 'together-ai', 'gemini'];
  const users = ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'];

  for (let i = 0; i < 100; i++) {
    const provider = providers[i % providers.length];
    const inputTokens = 100 + ((i * 37) % 900);
    const outputTokens = 500 + ((i * 73) % 2500);
    const realCost = (inputTokens / 1000) * 0.003 + (outputTokens / 1000) * 0.015;

    data.push({
      billedCost: realCost * 1.5,
      id: `usage_${i}`,
      inputTokens,
      margin: realCost * 0.5,
      outputTokens,
      provider,
      realCost,
      timestamp: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
      user: users[i % users.length],
    });
  }

  return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const PROVIDER_NAMES: Record<string, string> = {
  anthropic: 'Anthropic',
  gemini: 'Gemini',
  openai: 'OpenAI',
  'together-ai': 'Together.AI',
};

export function UsageTable({ period }: UsageTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterProvider, setFilterProvider] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const itemsPerPage = 20;

  const allData = useMemo(() => generateMockData(), []);

  const filteredData = useMemo(() => {
    const now = Date.now();
    const msRange = period === 'day' ? 86_400_000 : period === 'week' ? 7 * 86_400_000 : 30 * 86_400_000;

    return allData.filter((row) => {
      if (now - new Date(row.timestamp).getTime() > msRange) return false;
      if (filterProvider && row.provider !== filterProvider) return false;
      if (filterUser && !row.user.toLowerCase().includes(filterUser.toLowerCase())) return false;
      return true;
    });
  }, [allData, period, filterProvider, filterUser]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleExport = () => {
    const headers = ['Fecha', 'Usuario', 'Proveedor', 'Input Tokens', 'Output Tokens', 'Costo Real', 'Facturado', 'Margen'];
    const rows = filteredData.map((r) => [
      new Date(r.timestamp).toLocaleString('es-ES'),
      r.user,
      PROVIDER_NAMES[r.provider] || r.provider,
      r.inputTokens,
      r.outputTokens,
      r.realCost.toFixed(4),
      r.billedCost.toFixed(4),
      r.margin.toFixed(4),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <select
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
          onChange={(e) => { setFilterProvider(e.target.value); setCurrentPage(1); }}
          value={filterProvider}
        >
          <option value="">Todos los proveedores</option>
          <option value="anthropic">Anthropic</option>
          <option value="openai">OpenAI</option>
          <option value="together-ai">Together.AI</option>
          <option value="gemini">Gemini</option>
        </select>
        <input
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm"
          onChange={(e) => { setFilterUser(e.target.value); setCurrentPage(1); }}
          placeholder="Buscar por usuario..."
          type="text"
          value={filterUser}
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
                  {PROVIDER_NAMES[row.provider] || row.provider}
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
            {currentData.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-400" colSpan={8}>
                  Sin datos para los filtros seleccionados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {filteredData.length > 0
            ? `Mostrando ${startIndex + 1} - ${Math.min(startIndex + itemsPerPage, filteredData.length)} de ${filteredData.length} registros`
            : '0 registros'}
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={safePage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            type="button"
          >
            Anterior
          </button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Página {safePage} de {totalPages}
          </span>
          <button
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={safePage === totalPages}
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
          onClick={handleExport}
          type="button"
        >
          Exportar a CSV
        </button>
      </div>
    </div>
  );
}
