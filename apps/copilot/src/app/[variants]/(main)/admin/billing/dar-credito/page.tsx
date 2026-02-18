'use client';

import { Button, Card, Input, InputNumber, message } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, CreditCard, User } from 'lucide-react';
import Link from 'next/link';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    padding: 24px;
    max-width: 480px;
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
 * Admin: Dar crédito a usuario – Placeholder.
 * Cuando API2 exponga la mutation wallet_credit / wallet_adjust (admin),
 * aquí se enviará user_id, cantidad y motivo.
 * Ver: docs/PANELES-PENDIENTES-PETICIONES-API2-API-IA.md
 */
const DarCreditoPage = memo(() => {
  const { styles } = useStyles();
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    message.info('Pendiente de API2: mutation wallet_credit / wallet_adjust no disponible aún.');
  };

  return (
    <Flexbox gap={24} style={{ padding: 24, width: '100%' }}>
      <Flexbox align="center" gap={12} horizontal>
        <Link href="/admin/billing" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={18} />
          Volver a Facturación admin
        </Link>
      </Flexbox>

      <div className={styles.card}>
        <div className={styles.sectionTitle}>
          <CreditCard size={22} />
          Dar crédito a usuario
        </div>
        <p style={{ color: 'var(--lobe-color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
          Ajuste manual de wallet (solo admin). Cuando API2 exponga la mutation, aquí se enviará
          usuario, cantidad y motivo.
        </p>

        <Flexbox gap={16}>
          <Flexbox gap={4}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>
              <User size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Usuario (ID o email)
            </label>
            <Input
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user_id o email"
              value={userId}
            />
          </Flexbox>
          <Flexbox gap={4}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Cantidad (€)</label>
            <InputNumber
              min={0.01}
              onChange={(v) => setAmount(v ?? null)}
              placeholder="0.00"
              step={1}
              style={{ width: '100%' }}
              value={amount}
            />
          </Flexbox>
          <Flexbox gap={4}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Motivo (opcional)</label>
            <Input.TextArea
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ajuste manual, bonificación..."
              rows={2}
              value={reason}
            />
          </Flexbox>
          <Button
            disabled
            onClick={handleSubmit}
            type="primary"
          >
            Dar crédito (pendiente de API2)
          </Button>
          <p style={{ fontSize: 12, color: 'var(--lobe-color-text-tertiary)', margin: 0 }}>
            Se requiere mutation wallet_credit o wallet_adjust en API2 para uso admin. Ver
            docs/PANELES-PENDIENTES-PETICIONES-API2-API-IA.md.
          </p>
        </Flexbox>
      </div>
    </Flexbox>
  );
});

DarCreditoPage.displayName = 'DarCreditoPage';

export default DarCreditoPage;
