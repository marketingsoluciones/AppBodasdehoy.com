'use client';

import { useStorageData } from '../hooks/useStorageData';

export function StorageCosts() {
  const { data, loading, error } = useStorageData();

  if (loading) {
    return <div className="h-64 animate-pulse rounded-lg bg-gray-200" />;
  }

  if (error) {
    return <div className="text-center text-red-600">Error: {error.message}</div>;
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No hay datos de storage disponibles
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="text-sm text-gray-600">💾 Storage Total</div>
          <div className="mt-2 text-2xl font-bold text-blue-700">
            {data.totalGB.toFixed(2)} GB
          </div>
        </div>
        <div className="rounded-lg bg-green-50 p-4">
          <div className="text-sm text-gray-600">📁 Archivos Totales</div>
          <div className="mt-2 text-2xl font-bold text-green-700">
            {data.totalFiles.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg bg-purple-50 p-4">
          <div className="text-sm text-gray-600">💰 Costo Mensual</div>
          <div className="mt-2 text-2xl font-bold text-purple-700">
            ${data.monthlyCost.toFixed(4)}
          </div>
        </div>
        <div className="rounded-lg bg-orange-50 p-4">
          <div className="text-sm text-gray-600">📊 Proyección Anual</div>
          <div className="mt-2 text-2xl font-bold text-orange-700">
            ${data.projectedAnnualCost.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Top Users by Storage */}
      <div>
        <div className="mb-4 text-lg font-semibold text-gray-800">
          Top Usuarios por Storage
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3 text-right">Storage (GB)</th>
                <th className="px-4 py-3 text-right">Archivos</th>
                <th className="px-4 py-3 text-right">Costo Mensual</th>
              </tr>
            </thead>
            <tbody>
              {data.topUsers.map((user, index) => (
                <tr className="border-b hover:bg-gray-50" key={user.userId}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        } text-sm font-semibold`}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-700">{user.userName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">
                        {user.storageGB.toFixed(2)} GB
                      </div>
                      <div className="h-1.5 w-20 rounded-full bg-gray-200">
                        <div
                          className="h-1.5 rounded-full bg-blue-500"
                          style={{
                            width: `${(user.storageGB / data.totalGB) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {user.fileCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    ${user.cost.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-4 py-3">TOTAL</td>
                <td className="px-4 py-3 text-right text-blue-700">
                  {data.totalGB.toFixed(2)} GB
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {data.totalFiles.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-green-600">
                  ${data.monthlyCost.toFixed(4)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Storage Info */}
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <div className="font-semibold text-blue-900">Cloudflare R2</div>
            <div className="mt-1 text-sm text-blue-700">
              • $0.015 por GB/mes
              <br />
              • Egress (descarga) ilimitado gratis
              <br />
              • Tier gratuito: 10 GB
              <br />• Costo muy bajo comparado con AWS S3 o Google Cloud Storage
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

