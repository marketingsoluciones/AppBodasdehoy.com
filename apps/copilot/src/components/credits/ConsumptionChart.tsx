'use client';

import { createStyles } from 'antd-style';
import { memo, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Flexbox } from 'react-layout-kit';

import { UsageStats } from '@/services/api2/invoices';

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    padding: 24px;
  `,
  chartContainer: css`
    height: 300px;
    margin-top: 16px;
  `,
  sectionTitle: css`
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
  `,
}));

interface ConsumptionChartProps {
  period?: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_30_DAYS';
  usageStats: UsageStats | null;
}

const ConsumptionChart = memo<ConsumptionChartProps>(({ usageStats, period = 'THIS_MONTH' }) => {
  const { styles } = useStyles();

  // Preparar datos para gráfico de tokens por modelo
  const tokensByModel = useMemo(() => {
    if (!usageStats?.ai_tokens?.by_model) return [];
    return usageStats.ai_tokens.by_model.map((m) => ({
      cost: m.cost || 0,
      name: m.model?.split('-').pop() || m.model || 'Unknown',
      tokens: m.tokens || 0,
    }));
  }, [usageStats]);

  // Preparar datos para gráfico de imágenes por proveedor
  const imagesByProvider = useMemo(() => {
    if (!usageStats?.images?.by_provider) return [];
    return usageStats.images.by_provider.map((p) => ({
      cost: p.cost || 0,
      count: p.count || 0,
      name: p.provider || 'Unknown',
    }));
  }, [usageStats]);

  // Preparar datos para gráfico de comunicaciones
  const communicationsData = useMemo(() => {
    if (!usageStats?.communications) return [];
    return [
      { name: 'WhatsApp', value: usageStats.communications.whatsapp_sent || 0 },
      { name: 'SMS', value: usageStats.communications.sms_sent || 0 },
      { name: 'Email', value: usageStats.communications.emails_sent || 0 },
    ].filter((item) => item.value > 0);
  }, [usageStats]);

  const formatCurrency = (value: number) => {
    return `€${value.toFixed(2)}`;
  };

  if (!usageStats) {
    return (
      <div className={styles.card}>
        <div className={styles.sectionTitle}>Gráficos de Consumo</div>
        <p style={{ color: 'var(--lobe-color-text-secondary)', padding: '48px 0', textAlign: 'center' }}>
          No hay datos disponibles para mostrar gráficos
        </p>
      </div>
    );
  }

  return (
    <Flexbox gap={24}>
      {/* Gráfico de Tokens por Modelo */}
      {tokensByModel.length > 0 && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>Tokens IA por Modelo</div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={tokensByModel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'tokens') return [`${value.toLocaleString()} tokens`, 'Tokens'];
                    if (name === 'cost') return [formatCurrency(value), 'Costo'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar dataKey="tokens" fill="#667eea" name="Tokens" />
                <Bar dataKey="cost" fill="#764ba2" name="Costo (€)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Gráfico de Imágenes por Proveedor */}
      {imagesByProvider.length > 0 && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>Imágenes Generadas por Proveedor</div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={imagesByProvider}
                  dataKey="count"
                  fill="#8884d8"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  nameKey="name"
                  outerRadius={100}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Gráfico de Comunicaciones */}
      {communicationsData.length > 0 && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>Distribución de Comunicaciones</div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={communicationsData}
                  dataKey="value"
                  fill="#82ca9d"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  nameKey="name"
                  outerRadius={100}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Gráfico de Costo Total por Categoría */}
      <div className={styles.card}>
        <div className={styles.sectionTitle}>Costo por Categoría</div>
        <div className={styles.chartContainer}>
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              data={[
                {
                  costo: usageStats.ai_tokens?.total ? (usageStats.ai_tokens.by_model?.[0]?.cost || 0) : 0,
                  name: 'Tokens IA',
                },
                {
                  costo: usageStats.images?.total ? (usageStats.images.by_provider?.[0]?.cost || 0) : 0,
                  name: 'Imágenes',
                },
                {
                  costo: usageStats.communications?.total_cost || 0,
                  name: 'Comunicaciones',
                },
                {
                  costo: usageStats.storage?.cost || 0,
                  name: 'Almacenamiento',
                },
              ].filter((item) => item.costo > 0)}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="costo" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Flexbox>
  );
});

ConsumptionChart.displayName = 'ConsumptionChart';

export default ConsumptionChart;
