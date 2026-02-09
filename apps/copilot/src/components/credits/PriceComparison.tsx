'use client';

import { Table, Tag } from 'antd';
import { createStyles } from 'antd-style';
import { Check, X } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    padding: 24px;
  `,
  highlightRow: css`
    background: ${token.colorPrimaryBg};
    border: 2px solid ${token.colorPrimary};
  `,
  sectionTitle: css`
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
  `,
}));

interface PlanFeature {
  basic: string | boolean;
  enterprise: string | boolean;
  free: string | boolean;
  max: string | boolean;
  name: string;
  pro: string | boolean;
}

const PLANS_DATA: PlanFeature[] = [
  {
    basic: '€29',
    enterprise: 'Personalizado',
    free: 'Gratis',
    max: '€299',
    name: 'Precio Mensual',
    pro: '€99',
  },
  {
    basic: '100K',
    enterprise: 'Ilimitado',
    free: '10K',
    max: '2M',
    name: 'Tokens IA / Mes',
    pro: '500K',
  },
  {
    basic: '500',
    enterprise: 'Ilimitado',
    free: '50',
    max: '10,000',
    name: 'Imágenes / Mes',
    pro: '2,500',
  },
  {
    basic: '1,000',
    enterprise: 'Ilimitado',
    free: '100',
    max: '20,000',
    name: 'Mensajes WhatsApp',
    pro: '5,000',
  },
  {
    basic: '5,000',
    enterprise: 'Ilimitado',
    free: '500',
    max: '100,000',
    name: 'Emails / Mes',
    pro: '25,000',
  },
  {
    basic: '10 GB',
    enterprise: 'Ilimitado',
    free: '1 GB',
    max: '200 GB',
    name: 'Almacenamiento',
    pro: '50 GB',
  },
  {
    basic: false,
    enterprise: true,
    free: false,
    max: true,
    name: 'Acceso API',
    pro: true,
  },
  {
    basic: false,
    enterprise: true,
    free: false,
    max: true,
    name: 'Soporte Prioritario',
    pro: true,
  },
  {
    basic: false,
    enterprise: true,
    free: false,
    max: true,
    name: 'Branding Personalizado',
    pro: false,
  },
  {
    basic: false,
    enterprise: true,
    free: false,
    max: true,
    name: 'Analytics Avanzados',
    pro: false,
  },
];

const PriceComparison = memo(() => {
  const { styles } = useStyles();

  const renderValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check color="#10b981" size={20} style={{ margin: '0 auto' }} />
      ) : (
        <X color="#ef4444" size={20} style={{ margin: '0 auto' }} />
      );
    }
    return <span>{value}</span>;
  };

  const columns = [
    {
      dataIndex: 'name',
      key: 'name',
      title: 'Característica',
      width: 200,
    },
    {
      dataIndex: 'free',
      key: 'free',
      render: renderValue,
      title: 'Free',
      width: 120,
    },
    {
      dataIndex: 'basic',
      key: 'basic',
      render: renderValue,
      title: 'Basic',
      width: 120,
    },
    {
      dataIndex: 'pro',
      key: 'pro',
      render: renderValue,
      title: 'Pro',
      width: 120,
    },
    {
      dataIndex: 'max',
      key: 'max',
      render: renderValue,
      title: 'Max',
      width: 120,
    },
    {
      dataIndex: 'enterprise',
      key: 'enterprise',
      render: renderValue,
      title: 'Enterprise',
      width: 120,
    },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.sectionTitle}>Comparación de Planes</div>
      <Table
        columns={columns}
        dataSource={PLANS_DATA}
        pagination={false}
        rowKey="name"
        size="middle"
      />
      <Flexbox gap={8} style={{ marginTop: 16 }}>
        <Tag color="blue">💡 Recomendación: El plan Pro ofrece el mejor valor para la mayoría de usuarios</Tag>
      </Flexbox>
    </div>
  );
});

PriceComparison.displayName = 'PriceComparison';

export default PriceComparison;
