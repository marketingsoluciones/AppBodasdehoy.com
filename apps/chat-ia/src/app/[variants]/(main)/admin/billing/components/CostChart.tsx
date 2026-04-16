'use client';

import { useMemo, useState } from 'react';

interface CostChartProps {
  period: 'day' | 'week' | 'month';
}

// Seeded pseudo-random for stable mock data across renders
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16_807 + 0) % 2_147_483_647;
    return (s - 1) / 2_147_483_646;
  };
}

export function CostChart({ period }: CostChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const count = period === 'day' ? 24 : period === 'week' ? 7 : 30;
    const rand = seededRandom(period === 'day' ? 42 : period === 'week' ? 77 : 123);
    const data = [];

    for (let i = 0; i < count; i++) {
      const baseReal = rand() * 50 + 10;
      const billed = baseReal * 1.5;
      data.push({
        billed,
        label: period === 'day' ? `${i}:00` : period === 'week'
          ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i]
          : `${i + 1}`,
        margin: billed - baseReal,
        real: baseReal,
      });
    }
    return data;
  }, [period]);

  const maxValue = Math.max(...chartData.map((d) => d.billed));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f));

  // SVG dimensions
  const svgW = 700;
  const svgH = 240;
  const padL = 48;
  const padR = 12;
  const padT = 8;
  const padB = 28;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const barGroupW = chartW / chartData.length;
  const barW = Math.max(2, barGroupW * 0.25);
  const gap = Math.max(1, barGroupW * 0.04);

  // Show every Nth label to avoid crowding
  const labelStep = chartData.length > 14 ? Math.ceil(chartData.length / 10) : 1;

  const totals = useMemo(() => ({
    billed: chartData.reduce((s, d) => s + d.billed, 0),
    margin: chartData.reduce((s, d) => s + d.margin, 0),
    real: chartData.reduce((s, d) => s + d.real, 0),
  }), [chartData]);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>Costo Real</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>Facturado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span>Margen</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="overflow-x-auto">
        <svg
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${svgW} ${svgH}`}
        >
          {/* Grid lines + Y labels */}
          {yTicks.map((tick) => {
            const y = padT + chartH - (tick / maxValue) * chartH;
            return (
              <g key={tick}>
                <line
                  stroke="#e5e7eb" strokeWidth="1"
                  x1={padL} x2={svgW - padR}
                  y1={y} y2={y}
                />
                <text
                  fill="#9ca3af" fontSize="10"
                  textAnchor="end" x={padL - 6} y={y + 3}
                >
                  ${tick.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {chartData.map((item, i) => {
            const groupX = padL + i * barGroupW + barGroupW / 2 - (barW * 3 + gap * 2) / 2;
            const rH = (item.real / maxValue) * chartH;
            const bH = (item.billed / maxValue) * chartH;
            const mH = (item.margin / maxValue) * chartH;
            const baseY = padT + chartH;
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Hover background */}
                {isHovered && (
                  <rect
                    fill="#f3f4f6"
                    height={chartH}
                    rx="2"
                    width={barGroupW}
                    x={padL + i * barGroupW}
                    y={padT}
                  />
                )}

                {/* Real bar */}
                <rect
                  fill={isHovered ? '#dc2626' : '#ef4444'}
                  height={rH}
                  rx="1"
                  width={barW}
                  x={groupX}
                  y={baseY - rH}
                />
                {/* Billed bar */}
                <rect
                  fill={isHovered ? '#16a34a' : '#22c55e'}
                  height={bH}
                  rx="1"
                  width={barW}
                  x={groupX + barW + gap}
                  y={baseY - bH}
                />
                {/* Margin bar */}
                <rect
                  fill={isHovered ? '#2563eb' : '#3b82f6'}
                  height={mH}
                  rx="1"
                  width={barW}
                  x={groupX + (barW + gap) * 2}
                  y={baseY - mH}
                />

                {/* X label */}
                {i % labelStep === 0 && (
                  <text
                    fill="#9ca3af"
                    fontSize="9"
                    textAnchor="middle" x={padL + i * barGroupW + barGroupW / 2} y={svgH - 4}
                  >
                    {item.label}
                  </text>
                )}

                {/* Tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      fill="#1f2937"
                      height={44}
                      rx="4" width={104}
                      x={padL + i * barGroupW + barGroupW / 2 - 52} y={padT - 4}
                    />
                    <text fill="#fca5a5" fontSize="9" textAnchor="middle" x={padL + i * barGroupW + barGroupW / 2} y={padT + 10}>
                      Real: ${item.real.toFixed(2)}
                    </text>
                    <text fill="#86efac" fontSize="9" textAnchor="middle" x={padL + i * barGroupW + barGroupW / 2} y={padT + 21}>
                      Facturado: ${item.billed.toFixed(2)}
                    </text>
                    <text fill="#93c5fd" fontSize="9" textAnchor="middle" x={padL + i * barGroupW + barGroupW / 2} y={padT + 32}>
                      Margen: ${item.margin.toFixed(2)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-sm text-gray-600">Total Real</div>
          <div className="text-xl font-bold text-red-600">
            ${totals.real.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">
            ~${(totals.real / chartData.length).toFixed(2)}/
            {period === 'day' ? 'hora' : 'día'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Total Facturado</div>
          <div className="text-xl font-bold text-green-600">
            ${totals.billed.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">
            ~${(totals.billed / chartData.length).toFixed(2)}/
            {period === 'day' ? 'hora' : 'día'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Total Margen</div>
          <div className="text-xl font-bold text-blue-600">
            ${totals.margin.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">
            {((totals.margin / totals.billed) * 100).toFixed(1)}% margen
          </div>
        </div>
      </div>
    </div>
  );
}
