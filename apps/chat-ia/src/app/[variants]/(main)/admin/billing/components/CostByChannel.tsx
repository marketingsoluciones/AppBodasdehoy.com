'use client';

interface CostByChannelProps {
  period: 'day' | 'week' | 'month';
}

export function CostByChannel({ period: _period }: CostByChannelProps) {
  void _period;
  // TODO: Implementar fetch de métricas multi-canal desde backend
  // Por ahora, datos de ejemplo
  const channelData = [
    {
      avgCostPerMessage: 0.08,
      channel: 'whatsapp',
      color: 'bg-green-500',
      cost: 8,
      icon: '📱',
      messages: 100,
      name: 'WhatsApp',
    },
    {
      avgCostPerMessage: 0.12,
      channel: 'instagram',
      color: 'bg-pink-500',
      cost: 6,
      icon: '📷',
      messages: 50,
      name: 'Instagram',
    },
    {
      avgCostPerMessage: 0.05,
      channel: 'telegram',
      color: 'bg-blue-500',
      cost: 1,
      icon: '✈️',
      messages: 20,
      name: 'Telegram',
    },
    {
      avgCostPerMessage: 0.075,
      channel: 'web',
      color: 'bg-purple-500',
      cost: 15,
      icon: '🌐',
      messages: 200,
      name: 'Web',
    },
  ];

  const totalCost = channelData.reduce((sum, ch) => sum + ch.cost, 0);
  const totalMessages = channelData.reduce((sum, ch) => sum + ch.messages, 0);

  // Ordenar por costo descendente
  const sortedChannels = [...channelData].sort((a, b) => b.cost - a.cost);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="text-sm text-gray-600">Total Mensajes</div>
          <div className="text-2xl font-bold text-blue-700">
            {totalMessages.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg bg-green-50 p-4">
          <div className="text-sm text-gray-600">Costo Total</div>
          <div className="text-2xl font-bold text-green-700">${totalCost.toFixed(2)}</div>
        </div>
      </div>

      {/* Pie Chart (Simulado con barras circulares) */}
      <div>
        <div className="mb-3 text-sm font-medium text-gray-700">
          Distribución por Canal
        </div>
        <div className="space-y-3">
          {sortedChannels.map((channel) => {
            const percentage = totalCost > 0 ? (channel.cost / totalCost) * 100 : 0;
            return (
              <div className="space-y-1" key={channel.channel}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{channel.icon}</span>
                    <span className="font-medium text-gray-700">{channel.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">
                      {channel.messages} msgs
                    </span>
                    <span className="font-semibold text-gray-900">
                      ${channel.cost.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full ${channel.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cost per Message */}
      <div>
        <div className="mb-3 text-sm font-medium text-gray-700">
          Costo Promedio por Mensaje
        </div>
        <div className="grid grid-cols-2 gap-3">
          {sortedChannels.map((channel) => (
            <div
              className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
              key={channel.channel}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{channel.icon}</span>
                <span className="text-sm font-medium text-gray-700">{channel.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                ${channel.avgCostPerMessage.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Most/Least Expensive Badge */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="text-xs text-green-600">🏆 Más Rentable</div>
          <div className="mt-1 font-semibold text-green-700">
            {sortedChannels.at(-1)?.name}
          </div>
          <div className="text-xs text-green-600">
            ${sortedChannels.at(-1)?.avgCostPerMessage.toFixed(4)}/msg
          </div>
        </div>
        <div className="flex-1 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="text-xs text-red-600">⚠️ Más Costoso</div>
          <div className="mt-1 font-semibold text-red-700">{sortedChannels[0]?.name}</div>
          <div className="text-xs text-red-600">
            ${sortedChannels[0]?.avgCostPerMessage.toFixed(4)}/msg
          </div>
        </div>
      </div>
    </div>
  );
}

