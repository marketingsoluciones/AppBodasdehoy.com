'use client';

interface CostChartProps {
  period: 'day' | 'week' | 'month';
}

export function CostChart({ period }: CostChartProps) {
  // TODO: Implementar gráfica real con recharts o similar
  // Por ahora, placeholder

  const generateMockData = () => {
    const days = period === 'day' ? 24 : period === 'week' ? 7 : 30;
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const baseReal = Math.random() * 50 + 10;
      const billed = baseReal * 1.5;
      const margin = billed - baseReal;
      
      data.push({
        billed: billed,
        label: period === 'day' ? `${i}:00` : `Día ${i + 1}`,
        margin: margin,
        real: baseReal,
      });
    }
    
    return data;
  };

  const chartData = generateMockData();
  const maxValue = Math.max(...chartData.map((d) => d.billed));

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

      {/* Simple Bar Chart Visualization */}
      <div className="relative h-64 overflow-x-auto">
        <div className="flex h-full items-end gap-1 pb-6">
          {chartData.map((item, index) => {
            const realHeight = (item.real / maxValue) * 100;
            const billedHeight = (item.billed / maxValue) * 100;
            const marginHeight = (item.margin / maxValue) * 100;

            return (
              <div className="group relative flex-1" key={index}>
                {/* Tooltip */}
                <div className="invisible absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                  <div>Real: ${item.real.toFixed(2)}</div>
                  <div>Facturado: ${item.billed.toFixed(2)}</div>
                  <div>Margen: ${item.margin.toFixed(2)}</div>
                </div>

                {/* Bars */}
                <div className="flex h-full items-end justify-center gap-0.5">
                  <div
                    className="w-1/3 rounded-t bg-red-500 transition-all hover:bg-red-600"
                    style={{ height: `${realHeight}%` }}
                  />
                  <div
                    className="w-1/3 rounded-t bg-green-500 transition-all hover:bg-green-600"
                    style={{ height: `${billedHeight}%` }}
                  />
                  <div
                    className="w-1/3 rounded-t bg-blue-500 transition-all hover:bg-blue-600"
                    style={{ height: `${marginHeight}%` }}
                  />
                </div>

                {/* Label */}
                <div className="absolute -bottom-5 left-0 right-0 text-center text-[0.6rem] text-gray-500">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-sm text-gray-600">Promedio Real</div>
          <div className="text-xl font-bold text-red-600">
            $
            {(
              chartData.reduce((sum, d) => sum + d.real, 0) / chartData.length
            ).toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Promedio Facturado</div>
          <div className="text-xl font-bold text-green-600">
            $
            {(
              chartData.reduce((sum, d) => sum + d.billed, 0) / chartData.length
            ).toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Promedio Margen</div>
          <div className="text-xl font-bold text-blue-600">
            $
            {(
              chartData.reduce((sum, d) => sum + d.margin, 0) / chartData.length
            ).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Note about real chart library */}
      <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
        💡 <strong>Nota:</strong> Esta es una visualización simplificada. Se puede
        implementar una gráfica más avanzada con{' '}
        <code className="rounded bg-yellow-200 px-1">recharts</code> o{' '}
        <code className="rounded bg-yellow-200 px-1">chart.js</code> para mayor
        interactividad.
      </div>
    </div>
  );
}

