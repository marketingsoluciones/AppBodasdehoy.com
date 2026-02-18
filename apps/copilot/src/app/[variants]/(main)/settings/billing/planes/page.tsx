'use client';

import { Breadcrumb, Card, Tag } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, Package, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

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
    display: flex;
    align-items: center;
    gap: 8px;
  `,
}));

/**
 * Catálogo de planes – Placeholder.
 * Cuando API2 exponga getAvailablePlans (o equivalente), aquí se listarán
 * los planes con precios y se podrá iniciar el flujo "Cambiar plan".
 * Ver: docs/PANELES-PENDIENTES-PETICIONES-API2-API-IA.md
 */
const PlanesPage = memo(() => {
  const { styles } = useStyles();

  return (
    <Flexbox gap={24} style={{ maxWidth: 1024, padding: 24, width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link href="/settings">Ajustes</Link> },
          { title: <Link href="/settings/billing">Facturación</Link> },
          { title: 'Planes' },
        ]}
      />

      <Flexbox align="center" gap={12} horizontal>
        <Link href="/settings/billing" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={18} />
          Volver a Facturación
        </Link>
      </Flexbox>

      <div className={styles.card}>
        <div className={styles.sectionTitle}>
          <TrendingUp size={22} />
          Catálogo de planes
        </div>
        <Flexbox gap={16}>
          <p style={{ color: 'var(--lobe-color-text-secondary)', margin: 0 }}>
            El listado de planes disponibles con precios y límites se mostrará aquí cuando API2 exponga
            la query <strong>getAvailablePlans</strong> (o equivalente).
          </p>
          <Tag color="blue">Pendiente de API2</Tag>
          <p style={{ fontSize: 13, margin: 0 }}>
            Desde aquí podrás ver todos los planes, comparar y cambiar el tuyo (upgrade/downgrade).
          </p>
        </Flexbox>
      </div>

      {/* Placeholder de planes mock opcional – solo visual */}
      <Flexbox gap={12} horizontal style={{ flexWrap: 'wrap' }}>
        <Card size="small" style={{ minWidth: 200 }} title={<><Package size={16} /> Básico</>}>
          <p style={{ fontSize: 12, margin: 0 }}>Ejemplo. Datos reales cuando exista la API.</p>
        </Card>
        <Card size="small" style={{ minWidth: 200 }} title={<><Package size={16} /> Pro</>}>
          <p style={{ fontSize: 12, margin: 0 }}>Ejemplo. Datos reales cuando exista la API.</p>
        </Card>
        <Card size="small" style={{ minWidth: 200 }} title={<><Package size={16} /> Max</>}>
          <p style={{ fontSize: 12, margin: 0 }}>Ejemplo. Datos reales cuando exista la API.</p>
        </Card>
      </Flexbox>
    </Flexbox>
  );
});

PlanesPage.displayName = 'PlanesPage';

export default PlanesPage;
