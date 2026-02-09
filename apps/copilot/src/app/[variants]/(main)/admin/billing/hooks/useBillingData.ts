import { useEffect, useState } from 'react';

export interface BillingData {
  avgCostPerRequest: number;
  billedCost: number;
  byDay: Array<{
    billedCost: number;
    date: string;
    margin: number;
    realCost: number;
    requests: number;
  }>;
  byProvider: Array<{
    avgResponseTime: number;
    billedCost: number;
    margin: number;
    provider: string;
    realCost: number;
    requests: number;
    successRate: number;
  }>;
  margin: number;
  marginPercentage: number;
  realCost: number;
  totalRequests: number;
  totalTokens: number;
}

export function useBillingData(period: 'day' | 'week' | 'month') {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      // Determinar días según período
      const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;

      // Fetch stats desde backend
      const response = await fetch(
        `http://localhost:8030/api/usage/stats?development=bodasdehoy&days=${days}`
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const stats = await response.json();

      // Calcular costos con margen del 50%
      const marginMultiplier = 1.5;
      const realCost = stats.total_cost_usd || 0;
      const billedCost = realCost * marginMultiplier;
      const margin = billedCost - realCost;

      // Transform data
      const billingData: BillingData = {
        avgCostPerRequest: stats.total_requests ? realCost / stats.total_requests : 0,
        billedCost,
        byDay: [],
        byProvider: Object.entries(stats.providers || {}).map(([provider, data]: [string, any]) => ({
          avgResponseTime: data.avg_response_time_ms || 0,
          billedCost: (data.cost_usd || 0) * marginMultiplier,
          margin: (data.cost_usd || 0) * (marginMultiplier - 1),
          provider,
          realCost: data.cost_usd || 0,
          requests: data.requests || 0,
          successRate: data.success_rate || 0,
        })),
        margin,
        marginPercentage: 50,
        realCost,
        totalRequests: stats.total_requests || 0,
        totalTokens: stats.total_tokens || 0, // TODO: Implementar cuando backend tenga datos por día
      };

      setData(billingData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [period]);

  return { data, error, loading, refetch: fetchBillingData };
}

