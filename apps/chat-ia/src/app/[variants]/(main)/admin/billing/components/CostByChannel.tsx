'use client';

import { useMemo, useState } from 'react';

interface CostByChannelProps {
  period: 'day' | 'week' | 'month';
}

export function CostByChannel({ period }: CostByChannelProps) {
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);

  const channelData = useMemo(() => [
    {
      channel: 'whatsapp',
      color: '#22c55e',
      cost: period === 'day' ? 8 : period === 'week' ? 56 : 240,
      icon: '📱',
      messages: period === 'day' ? 100 : period === 'week' ? 700 : 3000,
      name: 'WhatsApp',
    },
    {
      channel: 'instagram',
      color: '#ec4899',
      cost: period === 'day' ? 6 : period === 'week' ? 42 : 180,
      icon: '📷',
      messages: period === 'day' ? 50 : period === 'week' ? 350 : 1500,
      name: 'Instagram',
    },
    {
      channel: 'telegram',
      color: '#3b82f6',
      cost: period === 'day' ? 1 : period === 'week' ? 7 : 30,
      icon: '✈️',
      messages: period === 'day' ? 20 : period === 'week' ? 140 : 600,
      name: 'Telegram',
    },
    {
      avgCostPerMessage: 0.075,
      channel: 'web',
      color: '#a855f7',
      cost: period === 'day' ? 15 : period === 'week' ? 105 : 450,
      icon: '🌐',
      messages: period === 'day' ? 200 : period === 'week' ? 1400 : 6000,
      name: 'Web',
    },
  ], [period]);

  const totalCost = channelData.reduce((sum, ch) => sum + ch.cost, 0);
  const totalMessages = channelData.reduce((sum, ch) => sum + ch.messages, 0);
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

      {/* Donut Chart + Breakdown */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* SVG Donut */}
        <div className="relative flex-shrink-0">
          <svg width="160" height="160" viewBox="0 0 160 160">
            {(() => {
              const cx = 80, cy = 80, r = 60, strokeW = 24;
              const circ = 2 * Math.PI * r;
              let offset = 0;
              return sortedChannels.map((ch) => {
                const pct = totalCost > 0 ? ch.cost / totalCost : 0;
                const dash = circ * pct;
                const gap = circ - dash;
                const el = (
                  <circle
                    key={ch.channel}
                    cx={cx} cy={cy} r={r}
                    fill="none"
                    stroke={hoveredChannel === ch.channel ? ch.color : `${ch.color}cc`}
                    strokeWidth={hoveredChannel === ch.channel ? strokeW + 4 : strokeW}
                    strokeDasharray={`${dash} ${gap}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt"
                    transform="rotate(-90 80 80)"
                    style={{ transition: 'stroke-width 0.2s, stroke 0.2s' }}
                    onMouseEnter={() => setHoveredChannel(ch.channel)}
                    onMouseLeave={() => setHoveredChannel(null)}
                  />
                );
                offset += dash;
                return el;
              });
            })()}
            <text x="80" y="74" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#111827">
              ${totalCost.toFixed(0)}
            </text>
            <text x="80" y="92" textAnchor="middle" fontSize="10" fill="#6b7280">
              total
            </text>
          </svg>
        </div>

        {/* Channel bars */}
        <div className="flex-1 space-y-3 w-full">
          {sortedChannels.map((channel) => {
            const pct = totalCost > 0 ? (channel.cost / totalCost) * 100 : 0;
            const avgCost = channel.messages > 0 ? channel.cost / channel.messages : 0;
            const isHovered = hoveredChannel === channel.channel;
            return (
              <div
                className={`space-y-1 rounded-lg p-2 transition-colors ${isHovered ? 'bg-gray-50' : ''}`}
                key={channel.channel}
                onMouseEnter={() => setHoveredChannel(channel.channel)}
                onMouseLeave={() => setHoveredChannel(null)}
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{channel.icon}</span>
                    <span className="font-medium text-gray-700">{channel.name}</span>
                    <span className="text-xs text-gray-400">{channel.messages.toLocaleString()} msgs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">${channel.cost.toFixed(2)}</span>
                    <span className="text-xs text-gray-400">({pct.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: channel.color }}
                  />
                </div>
                <div className="text-xs text-gray-400">
                  ${avgCost.toFixed(4)}/msg promedio
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Most/Least Expensive */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="text-xs text-green-600">Más Rentable</div>
          <div className="mt-1 flex items-center gap-2">
            <span>{sortedChannels.at(-1)?.icon}</span>
            <span className="font-semibold text-green-700">{sortedChannels.at(-1)?.name}</span>
          </div>
          <div className="text-xs text-green-600">
            ${sortedChannels.at(-1) ? (sortedChannels.at(-1)!.cost / sortedChannels.at(-1)!.messages).toFixed(4) : '0'}/msg
          </div>
        </div>
        <div className="flex-1 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="text-xs text-red-600">Más Costoso</div>
          <div className="mt-1 flex items-center gap-2">
            <span>{sortedChannels[0]?.icon}</span>
            <span className="font-semibold text-red-700">{sortedChannels[0]?.name}</span>
          </div>
          <div className="text-xs text-red-600">
            ${sortedChannels[0] ? (sortedChannels[0].cost / sortedChannels[0].messages).toFixed(4) : '0'}/msg
          </div>
        </div>
      </div>
    </div>
  );
}

