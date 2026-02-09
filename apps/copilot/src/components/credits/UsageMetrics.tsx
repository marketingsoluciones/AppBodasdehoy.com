'use client';

import { Card, Statistic } from 'antd';
import { createStyles } from 'antd-style';
import { Brain, Image, Mail, MessageSquare, TrendingDown, TrendingUp } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { UsageStats } from '@/services/api2/invoices';

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    padding: 20px;
  `,
  metricCard: css`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
    padding: 20px;
  `,
}));

interface UsageMetricsProps {
  previousPeriod?: UsageStats | null;
  usageStats: UsageStats | null;
}

const UsageMetrics = memo<UsageMetricsProps>(({ usageStats, previousPeriod }) => {
  const { styles } = useStyles();

  if (!usageStats) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return `€${value.toFixed(2)}`;
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      isIncrease: change > 0,
      value: Math.abs(change).toFixed(1),
    };
  };

  const totalCostChange = previousPeriod
    ? calculateChange(usageStats.total_cost || 0, previousPeriod.total_cost || 0)
    : null;

  return (
    <Flexbox gap={16} style={{ marginBottom: 24 }}>
      {/* Métricas Principales */}
      <div className={styles.metricCard}>
        <Flexbox gap={16} horizontal style={{ flexWrap: 'wrap' }}>
          <Flexbox gap={4}>
            <span style={{ fontSize: 12, opacity: 0.9 }}>Costo Total del Mes</span>
            <Flexbox align="center" gap={8} horizontal>
              <span style={{ fontSize: 32, fontWeight: 700 }}>
                {formatCurrency(usageStats.total_cost || 0)}
              </span>
              {totalCostChange && (
                <Flexbox align="center" gap={4} horizontal>
                  {totalCostChange.isIncrease ? (
                    <TrendingUp color="#10b981" size={20} />
                  ) : (
                    <TrendingDown color="#ef4444" size={20} />
                  )}
                  <span style={{ fontSize: 14, opacity: 0.9 }}>
                    {totalCostChange.isIncrease ? '+' : '-'}
                    {totalCostChange.value}%
                  </span>
                </Flexbox>
              )}
            </Flexbox>
          </Flexbox>
        </Flexbox>
      </div>

      {/* Métricas Detalladas */}
      <Flexbox gap={16} horizontal style={{ flexWrap: 'wrap' }}>
        {usageStats.ai_tokens && (
          <Card className={styles.card} style={{ flex: 1, minWidth: 200 }}>
            <Statistic
              prefix={<Brain size={20} style={{ color: '#667eea' }} />}
              title="Tokens IA"
              value={usageStats.ai_tokens.total?.toLocaleString() || 0}
              valueStyle={{ color: '#667eea', fontSize: 24 }}
            />
            {usageStats.ai_tokens.by_model?.[0]?.cost && (
              <div style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 12, marginTop: 4 }}>
                Costo: {formatCurrency(usageStats.ai_tokens.by_model[0].cost)}
              </div>
            )}
          </Card>
        )}

        {usageStats.images && usageStats.images.total > 0 && (
          <Card className={styles.card} style={{ flex: 1, minWidth: 200 }}>
            <Statistic
              prefix={<Image size={20} style={{ color: '#764ba2' }} />}
              title="Imágenes"
              value={usageStats.images.total}
              valueStyle={{ color: '#764ba2', fontSize: 24 }}
            />
            {usageStats.images.by_provider?.[0]?.cost && (
              <div style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 12, marginTop: 4 }}>
                Costo: {formatCurrency(usageStats.images.by_provider[0].cost)}
              </div>
            )}
          </Card>
        )}

        {usageStats.communications && (
          <Card className={styles.card} style={{ flex: 1, minWidth: 200 }}>
            <Statistic
              prefix={<MessageSquare size={20} style={{ color: '#10b981' }} />}
              title="Comunicaciones"
              value={
                (usageStats.communications.whatsapp_sent || 0) +
                (usageStats.communications.sms_sent || 0) +
                (usageStats.communications.emails_sent || 0)
              }
              valueStyle={{ color: '#10b981', fontSize: 24 }}
            />
            {usageStats.communications.total_cost > 0 && (
              <div style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 12, marginTop: 4 }}>
                Costo: {formatCurrency(usageStats.communications.total_cost)}
              </div>
            )}
          </Card>
        )}

        {usageStats.storage && usageStats.storage.total_gb > 0 && (
          <Card className={styles.card} style={{ flex: 1, minWidth: 200 }}>
            <Statistic
              prefix={<Mail size={20} style={{ color: '#ef4444' }} />}
              suffix="GB"
              title="Almacenamiento"
              value={usageStats.storage.total_gb.toFixed(2)}
              valueStyle={{ color: '#ef4444', fontSize: 24 }}
            />
            {usageStats.storage.cost > 0 && (
              <div style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 12, marginTop: 4 }}>
                Costo: {formatCurrency(usageStats.storage.cost)}
              </div>
            )}
          </Card>
        )}
      </Flexbox>
    </Flexbox>
  );
});

UsageMetrics.displayName = 'UsageMetrics';

export default UsageMetrics;
