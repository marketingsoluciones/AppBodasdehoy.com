'use client';

import { Table } from 'antd';
import { createStyles } from 'antd-style';
import { Check, X } from 'lucide-react';
import { memo } from 'react';

import type { SubscriptionPlan } from '@/services/api2/subscriptions';
import { humanizeQuota } from '@bodasdehoy/shared/plans';

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    padding: 24px;
  `,
  sectionTitle: css`
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
  `,
}));

const PLAN_COLORS: Record<string, string> = {
  BASIC: '#2563eb',
  ENTERPRISE: '#059669',
  FREE: '#374151',
  MAX: '#d97706',
  PRO: '#7c3aed',
};

// SKUs shown as rows in the comparison table
const QUOTA_ROWS: { key: string; label: string; skuMatch: (sku: string) => boolean }[] = [
  { key: 'ai', label: 'Consultas IA / mes', skuMatch: (s) => s.includes('ai') || s.includes('token') || s.includes('anthropic') || s.includes('openai') },
  { key: 'images', label: 'Imágenes IA / mes', skuMatch: (s) => s.includes('image') || s.includes('dalle') || s.includes('flux') },
  { key: 'whatsapp', label: 'WhatsApp', skuMatch: (s) => s.includes('whatsapp') || s.includes('-wa') },
  { key: 'sms', label: 'SMS', skuMatch: (s) => s === 'sms-invitations' },
  { key: 'storage', label: 'Almacenamiento', skuMatch: (s) => s === 'storage-gb' },
  { key: 'events', label: 'Eventos activos', skuMatch: (s) => s === 'events-count' },
  { key: 'guests', label: 'Invitados / evento', skuMatch: (s) => s === 'guests-per-event' },
];

function getQuotaValue(plan: SubscriptionPlan, skuMatch: (s: string) => boolean): string {
  const limit = plan.product_limits.find((l) => skuMatch(l.sku.toLowerCase()));
  if (!limit) return '—';
  if (limit.free_quota <= 0) return '—';
  return humanizeQuota(limit.sku, limit.free_quota);
}

interface Props {
  plans: SubscriptionPlan[];
}

const PriceComparison = memo<Props>(({ plans }) => {
  const { styles } = useStyles();

  const mainPlans = plans
    .filter((p) => p.tier !== 'ENTERPRISE' && p.tier !== 'CUSTOM')
    .sort((a, b) => a.pricing.monthly_fee - b.pricing.monthly_fee);

  if (mainPlans.length === 0) return null;

  const renderBool = (v: boolean) =>
    v ? <Check color="#10b981" size={18} style={{ margin: '0 auto' }} /> : <X color="#d1d5db" size={18} style={{ margin: '0 auto' }} />;

  // Build columns
  const columns = [
    { dataIndex: 'label', key: 'label', title: 'Característica', width: 200 },
    ...mainPlans.map((p) => ({
      dataIndex: p.tier,
      key: p.tier,
      onHeaderCell: () => ({ style: { color: PLAN_COLORS[p.tier] ?? '#374151', fontWeight: 700 } }),
      render: (v: string | boolean) =>
        typeof v === 'boolean' ? renderBool(v) : <span style={{ textAlign: 'center', display: 'block' }}>{v}</span>,
      title: p.name,
      width: 110,
    })),
  ];

  // Build rows — quota rows
  const quotaRows = QUOTA_ROWS.map(({ key, label, skuMatch }) => {
    const row: Record<string, string | boolean> = { key, label };
    for (const p of mainPlans) {
      row[p.tier] = getQuotaValue(p, skuMatch);
    }
    return row;
  });

  // Feature rows from feature_restrictions
  const featureRows = [
    {
      key: 'discount',
      label: 'Descuento en servicios',
      ...Object.fromEntries(mainPlans.map((p) => [p.tier, p.global_discount?.value ? `${p.global_discount.value}%` : false])),
    },
    {
      key: 'support',
      label: 'Soporte',
      ...Object.fromEntries(mainPlans.map((p) => [
        p.tier,
        p.feature_restrictions.white_label ? 'Dedicado' : p.feature_restrictions.priority_support ? 'Prioritario' : 'Comunidad',
      ])),
    },
    {
      key: 'wallet',
      label: 'Wallet prepago',
      ...Object.fromEntries(mainPlans.map((p) => [p.tier, true])),
    },
    {
      key: 'api',
      label: 'API acceso completo',
      ...Object.fromEntries(mainPlans.map((p) => [p.tier, p.feature_restrictions.api_access])),
    },
    {
      key: 'manager',
      label: 'Gestor de cuenta dedicado',
      ...Object.fromEntries(mainPlans.map((p) => [p.tier, p.feature_restrictions.white_label])),
    },
  ];

  const allRows = [
    { key: '__price', label: 'Precio mensual', ...Object.fromEntries(mainPlans.map((p) => [p.tier, p.pricing.monthly_fee === 0 ? 'Gratis' : `€${p.pricing.monthly_fee}`])) },
    ...quotaRows,
    ...featureRows,
  ];

  return (
    <div className={styles.card}>
      <div className={styles.sectionTitle}>Comparación de planes</div>
      <Table
        columns={columns}
        dataSource={allRows}
        pagination={false}
        rowKey="key"
        scroll={{ x: true }}
        size="middle"
      />
      <p style={{ color: 'var(--ant-color-text-quaternary)', fontSize: 12, marginTop: 12 }}>
        Todos los precios no incluyen IVA. El plan Pro es el más popular entre organizadores de bodas.
      </p>
    </div>
  );
});

PriceComparison.displayName = 'PriceComparison';

export default PriceComparison;
